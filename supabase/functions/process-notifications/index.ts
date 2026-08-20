import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const expoPushUrl = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (request) => {
  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let totalEnviadas = 0;

  // 1. Processa Lembretes Agendados Pendentes
  const agora = new Date().toISOString();
  const { data: lembretesPendentes, error: errLembretes } = await supabase
    .from('lembretes_agendados')
    .select(`
      id,
      tipo,
      agendamento_id,
      agendamento:agendamentos (
        id,
        cliente_id,
        data,
        horario,
        status,
        servico:servicos(nome)
      )
    `)
    .eq('enviado', false)
    .lte('enviar_em', agora)
    .limit(50);

  if (errLembretes) {
    console.error('Erro ao buscar lembretes:', errLembretes.message);
  }

  for (const lembrete of lembretesPendentes ?? []) {
    const agendamento = Array.isArray(lembrete.agendamento)
      ? lembrete.agendamento[0]
      : lembrete.agendamento;

    if (!agendamento || agendamento.status === 'cancelado' || agendamento.status === 'concluido') {
      await supabase.from('lembretes_agendados').update({ enviado: true }).eq('id', lembrete.id);
      continue;
    }

    const servicoNome = agendamento.servico?.nome ?? 'Atendimento';
    const titulo =
      lembrete.tipo === 'vespera'
        ? 'Lembrete de Atendimento 💈'
        : 'Seu horário é daqui a pouco! ✂️';

    const mensagem =
      lembrete.tipo === 'vespera'
        ? `Lembrete: você tem agendamento amanhã às ${agendamento.horario} (${servicoNome}). Abra o app para confirmar sua presença!`
        : `Seu horário de ${servicoNome} na Barbearia Vieira está marcado para hoje às ${agendamento.horario}. Estamos prontos para te atender!`;

    // Insere na tabela de notificações do usuário
    await supabase.from('notifications').insert({
      usuario_id: agendamento.cliente_id,
      tipo: 'lembrete',
      titulo,
      mensagem,
      dados: {
        tipo: 'lembrete',
        agendamento_id: agendamento.id,
        tipo_lembrete: lembrete.tipo,
      },
    });

    await supabase.from('lembretes_agendados').update({ enviado: true }).eq('id', lembrete.id);
  }

  // 2. Processa Notificações Pendentes de Envio via Push
  const { data: notificacoes, error: errNotif } = await supabase
    .from('notifications')
    .select('id, usuario_id, tipo, titulo, mensagem, dados')
    .is('enviada_em', null)
    .order('criada_em', { ascending: true })
    .limit(100);

  if (errNotif) {
    return Response.json({ error: errNotif.message }, { status: 500 });
  }

  for (const notificacao of notificacoes ?? []) {
    const { data: tokens } = await supabase
      .from('notification_tokens')
      .select('token')
      .eq('usuario_id', notificacao.usuario_id)
      .eq('ativo', true);

    if (!tokens?.length) {
      // Se o usuário não tem tokens cadastrados, marca enviada para não reprocessar eternamente
      await supabase
        .from('notifications')
        .update({ enviada_em: new Date().toISOString() })
        .eq('id', notificacao.id);
      continue;
    }

    const mensagens = tokens.map(({ token }) => ({
      to: token,
      title: notificacao.titulo,
      body: notificacao.mensagem,
      data: notificacao.dados ?? {},
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    }));

    try {
      const resposta = await fetch(expoPushUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mensagens),
      });

      if (resposta.ok) {
        await supabase
          .from('notifications')
          .update({ enviada_em: new Date().toISOString() })
          .eq('id', notificacao.id);
        totalEnviadas += mensagens.length;
      }
    } catch (err) {
      console.error('Erro ao chamar Expo Push API:', err);
    }
  }

  return Response.json({
    sucesso: true,
    lembretes_processados: lembretesPendentes?.length ?? 0,
    notificacoes_processadas: notificacoes?.length ?? 0,
    push_enviados: totalEnviadas,
    executado_em: new Date().toISOString(),
  });
});
