-- Um barbeiro pode administrar mais de uma barbearia. A agenda semanal
-- precisa ser unica por tenant, barbeiro e periodo.

begin;

alter table public.agendas_semanais
  drop constraint if exists agendas_semanais_unica_por_barbeiro;

create unique index if not exists agendas_semanais_tenant_barbeiro_periodo_unique
  on public.agendas_semanais (barbearia_id, barbeiro_id, data_inicio);

commit;
