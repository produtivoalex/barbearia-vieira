-- ============================================================================
-- FASE 18: Permissões do Barbeiro (Atualização de Agendamentos, Fila e Atrasos)
-- ============================================================================

-- 1. Permitir que o barbeiro atualize agendamentos associados a ele (concluir, cancelar, etc.)
create policy "Barbeiros podem atualizar seus agendamentos" on public.agendamentos
  for update using ( auth.uid() = barbeiro_id )
  with check ( auth.uid() = barbeiro_id );

-- 2. Permitir que o barbeiro visualize a fila de espera para métricas e acompanhamento
create policy "Barbeiros podem ver a fila de espera" on public.fila_espera
  for select using (
    exists (
      select 1 from public.perfis
      where id = auth.uid() and role = 'barbeiro'
    )
  );

-- 3. Garantir que o barbeiro pode gerenciar seus atrasos na agenda
create policy "Barbeiro gerencia seus atrasos" on public.atrasos_agenda
  for all using ( auth.uid() = barbeiro_id )
  with check ( auth.uid() = barbeiro_id );
