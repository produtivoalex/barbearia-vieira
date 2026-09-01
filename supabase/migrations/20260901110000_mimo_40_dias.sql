-- Atualiza o gatilho de reativação de clientes de 20 para 40 dias
create or replace function public.disparar_mimos_reativacao(p_barbearia_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_config jsonb;
  v_titulo text;
  v_descricao text;
  v_validade integer;
  v_count integer;
begin
  if not public.usuario_e_gestor(p_barbearia_id) then
    raise exception 'Usuario nao autorizado para esta barbearia';
  end if;

  select coalesce(mimo_ativo, '{}'::jsonb) into v_config
    from public.barbearias where id = p_barbearia_id;
  if coalesce((v_config->>'ativo')::boolean, false) = false then return 0; end if;

  v_titulo := coalesce(v_config->>'titulo', 'Mimo especial 🎁');
  v_descricao := coalesce(v_config->>'descricao', 'Um presente especial espera por você na barbearia.');
  v_validade := greatest(coalesce((v_config->>'validade_dias')::integer, 7), 1);

  insert into public.notifications (usuario_id, barbearia_id, tipo, titulo, mensagem, dados)
  select ult.cliente_id, p_barbearia_id, 'mimo_reativacao', v_titulo, v_descricao,
         jsonb_build_object('barbeariaId', p_barbearia_id, 'validadeDias', v_validade)
  from (
    select a.cliente_id, max(a.data_hora) as ultimo_atendimento
    from public.agendamentos a
    where a.barbearia_id = p_barbearia_id
      and a.status in ('confirmado', 'concluido')
      and a.data_hora < now() - interval '40 days'
    group by a.cliente_id
  ) ult
  where not exists (
    select 1 from public.agendamentos futuro
    where futuro.cliente_id = ult.cliente_id
      and futuro.barbearia_id = p_barbearia_id
      and futuro.data_hora >= now()
      and futuro.status in ('pendente', 'confirmado')
  )
  and not exists (
    select 1 from public.notifications n
    where n.usuario_id = ult.cliente_id
      and n.barbearia_id = p_barbearia_id
      and n.tipo = 'mimo_reativacao'
      and n.criada_em >= now() - make_interval(days => v_validade)
  );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.disparar_mimos_reativacao(uuid) from public;
grant execute on function public.disparar_mimos_reativacao(uuid) to authenticated;
