-- Slots tambem precisam ser isolados por tenant quando o barbeiro possui
-- vinculo com mais de uma barbearia.

begin;

alter table public.slots_agenda
  drop constraint if exists slots_agenda_barbeiro_id_data_hora_key;

create unique index if not exists slots_agenda_tenant_barbeiro_data_unique
  on public.slots_agenda (barbearia_id, barbeiro_id, data_hora);

commit;
