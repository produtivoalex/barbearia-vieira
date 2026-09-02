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

export interface VagaDireta {
  hora_inicio: string;
  hora_fim: string;
  data_hora: string;
  duracao_min: number;
  candidatos_fila: Array<{
    id: string;
    cliente_nome: string;
    cliente_telefone: string;
    servico_nome: string;
  }>;
}

export interface OtimizacaoSugestao {
  agendamento_id: string;
  cliente_nome: string;
  servico_nome: string;
  horario_atual: string;
  sugestao_ajuste: string;
  duracao_liberada_min: number;
  beneficio: string;
}

export interface ClienteResumo {
  id: string;
  nome_completo: string | null;
  telefone: string | null;
  totalAgendamentos: number;
  ultimoAtendimento: string | null;
  mimoNotificacao?: {
    id: string;
    criada_em: string;
    lida_em: string | null;
  } | null;
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
  const [vagasDiretas, setVagasDiretas] = useState<VagaDireta[]>([]);
  const [otimizacoes, setOtimizacoes] = useState<OtimizacaoSugestao[]>([]);
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

    // 7. Notificações de mimo de reativação para cruzar com clientes
    let consultaMimos = supabase
      .from('notifications')
      .select('id, usuario_id, criada_em, lida_em')
      .eq('tipo', 'mimo_reativacao')
      .order('criada_em', { ascending: false });
    if (barbeariaId) consultaMimos = consultaMimos.eq('barbearia_id', barbeariaId);
    const { data: dataMimos } = await consultaMimos;
    const mimosPorCliente = new Map<string, { id: string; criada_em: string; lida_em: string | null }>();
    if (dataMimos) {
      for (const m of dataMimos) {
        if (!mimosPorCliente.has(m.usuario_id)) {
          mimosPorCliente.set(m.usuario_id, {
            id: m.id,
            criada_em: m.criada_em,
            lida_em: m.lida_em,
          });
        }
      }
    }

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
            mimoNotificacao: mimosPorCliente.get(c.id) ?? null,
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
    // 8. Detecção de Vagas Diretas e Otimizações de Encaixe
    try {
      if (barbeariaId) {
        const { data: vagasRes } = await supabase.rpc('detectar_vagas_e_otimizacoes', {
          p_barbearia_id: barbeariaId,
          p_barbeiro_id: barbeiroId,
          p_data: dataHojeStr,
        });
        if (vagasRes) {
          setVagasDiretas((vagasRes as any).vagas_diretas || []);
          setOtimizacoes((vagasRes as any).otimizacoes || []);
        }
      }
    } catch {
      // Falha graciosa caso a RPC esteja em migração
    }

    setCarregando(false);
  }, [barbeiroId, barbeariaId]);

  const concluirAgendamento = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', id);

    if (error) throw error;
    setAgendamentosHoje((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'concluido' } : a))
    );
  }, []);

  const cancelarAgendamento = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', id);

    if (error) throw error;
    setAgendamentosHoje((prev) => prev.filter((a) => a.id !== id));
    setAgendamentosSemana((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const definirAtraso = useCallback(async (minutos: number) => {
    if (!barbeiroId) return;
    const dataHojeStr = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from('atrasos_agenda')
      .upsert({
        barbeiro_id: barbeiroId,
        barbearia_id: barbeariaId ?? null,
        data: dataHojeStr,
        minutos_atraso: minutos,
        normalizado_em: minutos === 0 ? new Date().toISOString() : null,
      }, { onConflict: 'barbeiro_id,data' });

    if (error) throw error;
    setMinutosAtraso(minutos);
  }, [barbeiroId, barbeariaId]);

  const alternarTardeFechada = useCallback(async (fechada: boolean) => {
    if (!barbeiroId) return;
    const dataHojeStr = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from('avisos_funcionamento')
      .upsert({
        barbeiro_id: barbeiroId,
        barbearia_id: barbeariaId ?? null,
        data: dataHojeStr,
        tarde_fechada: fechada,
      }, { onConflict: 'barbeiro_id,data' });

    if (error) throw error;
    setTardeFechadaHoje(fechada);
  }, [barbeiroId, barbeariaId]);

  const criarReservaManual = useCallback(async (dados: {
    clienteId?: string;
    clienteNome?: string;
    nomeCliente?: string;
    clienteTelefone?: string;
    telefone?: string;
    servicoId: string;
    dataHora: string;
  }) => {
    if (!barbeiroId) throw new Error('Barbeiro não autenticado.');

    const tel = (dados.clienteTelefone || dados.telefone || '').trim();
    let clienteFinalId = dados.clienteId || barbeiroId;
    if (tel && !dados.clienteId) {
      const { data: perfilExistente } = await supabase
        .from('perfis')
        .select('id')
        .eq('telefone', tel)
        .maybeSingle();

      if (perfilExistente) {
        clienteFinalId = perfilExistente.id;
      }
    }

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

  const enviarMimoCliente = useCallback(async (clienteId: string, titulo?: string, mensagem?: string) => {
    if (!barbeariaId) throw new Error('Barbearia não selecionada.');

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        usuario_id: clienteId,
        barbearia_id: barbeariaId,
        tipo: 'mimo_reativacao',
        titulo: titulo || 'Mimo Especial 🎁',
        mensagem: mensagem || 'Você ganhou um presente exclusivo para seu próximo corte!',
        dados: { barbeariaId, validadeDias: 7 },
      })
      .select('id, criada_em, lida_em')
      .single();

    if (error) throw error;

    setClientes((prev) =>
      prev.map((cli) =>
        cli.id === clienteId
          ? {
              ...cli,
              mimoNotificacao: {
                id: data.id,
                criada_em: data.criada_em,
                lida_em: null,
              },
            }
          : cli
      )
    );

    return data;
  }, [barbeariaId]);

  const aplicarOtimizacao = useCallback(async (otim: OtimizacaoSugestao) => {
    if (!barbeiroId || !barbeariaId) return;
    const agora = new Date();
    const dataHojeStr = agora.toISOString().slice(0, 10);
    const novoIso = `${dataHojeStr}T${otim.sugestao_ajuste}:00Z`;

    const { error } = await supabase
      .from('agendamentos')
      .update({
        data_hora: novoIso,
        data_hora_fim: new Date(new Date(novoIso).getTime() + (otim.duracao_liberada_min || 30) * 60 * 1000).toISOString(),
      })
      .eq('id', otim.agendamento_id);

    if (error) throw error;
    await carregar();
  }, [barbeiroId, barbeariaId, carregar]);

  const liberarVagaParaFila = useCallback(async (vaga: VagaDireta, filaCandidatoId?: string) => {
    if (!barbeiroId || !barbeariaId) return;

    if (filaCandidatoId) {
      await supabase.from('notifications').insert({
        usuario_id: filaCandidatoId,
        barbearia_id: barbeariaId,
        tipo: 'oferta_vaga_fila',
        titulo: 'Vaga Disponível Hoje! ⚡',
        mensagem: `Uma vaga foi liberada para hoje às ${vaga.hora_inicio}! Abra o app para confirmar.`,
        dados: { barbeariaId, dataHora: vaga.data_hora },
      });
    }
    await carregar();
  }, [barbeiroId, barbeariaId, carregar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    agendamentosHoje,
    agendamentosSemana,
    vagasDiretas,
    otimizacoes,
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
    enviarMimoCliente,
    aplicarOtimizacao,
    liberarVagaParaFila,
  };
}
