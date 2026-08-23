import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Perfil } from './usePerfil';

export interface Agendamento {
  id: string;
  cliente_id: string;
  barbeiro_id: string;
  servico_id: string;
  data_hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  criado_em: string;
}

export function useAgendamento(barbeariaId?: string) {
  const { session } = useAuth();
  const [barbeiros, setBarbeiros] = useState<Perfil[]>([]);
  const [carregandoBarbeiros, setCarregandoBarbeiros] = useState(true);

  // Carrega barbeiros disponíveis
  const carregarBarbeiros = useCallback(async () => {
    setCarregandoBarbeiros(true);
    let consultaBarbeiros = supabase
      .from('perfis')
      .select('*')
      .eq('role', 'barbeiro');
    if (barbeariaId) {
      const { data: membros } = await supabase
        .from('barbearia_membros')
        .select('usuario_id')
        .eq('barbearia_id', barbeariaId)
        .eq('ativo', true)
        .in('papel', ['proprietario', 'gestor', 'barbeiro']);
      const ids = (membros ?? []).map((membro) => membro.usuario_id);
      if (!ids.length) {
        setBarbeiros([]);
        setCarregandoBarbeiros(false);
        return;
      }
      consultaBarbeiros = consultaBarbeiros.in('id', ids);
    }
    const { data } = await consultaBarbeiros;

    if (data && data.length > 0) {
      setBarbeiros(data as Perfil[]);
    } else {
      setBarbeiros([]);
    }
    setCarregandoBarbeiros(false);
  }, [barbeariaId]);

  useEffect(() => {
    carregarBarbeiros();
  }, [carregarBarbeiros]);

  // Busca horários já agendados em um dia específico (formato YYYY-MM-DD, horário local)
  const buscarHorariosOcupados = useCallback(async (dataIso: string, barbeiroId?: string): Promise<string[]> => {
    // Constrói início e fim do dia no horário local (UTC-3 = +3h no UTC)
    // Para garantir que buscamos todo o dia independente do fuso,
    // usamos uma janela de 48h centrada no dia e filtramos no cliente.
    const inicioDia = new Date(`${dataIso}T00:00:00`); // interpreta como local
    const fimDia = new Date(`${dataIso}T23:59:59`);    // interpreta como local

    let query = supabase
      .from('agendamentos')
      .select('data_hora')
      .gte('data_hora', inicioDia.toISOString())
      .lte('data_hora', fimDia.toISOString())
      .in('status', ['pendente', 'confirmado']);

    if (barbeiroId) {
      query = query.eq('barbeiro_id', barbeiroId);
    }
    if (barbeariaId) query = query.eq('barbearia_id', barbeariaId);

    const { data, error } = await query;
    if (error || !data) return [];

    // Extrai a hora local (correspondente a como o usuário selecionou)
    return data.map((item) => {
      const dataObj = new Date(item.data_hora);
      // getHours/getMinutes retorna hora local do dispositivo — correto,
      // pois o agendamento foi criado com new Date(ano, mes, dia, h, m) local.
      const horas = String(dataObj.getHours()).padStart(2, '0');
      const minutos = String(dataObj.getMinutes()).padStart(2, '0');
      return `${horas}:${minutos}`;
    });
  }, [barbeariaId]);

  // Criação de agendamento no Supabase
  const criarAgendamento = useCallback(async (dados: {
    servicoId: string;
    barbeiroId: string;
    dataHoraIso: string;
  }) => {
    if (!session?.user?.id) {
      return { error: new Error('Usuário não autenticado.') };
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .insert({
        cliente_id: session.user.id,
        barbeiro_id: dados.barbeiroId,
        servico_id: dados.servicoId,
        barbearia_id: barbeariaId ?? null,
        data_hora: dados.dataHoraIso,
        status: 'confirmado',
      })
      .select()
      .single();

    return { data, error };
  }, [session?.user?.id, barbeariaId]);

  return {
    barbeiros,
    carregandoBarbeiros,
    buscarHorariosOcupados,
    criarAgendamento,
    recarregarBarbeiros: carregarBarbeiros,
  };
}
