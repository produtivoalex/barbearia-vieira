-- Corrige a policy recursiva de public.perfis criada na Fase 21.
-- A regra antiga consultava public.perfis dentro da própria policy de SELECT
-- e o Postgres abortava com "infinite recursion detected in policy".

begin;

drop policy if exists "Barbeiros podem visualizar perfis de clientes" on public.perfis;

create policy "Equipe pode visualizar perfis de clientes" on public.perfis
  for select
  using (
    role = 'cliente'
    and exists (
      select 1
      from public.barbearia_membros m
      where m.usuario_id = auth.uid()
        and m.ativo = true
    )
  );

commit;
