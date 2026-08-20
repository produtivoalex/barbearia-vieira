-- ============================================================================
-- SCRIPT DE CONFIGURAÇÃO DE CRONS NO SUPABASE DASHBOARD / SQL EDITOR
-- ============================================================================
-- Instruções:
-- 1. Abra o Supabase Dashboard -> SQL Editor (ou via CLI supabase db push).
-- 2. Substitua os placeholders <SUA_SUPABASE_URL> e <SUA_SUPABASE_SERVICE_ROLE_KEY>
--    pelas variáveis reais do seu projeto Supabase (Project Settings -> API).
--    Exemplo:
--      URL: https://xxxxxxxxxxxx.supabase.co
--      KEY: eyJhbGciOi...
-- ============================================================================

-- 1. Habilitar extensões pg_cron e pg_net no PostgreSQL
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Limpar agendamentos anteriores (caso já existam com o mesmo nome)
do $$
begin
  perform cron.unschedule('auto-open-agenda-job');
exception when others then null;
end $$;

do $$
begin
  perform cron.unschedule('process-notifications-job');
exception when others then null;
end $$;

-- 3. Agendar auto-open-agenda a cada 5 minutos (*/5 * * * *)
-- Abre agendas programadas que atingiram data_abertura_programada <= NOW()
select cron.schedule(
  'auto-open-agenda-job',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := '<SUA_SUPABASE_URL>/functions/v1/auto-open-agenda',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SUA_SUPABASE_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- 4. Agendar process-notifications a cada 1 minuto (* * * * *)
-- Processa lembretes pendentes (véspera/2h antes) e envia push notifications via Expo API
select cron.schedule(
  'process-notifications-job',
  '* * * * *',
  $$
  select net.http_post(
    url := '<SUA_SUPABASE_URL>/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SUA_SUPABASE_SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- 5. Consulta para verificar jobs agendados
select jobid, jobname, schedule, command, active from cron.job;
