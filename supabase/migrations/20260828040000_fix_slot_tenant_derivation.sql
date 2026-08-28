-- Slots devem herdar o tenant do dia da agenda, nao do barbeiro.

begin;

create or replace function public.preencher_tenant_operacional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_count integer;
begin
  if new.barbearia_id is not null then return new; end if;
  if tg_table_name in ('servicos', 'notifications') then return new;
  elsif tg_table_name in ('agendamentos', 'fila_espera') then
    select (array_agg(s.barbearia_id order by s.barbearia_id))[1], count(distinct s.barbearia_id)
      into v_tenant, v_count from public.servicos s where s.id = new.servico_id;
  elsif tg_table_name in ('agendas_semanais', 'atrasos_agenda', 'avisos_funcionamento', 'reajustes_precos', 'bloqueios_clientes', 'equipe_barbearia') then
    select (array_agg(m.barbearia_id order by m.barbearia_id))[1], count(distinct m.barbearia_id)
      into v_tenant, v_count from public.barbearia_membros m
     where m.usuario_id = new.barbeiro_id and m.ativo = true;
  elsif tg_table_name = 'dias_agenda' then
    select (array_agg(a.barbearia_id order by a.barbearia_id))[1], count(distinct a.barbearia_id)
      into v_tenant, v_count from public.agendas_semanais a where a.id = new.agenda_semana_id;
  elsif tg_table_name = 'slots_agenda' then
    select (array_agg(d.barbearia_id order by d.barbearia_id))[1], count(distinct d.barbearia_id)
      into v_tenant, v_count from public.dias_agenda d where d.id = new.dia_agenda_id;
  elsif tg_table_name = 'fila_troca' then
    select (array_agg(a.barbearia_id order by a.barbearia_id))[1], count(distinct a.barbearia_id)
      into v_tenant, v_count from public.agendamentos a where a.id = new.agendamento_id;
  elsif tg_table_name = 'ofertas_fila' then
    select (array_agg(f.barbearia_id order by f.barbearia_id))[1], count(distinct f.barbearia_id)
      into v_tenant, v_count from public.fila_espera f where f.id = new.fila_espera_id;
  elsif tg_table_name = 'agenda_lembretes' then
    select (array_agg(a.barbearia_id order by a.barbearia_id))[1], count(distinct a.barbearia_id)
      into v_tenant, v_count from public.agendas_semanais a where a.id = new.agenda_semana_id;
  elsif tg_table_name = 'lembretes_agendados' then
    select (array_agg(a.barbearia_id order by a.barbearia_id))[1], count(distinct a.barbearia_id)
      into v_tenant, v_count from public.agendamentos a where a.id = new.agendamento_id;
  end if;

  if v_count is null or v_count = 0 or v_tenant is null then
    raise exception 'barbearia_id obrigatorio: nao foi possivel derivar o tenant de %', tg_table_name;
  end if;
  if v_count > 1 then
    raise exception 'barbearia_id obrigatorio: vinculo ambiguo para %', tg_table_name;
  end if;
  new.barbearia_id := v_tenant;
  return new;
end;
$$;

commit;
