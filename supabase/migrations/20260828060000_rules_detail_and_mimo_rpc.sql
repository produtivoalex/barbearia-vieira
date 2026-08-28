-- Publica apenas as regras necessarias ao comportamento do cliente e cria
-- o disparo real de mimos via notificacoes in-app.

begin;

create or replace function public.detalhe_barbearia_publica(p_slug text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', b.id, 'slug', b.slug, 'nome', b.nome, 'descricao', b.descricao,
    'cidade', b.cidade, 'bairro', b.bairro, 'endereco', b.endereco,
    'telefone', b.telefone, 'whatsapp', b.whatsapp, 'logo_url', b.logo_url,
    'banner_url', b.banner_url, 'fotos', b.fotos,
    'modo_agenda', b.modo_agenda,
    'dias_janela_agendamento', b.dias_janela_agendamento,
    'regras_fidelidade', b.regras_fidelidade,
    'mimo_ativo', b.mimo_ativo,
    'servicos', coalesce((
      select jsonb_agg(to_jsonb(s) - 'barbearia_id' order by s.ordem_exibicao, s.nome)
      from public.servicos s where s.barbearia_id = b.id and s.ativo = true
    ), '[]'::jsonb)
  )
  from public.barbearias b
  where b.slug = p_slug and b.publicada = true and b.status = 'ativa';
$$;

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

  v_titulo := coalesce(v_config->>'titulo', 'Mimo especial');
  v_descricao := coalesce(v_config->>'descricao', 'Um presente especial espera por voce.');
  v_validade := greatest(coalesce((v_config->>'validade_dias')::integer, 7), 1);

  insert into public.notifications (usuario_id, barbearia_id, tipo, titulo, mensagem, dados)
  select ult.cliente_id, p_barbearia_id, 'mimo_reativacao', v_titulo, v_descricao,
         jsonb_build_object('barbeariaId', p_barbearia_id, 'validadeDias', v_validade)
  from (
    select a.cliente_id, max(a.data_hora) as ultimo_atendimento
    from public.agendamentos a
    where a.barbearia_id = p_barbearia_id
      and a.status in ('confirmado', 'concluido')
      and a.data_hora < now() - interval '20 days'
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

commit;
