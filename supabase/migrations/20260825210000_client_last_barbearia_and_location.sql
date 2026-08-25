-- Migration: Adicionar ultima_barbearia_id em perfis e atualizar busca de barbearias com tema e coordenadas

begin;

-- 1. Coluna de persistência da última barbearia do cliente na nuvem
alter table public.perfis
  add column if not exists ultima_barbearia_id uuid references public.barbearias(id) on delete set null;

create index if not exists idx_perfis_ultima_barbearia on public.perfis(ultima_barbearia_id);

-- 2. Backfill de clientes existentes a partir dos seus agendamentos mais recentes
update public.perfis p
set ultima_barbearia_id = sub.barbearia_id
from (
  select distinct on (a.cliente_id) a.cliente_id, a.barbearia_id
  from public.agendamentos a
  where a.barbearia_id is not null
  order by a.cliente_id, a.data_hora desc
) sub
where p.id = sub.cliente_id
  and p.ultima_barbearia_id is null;

-- 3. Atualizar Barbearia Vieira com coordenadas padrão e dados comerciais se nulos
update public.barbearias
set
  cidade = coalesce(cidade, 'Teresina'),
  bairro = coalesce(bairro, 'Centro'),
  endereco = coalesce(endereco, 'Rua das Flores, 123'),
  telefone = coalesce(telefone, '(86) 98190-7478'),
  whatsapp = coalesce(whatsapp, '(86) 98190-7478'),
  latitude = coalesce(latitude, -5.0920),
  longitude = coalesce(longitude, -42.8038)
where slug = 'barbearia-vieira';

-- 4. Atualizar a RPC buscar_barbearias para retornar também 'tema'
drop function if exists public.buscar_barbearias(text, text, text, numeric, numeric, numeric, integer, integer);

create or replace function public.buscar_barbearias(
  p_busca text default null,
  p_cidade text default null,
  p_bairro text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_raio_km numeric default null,
  p_pagina integer default 1,
  p_por_pagina integer default 20
)
returns table (
  id uuid,
  slug text,
  nome text,
  descricao text,
  cidade text,
  bairro text,
  endereco text,
  telefone text,
  whatsapp text,
  logo_url text,
  banner_url text,
  fotos jsonb,
  tema jsonb,
  distancia_km numeric,
  total_resultados bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with resultados as (
    select
      b.id, b.slug, b.nome, b.descricao, b.cidade, b.bairro, b.endereco,
      b.telefone, b.whatsapp, b.logo_url, b.banner_url, b.fotos, b.tema,
      case
        when p_latitude is null or p_longitude is null or b.latitude is null or b.longitude is null then null::numeric
        else round((6371 * 2 * asin(sqrt(
          power(sin(radians(b.latitude - p_latitude) / 2), 2) +
          cos(radians(p_latitude)) * cos(radians(b.latitude)) *
          power(sin(radians(b.longitude - p_longitude) / 2), 2)
        )))::numeric, 2)
      end as distancia_km
    from public.barbearias b
    where b.publicada = true and b.status = 'ativa'
      and (nullif(trim(p_busca), '') is null or b.nome ilike '%' || trim(p_busca) || '%' or b.descricao ilike '%' || trim(p_busca) || '%')
      and (nullif(trim(p_cidade), '') is null or b.cidade ilike '%' || trim(p_cidade) || '%')
      and (nullif(trim(p_bairro), '') is null or b.bairro ilike '%' || trim(p_bairro) || '%')
  )
  select r.*, count(*) over() as total_resultados
  from resultados r
  where p_raio_km is null or r.distancia_km is null or r.distancia_km <= greatest(p_raio_km, 0)
  order by (r.distancia_km is null), r.distancia_km nulls last, r.nome
  limit least(greatest(coalesce(p_por_pagina, 20), 1), 50)
  offset (greatest(coalesce(p_pagina, 1), 1) - 1) * least(greatest(coalesce(p_por_pagina, 20), 1), 50);
$$;

commit;
