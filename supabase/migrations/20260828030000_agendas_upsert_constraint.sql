-- O upsert via PostgREST precisa de uma constraint UNIQUE explicita para
-- reconhecer o alvo do ON CONFLICT.

begin;

drop index if exists public.agendas_semanais_tenant_barbeiro_periodo_unique;
alter table public.agendas_semanais
  drop constraint if exists agendas_semanais_tenant_barbeiro_periodo_unique;
alter table public.agendas_semanais
  add constraint agendas_semanais_tenant_barbeiro_periodo_unique
  unique (barbearia_id, barbeiro_id, data_inicio);

commit;
