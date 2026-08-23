-- Seed controlado para validar isolamento multi-tenant.
-- Usa o proprietario existente da Vieira; nao cria usuario/auth nem altera a Vieira.

begin;

do $$
declare
  v_vieira_id uuid;
  v_teste_id uuid;
  v_usuario_id uuid;
begin
  select id into v_vieira_id
  from public.barbearias
  where slug = 'barbearia-vieira';

  if v_vieira_id is null then
    raise exception 'Barbearia Vieira nao encontrada';
  end if;

  select m.usuario_id into v_usuario_id
  from public.barbearia_membros m
  where m.barbearia_id = v_vieira_id
    and m.papel = 'proprietario'
    and m.ativo = true
  limit 1;

  if v_usuario_id is null then
    raise exception 'Proprietario ativo da Vieira nao encontrado';
  end if;

  insert into public.barbearias (
    slug, nome, descricao, cidade, bairro, status, publicada, tema
  ) values (
    'barbearia-teste-multi-tenant',
    'Barbearia Teste Multi Tenant',
    'Tenant privado criado para validar isolamento de dados.',
    'Sao Paulo',
    'Centro',
    'ativa',
    false,
    '{}'::jsonb
  )
  on conflict (slug) do update
    set nome = excluded.nome,
        publicada = false,
        status = 'ativa'
  returning id into v_teste_id;

  if v_teste_id is null then
    select id into v_teste_id
    from public.barbearias
    where slug = 'barbearia-teste-multi-tenant';
  end if;

  insert into public.barbearia_membros (barbearia_id, usuario_id, papel, ativo)
  values (v_teste_id, v_usuario_id, 'gestor', true)
  on conflict (barbearia_id, usuario_id) do update
    set papel = 'gestor', ativo = true;
end $$;

commit;

select b.id, b.slug, b.nome, b.status, b.publicada, m.usuario_id, m.papel, m.ativo
from public.barbearias b
join public.barbearia_membros m on m.barbearia_id = b.id
where b.slug = 'barbearia-teste-multi-tenant';
