-- Permite reservar agendas futuras que ainda estao marcadas como programada.
-- O status programada ja era exibido pela agenda legada, mas as policies e a
-- RPC multi-tenant aceitavam somente aberta.

begin;

drop policy if exists agendas_publicas_select on public.agendas_semanais;
create policy agendas_publicas_select on public.agendas_semanais
  for select using (status in ('aberta', 'programada') and public.barbearia_publicada(barbearia_id));

drop policy if exists dias_publicos_select on public.dias_agenda;
create policy dias_publicos_select on public.dias_agenda
  for select using (
    ativo = true
    and exists (
      select 1 from public.agendas_semanais a
      where a.id = agenda_semana_id
        and a.barbearia_id = dias_agenda.barbearia_id
        and a.status in ('aberta', 'programada')
        and public.barbearia_publicada(a.barbearia_id)
    )
  );

drop policy if exists slots_publicos_select on public.slots_agenda;
create policy slots_publicos_select on public.slots_agenda
  for select using (
    ativo = true
    and exists (
      select 1
      from public.dias_agenda d
      join public.agendas_semanais a on a.id = d.agenda_semana_id
      where d.id = dia_agenda_id
        and d.barbearia_id = slots_agenda.barbearia_id
        and a.status in ('aberta', 'programada')
        and public.barbearia_publicada(a.barbearia_id)
    )
  );

create or replace function public.reservar_slot(
  p_slot_id uuid,
  p_cliente_id uuid,
  p_servico_id uuid
) returns public.agendamentos
language plpgsql security definer set search_path = public
as $$
declare
  v_slot public.slots_agenda;
  v_servico public.servicos;
  v_agendamento public.agendamentos;
begin
  if auth.uid() is null or auth.uid() <> p_cliente_id then
    raise exception 'Usuário não autorizado';
  end if;

  select s.* into v_slot
  from public.slots_agenda s
  join public.dias_agenda d on d.id = s.dia_agenda_id and d.ativo = true
  join public.agendas_semanais a on a.id = d.agenda_semana_id
    and a.status in ('aberta', 'programada')
    and a.barbearia_id = s.barbearia_id
  where s.id = p_slot_id and s.ativo = true
  for update;

  if not found then raise exception 'Horário indisponível'; end if;

  select * into v_servico from public.servicos where id = p_servico_id and ativo = true;
  if not found or v_servico.barbearia_id is distinct from v_slot.barbearia_id then
    raise exception 'Serviço não pertence à barbearia do horário';
  end if;

  if exists (
    select 1 from public.agendamentos a
    where a.barbeiro_id = v_slot.barbeiro_id
      and a.barbearia_id = v_slot.barbearia_id
      and a.data_hora = v_slot.data_hora
      and a.status in ('pendente', 'confirmado')
  ) then raise exception 'Horário acabou de ser reservado'; end if;

  if exists (
    select 1 from public.agendamentos a
    where a.cliente_id = p_cliente_id
      and a.barbearia_id = v_slot.barbearia_id
      and a.status in ('pendente', 'confirmado')
      and a.data_hora::date = (v_slot.data_hora at time zone 'America/Sao_Paulo')::date
  ) then raise exception 'Cliente já possui agendamento ativo neste dia'; end if;

  insert into public.agendamentos
    (cliente_id, barbeiro_id, servico_id, barbearia_id, data_hora, status)
  values
    (p_cliente_id, v_slot.barbeiro_id, p_servico_id, v_slot.barbearia_id, v_slot.data_hora, 'confirmado')
  returning * into v_agendamento;

  return v_agendamento;
end;
$$;

commit;
