-- Auditoria read-only da Parte 2.
-- Executar depois da migration foundation no projeto Supabase correto.

-- Registros sem tenant.
select 'servicos' as tabela, count(*) as sem_tenant from public.servicos where barbearia_id is null
union all
select 'agendamentos', count(*) from public.agendamentos where barbearia_id is null
union all
select 'agendas_semanais', count(*) from public.agendas_semanais where barbearia_id is null
union all
select 'dias_agenda', count(*) from public.dias_agenda where barbearia_id is null
union all
select 'slots_agenda', count(*) from public.slots_agenda where barbearia_id is null
union all
select 'fila_espera', count(*) from public.fila_espera where barbearia_id is null
union all
select 'fila_troca', count(*) from public.fila_troca where barbearia_id is null
union all
select 'ofertas_fila', count(*) from public.ofertas_fila where barbearia_id is null
union all
select 'atrasos_agenda', count(*) from public.atrasos_agenda where barbearia_id is null
union all
select 'avisos_funcionamento', count(*) from public.avisos_funcionamento where barbearia_id is null
union all
select 'reajustes_precos', count(*) from public.reajustes_precos where barbearia_id is null
union all
select 'bloqueios_clientes', count(*) from public.bloqueios_clientes where barbearia_id is null
union all
select 'equipe_barbearia', count(*) from public.equipe_barbearia where barbearia_id is null
union all
select 'agenda_lembretes', count(*) from public.agenda_lembretes where barbearia_id is null
union all
select 'lembretes_agendados', count(*) from public.lembretes_agendados where barbearia_id is null
union all
select 'notifications', count(*) from public.notifications where barbearia_id is null;

-- Integridade de agendamentos: serviço e barbeiro precisam estar no mesmo tenant.
select a.id, a.barbearia_id, a.barbeiro_id, a.servico_id
from public.agendamentos a
join public.servicos s on s.id = a.servico_id
where a.barbearia_id is distinct from s.barbearia_id;

select a.id, a.barbearia_id, a.barbeiro_id
from public.agendamentos a
where not exists (
  select 1
  from public.barbearia_membros m
  where m.barbearia_id = a.barbearia_id
    and m.usuario_id = a.barbeiro_id
    and m.ativo = true
);

-- Integridade de slots: dia, agenda e slot precisam permanecer no mesmo tenant.
select s.id, s.barbearia_id, d.barbearia_id as dia_barbearia_id, a.barbearia_id as agenda_barbearia_id
from public.slots_agenda s
join public.dias_agenda d on d.id = s.dia_agenda_id
join public.agendas_semanais a on a.id = d.agenda_semana_id
where s.barbearia_id is distinct from d.barbearia_id
   or s.barbearia_id is distinct from a.barbearia_id;

-- Deve retornar exatamente uma barbearia legada publicada após o backfill.
select id, slug, nome, status, publicada
from public.barbearias
where slug = 'barbearia-vieira';
