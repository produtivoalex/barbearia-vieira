-- Parte 8: auditoria read-only de rollout e Storage.
-- Executar no projeto Supabase correto após aplicar as migrations.

-- 1. Todo tenant operacional deve estar preenchido.
select tabela, count(*) as registros_sem_tenant
from (
  select 'servicos' tabela, barbearia_id from public.servicos
  union all select 'agendamentos', barbearia_id from public.agendamentos
  union all select 'agendas_semanais', barbearia_id from public.agendas_semanais
  union all select 'dias_agenda', barbearia_id from public.dias_agenda
  union all select 'slots_agenda', barbearia_id from public.slots_agenda
  union all select 'fila_espera', barbearia_id from public.fila_espera
  union all select 'notificacoes', barbearia_id from public.notifications
) registros
where barbearia_id is null
group by tabela
order by tabela;

-- 2. Relações críticas não podem cruzar tenants.
select a.id, a.barbearia_id, s.barbearia_id as servico_barbearia_id
from public.agendamentos a
join public.servicos s on s.id = a.servico_id
where a.barbearia_id is distinct from s.barbearia_id;

-- 3. Cada membro ativo precisa apontar para tenant existente.
select m.id, m.barbearia_id, m.usuario_id, m.papel
from public.barbearia_membros m
left join public.barbearias b on b.id = m.barbearia_id
where m.ativo = true and b.id is null;

-- 4. Objetos de Storage devem seguir o contrato tenant/tipo/arquivo.
select o.id, o.name, o.bucket_id
from storage.objects o
where o.bucket_id = 'barbearia-media'
  and (
    array_length(storage.foldername(o.name), 1) < 2
    or (storage.foldername(o.name))[2] not in ('logo', 'banner', 'fotos')
    or not exists (
      select 1 from public.barbearias b
      where b.id::text = (storage.foldername(o.name))[1]
    )
  );

-- 5. Resumo esperado para o rollout.
select
  (select count(*) from public.barbearias where publicada = true and status = 'ativa') as tenants_publicados,
  (select count(*) from storage.buckets where id = 'barbearia-media') as buckets_media,
  (select count(*) from storage.objects where bucket_id = 'barbearia-media') as objetos_media;
