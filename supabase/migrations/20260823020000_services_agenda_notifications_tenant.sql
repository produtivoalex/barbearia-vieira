-- Parte 4: catálogo, agenda e notificações preparados para múltiplos tenants.

begin;

alter table public.servicos add column if not exists imagem_url text;
alter table public.servicos add column if not exists ordem_exibicao integer default 0 not null;

alter table public.servicos drop constraint if exists servicos_nome_unique;
create unique index if not exists servicos_barbearia_nome_unique
  on public.servicos (barbearia_id, lower(nome))
  where barbearia_id is not null;

create index if not exists notifications_barbearia_usuario_idx
  on public.notifications (barbearia_id, usuario_id, criada_em desc);
create index if not exists reajustes_barbearia_vigencia_idx
  on public.reajustes_precos (barbearia_id, data_vigencia desc);
create index if not exists avisos_barbearia_data_idx
  on public.avisos_funcionamento (barbearia_id, data desc);

comment on column public.servicos.barbearia_id is 'Tenant proprietário do serviço; preços não são compartilhados entre barbearias.';
comment on column public.notifications.barbearia_id is 'Tenant de origem da notificação operacional; tokens continuam globais por usuário.';

commit;
