-- Habilita extensão para UUIDs
create extension if not exists "uuid-ossp";

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
  id uuid default uuid_generate_v4() primary key,
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
  id uuid default uuid_generate_v4() primary key,
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

-- Seeds de Serviços Iniciais
insert into public.servicos (nome, descricao, preco, duracao_minutos, ativo)
values 
  ('Corte de Cabelo', 'Corte moderno ou clássico com tesoura e máquina', 35.00, 30, true),
  ('Barba Completa', 'Modelagem de barba com toalha quente e navalha', 25.00, 30, true),
  ('Combo Cabelo + Barba', 'Corte de cabelo completo e barba alinhada', 50.00, 60, true),
  ('Pézinho / Acabamento', 'Alinhamento de contornos e nuca', 15.00, 15, true)
on conflict do nothing;
