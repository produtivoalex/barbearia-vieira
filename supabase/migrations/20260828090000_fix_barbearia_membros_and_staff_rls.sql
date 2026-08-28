-- Garante que membros de barbearias estejam sincronizados e que barbeiros
-- consigam sempre gerenciar suas agendas e slots via RLS e via RPCs atômicas.

begin;

-- 1. Sincroniza barbearia_membros para todos os perfis com role = 'barbeiro'
insert into public.barbearia_membros (barbearia_id, usuario_id, papel, ativo)
select
  coalesce(p.ultima_barbearia_id, b.id) as barbearia_id,
  p.id as usuario_id,
  'proprietario' as papel,
  true as ativo
from public.perfis p
cross join (
  select id from public.barbearias order by criado_em asc limit 1
) b
where p.role = 'barbeiro'
on conflict (barbearia_id, usuario_id) do update
  set ativo = true, papel = 'proprietario';

-- 2. Atualiza a funcao usuario_e_barbeiro para aceitar fallback de perfil
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
  ) or exists (
    select 1 from public.perfis p
    where p.id = auth.uid()
      and p.role in ('barbeiro', 'admin')
      and (p.ultima_barbearia_id = p_barbearia_id or p_barbearia_id is null or not exists (select 1 from public.barbearia_membros bm where bm.usuario_id = auth.uid() and bm.ativo = true))
  );
$$;

-- 3. RPC Atômica para Liberar Vagas da Tarde
create or replace function public.liberar_vagas_tarde_rpc(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_data text,
  p_horarios text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inicio_semana date;
  v_fim_semana date;
  v_data_date date;
  v_agenda_id uuid;
  v_dia_id uuid;
  v_hora text;
  v_data_hora timestamptz;
  v_slots_criados integer := 0;
begin
  -- Validação de autorização
  if auth.uid() is null or (auth.uid() <> p_barbeiro_id and not public.usuario_e_barbeiro(p_barbearia_id)) then
    raise exception 'Usuário não autorizado a gerenciar esta agenda.';
  end if;

  v_data_date := p_data::date;
  -- Calcula segunda-feira da semana da data
  v_inicio_semana := v_data_date - ((extract(dow from v_data_date)::integer + 6) % 7);
  v_fim_semana := v_inicio_semana + 6;

  -- Garante a agenda semanal aberta
  insert into public.agendas_semanais (
    barbearia_id, barbeiro_id, data_inicio, data_fim, status, notificar_abertura
  ) values (
    p_barbearia_id, p_barbeiro_id, v_inicio_semana, v_fim_semana, 'aberta', true
  )
  on conflict (barbearia_id, barbeiro_id, data_inicio) do update
    set status = 'aberta', barbearia_id = excluded.barbearia_id
  returning id into v_agenda_id;

  -- Garante o dia na tabela dias_agenda
  insert into public.dias_agenda (
    agenda_semana_id, barbearia_id, data, ativo
  ) values (
    v_agenda_id, p_barbearia_id, p_data, true
  )
  on conflict do nothing;

  select id into v_dia_id
  from public.dias_agenda
  where agenda_semana_id = v_agenda_id and data = p_data
  limit 1;

  if v_dia_id is null then
    update public.dias_agenda set ativo = true, barbearia_id = p_barbearia_id
    where agenda_semana_id = v_agenda_id and data = p_data
    returning id into v_dia_id;
  else
    update public.dias_agenda set ativo = true, barbearia_id = p_barbearia_id
    where id = v_dia_id;
  end if;

  -- Insere ou reativa cada um dos slots da tarde
  foreach v_hora in array p_horarios
  loop
    v_data_hora := (p_data || ' ' || v_hora || ':00')::timestamp at time zone 'America/Sao_Paulo';

    insert into public.slots_agenda (
      barbearia_id, dia_agenda_id, barbeiro_id, data_hora, ativo
    ) values (
      p_barbearia_id, v_dia_id, p_barbeiro_id, v_data_hora, true
    )
    on conflict (barbearia_id, barbeiro_id, data_hora) do update
      set ativo = true, dia_agenda_id = excluded.dia_agenda_id;

    v_slots_criados := v_slots_criados + 1;
  end loop;

  return jsonb_build_object(
    'sucesso', true,
    'agenda_id', v_agenda_id,
    'dia_id', v_dia_id,
    'slots_criados', v_slots_criados
  );
end;
$$;

-- 4. RPC Atômica para Salvar Agenda Semanal Completa
create or replace function public.salvar_agenda_semanal_rpc(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_data_inicio text,
  p_data_fim text,
  p_status text,
  p_data_abertura_programada timestamptz,
  p_dias jsonb,
  p_slots jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agenda_id uuid;
  v_dia record;
  v_slot record;
  v_dia_id uuid;
  v_mapa_dias jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or (auth.uid() <> p_barbeiro_id and not public.usuario_e_barbeiro(p_barbearia_id)) then
    raise exception 'Usuário não autorizado a gerenciar esta agenda.';
  end if;

  -- 1. Cria ou atualiza a agenda semanal
  insert into public.agendas_semanais (
    barbearia_id, barbeiro_id, data_inicio, data_fim, status,
    data_abertura_programada, notificar_abertura
  ) values (
    p_barbearia_id, p_barbeiro_id, p_data_inicio::date, p_data_fim::date, p_status,
    p_data_abertura_programada, true
  )
  on conflict (barbearia_id, barbeiro_id, data_inicio) do update
    set status = excluded.status,
        data_fim = excluded.data_fim,
        data_abertura_programada = excluded.data_abertura_programada,
        notificar_abertura = true
  returning id into v_agenda_id;

  -- 2. Limpa dias antigos desta agenda
  delete from public.dias_agenda where agenda_semana_id = v_agenda_id;

  -- 3. Insere os novos dias da semana
  for v_dia in select * from jsonb_to_recordset(p_dias) as (data text, ativo boolean)
  loop
    insert into public.dias_agenda (
      agenda_semana_id, barbearia_id, data, ativo
    ) values (
      v_agenda_id, p_barbearia_id, v_dia.data, v_dia.ativo
    )
    returning id into v_dia_id;

    v_mapa_dias := jsonb_set(v_mapa_dias, array[v_dia.data], to_jsonb(v_dia_id::text));
  end loop;

  -- 4. Insere os slots ativos
  for v_slot in select * from jsonb_to_recordset(p_slots) as (data text, hora text)
  loop
    v_dia_id := (v_mapa_dias->>v_slot.data)::uuid;
    if v_dia_id is not null then
      insert into public.slots_agenda (
        barbearia_id, dia_agenda_id, barbeiro_id, data_hora, ativo
      ) values (
        p_barbearia_id,
        v_dia_id,
        p_barbeiro_id,
        (v_slot.data || ' ' || v_slot.hora || ':00')::timestamp at time zone 'America/Sao_Paulo',
        true
      )
      on conflict (barbearia_id, barbeiro_id, data_hora) do update
        set ativo = true, dia_agenda_id = excluded.dia_agenda_id;
    end if;
  end loop;

  return jsonb_build_object(
    'sucesso', true,
    'agenda_id', v_agenda_id
  );
end;
$$;

revoke all on function public.liberar_vagas_tarde_rpc(uuid, uuid, text, text[]) from public;
grant execute on function public.liberar_vagas_tarde_rpc(uuid, uuid, text, text[]) to authenticated;

revoke all on function public.salvar_agenda_semanal_rpc(uuid, uuid, text, text, text, timestamptz, jsonb, jsonb) from public;
grant execute on function public.salvar_agenda_semanal_rpc(uuid, uuid, text, text, text, timestamptz, jsonb, jsonb) to authenticated;

commit;
