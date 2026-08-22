-- ============================================================================
-- FASE 9: Notificações Push, Lembretes, Abertura Automática e Atrasos
-- ============================================================================

-- 1. Lembretes programados de agendamentos
create table if not exists public.lembretes_agendados (
  id uuid default gen_random_uuid() primary key,
  agendamento_id uuid references public.agendamentos(id) on delete cascade not null,
  tipo text not null check (tipo in ('vespera', 'horas_antes')),
  enviar_em timestamp with time zone not null,
  enviado boolean default false not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lembretes_agendados enable row level security;

create policy "Cliente vê seus lembretes agendados" on public.lembretes_agendados
  for select using (
    exists (
      select 1 from public.agendamentos a
      where a.id = agendamento_id and a.cliente_id = auth.uid()
    )
  );

-- 2. Trigger: ao criar agendamento, gera lembretes automáticos (véspera e 2h antes)
create or replace function public.agendar_lembretes_agendamento()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_data_hora timestamp with time zone;
begin
  -- Se slot_id estiver preenchido, busca data_hora do slot
  if NEW.slot_id is not null then
    select s.data_hora into v_data_hora
    from public.slots_agenda s
    where s.id = NEW.slot_id;
  end if;

  -- Se não achou no slot (ou agendamento legado), monta a partir de data e horario
  if v_data_hora is null and NEW.data is not null and NEW.horario is not null then
    v_data_hora := (NEW.data || ' ' || NEW.horario)::timestamp with time zone;
  end if;

  if v_data_hora is not null then
    -- Lembrete de véspera (13 horas antes, ex: dia anterior às 19h para atendimento às 08h)
    insert into public.lembretes_agendados (agendamento_id, tipo, enviar_em)
    values (NEW.id, 'vespera', v_data_hora - interval '13 hours');

    -- Lembrete 2 horas antes do atendimento
    insert into public.lembretes_agendados (agendamento_id, tipo, enviar_em)
    values (NEW.id, 'horas_antes', v_data_hora - interval '2 hours');
  end if;

  return NEW;
end;
$$;

drop trigger if exists tg_agendar_lembretes on public.agendamentos;
create trigger tg_agendar_lembretes
  after insert on public.agendamentos
  for each row execute function public.agendar_lembretes_agendamento();

-- 3. RPC: Confirmar presença pelo cliente
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
    and status = 'agendado'
  returning * into v_agendamento;

  if v_agendamento.id is null then
    raise exception 'Agendamento não encontrado ou não está no estado agendado.';
  end if;

  return v_agendamento;
end;
$$;

-- 4. Trigger: Quando a agenda semanal mudar para 'aberta', gera notificação para clientes
create or replace function public.notificar_agenda_aberta()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if NEW.status = 'aberta' and (OLD.status is null or OLD.status != 'aberta') then
    insert into public.notifications (usuario_id, tipo, titulo, mensagem, dados)
    select
      nt.usuario_id,
      'agenda_aberta',
      'Agenda aberta! 💈',
      'A agenda da semana ' || to_char(NEW.data_inicio, 'DD/MM') || ' a ' || to_char(NEW.data_fim, 'DD/MM') || ' está aberta. Garanta seu horário!',
      jsonb_build_object(
        'tipo', 'agenda_aberta',
        'agenda_semana_id', NEW.id,
        'data_inicio', NEW.data_inicio,
        'data_fim', NEW.data_fim
      )
    from public.notification_tokens nt
    where nt.ativo = true
      and nt.usuario_id != NEW.barbeiro_id
    group by nt.usuario_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists tg_notificar_agenda_aberta on public.agendas_semanais;
create trigger tg_notificar_agenda_aberta
  after update on public.agendas_semanais
  for each row execute function public.notificar_agenda_aberta();

-- 5. RPC: Registrar atraso e disparar notificações para clientes afetados
create or replace function public.registrar_atraso_agenda(
  p_minutos integer,
  p_data date default current_date
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_barbeiro_id uuid := auth.uid();
  v_afetados integer := 0;
  v_agendamento record;
begin
  if not exists (select 1 from public.perfis where id = v_barbeiro_id and role = 'barbeiro') then
    raise exception 'Apenas barbeiros podem registrar atrasos.';
  end if;

  -- Registra ou atualiza atraso do dia
  insert into public.atrasos_agenda (barbeiro_id, data, minutos_atraso, normalizado_em)
  values (v_barbeiro_id, p_data, p_minutos, null)
  on conflict (barbeiro_id, data)
  do update set
    minutos_atraso = excluded.minutos_atraso,
    normalizado_em = null,
    criado_em = now();

  -- Se for normalização (p_minutos <= 0)
  if p_minutos <= 0 then
    update public.atrasos_agenda
    set normalizado_em = now()
    where barbeiro_id = v_barbeiro_id and data = p_data;

    return 0;
  end if;

  -- Notifica clientes que possuem agendamento no dia de hoje com status ativo
  for v_agendamento in
    select a.id, a.cliente_id, a.horario
    from public.agendamentos a
    where a.barbeiro_id = v_barbeiro_id
      and a.data = p_data
      and a.status in ('agendado', 'confirmado')
  loop
    insert into public.notifications (usuario_id, tipo, titulo, mensagem, dados)
    values (
      v_agendamento.cliente_id,
      'atraso',
      'Aviso de Atraso ⏳',
      'Houve um pequeno atraso de aprox. ' || p_minutos || ' min na barbearia. Seu horário das ' || v_agendamento.horario || ' deve iniciar um pouco depois.',
      jsonb_build_object(
        'tipo', 'atraso',
        'agendamento_id', v_agendamento.id,
        'minutos_atraso', p_minutos,
        'horario_original', v_agendamento.horario
      )
    );
    v_afetados := v_afetados + 1;
  end loop;

  return v_afetados;
end;
$$;
