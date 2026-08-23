-- Reparo determinístico de registros legados criados antes dos triggers tenant-aware.
begin;

update public.agendamentos a
set barbearia_id = s.barbearia_id
from public.servicos s
where a.servico_id = s.id
  and a.barbearia_id is null
  and s.barbearia_id is not null;

do $$
begin
  if exists (select 1 from public.agendamentos where barbearia_id is null) then
    raise exception 'Ainda existem agendamentos sem barbearia_id após o reparo';
  end if;
  if exists (
    select 1
    from public.agendamentos a
    join public.servicos s on s.id = a.servico_id
    where a.barbearia_id is distinct from s.barbearia_id
  ) then
    raise exception 'Ainda existem agendamentos com serviço de outro tenant após o reparo';
  end if;
end;
$$;

commit;
