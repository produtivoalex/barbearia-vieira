-- Parte 5: vitrine pública e busca segura de barbearias.
-- Retorna somente dados comerciais; clientes e operação nunca são expostos.

begin;

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
      b.telefone, b.whatsapp, b.logo_url, b.banner_url, b.fotos,
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

create or replace function public.detalhe_barbearia_publica(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', b.id,
    'slug', b.slug,
    'nome', b.nome,
    'descricao', b.descricao,
    'cidade', b.cidade,
    'bairro', b.bairro,
    'endereco', b.endereco,
    'telefone', b.telefone,
    'whatsapp', b.whatsapp,
    'logo_url', b.logo_url,
    'banner_url', b.banner_url,
    'fotos', b.fotos,
    'modo_agenda', b.modo_agenda,
    'dias_janela_agendamento', b.dias_janela_agendamento,
    'regras_fidelidade', b.regras_fidelidade,
    'mimo_ativo', b.mimo_ativo,
    'servicos', coalesce((
      select jsonb_agg(to_jsonb(s) - 'barbearia_id' order by s.ordem_exibicao, s.nome)
      from public.servicos s
      where s.barbearia_id = b.id and s.ativo = true
    ), '[]'::jsonb)
  )
  from public.barbearias b
  where b.slug = p_slug and b.publicada = true and b.status = 'ativa';
$$;

revoke all on function public.buscar_barbearias(text, text, text, numeric, numeric, numeric, integer, integer) from public;
grant execute on function public.buscar_barbearias(text, text, text, numeric, numeric, numeric, integer, integer) to anon, authenticated;
revoke all on function public.detalhe_barbearia_publica(text) from public;
grant execute on function public.detalhe_barbearia_publica(text) to anon, authenticated;

commit;
