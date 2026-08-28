-- Regras configuraveis do estabelecimento.

begin;

alter table public.barbearias
  add column if not exists modo_agenda text not null default 'continua'
    check (modo_agenda in ('continua', 'drops', 'fila_virtual')),
  add column if not exists dias_janela_agendamento integer not null default 14
    check (dias_janela_agendamento between 1 and 365),
  add column if not exists comissao_padrao numeric(5,2) not null default 50
    check (comissao_padrao between 0 and 100),
  add column if not exists regras_fidelidade jsonb not null default '{"ativo": false, "meta_cortes": 10, "recompensa": "Corte ou Barba Grátis"}'::jsonb,
  add column if not exists mimo_ativo jsonb not null default '{"ativo": true, "tipo": "upgrade", "titulo": "Corte Ganha Sobrancelha Grátis", "descricao": "Agende seu corte e ganhe um mimo.", "validade_dias": 7}'::jsonb;

commit;
