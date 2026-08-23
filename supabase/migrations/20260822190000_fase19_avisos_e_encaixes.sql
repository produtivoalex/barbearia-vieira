-- ============================================================================
-- FASE 19: Avisos de Funcionamento e Reservas Manuais (Encaixes do Barbeiro)
-- ============================================================================

-- 1. Tabela para avisos diários de funcionamento (ex: Tarde fechada / Ordem de chegada)
create table if not exists public.avisos_funcionamento (
  id uuid default gen_random_uuid() primary key,
  barbeiro_id uuid references public.perfis(id) on delete cascade not null,
  data date not null,
  tarde_fechada boolean default false not null,
  motivo text,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (barbeiro_id, data)
);

-- Habilitar RLS em avisos_funcionamento
alter table public.avisos_funcionamento enable row level security;

create policy "Todos podem visualizar avisos de funcionamento" on public.avisos_funcionamento
  for select using ( true );

create policy "Barbeiro gerencia seus avisos de funcionamento" on public.avisos_funcionamento
  for all using ( auth.uid() = barbeiro_id )
  with check ( auth.uid() = barbeiro_id );

-- 2. Permitir que o barbeiro crie reservas manuais / encaixes para clientes
create policy "Barbeiros podem criar agendamentos manuais" on public.agendamentos
  for insert with check ( auth.uid() = barbeiro_id );
