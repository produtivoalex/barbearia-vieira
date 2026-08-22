-- ============================================================================
-- FASE 10: Agendamentos CRON e Refinamentos de RPCs
-- ============================================================================

-- 1. Habilitar extensões necessárias para CRON e requisições HTTP internas
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Refinamento da RPC confirmar_presenca (suporta 'pendente' e 'agendado')
create or replace function public.confirmar_presenca(p_agendamento_id uuid)
returns public.agendamentos
language plpgsql security definer set search_path = public
as $$
declare
  v_agendamento public.agendamentos;
begin
  update public.agendamentos
  set status = 'confirmado'
  where id = p_agendamento_id
    and cliente_id = auth.uid()
    and status in ('pendente', 'agendado')
  returning * into v_agendamento;

  if v_agendamento.id is null then
    raise exception 'Agendamento não encontrado ou não está pendente/agendado.';
  end if;

  return v_agendamento;
end;
$$;

-- 3. Política de RLS para cancelamento/atualização do próprio agendamento pelo cliente
create policy "Clientes podem atualizar seus próprios agendamentos" on public.agendamentos
  for update using ( auth.uid() = cliente_id )
  with check ( auth.uid() = cliente_id );

-- 4. Funções auxiliares para disparar as Edge Functions via pg_net / cron

-- Função para chamar auto-open-agenda
create or replace function public.cron_executar_auto_open_agenda(p_supabase_url text, p_service_key text)
returns void
language plpgsql security definer as $$
begin
  perform net.http_post(
    url := p_supabase_url || '/functions/v1/auto-open-agenda',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || p_service_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- Função para chamar process-notifications
create or replace function public.cron_executar_process_notifications(p_supabase_url text, p_service_key text)
returns void
language plpgsql security definer as $$
begin
  perform net.http_post(
    url := p_supabase_url || '/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || p_service_key
    ),
    body := '{}'::jsonb
  );
end;
$$;
