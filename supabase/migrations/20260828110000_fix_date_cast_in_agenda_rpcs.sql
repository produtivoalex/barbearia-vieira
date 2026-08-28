-- Migration: Corrige o cast explícito de v_dia.data::date em salvar_agenda_semanal_rpc e salvar_agenda_multiplas_semanas_rpc

begin;

-- 1. Corrige salvar_agenda_semanal_rpc
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
  v_total_slots integer := 0;
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

  -- 2. Limpa os dias anteriores
  delete from public.dias_agenda where agenda_semana_id = v_agenda_id;

  -- 3. Insere os novos dias da semana com cast explícito para date
  for v_dia in select * from jsonb_to_recordset(p_dias) as (data text, ativo boolean)
  loop
    insert into public.dias_agenda (
      agenda_semana_id, barbearia_id, data, ativo
    ) values (
      v_agenda_id, p_barbearia_id, v_dia.data::date, v_dia.ativo
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

      v_total_slots := v_total_slots + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'sucesso', true,
    'agenda_id', v_agenda_id,
    'total_slots', v_total_slots
  );
end;
$$;

revoke all on function public.salvar_agenda_semanal_rpc(uuid, uuid, text, text, text, timestamptz, jsonb, jsonb) from public;
grant execute on function public.salvar_agenda_semanal_rpc(uuid, uuid, text, text, text, timestamptz, jsonb, jsonb) to authenticated;


-- 2. Corrige salvar_agenda_multiplas_semanas_rpc
create or replace function public.salvar_agenda_multiplas_semanas_rpc(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_semanas jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_semana record;
  v_dia record;
  v_slot record;
  v_agenda_id uuid;
  v_dia_id uuid;
  v_mapa_dias jsonb;
  v_total_agendas integer := 0;
  v_total_slots integer := 0;
begin
  if auth.uid() is null or (auth.uid() <> p_barbeiro_id and not public.usuario_e_barbeiro(p_barbearia_id)) then
    raise exception 'Usuário não autorizado a gerenciar esta agenda.';
  end if;

  for v_semana in select * from jsonb_to_recordset(p_semanas) as (
    data_inicio text,
    data_fim text,
    status text,
    data_abertura_programada timestamptz,
    dias jsonb,
    slots jsonb
  )
  loop
    -- 1. Cria ou atualiza a agenda semanal
    insert into public.agendas_semanais (
      barbearia_id, barbeiro_id, data_inicio, data_fim, status,
      data_abertura_programada, notificar_abertura
    ) values (
      p_barbearia_id, p_barbeiro_id, v_semana.data_inicio::date, v_semana.data_fim::date, v_semana.status,
      v_semana.data_abertura_programada, true
    )
    on conflict (barbearia_id, barbeiro_id, data_inicio) do update
      set status = excluded.status,
          data_fim = excluded.data_fim,
          data_abertura_programada = excluded.data_abertura_programada,
          notificar_abertura = true
    returning id into v_agenda_id;

    v_total_agendas := v_total_agendas + 1;
    v_mapa_dias := '{}'::jsonb;

    -- 2. Limpa dias antigos desta agenda
    delete from public.dias_agenda where agenda_semana_id = v_agenda_id;

    -- 3. Insere os dias da semana com cast explícito para date
    for v_dia in select * from jsonb_to_recordset(v_semana.dias) as (data text, ativo boolean)
    loop
      insert into public.dias_agenda (
        agenda_semana_id, barbearia_id, data, ativo
      ) values (
        v_agenda_id, p_barbearia_id, v_dia.data::date, v_dia.ativo
      )
      returning id into v_dia_id;

      v_mapa_dias := jsonb_set(v_mapa_dias, array[v_dia.data], to_jsonb(v_dia_id::text));
    end loop;

    -- 4. Insere os slots ativos
    for v_slot in select * from jsonb_to_recordset(v_semana.slots) as (data text, hora text)
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

        v_total_slots := v_total_slots + 1;
      end if;
    end loop;
  end loop;

  return jsonb_build_object(
    'sucesso', true,
    'total_agendas', v_total_agendas,
    'total_slots', v_total_slots
  );
end;
$$;

revoke all on function public.salvar_agenda_multiplas_semanas_rpc(uuid, uuid, jsonb) from public;
grant execute on function public.salvar_agenda_multiplas_semanas_rpc(uuid, uuid, jsonb) to authenticated;

commit;
