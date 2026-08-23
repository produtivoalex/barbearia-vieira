-- Parte 2: fundação multi-tenant e backfill inicial da Barbearia Vieira.
-- Esta migration é aditiva e mantém as colunas tenant nullable até a auditoria.
-- Não substituir as policies antigas nesta etapa; isso será feito na Parte 3.

begin;

create table if not exists public.barbearias (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  nome text not null,
  descricao text,
  telefone text,
  whatsapp text,
  email text,
  cidade text,
  bairro text,
  endereco text,
  latitude numeric,
  longitude numeric,
  logo_url text,
  banner_url text,
  fotos jsonb default '[]'::jsonb not null,
  tema jsonb default '{}'::jsonb not null,
  status text default 'ativa' not null check (status in ('rascunho', 'ativa', 'pausada', 'suspensa')),
  publicada boolean default false not null,
  criado_em timestamptz default timezone('utc'::text, now()) not null,
  atualizado_em timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.barbearia_membros (
  id uuid default gen_random_uuid() primary key,
  barbearia_id uuid references public.barbearias(id) on delete cascade not null,
  usuario_id uuid references public.perfis(id) on delete cascade not null,
  papel text default 'barbeiro' not null check (papel in ('proprietario', 'gestor', 'barbeiro', 'atendente')),
  ativo boolean default true not null,
  criado_em timestamptz default timezone('utc'::text, now()) not null,
  unique (barbearia_id, usuario_id)
);

alter table public.barbearias enable row level security;
alter table public.barbearia_membros enable row level security;

alter table public.servicos add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.agendamentos add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.agendas_semanais add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.dias_agenda add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.slots_agenda add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.fila_espera add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.fila_troca add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.ofertas_fila add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.atrasos_agenda add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.avisos_funcionamento add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.reajustes_precos add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.bloqueios_clientes add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.equipe_barbearia add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.agenda_lembretes add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.lembretes_agendados add column if not exists barbearia_id uuid references public.barbearias(id);
alter table public.notifications add column if not exists barbearia_id uuid references public.barbearias(id);

create index if not exists idx_servicos_barbearia on public.servicos(barbearia_id);
create index if not exists idx_agendamentos_barbearia_data on public.agendamentos(barbearia_id, data_hora);
create index if not exists idx_agendas_barbearia_inicio on public.agendas_semanais(barbearia_id, data_inicio);
create index if not exists idx_slots_barbearia_data on public.slots_agenda(barbearia_id, data_hora);
create index if not exists idx_fila_espera_barbearia_status on public.fila_espera(barbearia_id, status);

do $$
declare
  v_barbearia_id uuid;
  v_barbeiro_count integer;
begin
  select count(*) into v_barbeiro_count
  from public.perfis
  where role = 'barbeiro';

  if v_barbeiro_count = 0 then
    raise exception 'Backfill multi-tenant interrompido: nenhum perfil com role barbeiro foi encontrado';
  end if;

  insert into public.barbearias (
    slug, nome, descricao, tema, status, publicada
  ) values (
    'barbearia-vieira',
    'Barbearia Vieira',
    'Barbearia Vieira — tenant legado migrado para a plataforma multi-barbearia.',
    jsonb_build_object(
      'primary', '#CBA14A',
      'secondary', '#141416',
      'background', '#0F0F10',
      'text', '#FFFFFF',
      'accent', '#F0D17D'
    ),
    'ativa',
    true
  )
  on conflict (slug) do update
    set nome = excluded.nome,
        descricao = coalesce(public.barbearias.descricao, excluded.descricao),
        tema = case when public.barbearias.tema = '{}'::jsonb then excluded.tema else public.barbearias.tema end,
        status = coalesce(public.barbearias.status, excluded.status),
        publicada = public.barbearias.publicada;

  select id into v_barbearia_id
  from public.barbearias
  where slug = 'barbearia-vieira';

  insert into public.barbearia_membros (barbearia_id, usuario_id, papel)
  select
    v_barbearia_id,
    p.id,
    case
      when p.id = (
        select p_owner.id
        from public.perfis p_owner
        where p_owner.role = 'barbeiro'
        order by p_owner.criado_em nulls last, p_owner.id
        limit 1
      ) then 'proprietario'
      else 'barbeiro'
    end
  from public.perfis p
  where p.role = 'barbeiro'
  on conflict (barbearia_id, usuario_id) do nothing;

  update public.servicos set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.agendamentos set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.agendas_semanais set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.dias_agenda set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.slots_agenda set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.fila_espera set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.fila_troca set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.ofertas_fila set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.atrasos_agenda set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.avisos_funcionamento set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.reajustes_precos set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.bloqueios_clientes set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.equipe_barbearia set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.agenda_lembretes set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.lembretes_agendados set barbearia_id = v_barbearia_id where barbearia_id is null;
  update public.notifications set barbearia_id = v_barbearia_id where barbearia_id is null;
end;
$$;

comment on table public.barbearias is 'Estabelecimentos publicados na plataforma multi-tenant.';
comment on table public.barbearia_membros is 'Vínculos de usuários com barbearias e seus papéis operacionais.';

commit;
