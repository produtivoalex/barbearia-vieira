-- Adiciona coluna email na tabela perfis se não existir
alter table public.perfis add column if not exists email text;

-- Atualiza o trigger para salvar email automaticamente
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.perfis (id, nome_completo, email, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nome_completo',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Cliente Vieira'
    ),
    new.email,
    'cliente'
  )
  on conflict (id) do update
  set nome_completo = coalesce(
    public.perfis.nome_completo,
    excluded.nome_completo
  ),
  email = coalesce(
    public.perfis.email,
    excluded.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Preenche email nos perfis existentes a partir de auth.users caso estejam vazios
update public.perfis p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Permite que o barbeiro visualize todos os perfis de clientes para busca, encaixes e bloqueios
drop policy if exists "Barbeiros podem visualizar perfis de clientes" on public.perfis;
create policy "Barbeiros podem visualizar perfis de clientes" on public.perfis
  for select
  using (
    exists (
      select 1 from public.perfis b
      where b.id = auth.uid() and b.role = 'barbeiro'
    )
  );
