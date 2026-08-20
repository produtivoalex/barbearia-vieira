-- PostgreSQL 14+ tem gen_random_uuid() nativo — sem necessidade de uuid-ossp

-- 1. Tabela de Perfis
create table if not exists public.perfis (
  id uuid references auth.users(id) on delete cascade primary key,
  nome_completo text,
  telefone text,
  role text check (role in ('cliente', 'barbeiro')) default 'cliente',
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Segurança) em Perfis
alter table public.perfis enable row level security;
create policy "Perfis visíveis para o próprio usuário" on public.perfis for select using ( auth.uid() = id );
create policy "Barbeiros visíveis para todos" on public.perfis for select using ( role = 'barbeiro' );
create policy "Usuário pode atualizar seu próprio perfil" on public.perfis for update using ( auth.uid() = id );
create policy "Usuário pode inserir seu próprio perfil" on public.perfis for insert with check ( auth.uid() = id );

-- 2. Trigger para criar perfil automaticamente no cadastro
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.perfis (id, nome_completo)
  values (new.id, new.raw_user_meta_data->>'nome_completo');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Tabela de Serviços
create table if not exists public.servicos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  preco numeric not null,
  duracao_minutos integer not null,
  ativo boolean default true
);

-- Habilitar RLS em Serviços
alter table public.servicos enable row level security;
create policy "Serviços ativos visíveis para todos" on public.servicos for select using ( ativo = true );

-- 4. Tabela de Agendamentos
create table if not exists public.agendamentos (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references public.perfis(id) not null,
  barbeiro_id uuid references public.perfis(id) not null,
  servico_id uuid references public.servicos(id) not null,
  data_hora timestamp with time zone not null,
  status text check (status in ('pendente', 'confirmado', 'cancelado', 'concluido')) default 'pendente',
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em Agendamentos
alter table public.agendamentos enable row level security;
create policy "Clientes podem criar seus agendamentos" on public.agendamentos for insert with check ( auth.uid() = cliente_id );
create policy "Usuários podem ver seus próprios agendamentos" on public.agendamentos for select using ( auth.uid() = cliente_id or auth.uid() = barbeiro_id );

-- Seeds de Serviços Reais — Barbearia Vieira
insert into public.servicos (nome, descricao, preco, duracao_minutos, ativo, categoria)
values 
  -- Cortes
  ('Corte degradê', 'Degradê na régua com fade moderno e acabamento limpo', 20.00, 30, true, 'cortes'),
  ('Corte navalhado', 'Acabamento ultra preciso na navalhete e contorno alinhado', 23.00, 35, true, 'cortes'),
  ('Corte Social', 'Corte tradicional e elegante executado na tesoura e máquina', 18.00, 30, true, 'cortes'),
  ('Social todo na máquina', 'Praticidade, agilidade e uniformidade com pentes na máquina', 15.00, 20, true, 'cortes'),

  -- Combos
  ('Combo 1', 'Corte navalhado + barba desenhada + sobrancelha', 45.00, 60, true, 'combos'),
  ('Combo 2', 'Corte degradê + barba desenhada + sobrancelha', 43.00, 60, true, 'combos'),
  ('Combo 3', 'Corte social + barba desenhada + sobrancelha', 40.00, 50, true, 'combos'),
  ('Combo 4', 'Corte navalhado + barba desenhada', 35.00, 45, true, 'combos'),
  ('Combo 5', 'Corte degradê + barba desenhada', 33.00, 45, true, 'combos'),
  ('Combo 6', 'Social + barba desenhada', 30.00, 40, true, 'combos'),

  -- Barbas
  ('Barba desenhada', 'Alinhamento e contorno milimétrico da barba na navalha', 15.00, 25, true, 'barba'),
  ('Barba simples', 'Raspada toda a barba com rapidez e suavidade', 5.00, 15, true, 'barba'),

  -- Sobrancelha
  ('Sobrancelha', 'Design e alinhamento de sobrancelha masculino com pinça e navalha', 10.00, 15, true, 'sobrancelha'),

  -- Limpeza de Pele
  ('Limpeza de pele', 'Remoção profunda de impurezas faciais, esfoliação e revitalização', 20.00, 25, true, 'limpeza_de_pele')
on conflict do nothing;

-- ================================================================
-- FASE 8: agenda semanal, filas, atrasos e notificações
-- ================================================================

create table if not exists public.agendas_semanais (
  id uuid default gen_random_uuid() primary key,
  barbeiro_id uuid references public.perfis(id) on delete cascade not null,
  data_inicio date not null,
  data_fim date not null,
  status text check (status in ('em_preparacao', 'programada', 'aberta', 'encerrada')) default 'em_preparacao' not null,
  data_abertura_programada timestamp with time zone,
  notificar_abertura boolean default true not null,
  notificar_antecedencia_minutos integer default 0 not null check (notificar_antecedencia_minutos >= 0),
  criada_em timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint agendas_semanais_periodo_valido check (data_fim >= data_inicio),
  constraint agendas_semanais_unica_por_barbeiro unique (barbeiro_id, data_inicio)
);

create table if not exists public.dias_agenda (
  id uuid default gen_random_uuid() primary key,
  agenda_semana_id uuid references public.agendas_semanais(id) on delete cascade not null,
  data date not null,
  ativo boolean default true not null,
  unique (agenda_semana_id, data)
);

create table if not exists public.slots_agenda (
  id uuid default gen_random_uuid() primary key,
  dia_agenda_id uuid references public.dias_agenda(id) on delete cascade not null,
  barbeiro_id uuid references public.perfis(id) on delete cascade not null,
  data_hora timestamp with time zone not null,
  ativo boolean default true not null,
  unique (barbeiro_id, data_hora)
);

create table if not exists public.fila_espera (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references public.perfis(id) on delete cascade not null,
  servico_id uuid references public.servicos(id) not null,
  dias_preferidos integer[] default '{}',
  horarios_preferidos text[] default '{}',
  status text check (status in ('aguardando', 'ofertado', 'atendido', 'cancelado')) default 'aguardando' not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.fila_troca (
  id uuid default gen_random_uuid() primary key,
  agendamento_id uuid references public.agendamentos(id) on delete cascade not null,
  dias_desejados integer[] default '{}',
  horarios_desejados text[] default '{}',
  status text check (status in ('aguardando', 'trocado', 'cancelado')) default 'aguardando' not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.ofertas_fila (
  id uuid default gen_random_uuid() primary key,
  fila_espera_id uuid references public.fila_espera(id) on delete cascade not null,
  slot_id uuid references public.slots_agenda(id) on delete cascade not null,
  expira_em timestamp with time zone not null,
  status text check (status in ('pendente', 'aceita', 'recusada', 'expirada')) default 'pendente' not null,
  criada_em timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.atrasos_agenda (
  id uuid default gen_random_uuid() primary key,
  barbeiro_id uuid references public.perfis(id) on delete cascade not null,
  data date not null,
  minutos_atraso integer default 0 not null check (minutos_atraso >= 0),
  normalizado_em timestamp with time zone,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (barbeiro_id, data)
);

create table if not exists public.notification_tokens (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references public.perfis(id) on delete cascade not null,
  token text not null,
  plataforma text check (plataforma in ('ios', 'android', 'web')),
  ativo boolean default true not null,
  atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (usuario_id, token)
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references public.perfis(id) on delete cascade not null,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  dados jsonb default '{}'::jsonb not null,
  lida_em timestamp with time zone,
  enviada_em timestamp with time zone,
  criada_em timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications add column if not exists enviada_em timestamp with time zone;

create table if not exists public.agenda_lembretes (
  id uuid default gen_random_uuid() primary key,
  agenda_semana_id uuid references public.agendas_semanais(id) on delete cascade not null,
  cliente_id uuid references public.perfis(id) on delete cascade not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (agenda_semana_id, cliente_id)
);

alter table public.agendas_semanais enable row level security;
alter table public.dias_agenda enable row level security;
alter table public.slots_agenda enable row level security;
alter table public.fila_espera enable row level security;
alter table public.fila_troca enable row level security;
alter table public.ofertas_fila enable row level security;
alter table public.atrasos_agenda enable row level security;
alter table public.notification_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.agenda_lembretes enable row level security;

create policy "Barbeiro gerencia suas agendas" on public.agendas_semanais
  for all using (auth.uid() = barbeiro_id) with check (auth.uid() = barbeiro_id);
create policy "Clientes veem agendas abertas" on public.agendas_semanais
  for select using (status = 'aberta');
create policy "Barbeiro gerencia dias da agenda" on public.dias_agenda
  for all using (exists (select 1 from public.agendas_semanais a where a.id = agenda_semana_id and a.barbeiro_id = auth.uid()))
  with check (exists (select 1 from public.agendas_semanais a where a.id = agenda_semana_id and a.barbeiro_id = auth.uid()));
create policy "Todos veem dias de agendas abertas" on public.dias_agenda
  for select using (exists (select 1 from public.agendas_semanais a where a.id = agenda_semana_id and a.status = 'aberta'));
create policy "Slots de agendas abertas visíveis" on public.slots_agenda
  for select using (exists (select 1 from public.dias_agenda d join public.agendas_semanais a on a.id = d.agenda_semana_id where d.id = dia_agenda_id and a.status = 'aberta'));
create policy "Barbeiro gerencia seus slots" on public.slots_agenda
  for all using (auth.uid() = barbeiro_id) with check (auth.uid() = barbeiro_id);
create policy "Cliente gerencia sua fila" on public.fila_espera
  for all using (auth.uid() = cliente_id) with check (auth.uid() = cliente_id);
create policy "Cliente gerencia sua fila de troca" on public.fila_troca
  for all using (exists (select 1 from public.agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid()))
  with check (exists (select 1 from public.agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid()));
create policy "Cliente vê suas ofertas" on public.ofertas_fila
  for select using (exists (select 1 from public.fila_espera f where f.id = fila_espera_id and f.cliente_id = auth.uid()));
create policy "Barbeiro vê atrasos da sua agenda" on public.atrasos_agenda
  for all using (auth.uid() = barbeiro_id) with check (auth.uid() = barbeiro_id);
create policy "Usuário gerencia seus tokens" on public.notification_tokens
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Usuário vê suas notificações" on public.notifications
  for select using (auth.uid() = usuario_id);
create policy "Usuário marca suas notificações" on public.notifications
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Cliente gerencia seus lembretes" on public.agenda_lembretes
  for all using (auth.uid() = cliente_id) with check (auth.uid() = cliente_id);

-- Reserva o slot apenas se ele ainda estiver disponível e se o cliente não
-- possuir outro agendamento ativo na mesma semana.
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
    raise exception 'Usuário não autorizado';
  end if;

  select s.* into v_slot
  from public.slots_agenda s
  join public.dias_agenda d on d.id = s.dia_agenda_id and d.ativo = true
  join public.agendas_semanais a on a.id = d.agenda_semana_id and a.status = 'aberta'
  where s.id = p_slot_id and s.ativo = true
  for update;

  if not found then raise exception 'Horário indisponível'; end if;
  if exists (
    select 1 from public.agendamentos x
    join public.dias_agenda d on d.data = (v_slot.data_hora at time zone 'America/Sao_Paulo')::date
    join public.agendas_semanais a on a.id = d.agenda_semana_id
    where x.cliente_id = p_cliente_id and x.status in ('pendente', 'confirmado')
      and x.data_hora >= a.data_inicio and x.data_hora < (a.data_fim + 1)
  ) then raise exception 'Cliente já possui agendamento ativo nesta semana'; end if;
  if exists (select 1 from public.agendamentos where barbeiro_id = v_slot.barbeiro_id and data_hora = v_slot.data_hora and status in ('pendente', 'confirmado')) then
    raise exception 'Horário acabou de ser reservado';
  end if;

  insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, data_hora, status)
  values (p_cliente_id, v_slot.barbeiro_id, p_servico_id, v_slot.data_hora, 'confirmado')
  returning * into v_agendamento;
  return v_agendamento;
end;
$$;

create or replace function public.aceitar_oferta_fila(p_oferta_id uuid)
returns public.agendamentos
language plpgsql security definer set search_path = public
as $$
declare
  v_oferta public.ofertas_fila;
  v_fila public.fila_espera;
  v_slot public.slots_agenda;
  v_agendamento public.agendamentos;
begin
  select o.* into v_oferta from public.ofertas_fila o where o.id = p_oferta_id for update;
  if not found then raise exception 'Oferta não encontrada'; end if;
  select f.* into v_fila from public.fila_espera f where f.id = v_oferta.fila_espera_id;
  if not found or v_fila.cliente_id <> auth.uid() then raise exception 'Usuário não autorizado'; end if;
  if v_oferta.status <> 'pendente' or v_oferta.expira_em <= now() then
    update public.ofertas_fila set status = 'expirada' where id = p_oferta_id and status = 'pendente';
    raise exception 'Esta oferta expirou';
  end if;

  select s.* into v_slot from public.slots_agenda s where s.id = v_oferta.slot_id and s.ativo = true for update;
  if not found or exists (select 1 from public.agendamentos a where a.barbeiro_id = v_slot.barbeiro_id and a.data_hora = v_slot.data_hora and a.status in ('pendente', 'confirmado')) then
    update public.ofertas_fila set status = 'expirada' where id = p_oferta_id;
    raise exception 'Horário acabou de ser ocupado';
  end if;
  if exists (select 1 from public.agendamentos a where a.cliente_id = auth.uid() and a.status in ('pendente', 'confirmado') and a.data_hora::date = v_slot.data_hora::date) then
    raise exception 'Você já possui um atendimento neste dia';
  end if;

  insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, data_hora, status)
  values (v_fila.cliente_id, v_slot.barbeiro_id, v_fila.servico_id, v_slot.data_hora, 'confirmado')
  returning * into v_agendamento;
  update public.ofertas_fila set status = 'aceita' where id = p_oferta_id;
  update public.fila_espera set status = 'atendido' where id = v_fila.id;
  return v_agendamento;
end;
$$;

create or replace function public.oferecer_proxima_vaga(p_slot_id uuid, p_minutos integer default 5)
returns public.ofertas_fila
language plpgsql security definer set search_path = public
as $$
declare
  v_slot public.slots_agenda;
  v_fila public.fila_espera;
  v_oferta public.ofertas_fila;
begin
  select s.* into v_slot from public.slots_agenda s where s.id = p_slot_id and s.ativo = true;
  if not found then return null; end if;
  if exists (select 1 from public.ofertas_fila o where o.slot_id = p_slot_id and o.status = 'pendente' and o.expira_em > now()) then return null; end if;

  select f.* into v_fila
  from public.fila_espera f
  where f.status = 'aguardando'
    and (cardinality(f.dias_preferidos) = 0 or extract(dow from (v_slot.data_hora at time zone 'America/Sao_Paulo'))::integer = any(f.dias_preferidos))
    and (cardinality(f.horarios_preferidos) = 0 or to_char(v_slot.data_hora at time zone 'America/Sao_Paulo', 'HH24:MI') = any(f.horarios_preferidos))
    and not exists (select 1 from public.agendamentos a where a.cliente_id = f.cliente_id and a.status in ('pendente', 'confirmado') and a.data_hora::date = v_slot.data_hora::date)
  order by f.criado_em
  limit 1
  for update skip locked;
  if not found then return null; end if;

  insert into public.ofertas_fila (fila_espera_id, slot_id, expira_em)
  values (v_fila.id, v_slot.id, now() + make_interval(mins => greatest(1, p_minutos)))
  returning * into v_oferta;
  update public.fila_espera set status = 'ofertado' where id = v_fila.id;
  insert into public.notifications (usuario_id, tipo, titulo, mensagem, dados)
  values (v_fila.cliente_id, 'oferta_fila', 'Surgiu uma vaga', 'Surgiu uma vaga compatível com suas preferências. Você tem alguns minutos para aceitar.', jsonb_build_object('ofertaId', v_oferta.id));
  return v_oferta;
end;
$$;

create or replace function public.disparar_oferta_apos_cancelamento()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_slot_id uuid;
begin
  if old.status in ('pendente', 'confirmado') and new.status = 'cancelado' then
    select id into v_slot_id from public.slots_agenda where barbeiro_id = new.barbeiro_id and data_hora = new.data_hora limit 1;
    if v_slot_id is not null then perform public.oferecer_proxima_vaga(v_slot_id, 5); end if;
  end if;
  return new;
end;
$$;

drop trigger if exists agendamento_cancelado_oferece_vaga on public.agendamentos;
create trigger agendamento_cancelado_oferece_vaga
  after update of status on public.agendamentos
  for each row execute procedure public.disparar_oferta_apos_cancelamento();
