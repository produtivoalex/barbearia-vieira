import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (request) => {
  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const agora = new Date();
  const agoraIso = agora.toISOString();

  // 1. Abertura Automática de Agendas Programadas
  const { data: agendasProgramadas, error: errAgendas } = await supabase
    .from('agendas_semanais')
    .select('id, barbeiro_id, barbearia_id, data_inicio, data_fim, data_abertura_programada')
    .eq('status', 'programada')
    .lte('data_abertura_programada', agoraIso);

  if (errAgendas) {
    console.error('Erro ao buscar agendas programadas:', errAgendas.message);
  }

  let agendasAbertas = 0;
  for (const agenda of agendasProgramadas ?? []) {
    const { error: errUpdate } = await supabase
      .from('agendas_semanais')
      .update({
        status: 'aberta',
        atualizado_em: agoraIso,
      })
      .eq('id', agenda.id);

    if (!errUpdate) {
      agendasAbertas += 1;
    } else {
      console.error(`Erro ao abrir agenda ${agenda.id}:`, errUpdate.message);
    }
  }

  // 2. Lembrete ao Barbeiro (Segunda-feira) se a agenda ainda não estiver preparada
  // Dia 1 = Segunda-feira no UTC/Horário de Brasília
  const diaSemana = agora.getDay();
  let barbeirosAvisados = 0;

  if (diaSemana === 1) {
    // Busca vínculos ativos de barbeiros por barbearia.
    const { data: barbeiros } = await supabase
      .from('barbearia_membros')
      .select('usuario_id, barbearia_id, perfil:perfis!inner(id, role)')
      .eq('ativo', true)
      .eq('perfil.role', 'barbeiro');

    for (const barbeiro of barbeiros ?? []) {
      // Verifica se existe agenda para a semana seguinte (ou atual) já programada/aberta
      const { data: agendaExistente } = await supabase
        .from('agendas_semanais')
        .select('id, status')
        .eq('barbeiro_id', barbeiro.usuario_id)
        .eq('barbearia_id', barbeiro.barbearia_id)
        .in('status', ['programada', 'aberta'])
        .gte('data_fim', agoraIso.split('T')[0])
        .limit(1);

      if (!agendaExistente || agendaExistente.length === 0) {
        // Verifica se já enviamos lembrete de segunda-feira hoje
        const hojeStr = agoraIso.split('T')[0];
        const { data: jaNotificado } = await supabase
          .from('notifications')
          .select('id')
          .eq('usuario_id', barbeiro.usuario_id)
          .eq('barbearia_id', barbeiro.barbearia_id)
          .eq('tipo', 'barbeiro_sem_agenda')
          .gte('criada_em', `${hojeStr}T00:00:00Z`)
          .limit(1);

        if (!jaNotificado || jaNotificado.length === 0) {
          await supabase.from('notifications').insert({
            usuario_id: barbeiro.usuario_id,
            barbearia_id: barbeiro.barbearia_id,
            tipo: 'barbeiro_sem_agenda',
            titulo: 'Prepare a Próxima Semana 💈',
            mensagem:
              'A próxima semana ainda não está preparada. Revise os dias de trabalho antes de abrir a agenda para os clientes.',
            dados: { tipo: 'barbeiro_sem_agenda', barbearia_id: barbeiro.barbearia_id },
          });
          barbeirosAvisados += 1;
        }
      }
    }
  }

  // 3. Dispara o processamento imediato de notificações
  try {
    const edgeBaseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.supabase.co/functions/v1');
    if (edgeBaseUrl) {
      await fetch(`${edgeBaseUrl}/process-notifications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      });
    }
  } catch (err) {
    console.warn('Não foi possível acionar process-notifications síncrono:', err);
  }

  return Response.json({
    sucesso: true,
    agendas_abertas: agendasAbertas,
    barbeiros_avisados: barbeirosAvisados,
    executado_em: agoraIso,
  });
});
