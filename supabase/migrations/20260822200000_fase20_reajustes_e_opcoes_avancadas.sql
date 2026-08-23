-- ============================================================================
-- FASE 20: Reajustes de Preços, Lista Negra e Opções Avançadas do Barbeiro
-- ============================================================================

-- 1. Histórico e agendamento de Reajustes de Preços
create table if not exists public.reajustes_precos (
  id uuid default gen_random_uuid() primary key,
  barbeiro_id uuid references public.perfis(id) on delete cascade not null,
  tipo text check (tipo in ('individual', 'lote')) default 'individual' not null,
  data_vigencia date not null,
  justificativa text,
  itens_alterados jsonb not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reajustes_precos enable row level security;
create policy "Todos podem visualizar reajustes de preços" on public.reajustes_precos
  for select using ( true );
create policy "Barbeiro cria reajustes de preços" on public.reajustes_precos
  for insert with check ( auth.uid() = barbeiro_id );

-- 2. Lista Negra (Bloqueio de Clientes)
create table if not exists public.bloqueios_clientes (
  id uuid default gen_random_uuid() primary key,
  barbeiro_id uuid references public.perfis(id) on delete cascade not null,
  cliente_id uuid references public.perfis(id) on delete cascade,
  email text,
  telefone text,
  motivo text,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bloqueios_clientes enable row level security;
create policy "Barbeiro gerencia bloqueios" on public.bloqueios_clientes
  for all using ( auth.uid() = barbeiro_id ) with check ( auth.uid() = barbeiro_id );
create policy "Qualquer usuário pode verificar status de bloqueio" on public.bloqueios_clientes
  for select using ( true );

-- 3. Gestão de Equipe e Funcionários
create table if not exists public.equipe_barbearia (
  id uuid default gen_random_uuid() primary key,
  barbeiro_id uuid references public.perfis(id) on delete cascade not null,
  nome text not null,
  email text,
  telefone text,
  cargo text default 'Barbeiro',
  ativo boolean default true,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.equipe_barbearia enable row level security;
create policy "Barbeiro gerencia sua equipe" on public.equipe_barbearia
  for all using ( auth.uid() = barbeiro_id ) with check ( auth.uid() = barbeiro_id );

-- 4. Função RPC para notificar todos os clientes cadastrados sobre avisos e reajustes
create or replace function public.notificar_todos_clientes(
  p_titulo text,
  p_mensagem text,
  p_tipo text,
  p_dados jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer := 0;
begin
  insert into public.notifications (usuario_id, titulo, mensagem, tipo, dados)
  select id, p_titulo, p_mensagem, p_tipo, p_dados
  from public.perfis
  where role = 'cliente';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
