# Roadmap Multi-Tenant / Marketplace

## Objetivo

Transformar o App Barbearia em um aplicativo único para múltiplas barbearias, mantendo as funcionalidades atuais e isolando os dados por `barbearia_id`.

## Regra de retomada

Em uma nova conversa, ler primeiro este arquivo e o bloco "Pivot multi-tenant" do `PROGRESS.md`. Executar somente a primeira parte marcada como `PENDENTE` ou `EM ANDAMENTO`, preservando alterações locais e atualizando os dois arquivos ao concluir uma etapa significativa.

## Estado atual

- Fase: Parte 4 — serviços, agenda e notificações por barbearia.
- Status: CONCLUÍDA em 23/08/2026.
- Código operacional: ainda não alterado para multi-tenant.
- Banco remoto: migration aplicada e auditoria concluída sem inconsistências.
- Tenant legado: Barbearia Vieira, ainda funcionando no modelo atual.
- Próxima parte: Parte 5 — vitrine e busca.

## Critérios gerais de segurança

- `barbearia_id` será o limite de isolamento; `barbeiro_id` continuará identificando o profissional.
- Nenhuma reserva poderá combinar serviço, slot, barbeiro e barbearia diferentes.
- Dados públicos da vitrine não poderão expor dados privados de clientes ou operação.
- A Barbearia Vieira será migrada por backfill, sem apagar ou recriar agendamentos existentes.
- Não fazer `git reset`, não sobrescrever alterações do usuário e não fazer commit sem autorização.
- Toda etapa deve terminar com validação local, atualização deste arquivo e atualização do `PROGRESS.md`.

## Partes e status

### Parte 0 — Handoff persistente e plano

Status: CONCLUÍDA.

- Criado este roadmap como fonte compacta de retomada.
- Registrado no `PROGRESS.md` o pivot, a parte atual e a próxima parte.
- Confirmado que o repositório estava sem alterações locais antes da migração.

### Parte 1 — Inventário e desenho da migration base

Status: CONCLUÍDA em 23/08/2026.

- Inventário registrado em `MULTI_TENANT_INVENTORY.md`.
- Mapeadas tabelas, migrations, RPCs, triggers, Edge Functions, hooks e telas dependentes.
- Definidas as tabelas `barbearias` e `barbearia_membros` e o conjunto inicial de colunas tenant-aware.
- Definida a estratégia de backfill e as consultas de auditoria da Vieira.
- Nenhuma alteração irreversível foi aplicada no banco remoto.

### Parte 2 — Fundação do tenant e backfill da Vieira

Status: CONCLUÍDA em 23/08/2026.

- Migration local criada em `supabase/migrations/20260823000000_multi_tenant_foundation.sql`.
- Auditoria read-only criada em `scripts/multi_tenant_audit.sql`.
- A migration cria `barbearias` e `barbearia_membros`, adiciona colunas nullable, índices e faz backfill idempotente da Vieira.
- A CLI Supabase foi vinculada ao projeto configurado no `.env`.
- O dry-run confirmou e o `db push --linked` aplicou as Fases 18–22 e a foundation `20260823000000`.
- `npx.cmd supabase migration list --linked` confirmou todas as migrations locais até `20260823000000` no remoto.
- A auditoria read-only confirmou: 1 barbearia, 1 membro, zero registros sem tenant, zero agendamentos com serviço divergente, zero barbeiros sem vínculo e zero slots inconsistentes.
- O vínculo atual usa arquivos temporários da CLI em `supabase/.temp`; não foi criado `supabase/config.toml`.

### Parte 3 — RLS e RPCs tenant-aware

Status: CONCLUÍDA em 23/08/2026.

- Migration aplicada: `supabase/migrations/20260823010000_multi_tenant_rls_and_rpcs.sql`.
- Reparo aplicado: `supabase/migrations/20260823011000_multi_tenant_repair_legacy_rows.sql`.
- Criados helpers de publicação, membro, gestor e barbeiro.
- Instaladas 32 policies tenant-aware nas tabelas operacionais.
- RPCs de reserva, fila, cancelamento e notificações passaram a validar/gravar `barbearia_id`.
- Trigger transitório deriva o tenant em inserts legados quando o vínculo é único; vínculos ambíguos exigem `barbearia_id` explícito.
- Auditoria final: 13 migrations remotas, zero agendamentos órfãos, zero serviços órfãos, zero divergências de serviço e zero divergências de slot.

### Parte 4 — Serviços, agenda e notificações por barbearia

Status: CONCLUÍDA em 23/08/2026.

- Migration aplicada: `supabase/migrations/20260823020000_services_agenda_notifications_tenant.sql`.
- Serviços agora possuem campos de imagem/ordem e unicidade por `(barbearia_id, nome)`; a unicidade global foi removida.
- Índices tenant-aware adicionados para serviços, notificações, reajustes e avisos.
- `useServicos`, `useAgendaSemanal` e `useNotificacoes` aceitam `barbeariaId` sem quebrar chamadas antigas.
- `process-notifications` e `auto-open-agenda` foram atualizadas para carregar tenant, nome da barbearia e deep-link data.
- Migrations remotas confirmadas até `20260823020000`.
- Edge Functions confirmadas como ativas; as configurações JWT existentes foram preservadas.

### Parte 5 — Vitrine e busca

Status: PRÓXIMA.

- Criar consultas/RPCs públicas paginadas.
- Implementar cidade, bairro e proximidade geográfica opcional.
- Criar detalhe público da barbearia.
- Não expor PII ou dados operacionais privados.

### Parte 6 — Tema e fluxo nativo por tenant

Status: PENDENTE.

- Criar `BarbeariaContext` e persistência da barbearia selecionada.
- Criar `ThemeProvider` com fallback para o tema atual.
- Adaptar vitrine → detalhe → serviços → agenda → confirmação.
- Adaptar histórico do cliente e deep links.

### Parte 7 — Painel do barbeiro multi-barbearia

Status: PENDENTE.

- Seleção da barbearia ativa.
- Filtragem tenant-aware em Hoje, Semana, Clientes, Mais e Opções Avançadas.
- Manter todas as funcionalidades existentes disponíveis.

### Parte 8 — Storage, testes e rollout

Status: PENDENTE.

- Bucket e policies para logo, banner e fotos por tenant.
- Criar segunda barbearia de teste.
- Executar testes de isolamento e regressão da Vieira.
- Gerar development build e depois preview.
- Documentar resultado e bloqueios remotos.

## Checklist obrigatório por etapa

- [ ] Ler este arquivo e `PROGRESS.md`.
- [ ] Verificar `git status` antes de editar.
- [ ] Trabalhar somente na parte atual.
- [ ] Validar o que foi alterado.
- [ ] Registrar arquivos, validações, limitações e próxima parte neste arquivo.
- [ ] Atualizar o bloco correspondente no `PROGRESS.md`.

## Fora do MVP inicial

Pagamentos da plataforma, comissões, avaliações, favoritos, cupons, chat, planos, franquias/unidades e painel financeiro consolidado.
## Atualizacao da retomada - Parte 5 (23/08/2026)

- Criadas as RPCs `buscar_barbearias` e `detalhe_barbearia_publica` em `20260823030000_public_storefront_search.sql`.
- Criado `hooks/useBarbearias.ts` e as telas `app/(app)/barbearias/index.tsx` e `[slug].tsx`, acessiveis pela Home.
- O detalhe retorna somente dados comerciais e servicos ativos.
- Migration ainda nao aplicada remotamente; TypeScript e `git diff --check` passaram.

## Atualizacao da retomada - Parte 6 inicial (23/08/2026)

- Criado `contexts/BarbeariaContext.tsx` com persistencia em AsyncStorage.
- A selecao de uma barbearia no detalhe agora direciona para o catalogo e filtra catalogo, Home e agenda pelo tenant selecionado.
- O comportamento legado continua ativo quando nenhuma barbearia foi selecionada.
- TypeScript e `git diff --check` passaram.

## Atualizacao da retomada - Partes 6 e 7 (23/08/2026)

- `BarbeariaContext` agora restaura o tenant salvo e seleciona automaticamente o primeiro vinculo ativo do barbeiro.
- Tema por tenant recebeu estrutura com fallback Vieira em `contexts/BarbeariaContext.tsx`.
- Fluxos do cliente e o painel principal do barbeiro filtram dados pelo tenant ativo.
- Hoje, Semana, Clientes, Mais, Opcoes Avancadas e Preparar Agenda recebem a barbearia ativa; Mais ganhou acao para trocar estabelecimento.
- TypeScript e `git diff --check` passaram.
- Publicacao das migrations continua pendente no Supabase.

## Atualizacao final - Parte 8 (23/08/2026)

- Criada `supabase/migrations/20260823040000_multi_tenant_storage.sql` com bucket `barbearia-media` e policies por tenant.
- Contrato de Storage: `<barbearia_id>/<logo|banner|fotos>/<arquivo>`; leitura publica somente para barbearia publicada/ativa; escrita restrita a gestor/proprietario.
- Criados `scripts/multi_tenant_rollout_audit.sql` e `PART8_ROLLOUT.md` com auditorias e sequencia de rollout.
- TypeScript e `git diff --check` passaram.
- Nenhuma migration da Parte 8 foi aplicada remotamente; segunda barbearia e testes RLS reais continuam dependentes do Supabase autorizado.
- Partes 1 a 8 locais concluídas. Proxima etapa: Parte 9, apos publicar e validar o rollout remoto.

## Atualizacao da retomada - Parte 6 auditoria de consultas (23/08/2026)

- `useMeusAgendamentos` agora filtra o historico pelo tenant ativo.
- `useAgendamento` filtra barbeiros, ocupacao e inserts pela barbearia selecionada.
- Calendario de horarios e aviso de funcionamento da Home agora usam o mesmo tenant.
- TypeScript e `git diff --check` passaram.

## Atualizacao da retomada - Parte 6 fluxos operacionais (23/08/2026)

- Confirmacao filtra slots pelo tenant ativo e grava `barbearia_id` no fallback de agendamento.
- Lista de espera usa servicos e inserts do tenant ativo.
- Oferta da fila e notificacoes filtram a barbearia selecionada.
- TypeScript e `git diff --check` passaram.
