-- ============================================================================
-- FASE 17: Aprimoramento da Trigger de Perfis para Login Social (OAuth)
-- ============================================================================

-- Atualiza a função de criação de novo usuário para capturar nome de provedores
-- sociais (Google: full_name/name; Apple: full_name/name; Email: nome_completo)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.perfis (id, nome_completo, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nome_completo',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Cliente Vieira'
    ),
    'cliente'
  )
  on conflict (id) do update
  set nome_completo = coalesce(
    public.perfis.nome_completo,
    excluded.nome_completo
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Garante que a trigger está ativa após insert em auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
