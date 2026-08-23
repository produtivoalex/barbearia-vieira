import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type StatusAgenda = 'em_preparacao' | 'programada' | 'aberta' | 'encerrada';

export interface DiaAgenda {
  id: string;
  data: string;
  ativo: boolean;
}

export interface AgendaSemanal {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: StatusAgenda;
  data_abertura_programada: string | null;
  notificar_abertura: boolean;
  notificar_antecedencia_minutos: number;
  dias: DiaAgenda[];
}

function formatoData(data: Date) {
  return data.toISOString().slice(0, 10);
}

function inicioDaProximaSemana() {
  const hoje = new Date();
  const dia = hoje.getDay();
  const distanciaParaSegunda = dia === 0 ? 1 : 8 - dia;
  const segunda = new Date(hoje);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(hoje.getDate() + distanciaParaSegunda);
  return segunda;
}

export function useAgendaSemanal(barbeariaId?: string) {
  const { session } = useAuth();
  const [agenda, setAgenda] = useState<AgendaSemanal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    const hoje = formatoData(new Date());
    let consulta = supabase
      .from('agendas_semanais')
      .select('id, data_inicio, data_fim, status, data_abertura_programada, notificar_abertura, notificar_antecedencia_minutos, dias:dias_agenda(id, data, ativo)')
      .gte('data_fim', hoje)
      .in('status', ['programada', 'aberta'])
      .order('data_inicio', { ascending: false })
      .limit(1);
    if (barbeariaId) consulta = consulta.eq('barbearia_id', barbeariaId);
    const { data, error } = await consulta.maybeSingle();

    if (error) {
      setErro(error.message);
      setAgenda(null);
    } else {
      setAgenda((data as unknown as AgendaSemanal | null) ?? null);
    }
    setCarregando(false);
  }, [barbeariaId]);

  const carregarProximaParaBarbeiro = useCallback(async () => {
    if (!session?.user?.id) return null;
    const inicio = inicioDaProximaSemana();
    let consulta = supabase
      .from('agendas_semanais')
      .select('id, data_inicio, data_fim, status, data_abertura_programada, notificar_abertura, notificar_antecedencia_minutos, dias:dias_agenda(id, data, ativo)')
      .eq('barbeiro_id', session.user.id)
      .eq('data_inicio', formatoData(inicio));
    if (barbeariaId) consulta = consulta.eq('barbearia_id', barbeariaId);
    const { data } = await consulta.maybeSingle();
    return (data as unknown as AgendaSemanal | null) ?? null;
  }, [session?.user?.id, barbeariaId]);

  const ativarLembrete = useCallback(async (agendaId: string) => {
    if (!session?.user?.id) return { error: new Error('Usuário não autenticado.') };
    const { error } = await supabase.from('agenda_lembretes').upsert({ agenda_semana_id: agendaId, cliente_id: session.user.id }, { onConflict: 'agenda_semana_id,cliente_id' });
    return { error };
  }, [session?.user?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { agenda, carregando, erro, recarregar: carregar, carregarProximaParaBarbeiro, ativarLembrete };
}

export function useNotificacoes(barbeariaId?: string) {
  const { session } = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);

  const carregar = useCallback(async () => {
    if (!session?.user?.id) return;
    let consulta = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', session.user.id)
      .is('lida_em', null);
    if (barbeariaId) consulta = consulta.eq('barbearia_id', barbeariaId);
    const { count } = await consulta;
    setNaoLidas(count ?? 0);
  }, [session?.user?.id, barbeariaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { naoLidas, recarregar: carregar };
}
