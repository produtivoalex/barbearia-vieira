import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AgendamentoBarbeiro {
  id: string;
  data_hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  servico: {
    nome: string;
    preco: number;
    duracao_minutos: number;
  };
  cliente: {
    id: string;
    nome_completo: string | null;
    telefone: string | null;
  };
}

export interface ClienteResumo {
  id: string;
  nome_completo: string | null;
  telefone: string | null;
  totalAgendamentos: number;
  ultimoAtendimento: string | null;
}

/** Retorna início e fim do dia local como ISO strings. */
function intervaloDia(data: Date) {
  const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0);
  const fim    = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59);
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

/** Retorna início (segunda) e fim (domingo) da semana de uma data. */
function intervalaSemana(data: Date) {
  const diaSemana = data.getDay(); // 0 = Dom
  const diffSeg = (diaSemana === 0 ? -6 : 1 - diaSemana);
  const segunda  = new Date(data.getFullYear(), data.getMonth(), data.getDate() + diffSeg, 0, 0, 0);
  const domingo  = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  domingo.setHours(23, 59, 59);
  return { inicio: segunda.toISOString(), fim: domingo.toISOString() };
}

export function usePainelBarbeiro() {
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;

  const [agendamentosHoje, setAgendamentosHoje] = useState<AgendamentoBarbeiro[]>([]);
  const [agendamentosSemana, setAgendamentosSemana] = useState<AgendamentoBarbeiro[]>([]);
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!barbeiroId) {
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const agora = new Date();
    const { inicio: inicioHoje, fim: fimHoje } = intervaloDia(agora);
    const { inicio: inicioSemana, fim: fimSemana } = intervalaSemana(agora);

    // Agendamentos de hoje
    const { data: dataHoje } = await supabase
      .from('agendamentos')
      .select(`
        id, data_hora, status,
        servico:servico_id ( nome, preco, duracao_minutos ),
        cliente:cliente_id ( id, nome_completo, telefone )
      `)
      .eq('barbeiro_id', barbeiroId)
      .gte('data_hora', inicioHoje)
      .lte('data_hora', fimHoje)
      .in('status', ['pendente', 'confirmado'])
      .order('data_hora', { ascending: true });

    // Agendamentos da semana
    const { data: dataSemana } = await supabase
      .from('agendamentos')
      .select(`
        id, data_hora, status,
        servico:servico_id ( nome, preco, duracao_minutos ),
        cliente:cliente_id ( id, nome_completo, telefone )
      `)
      .eq('barbeiro_id', barbeiroId)
      .gte('data_hora', inicioSemana)
      .lte('data_hora', fimSemana)
      .in('status', ['pendente', 'confirmado'])
      .order('data_hora', { ascending: true });

    // Todos os agendamentos concluídos (para montar lista de clientes únicos)
    const { data: dataTodos } = await supabase
      .from('agendamentos')
      .select(`
        data_hora, status,
        cliente:cliente_id ( id, nome_completo, telefone )
      `)
      .eq('barbeiro_id', barbeiroId)
      .in('status', ['confirmado', 'concluido'])
      .order('data_hora', { ascending: false });

    setAgendamentosHoje((dataHoje ?? []) as unknown as AgendamentoBarbeiro[]);
    setAgendamentosSemana((dataSemana ?? []) as unknown as AgendamentoBarbeiro[]);

    // Consolida clientes únicos a partir do histórico completo
    if (dataTodos) {
      const mapa = new Map<string, ClienteResumo>();
      for (const item of dataTodos as unknown as { data_hora: string; status: string; cliente: { id: string; nome_completo: string | null; telefone: string | null } }[]) {
        const c = item.cliente;
        if (!c?.id) continue;
        if (!mapa.has(c.id)) {
          mapa.set(c.id, {
            id: c.id,
            nome_completo: c.nome_completo,
            telefone: c.telefone,
            totalAgendamentos: 0,
            ultimoAtendimento: null,
          });
        }
        const entrada = mapa.get(c.id)!;
        entrada.totalAgendamentos += 1;
        if (!entrada.ultimoAtendimento || item.data_hora > entrada.ultimoAtendimento) {
          entrada.ultimoAtendimento = item.data_hora;
        }
      }
      setClientes(Array.from(mapa.values()).sort((a, b) => b.totalAgendamentos - a.totalAgendamentos));
    }

    setCarregando(false);
  }, [barbeiroId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    agendamentosHoje,
    agendamentosSemana,
    clientes,
    carregando,
    recarregar: carregar,
  };
}
