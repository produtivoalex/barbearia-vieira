import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const expoPushUrl = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { data: notificacoes, error } = await supabase
    .from('notifications')
    .select('id, usuario_id, titulo, mensagem, dados')
    .is('enviada_em', null)
    .order('criada_em', { ascending: true })
    .limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let enviadas = 0;
  for (const notificacao of notificacoes ?? []) {
    const { data: tokens } = await supabase
      .from('notification_tokens')
      .select('token')
      .eq('usuario_id', notificacao.usuario_id)
      .eq('ativo', true);
    if (!tokens?.length) continue;

    const mensagens = tokens.map(({ token }) => ({
      to: token,
      title: notificacao.titulo,
      body: notificacao.mensagem,
      data: notificacao.dados ?? {},
      sound: 'default',
    }));
    const resposta = await fetch(expoPushUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mensagens),
    });
    if (!resposta.ok) continue;
    await supabase.from('notifications').update({ enviada_em: new Date().toISOString() }).eq('id', notificacao.id);
    enviadas += 1;
  }

  return Response.json({ processadas: notificacoes?.length ?? 0, enviadas });
});
