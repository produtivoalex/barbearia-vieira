-- Parte 3: isolamento tenant-aware e RPCs de reserva/fila.
-- A foundation da Parte 2 já foi aplicada; esta migration substitui policies
-- permissivas sem remover a compatibilidade de assinatura das RPCs existentes.

begin;

create or replace function public.barbearia_publicada(p_barbearia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.barbearias b
    where b.id = p_barbearia_id
      and b.publicada = true
      and b.status = 'ativa'
  );
$$;

create or replace function public.usuario_e_membro(p_barbearia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.barbearia_membros m
    where m.barbearia_id = p_barbearia_id
      and m.usuario_id = auth.uid()
      and m.ativo = true
  );
$$;

create or replace function public.usuario_e_gestor(p_barbearia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.barbearia_membros m
    where m.barbearia_id = p_barbearia_id
      and m.usuario_id = auth.uid()
      and m.ativo = true
      and m.papel in ('proprietario', 'gestor')
  );
$$;

create or replace function public.usuario_e_barbeiro(p_barbearia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.barbearia_membros m
    where m.barbearia_id = p_barbearia_id
      and m.usuario_id = auth.uid()
      and m.ativo = true
      and m.papel in ('proprietario', 'gestor', 'barbeiro')
  );
$$;

-- Preenche o tenant em inserts legados enquanto o front-end ainda está sendo
-- adaptado. Se houver mais de um vínculo possível, exige barbearia_id explícito.
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
  if new.barbearia_id is not null then
    return new;
  end if;

  if tg_table_name in ('servicos', 'notifications') then
    return new;
  elsif tg_table_name = 'agendamentos' or tg_table_name = 'fila_espera' then
    select min(s.barbearia_id), count(distinct s.barbearia_id)
      into v_tenant, v_count
      from public.servicos s
     where s.id = new.servico_id;
  elsif tg_table_name in ('agendas_semanais', 'slots_agenda', 'atrasos_agenda', 'avisos_funcionamento', 'reajustes_precos', 'bloqueios_clientes', 'equipe_barbearia') then
    select min(m.barbearia_id), count(distinct m.barbearia_id)
      into v_tenant, v_count
      from public.barbearia_membros m
     where m.usuario_id = new.barbeiro_id
       and m.ativo = true;
  elsif tg_table_name = 'dias_agenda' then
    select min(a.barbearia_id), count(distinct a.barbearia_id)
      into v_tenant, v_count
      from public.agendas_semanais a
     where a.id = new.agenda_semana_id;
  elsif tg_table_name = 'slots_agenda' then
    select min(d.barbearia_id), count(distinct d.barbearia_id)
      into v_tenant, v_count
      from public.dias_agenda d
     where d.id = new.dia_agenda_id;
  elsif tg_table_name = 'fila_troca' then
    select min(a.barbearia_id), count(distinct a.barbearia_id)
      into v_tenant, v_count
      from public.agendamentos a
     where a.id = new.agendamento_id;
  elsif tg_table_name = 'ofertas_fila' then
    select min(f.barbearia_id), count(distinct f.barbearia_id)
      into v_tenant, v_count
      from public.fila_espera f
     where f.id = new.fila_espera_id;
  elsif tg_table_name = 'agenda_lembretes' then
    select min(a.barbearia_id), count(distinct a.barbearia_id)
      into v_tenant, v_count
      from public.agendas_semanais a
     where a.id = new.agenda_semana_id;
  elsif tg_table_name = 'lembretes_agendados' then
    select min(a.barbearia_id), count(distinct a.barbearia_id)
      into v_tenant, v_count
      from public.agendamentos a
     where a.id = new.agendamento_id;
  end if;

  if v_count is null or v_count = 0 or v_tenant is null then
    raise exception 'barbearia_id obrigatório: não foi possível derivar o tenant de %', tg_table_name;
  end if;
  if v_count > 1 then
    raise exception 'barbearia_id obrigatório: vínculo ambíguo para %', tg_table_name;
  end if;

  new.barbearia_id := v_tenant;
  return new;
end;
$$;

drop trigger if exists tg_preencher_tenant_agendamentos on public.agendamentos;
create trigger tg_preencher_tenant_agendamentos before insert on public.agendamentos for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_fila on public.fila_espera;
create trigger tg_preencher_tenant_fila before insert on public.fila_espera for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_agendas on public.agendas_semanais;
create trigger tg_preencher_tenant_agendas before insert on public.agendas_semanais for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_dias on public.dias_agenda;
create trigger tg_preencher_tenant_dias before insert on public.dias_agenda for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_slots on public.slots_agenda;
create trigger tg_preencher_tenant_slots before insert on public.slots_agenda for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_atrasos on public.atrasos_agenda;
create trigger tg_preencher_tenant_atrasos before insert on public.atrasos_agenda for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_avisos on public.avisos_funcionamento;
create trigger tg_preencher_tenant_avisos before insert on public.avisos_funcionamento for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_reajustes on public.reajustes_precos;
create trigger tg_preencher_tenant_reajustes before insert on public.reajustes_precos for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_bloqueios on public.bloqueios_clientes;
create trigger tg_preencher_tenant_bloqueios before insert on public.bloqueios_clientes for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_equipe on public.equipe_barbearia;
create trigger tg_preencher_tenant_equipe before insert on public.equipe_barbearia for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_dias on public.dias_agenda;
create trigger tg_preencher_tenant_dias before insert on public.dias_agenda for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_fila_troca on public.fila_troca;
create trigger tg_preencher_tenant_fila_troca before insert on public.fila_troca for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_ofertas on public.ofertas_fila;
create trigger tg_preencher_tenant_ofertas before insert on public.ofertas_fila for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_lembretes on public.agenda_lembretes;
create trigger tg_preencher_tenant_lembretes before insert on public.agenda_lembretes for each row execute procedure public.preencher_tenant_operacional();
drop trigger if exists tg_preencher_tenant_lembretes_agendados on public.lembretes_agendados;
create trigger tg_preencher_tenant_lembretes_agendados before insert on public.lembretes_agendados for each row execute procedure public.preencher_tenant_operacional();

-- Remove policies anteriores apenas das tabelas já migradas. As novas policies
-- abaixo são a única autorização para essas tabelas.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename = any (array['barbearias','barbearia_membros','servicos','agendamentos','agendas_semanais','dias_agenda','slots_agenda','fila_espera','fila_troca','ofertas_fila','atrasos_agenda','avisos_funcionamento','reajustes_precos','bloqueios_clientes','equipe_barbearia','agenda_lembretes','lembretes_agendados','notifications'])
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end;
$$;

create policy barbearias_publicas_select on public.barbearias
  for select using (public.barbearia_publicada(id) or public.usuario_e_membro(id));
create policy barbearias_gestor_manage on public.barbearias
  for all using (public.usuario_e_gestor(id)) with check (public.usuario_e_gestor(id));

create policy membros_select_proprio_ou_gestor on public.barbearia_membros
  for select using (usuario_id = auth.uid() or public.usuario_e_gestor(barbearia_id));
create policy membros_gestor_manage on public.barbearia_membros
  for all using (public.usuario_e_gestor(barbearia_id)) with check (public.usuario_e_gestor(barbearia_id));

create policy servicos_publicos_select on public.servicos
  for select using (ativo = true and public.barbearia_publicada(barbearia_id) or public.usuario_e_membro(barbearia_id));
create policy servicos_gestor_manage on public.servicos
  for all using (public.usuario_e_gestor(barbearia_id)) with check (public.usuario_e_gestor(barbearia_id));

create policy agendamentos_select_isolado on public.agendamentos
  for select using (cliente_id = auth.uid() or (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id)));
create policy agendamentos_insert_cliente on public.agendamentos
  for insert with check (
    cliente_id = auth.uid()
    and public.barbearia_publicada(barbearia_id)
    and exists (select 1 from public.servicos s where s.id = servico_id and s.barbearia_id = agendamentos.barbearia_id and s.ativo = true)
    and exists (select 1 from public.barbearia_membros m where m.barbearia_id = agendamentos.barbearia_id and m.usuario_id = barbeiro_id and m.ativo = true)
  );
create policy agendamentos_insert_staff on public.agendamentos
  for insert with check (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id));
create policy agendamentos_update_cliente on public.agendamentos
  for update using (cliente_id = auth.uid()) with check (cliente_id = auth.uid() and public.barbearia_publicada(barbearia_id));
create policy agendamentos_update_staff on public.agendamentos
  for update using (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id))
  with check (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id));

create policy agendas_staff_manage on public.agendas_semanais
  for all using (public.usuario_e_barbeiro(barbearia_id) and barbeiro_id = auth.uid())
  with check (public.usuario_e_barbeiro(barbearia_id) and barbeiro_id = auth.uid());
create policy agendas_publicas_select on public.agendas_semanais
  for select using (status = 'aberta' and public.barbearia_publicada(barbearia_id));

create policy dias_staff_manage on public.dias_agenda
  for all using (public.usuario_e_barbeiro(barbearia_id) and exists (select 1 from public.agendas_semanais a where a.id = agenda_semana_id and a.barbearia_id = dias_agenda.barbearia_id and a.barbeiro_id = auth.uid()))
  with check (public.usuario_e_barbeiro(barbearia_id) and exists (select 1 from public.agendas_semanais a where a.id = agenda_semana_id and a.barbearia_id = dias_agenda.barbearia_id and a.barbeiro_id = auth.uid()));
create policy dias_publicos_select on public.dias_agenda
  for select using (ativo = true and exists (select 1 from public.agendas_semanais a where a.id = agenda_semana_id and a.barbearia_id = dias_agenda.barbearia_id and a.status = 'aberta' and public.barbearia_publicada(a.barbearia_id)));

create policy slots_staff_manage on public.slots_agenda
  for all using (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id) and exists (select 1 from public.dias_agenda d where d.id = dia_agenda_id and d.barbearia_id = slots_agenda.barbearia_id))
  with check (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id) and exists (select 1 from public.dias_agenda d where d.id = dia_agenda_id and d.barbearia_id = slots_agenda.barbearia_id));
create policy slots_publicos_select on public.slots_agenda
  for select using (ativo = true and exists (select 1 from public.dias_agenda d join public.agendas_semanais a on a.id = d.agenda_semana_id where d.id = dia_agenda_id and d.barbearia_id = slots_agenda.barbearia_id and a.status = 'aberta' and public.barbearia_publicada(a.barbearia_id)));

create policy fila_cliente_manage on public.fila_espera
  for all using (cliente_id = auth.uid()) with check (cliente_id = auth.uid() and public.barbearia_publicada(barbearia_id));
create policy fila_staff_select on public.fila_espera
  for select using (public.usuario_e_barbeiro(barbearia_id));
create policy fila_troca_cliente_manage on public.fila_troca
  for all using (exists (select 1 from public.agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid() and a.barbearia_id = fila_troca.barbearia_id))
  with check (exists (select 1 from public.agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid() and a.barbearia_id = fila_troca.barbearia_id));
create policy ofertas_cliente_select on public.ofertas_fila
  for select using (exists (select 1 from public.fila_espera f where f.id = fila_espera_id and f.cliente_id = auth.uid() and f.barbearia_id = ofertas_fila.barbearia_id));

create policy atrasos_staff_manage on public.atrasos_agenda
  for all using (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id)) with check (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id));
create policy avisos_publicos_select on public.avisos_funcionamento
  for select using (public.barbearia_publicada(barbearia_id));
create policy avisos_staff_manage on public.avisos_funcionamento
  for all using (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id)) with check (barbeiro_id = auth.uid() and public.usuario_e_barbeiro(barbearia_id));

create policy reajustes_publicos_select on public.reajustes_precos
  for select using (public.barbearia_publicada(barbearia_id));
create policy reajustes_staff_insert on public.reajustes_precos
  for insert with check (barbeiro_id = auth.uid() and public.usuario_e_gestor(barbearia_id));
create policy bloqueios_staff_manage on public.bloqueios_clientes
  for all using (barbeiro_id = auth.uid() and public.usuario_e_gestor(barbearia_id)) with check (barbeiro_id = auth.uid() and public.usuario_e_gestor(barbearia_id));
create policy bloqueios_cliente_proprio_select on public.bloqueios_clientes
  for select using (cliente_id = auth.uid());
create policy equipe_gestor_manage on public.equipe_barbearia
  for all using (barbeiro_id = auth.uid() and public.usuario_e_gestor(barbearia_id)) with check (barbeiro_id = auth.uid() and public.usuario_e_gestor(barbearia_id));
create policy lembretes_cliente_manage on public.agenda_lembretes
  for all using (cliente_id = auth.uid()) with check (cliente_id = auth.uid());
create policy lembretes_agendados_cliente_select on public.lembretes_agendados
  for select using (exists (select 1 from public.agendamentos a where a.id = agendamento_id and a.cliente_id = auth.uid() and a.barbearia_id = lembretes_agendados.barbearia_id));
create policy notifications_cliente_manage on public.notifications
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create or replace function public.reservar_slot(
  p_slot_id uuid,
  p_cliente_id uuid,
  p_servico_id uuid
) returns public.agendamentos
language plpgsql security definer set search_path = public
as $$
declare
  v_slot public.slots_agenda;
  v_servico public.servicos;
  v_agendamento public.agendamentos;
begin
  if auth.uid() is null or auth.uid() <> p_cliente_id then raise exception 'Usuário não autorizado'; end if;
  select s.* into v_slot from public.slots_agenda s join public.dias_agenda d on d.id = s.dia_agenda_id and d.ativo = true join public.agendas_semanais a on a.id = d.agenda_semana_id and a.status = 'aberta' and a.barbearia_id = s.barbearia_id where s.id = p_slot_id and s.ativo = true for update;
  if not found then raise exception 'Horário indisponível'; end if;
  select * into v_servico from public.servicos where id = p_servico_id and ativo = true;
  if not found or v_servico.barbearia_id is distinct from v_slot.barbearia_id then raise exception 'Serviço não pertence à barbearia do horário'; end if;
  if exists (select 1 from public.agendamentos a where a.barbeiro_id = v_slot.barbeiro_id and a.barbearia_id = v_slot.barbearia_id and a.data_hora = v_slot.data_hora and a.status in ('pendente', 'confirmado')) then raise exception 'Horário acabou de ser reservado'; end if;
  if exists (select 1 from public.agendamentos a where a.cliente_id = p_cliente_id and a.barbearia_id = v_slot.barbearia_id and a.status in ('pendente', 'confirmado') and a.data_hora::date = (v_slot.data_hora at time zone 'America/Sao_Paulo')::date) then raise exception 'Cliente já possui agendamento ativo neste dia'; end if;
  insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, barbearia_id, data_hora, status) values (p_cliente_id, v_slot.barbeiro_id, p_servico_id, v_slot.barbearia_id, v_slot.data_hora, 'confirmado') returning * into v_agendamento;
  return v_agendamento;
end;
$$;

create or replace function public.aceitar_oferta_fila(p_oferta_id uuid)
returns public.agendamentos language plpgsql security definer set search_path = public
as $$
declare v_oferta public.ofertas_fila; v_fila public.fila_espera; v_slot public.slots_agenda; v_agendamento public.agendamentos;
begin
  select * into v_oferta from public.ofertas_fila where id = p_oferta_id for update;
  if not found then raise exception 'Oferta não encontrada'; end if;
  select * into v_fila from public.fila_espera where id = v_oferta.fila_espera_id and barbearia_id = v_oferta.barbearia_id;
  if not found or v_fila.cliente_id <> auth.uid() then raise exception 'Usuário não autorizado'; end if;
  select * into v_slot from public.slots_agenda where id = v_oferta.slot_id and barbearia_id = v_oferta.barbearia_id and ativo = true for update;
  if not found or v_oferta.status <> 'pendente' or v_oferta.expira_em <= now() then update public.ofertas_fila set status = 'expirada' where id = p_oferta_id and status = 'pendente'; raise exception 'Esta oferta expirou ou está indisponível'; end if;
  if exists (select 1 from public.agendamentos a where a.barbeiro_id = v_slot.barbeiro_id and a.barbearia_id = v_slot.barbearia_id and a.data_hora = v_slot.data_hora and a.status in ('pendente', 'confirmado')) then update public.ofertas_fila set status = 'expirada' where id = p_oferta_id; raise exception 'Horário acabou de ser ocupado'; end if;
  insert into public.agendamentos (cliente_id, barbeiro_id, servico_id, barbearia_id, data_hora, status) values (v_fila.cliente_id, v_slot.barbeiro_id, v_fila.servico_id, v_slot.barbearia_id, v_slot.data_hora, 'confirmado') returning * into v_agendamento;
  update public.ofertas_fila set status = 'aceita' where id = p_oferta_id;
  update public.fila_espera set status = 'atendido' where id = v_fila.id;
  return v_agendamento;
end;
$$;

create or replace function public.oferecer_proxima_vaga(p_slot_id uuid, p_minutos integer default 5)
returns public.ofertas_fila language plpgsql security definer set search_path = public
as $$
declare v_slot public.slots_agenda; v_fila public.fila_espera; v_oferta public.ofertas_fila;
begin
  select * into v_slot from public.slots_agenda where id = p_slot_id and ativo = true for update;
  if not found then return null; end if;
  if exists (select 1 from public.ofertas_fila o where o.slot_id = p_slot_id and o.barbearia_id = v_slot.barbearia_id and o.status = 'pendente' and o.expira_em > now()) then return null; end if;
  select f.* into v_fila from public.fila_espera f where f.barbearia_id = v_slot.barbearia_id and f.status = 'aguardando' and (cardinality(f.dias_preferidos) = 0 or extract(dow from (v_slot.data_hora at time zone 'America/Sao_Paulo'))::integer = any(f.dias_preferidos)) and (cardinality(f.horarios_preferidos) = 0 or to_char(v_slot.data_hora at time zone 'America/Sao_Paulo', 'HH24:MI') = any(f.horarios_preferidos)) order by f.criado_em limit 1 for update skip locked;
  if not found then return null; end if;
  insert into public.ofertas_fila (fila_espera_id, slot_id, barbearia_id, expira_em) values (v_fila.id, v_slot.id, v_slot.barbearia_id, now() + make_interval(mins => greatest(1, p_minutos))) returning * into v_oferta;
  update public.fila_espera set status = 'ofertado' where id = v_fila.id;
  insert into public.notifications (usuario_id, barbearia_id, tipo, titulo, mensagem, dados) values (v_fila.cliente_id, v_slot.barbearia_id, 'oferta_fila', 'Surgiu uma vaga', 'Surgiu uma vaga compatível com suas preferências.', jsonb_build_object('ofertaId', v_oferta.id, 'barbeariaId', v_slot.barbearia_id));
  return v_oferta;
end;
$$;

create or replace function public.disparar_oferta_apos_cancelamento()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_slot_id uuid;
begin
  if old.status in ('pendente', 'confirmado') and new.status = 'cancelado' then
    select id into v_slot_id from public.slots_agenda where barbeiro_id = new.barbeiro_id and barbearia_id = new.barbearia_id and data_hora = new.data_hora limit 1;
    if v_slot_id is not null then perform public.oferecer_proxima_vaga(v_slot_id, 5); end if;
  end if;
  return new;
end;
$$;

drop trigger if exists agendamento_cancelado_oferece_vaga on public.agendamentos;
create trigger agendamento_cancelado_oferece_vaga after update of status on public.agendamentos for each row execute procedure public.disparar_oferta_apos_cancelamento();

create or replace function public.notificar_todos_clientes(
  p_barbearia_id uuid,
  p_titulo text,
  p_mensagem text,
  p_tipo text,
  p_dados jsonb default '{}'::jsonb
) returns integer language plpgsql security definer set search_path = public
as $$
declare v_count integer;
begin
  if not public.usuario_e_gestor(p_barbearia_id) then raise exception 'Usuário não autorizado para esta barbearia'; end if;
  insert into public.notifications (usuario_id, barbearia_id, titulo, mensagem, tipo, dados)
  select distinct x.usuario_id, p_barbearia_id, p_titulo, p_mensagem, p_tipo, p_dados
  from (
    select a.cliente_id as usuario_id from public.agendamentos a where a.barbearia_id = p_barbearia_id
    union
    select f.cliente_id from public.fila_espera f where f.barbearia_id = p_barbearia_id
  ) x;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Compatibilidade temporária para as telas antigas da Vieira. O novo front-end
-- deverá usar a assinatura com p_barbearia_id explícito.
create or replace function public.notificar_todos_clientes(
  p_titulo text,
  p_mensagem text,
  p_tipo text,
  p_dados jsonb default '{}'::jsonb
) returns integer language plpgsql security definer set search_path = public
as $$
declare v_barbearia_id uuid; v_count integer;
begin
  select min(m.barbearia_id) into v_barbearia_id from public.barbearia_membros m where m.usuario_id = auth.uid() and m.ativo = true;
  if v_barbearia_id is null or (select count(distinct m.barbearia_id) from public.barbearia_membros m where m.usuario_id = auth.uid() and m.ativo = true) <> 1 then raise exception 'Informe barbearia_id ao notificar clientes'; end if;
  v_count := public.notificar_todos_clientes(v_barbearia_id, p_titulo, p_mensagem, p_tipo, p_dados);
  return v_count;
end;
$$;

commit;
