-- Leitura segura dos slots publicados. Centraliza a regra de visibilidade
-- para evitar depender de subconsultas RLS encadeadas no cliente.

begin;

create or replace function public.buscar_slots_disponiveis(
  p_barbearia_id uuid,
  p_barbeiro_id uuid default null
)
returns table (id uuid, data_hora timestamptz, barbeiro_id uuid, barbearia_id uuid)
language sql stable security definer set search_path = public
as $$
  select s.id, s.data_hora, s.barbeiro_id, s.barbearia_id
  from public.slots_agenda s
  join public.dias_agenda d on d.id = s.dia_agenda_id
    and d.barbearia_id = s.barbearia_id and d.ativo = true
  join public.agendas_semanais a on a.id = d.agenda_semana_id
    and a.barbearia_id = s.barbearia_id
    and a.status in ('aberta', 'programada')
  where s.barbearia_id = p_barbearia_id
    and s.ativo = true
    and (p_barbeiro_id is null or s.barbeiro_id = p_barbeiro_id)
    and public.barbearia_publicada(s.barbearia_id)
  order by s.data_hora;
$$;

revoke all on function public.buscar_slots_disponiveis(uuid, uuid) from public;
grant execute on function public.buscar_slots_disponiveis(uuid, uuid) to anon, authenticated;

commit;
