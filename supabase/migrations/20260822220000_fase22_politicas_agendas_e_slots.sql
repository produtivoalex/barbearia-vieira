-- ================================================================
-- FASE 22: Políticas RLS e Correção de Triggers em Agendamentos
-- ================================================================

-- 1. Permite que clientes vejam agendas em status 'aberta' ou 'programada'
drop policy if exists "Clientes veem agendas abertas" on public.agendas_semanais;
drop policy if exists "Clientes veem agendas abertas e programadas" on public.agendas_semanais;
create policy "Clientes veem agendas abertas e programadas" on public.agendas_semanais
  for select using (status in ('aberta', 'programada'));

-- 2. Permite que clientes vejam os dias das agendas abertas ou programadas
drop policy if exists "Todos veem dias de agendas abertas" on public.dias_agenda;
drop policy if exists "Todos veem dias de agendas abertas e programadas" on public.dias_agenda;
create policy "Todos veem dias de agendas abertas e programadas" on public.dias_agenda
  for select using (
    exists (
      select 1 from public.agendas_semanais a 
      where a.id = agenda_semana_id 
        and a.status in ('aberta', 'programada')
    )
  );

-- 3. Permite que clientes vejam slots de agendas abertas ou programadas
drop policy if exists "Slots de agendas abertas visíveis" on public.slots_agenda;
drop policy if exists "Slots de agendas visíveis para clientes" on public.slots_agenda;
create policy "Slots de agendas visíveis para clientes" on public.slots_agenda
  for select using (
    exists (
      select 1 from public.dias_agenda d 
      join public.agendas_semanais a on a.id = d.agenda_semana_id 
      where d.id = dia_agenda_id 
        and a.status in ('aberta', 'programada')
    )
  );

-- 4. Correção crítica da trigger de lembretes (removendo referência a NEW.slot_id inexistente na tabela agendamentos)
create or replace function public.agendar_lembretes_agendamento()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if NEW.data_hora is not null then
    -- Lembrete de véspera (13 horas antes)
    insert into public.lembretes_agendados (agendamento_id, tipo, enviar_em)
    values (NEW.id, 'vespera', NEW.data_hora - interval '13 hours');

    -- Lembrete 2 horas antes do atendimento
    insert into public.lembretes_agendados (agendamento_id, tipo, enviar_em)
    values (NEW.id, 'horas_antes', NEW.data_hora - interval '2 hours');
  end if;

  return NEW;
end;
$$;

drop trigger if exists tg_agendar_lembretes on public.agendamentos;
create trigger tg_agendar_lembretes
  after insert on public.agendamentos
  for each row execute function public.agendar_lembretes_agendamento();

-- 5. Função de reserva de slot ultra-robusta
create or replace function public.reservar_slot(
  p_slot_id uuid,
  p_cliente_id uuid,
  p_servico_id uuid
) returns public.agendamentos
language plpgsql security definer set search_path = public
as $$
declare
  v_slot public.slots_agenda;
  v_agendamento public.agendamentos;
begin
  if auth.uid() is null or auth.uid() <> p_cliente_id then
    raise exception 'Usuário não autenticado';
  end if;

  -- Localiza o slot ativo com lock
  select s.* into v_slot
  from public.slots_agenda s
  where s.id = p_slot_id and s.ativo = true
  for update;

  if not found then 
    raise exception 'Horário indisponível'; 
  end if;

  -- Verifica se o horário já está ocupado por outro agendamento
  if exists (
    select 1 from public.agendamentos 
    where barbeiro_id = v_slot.barbeiro_id 
      and data_hora = v_slot.data_hora 
      and status in ('pendente', 'confirmado')
  ) then
    raise exception 'Este horário já foi preenchido por outro cliente';
  end if;

  -- Cria o agendamento confirmado
  insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, data_hora, status)
  values (p_cliente_id, v_slot.barbeiro_id, p_servico_id, v_slot.data_hora, 'confirmado')
  returning * into v_agendamento;

  return v_agendamento;
end;
$$;
