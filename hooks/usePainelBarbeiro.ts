import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AgendamentoBarbeiro {
  id: string;
  data_hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  servico: {
    id?: string;
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

export function usePainelBarbeiro(barbeariaId?: string) {
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;

  const [agendamentosHoje, setAgendamentosHoje] = useState<AgendamentoBarbeiro[]>([]);
  const [agendamentosSemana, setAgendamentosSemana] = useState<AgendamentoBarbeiro[]>([]);
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [totalNaFila, setTotalNaFila] = useState(0);
  const [minutosAtraso, setMinutosAtraso] = useState(0);
  const [tardeFechadaHoje, setTardeFechadaHoje] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!barbeiroId) {
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const agora = new Date();
    const dataHojeStr = agora.toISOString().slice(0, 10);
    const { inicio: inicioHoje, fim: fimHoje } = intervaloDia(agora);
    const { inicio: inicioSemana, fim: fimSemana } = intervalaSemana(agora);

    // 1. Agendamentos de hoje
    let consultaHoje = supabase
      .from('agendamentos')
      .select(`
        id, data_hora, status,
        servico:servico_id ( id, nome, preco, duracao_minutos ),
        cliente:cliente_id ( id, nome_completo, telefone )
      `)
      .eq('barbeiro_id', barbeiroId)
      .gte('data_hora', inicioHoje)
      .lte('data_hora', fimHoje);
    if (barbeariaId) consultaHoje = consultaHoje.eq('barbearia_id', barbeariaId);
    const { data: dataHoje } = await consultaHoje.order('data_hora', { ascending: true });

    // 2. Agendamentos da semana
    let consultaSemana = supabase
      .from('agendamentos')
      .select(`
        id, data_hora, status,
        servico:servico_id ( id, nome, preco, duracao_minutos ),
        cliente:cliente_id ( id, nome_completo, telefone )
      `)
      .eq('barbeiro_id', barbeiroId)
      .gte('data_hora', inicioSemana)
      .lte('data_hora', fimSemana)
      .neq('status', 'cancelado');
    if (barbeariaId) consultaSemana = consultaSemana.eq('barbearia_id', barbeariaId);
    const { data: dataSemana } = await consultaSemana.order('data_hora', { ascending: true });

    // 3. Todos os agendamentos concluídos ou confirmados para consolidar clientes
    let consultaTodos = supabase
      .from('agendamentos')
      .select(`
        data_hora, status,
        cliente:cliente_id ( id, nome_completo, telefone )
      `)
      .eq('barbeiro_id', barbeiroId)
      .in('status', ['confirmado', 'concluido']);
    if (barbeariaId) consultaTodos = consultaTodos.eq('barbearia_id', barbeariaId);
    const { data: dataTodos } = await consultaTodos.order('data_hora', { ascending: false });

    // 4. Clientes na fila de espera
    let consultaFila = supabase
      .from('fila_espera')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aguardando');
    if (barbeariaId) consultaFila = consultaFila.eq('barbearia_id', barbeariaId);
    const { count: filaCount } = await consultaFila;

    // 5. Atraso ativo de hoje
    let consultaAtraso = supabase
      .from('atrasos_agenda')
      .select('minutos_atraso, normalizado_em')
      .eq('barbeiro_id', barbeiroId)
      .eq('data', dataHojeStr);
    if (barbeariaId) consultaAtraso = consultaAtraso.eq('barbearia_id', barbeariaId);
    const { data: atrasoData } = await consultaAtraso.maybeSingle();

    // 6. Aviso de tarde fechada para hoje
    let consultaAviso = supabase
      .from('avisos_funcionamento')
      .select('tarde_fechada')
      .eq('barbeiro_id', barbeiroId)
      .eq('data', dataHojeStr);
    if (barbeariaId) consultaAviso = consultaAviso.eq('barbearia_id', barbeariaId);
    const { data: avisoData } = await consultaAviso.maybeSingle();

    setAgendamentosHoje((dataHoje ?? []) as unknown as AgendamentoBarbeiro[]);
    setAgendamentosSemana((dataSemana ?? []) as unknown as AgendamentoBarbeiro[]);
    setTotalNaFila(filaCount ?? 0);
    setTardeFechadaHoje(avisoData?.tarde_fechada ?? false);

    if (atrasoData && !atrasoData.normalizado_em) {
      setMinutosAtraso(atrasoData.minutos_atraso ?? 0);
    } else {
      setMinutosAtraso(0);
    }

    // Consolida clientes
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
  }, [barbeiroId, barbeariaId]);

  const concluirAgendamento = useCallback(async (id: string) => {
    let consulta = supabase
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', id)
      .eq('barbeiro_id', barbeiroId);
    if (barbeariaId) consulta = consulta.eq('barbearia_id', barbeariaId);
    const { error } = await consulta;

    if (error) throw error;

    setAgendamentosHoje((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'concluido' } : item))
    );
    setAgendamentosSemana((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'concluido' } : item))
    );
  }, [barbeiroId, barbeariaId]);

  const cancelarAgendamento = useCallback(async (id: string) => {
    let consulta = supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .eq('barbeiro_id', barbeiroId);
    if (barbeariaId) consulta = consulta.eq('barbearia_id', barbeariaId);
    const { error } = await consulta;

    if (error) throw error;

    setAgendamentosHoje((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'cancelado' } : item))
    );
    setAgendamentosSemana((prev) =>
      prev.filter((item) => item.id !== id)
    );
  }, [barbeiroId, barbeariaId]);

  const definirAtraso = useCallback(async (minutos: number) => {
    if (!barbeiroId) return;
    const data = new Date().toISOString().slice(0, 10);

    const { data: afetados, error: rpcErr } = await supabase.rpc('registrar_atraso_agenda', {
      p_minutos: minutos,
      p_data: data,
    });

    if (rpcErr) {
      const { error: upsertErr } = await supabase.from('atrasos_agenda').upsert(
        {
          barbeiro_id: barbeiroId,
          barbearia_id: barbeariaId ?? null,
          data,
          minutos_atraso: minutos,
          normalizado_em: minutos === 0 ? new Date().toISOString() : null,
        },
        { onConflict: 'barbeiro_id,data' }
      );
      if (upsertErr) throw upsertErr;
    }

    setMinutosAtraso(minutos);
    return afetados;
  }, [barbeiroId, barbeariaId]);

  const alternarTardeFechada = useCallback(async (fechada: boolean) => {
    if (!barbeiroId) return;
    const data = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from('avisos_funcionamento').upsert(
      {
        barbeiro_id: barbeiroId,
        barbearia_id: barbeariaId ?? null,
        data,
        tarde_fechada: fechada,
      },
      { onConflict: 'barbeiro_id,data' }
    );

    if (error) throw error;
    setTardeFechadaHoje(fechada);
  }, [barbeiroId, barbeariaId]);

  const criarReservaManual = useCallback(async (dados: {
    clienteId?: string;
    nomeCliente?: string;
    telefone?: string;
    servicoId: string;
    dataHora: string;
  }) => {
    if (!barbeiroId) throw new Error('Barbeiro não autenticado.');

    // Se clienteId não for fornecido, usa o próprio barbeiro ou cria perfil
    const clienteFinalId = dados.clienteId || barbeiroId;

    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        barbeiro_id: barbeiroId,
        cliente_id: clienteFinalId,
        servico_id: dados.servicoId,
        barbearia_id: barbeariaId ?? null,
        data_hora: dados.dataHora,
        status: 'confirmado',
      })
      .select(`
        id, data_hora, status,
        servico:servico_id ( id, nome, preco, duracao_minutos ),
        cliente:cliente_id ( id, nome_completo, telefone )
      `)
      .single();

    if (error) throw error;

    await carregar();
    return data;
  }, [barbeiroId, barbeariaId, carregar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    agendamentosHoje,
    agendamentosSemana,
    clientes,
    totalNaFila,
    minutosAtraso,
    tardeFechadaHoje,
    carregando,
    recarregar: carregar,
    concluirAgendamento,
    cancelarAgendamento,
    definirAtraso,
    alternarTardeFechada,
    criarReservaManual,
  };
}
