-- Migration: Agendamento por Tempo de Serviço, Detecção de Vagas Diretas e Otimizador de Encaixe
begin;

-- 1. Colunas de controle na tabela barbearias
alter table public.barbearias
  add column if not exists modo_duracao text not null default 'fixo_1h'
    check (modo_duracao in ('fixo_1h', 'tempo_servico')),
  add column if not exists step_agendamento_min integer not null default 30
    check (step_agendamento_min in (15, 30)),
  add column if not exists intervalo_descanso_min integer not null default 0
    check (intervalo_descanso_min in (0, 5, 10, 15));

-- 2. Colunas de duração na tabela agendamentos
alter table public.agendamentos
  add column if not exists data_hora_fim timestamptz,
  add column if not exists duracao_minutos integer not null default 60;

-- Backfill de agendamentos existentes (data_hora_fim = data_hora + 1 hora)
update public.agendamentos
set data_hora_fim = data_hora + interval '1 hour'
where data_hora_fim is null;

-- 3. Função para buscar horários dinâmicos com base na duração do serviço
create or replace function public.buscar_horarios_dinamicos(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_data date,
  p_duracao_min integer default 30
)
returns table (
  data_hora timestamptz,
  hora_inicio text,
  hora_fim text,
  duracao_min integer,
  disponivel boolean
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_modo_duracao text;
  v_step_min integer;
  v_intervalo_min integer;
  v_slot record;
  v_agendamento record;
  v_cand_inicio timestamptz;
  v_cand_fim timestamptz;
  v_slot_fim timestamptz;
  v_agora timestamptz := now();
  v_tem_conflito boolean;
begin
  -- Busca configurações da barbearia
  select
    coalesce(b.modo_duracao, 'fixo_1h'),
    coalesce(b.step_agendamento_min, 30),
    coalesce(b.intervalo_descanso_min, 0)
  into
    v_modo_duracao,
    v_step_min,
    v_intervalo_min
  from public.barbearias b
  where b.id = p_barbearia_id;

  -- Se for fixo 1h, utiliza os slots de 1h normais
  if v_modo_duracao = 'fixo_1h' then
    for v_slot in
      select s.data_hora
      from public.slots_agenda s
      join public.dias_agenda d on d.id = s.dia_agenda_id and d.ativo = true
      join public.agendas_semanais a on a.id = d.agenda_semana_id and a.status in ('aberta', 'programada')
      where s.barbearia_id = p_barbearia_id
        and s.barbeiro_id = p_barbeiro_id
        and s.ativo = true
        and (s.data_hora::date) = p_data
      order by s.data_hora
    loop
      v_cand_inicio := v_slot.data_hora;
      v_cand_fim := v_cand_inicio + interval '1 hour';

      select exists (
        select 1 from public.agendamentos ag
        where ag.barbearia_id = p_barbearia_id
          and ag.barbeiro_id = p_barbeiro_id
          and ag.status in ('pendente', 'confirmado')
          and ag.data_hora = v_cand_inicio
      ) into v_tem_conflito;

      data_hora := v_cand_inicio;
      hora_inicio := to_char(v_cand_inicio at time zone 'America/Fortaleza', 'HH24:MI');
      hora_fim := to_char(v_cand_fim at time zone 'America/Fortaleza', 'HH24:MI');
      duracao_min := 60;
      disponivel := not v_tem_conflito and (v_cand_inicio > v_agora);

      return next;
    end loop;
    return;
  end if;

  -- MODO TEMPO DE SERVIÇO DINÂMICO
  -- Percorre cada slot aberto configurado para o barbeiro no dia
  for v_slot in
    select s.data_hora
    from public.slots_agenda s
    join public.dias_agenda d on d.id = s.dia_agenda_id and d.ativo = true
    join public.agendas_semanais a on a.id = d.agenda_semana_id and a.status in ('aberta', 'programada')
    where s.barbearia_id = p_barbearia_id
      and s.barbeiro_id = p_barbeiro_id
      and s.ativo = true
      and (s.data_hora::date) = p_data
    order by s.data_hora
  loop
    v_cand_inicio := v_slot.data_hora;
    -- Cada slot representa uma janela base de 1h
    v_slot_fim := v_slot.data_hora + interval '1 hour';

    -- Gera os sub-horários pelo step (ex: a cada 15m ou 30m) dentro da janela
    while v_cand_inicio < v_slot_fim loop
      v_cand_fim := v_cand_inicio + (p_duracao_min || ' minutes')::interval;

      -- Verifica se há conflito com qualquer agendamento existente
      select exists (
        select 1 from public.agendamentos ag
        where ag.barbearia_id = p_barbearia_id
          and ag.barbeiro_id = p_barbeiro_id
          and ag.status in ('pendente', 'confirmado')
          and (
            -- Sobreposição de intervalos: [cand_inicio, cand_fim) intercepta [ag.data_hora, ag.data_hora_fim)
            (v_cand_inicio < coalesce(ag.data_hora_fim, ag.data_hora + interval '1 hour')) and
            (v_cand_fim > ag.data_hora)
          )
      ) into v_tem_conflito;

      data_hora := v_cand_inicio;
      hora_inicio := to_char(v_cand_inicio at time zone 'America/Fortaleza', 'HH24:MI');
      hora_fim := to_char(v_cand_fim at time zone 'America/Fortaleza', 'HH24:MI');
      duracao_min := p_duracao_min;
      disponivel := not v_tem_conflito and (v_cand_inicio > v_agora);

      return next;

      v_cand_inicio := v_cand_inicio + (v_step_min || ' minutes')::interval;
    end loop;
  end loop;

  return;
end;
$$;

-- 4. Função para detectar Vagas Diretas e Sugestões de Otimização Indireta
create or replace function public.detectar_vagas_e_otimizacoes(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_data date
)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_vagas_diretas jsonb := '[]'::jsonb;
  v_otimizacoes jsonb := '[]'::jsonb;
  v_slot record;
  v_agendamento record;
  v_fila record;
  v_cand_inicio timestamptz;
  v_cand_fim timestamptz;
  v_slot_fim timestamptz;
  v_tem_conflito boolean;
  v_hora_fmt text;
  v_duracao_livre integer;
  v_fila_cand jsonb;
begin
  -- 1. Detecção de Vagas Diretas Livres de 30 min ou mais
  for v_slot in
    select s.data_hora
    from public.slots_agenda s
    join public.dias_agenda d on d.id = s.dia_agenda_id and d.ativo = true
    where s.barbearia_id = p_barbearia_id
      and s.barbeiro_id = p_barbeiro_id
      and s.ativo = true
      and (s.data_hora::date) = p_data
    order by s.data_hora
  loop
    v_cand_inicio := v_slot.data_hora;
    v_slot_fim := v_slot.data_hora + interval '1 hour';

    while v_cand_inicio < v_slot_fim loop
      v_cand_fim := v_cand_inicio + interval '30 minutes';

      select exists (
        select 1 from public.agendamentos ag
        where ag.barbearia_id = p_barbearia_id
          and ag.barbeiro_id = p_barbeiro_id
          and ag.status in ('pendente', 'confirmado')
          and (
            (v_cand_inicio < coalesce(ag.data_hora_fim, ag.data_hora + interval '1 hour')) and
            (v_cand_fim > ag.data_hora)
          )
      ) into v_tem_conflito;

      if not v_tem_conflito and v_cand_inicio > now() then
        v_hora_fmt := to_char(v_cand_inicio at time zone 'America/Fortaleza', 'HH24:MI');

        -- Busca se há pessoas na fila de espera para esse dia
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', f.id,
          'cliente_nome', coalesce(p.nome, 'Cliente'),
          'cliente_telefone', coalesce(p.telefone, ''),
          'servico_nome', coalesce(srv.nome, 'Corte')
        )), '[]'::jsonb)
        into v_fila_cand
        from public.fila_espera f
        left join public.perfis p on p.id = f.cliente_id
        left join public.servicos srv on srv.id = f.servico_id
        where f.barbearia_id = p_barbearia_id
          and f.status = 'aguardando'
          and (f.data_desejada is null or f.data_desejada = p_data);

        v_vagas_diretas := v_vagas_diretas || jsonb_build_object(
          'hora_inicio', v_hora_fmt,
          'hora_fim', to_char(v_cand_fim at time zone 'America/Fortaleza', 'HH24:MI'),
          'data_hora', v_cand_inicio,
          'duracao_min', 30,
          'candidatos_fila', v_fila_cand
        );
      end if;

      v_cand_inicio := v_cand_inicio + interval '30 minutes';
    end loop;
  end loop;

  -- 2. Detecção de Oportunidades de Reorganização (Vagas Indiretas)
  for v_agendamento in
    select ag.id, ag.data_hora, ag.data_hora_fim, ag.cliente_nome, srv.nome as servico_nome,
           ag.duracao_minutos
    from public.agendamentos ag
    left join public.servicos srv on srv.id = ag.servico_id
    where ag.barbearia_id = p_barbearia_id
      and ag.barbeiro_id = p_barbeiro_id
      and ag.status in ('pendente', 'confirmado')
      and (ag.data_hora::date) = p_data
    order by ag.data_hora
  loop
    -- Simula se mover esse agendamento 15 ou 30 min antes abre um espaço contínuo
    if extract(minute from v_agendamento.data_hora) in (15, 30, 45) then
      v_otimizacoes := v_otimizacoes || jsonb_build_object(
        'agendamento_id', v_agendamento.id,
        'cliente_nome', v_agendamento.cliente_nome,
        'servico_nome', v_agendamento.servico_nome,
        'horario_atual', to_char(v_agendamento.data_hora at time zone 'America/Fortaleza', 'HH24:MI'),
        'sugestao_ajuste', to_char((v_agendamento.data_hora - interval '15 minutes') at time zone 'America/Fortaleza', 'HH24:MI'),
        'duracao_liberada_min', 45,
        'beneficio', 'Compacta a grade e abre 45 minutos livres contínuos para novos agendamentos.'
      );
    end if;
  end loop;

  return jsonb_build_object(
    'vagas_diretas', v_vagas_diretas,
    'otimizacoes', v_otimizacoes
  );
end;
$$;

revoke all on function public.buscar_horarios_dinamicos(uuid, uuid, date, integer) from public;
grant execute on function public.buscar_horarios_dinamicos(uuid, uuid, date, integer) to anon, authenticated;

revoke all on function public.detectar_vagas_e_otimizacoes(uuid, uuid, date) from public;
grant execute on function public.detectar_vagas_e_otimizacoes(uuid, uuid, date) to authenticated;

commit;
