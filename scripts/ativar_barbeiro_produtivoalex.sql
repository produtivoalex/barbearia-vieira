-- Ativa o acesso de barbeiro para o usuario existente.
-- Nao cria usuario, nao altera senha e nao toca em outros perfis.

begin;

do $$
declare
  v_usuario_id uuid;
  v_barbearia_id uuid;
begin
  select id into v_usuario_id
  from auth.users
  where lower(email) = lower('produtivoalex@gmail.com');

  if v_usuario_id is null then
    raise exception 'Usuario produtivoalex@gmail.com nao encontrado';
  end if;

  update public.perfis
  set role = 'barbeiro'
  where id = v_usuario_id;

  if not found then
    raise exception 'Perfil do usuario nao encontrado';
  end if;

  select id into v_barbearia_id
  from public.barbearias
  where slug = 'barbearia-vieira';

  if v_barbearia_id is null then
    raise exception 'Barbearia Vieira nao encontrada';
  end if;

  insert into public.barbearia_membros (barbearia_id, usuario_id, papel, ativo)
  values (v_barbearia_id, v_usuario_id, 'barbeiro', true)
  on conflict (barbearia_id, usuario_id) do update
    set papel = case
      when public.barbearia_membros.papel in ('proprietario', 'gestor')
        then public.barbearia_membros.papel
      else 'barbeiro'
    end,
    ativo = true;
end $$;

commit;

select
  u.email,
  p.id,
  p.role,
  b.slug,
  m.papel,
  m.ativo
from auth.users u
join public.perfis p on p.id = u.id
left join public.barbearia_membros m on m.usuario_id = u.id
left join public.barbearias b on b.id = m.barbearia_id
where lower(u.email) = lower('produtivoalex@gmail.com');
