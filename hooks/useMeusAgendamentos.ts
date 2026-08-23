import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AgendamentoCompleto {
  id: string;
  data_hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  servico: {
    nome: string;
    preco: number;
    duracao_minutos: number;
  };
  barbeiro: {
    nome_completo: string | null;
  };
}

export function useMeusAgendamentos(barbeariaId?: string) {
  const { session } = useAuth();
  const [proximos, setProximos] = useState<AgendamentoCompleto[]>([]);
  const [historico, setHistorico] = useState<AgendamentoCompleto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!session?.user?.id) {
      setProximos([]);
      setHistorico([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const agora = new Date().toISOString();

    let consulta = supabase
      .from('agendamentos')
      .select(`
        id,
        data_hora,
        status,
        servico:servico_id ( nome, preco, duracao_minutos ),
        barbeiro:barbeiro_id ( nome_completo )
      `)
      .eq('cliente_id', session.user.id)
      .order('data_hora', { ascending: true });
    if (barbeariaId) consulta = consulta.eq('barbearia_id', barbeariaId);
    const { data, error } = await consulta;

    if (error || !data) {
      setCarregando(false);
      return;
    }

    // Separa próximos (futuros ou pendentes/confirmados) de histórico
    const agendamentos = data as unknown as AgendamentoCompleto[];
    setProximos(
      agendamentos.filter(
        (a) => a.data_hora >= agora && (a.status === 'pendente' || a.status === 'confirmado')
      )
    );
    setHistorico(
      agendamentos.filter(
        (a) => a.data_hora < agora || a.status === 'cancelado' || a.status === 'concluido'
      )
    );

    setCarregando(false);
  }, [session?.user?.id, barbeariaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { proximos, historico, carregando, recarregar: carregar };
}
