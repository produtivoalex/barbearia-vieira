# Progresso do Projeto (App Barbearia -> Na Régua)

## Rebranding Oficial — "Na Régua" e Identidade Visual Completa (27/08/2026)

- O nome global do aplicativo foi atualizado oficialmente para **"Na Régua"**.
- Foram integrados e otimizados todos os novos assets oficiais fornecidos:
  - **Logo Na Régua** (`assets/logo-na-regua.png`, `assets/icon.png`, `assets/logo.png`): Imagem quadrada com fundo amarelo/ouro com a silhueta de perfil estilizada.
  - **Banner Na Régua** (`assets/banner-na-regua.png`): Arte oficial com fundo transparente e lettering metálico 3D "Na Régua" com navalha e silhueta.
  - **Avatar Na Régua** (`assets/avatar-na-regua.png`, `assets/logo-avatar.png`): Silhueta recortada com fundo 100% transparente para uso em cabeçalhos, perfis e badges.
  - **Favicon Na Régua** (`assets/favicon.png`): Favicon otimizado de alta resolução (64x64) para Web/PWA.
  - **Adaptive Icon & Splash Screen** (`assets/adaptive-icon.png`, `assets/splash-icon.png`): Otimizados com safe zone para Android e fundo dark no Splash.
- `app.json`: Atualizado o `name` para `"Na Régua"`, permissões de fotos e localização ajustadas com o novo nome da plataforma.
- Telas atualizadas:
  - `TelaLogin` (`app/(pre-auth)/index.tsx`): Integrado o **Banner Na Régua** transparente de alta definição no cabeçalho.
  - `TelaCadastro` (`app/(pre-auth)/cadastro.tsx`): Header com avatar oficial e mensagem de boas-vindas do Na Régua.
  - `TelaHome` (`app/(app)/(tabs)/index.tsx`): Cabeçalho e avisos de funcionamento ajustados dinamicamente.
  - `TelaPerfil` (`app/(app)/(tabs)/perfil.tsx`): Card de usuário e mensagens atualizados.
  - `ListaBarbearias` (`app/(app)/barbearias/index.tsx`): Eyebrow da plataforma atualizado para "NA RÉGUA".
  - `TelaMaisBarbeiro` (`app/(app)/(barbeiro)/mais.tsx`): Versão do app e badges do painel profissional atualizados.
  - `AuthCallback` (`app/auth/callback.tsx`): Mensagem de autenticação atualizada.
  - `components/Avatar.tsx`: Atualizado com suporte a imagens remotas e fallback com a silhueta do Na Régua.
  - `components/LogoBarbearia.tsx`: Suporte aos tipos `'banner'`, `'avatar'`, `'logo_na_regua'`, `'plataforma'`, `'padrao'`.
  - `components/HeaderApp.tsx`: Atualizado para renderizar o banner compacto.
- TypeScript (`npx tsc --noEmit`): 0 erros ✅.

## Pivot multi-tenant / marketplace — Partes 1 a 4 CONCLUÍDAS (23/08/2026)

- O projeto foi direcionado para um aplicativo único com múltiplas barbearias.
- A fronteira de isolamento será `barbearia_id`; `barbeiro_id` continuará representando o profissional.
- Inventário técnico: [`MULTI_TENANT_INVENTORY.md`](./MULTI_TENANT_INVENTORY.md).
- Handoff e sequência: [`MULTI_TENANT_ROADMAP.md`](./MULTI_TENANT_ROADMAP.md).
- A Parte 1 mapeou tabelas, migrations, RPCs, triggers, Edge Functions, hooks e telas dependentes.
- Nenhuma migration foi aplicada e nenhum código operacional foi alterado nesta parte.
- Parte 2 foi concluída: migration criada em `supabase/migrations/20260823000000_multi_tenant_foundation.sql` e aplicada remotamente.
- A migration é aditiva/idempotente, cria `barbearias` e `barbearia_membros`, adiciona `barbearia_id` nullable, índices e backfill da Vieira.
- A CLI Supabase foi vinculada ao projeto configurado no `.env`.
- O dry-run confirmou e o `db push --linked` aplicou as Fases 18–22 e a foundation `20260823000000`.
- A listagem remota confirmou todas as migrations locais até `20260823000000`.
- A auditoria confirmou: 1 barbearia, 1 membro, zero registros sem tenant, zero divergências de serviço, zero barbeiros sem vínculo e zero slots inconsistentes.
- Parte 3 foi concluída com `supabase/migrations/20260823010000_multi_tenant_rls_and_rpcs.sql`.
- Foram criados helpers de autorização, 32 policies tenant-aware, trigger transitório para inserts legados e RPCs tenant-aware de reserva/fila/notificações.
- O reparo `supabase/migrations/20260823011000_multi_tenant_repair_legacy_rows.sql` corrigiu o agendamento legado criado antes dos triggers.
- Auditoria final: 13 migrations remotas, zero agendamentos órfãos, zero serviços órfãos, zero divergências de serviço e zero divergências de slot.
- Parte 4 foi concluída com `supabase/migrations/20260823020000_services_agenda_notifications_tenant.sql`.
- Serviços passaram a ter unicidade por tenant, imagem e ordem de exibição; índices de notificações, reajustes e avisos foram adicionados.
- `useServicos`, `useAgendaSemanal` e `useNotificacoes` aceitam `barbeariaId` com compatibilidade retroativa.
- As Edge Functions `process-notifications` e `auto-open-agenda` foram atualizadas e estão ativas, carregando o tenant nas notificações e deep links.
- TypeScript e `git diff --check` passaram.

## Retomada - Partes 6 e 7 (23/08/2026)

- Contexto persistente, fallback de tema e selecao automatica de vinculo do barbeiro implementados.
- Fluxos do cliente e painel do barbeiro passaram a usar o tenant ativo.
- TypeScript e `git diff --check` passaram.
- Migrations da vitrine ainda nao foram publicadas remotamente.

## Parte 8 - Storage, testes e rollout (CONCLUIDA LOCALMENTE em 23/08/2026)

- Criado bucket tenant-aware `barbearia-media` com limite de 10 MiB e MIME types de imagem.
- Policies de leitura publica para tenants publicados e escrita/edicao/remocao para gestores do tenant.
- Criados `scripts/multi_tenant_rollout_audit.sql` e `PART8_ROLLOUT.md`.
- TypeScript e `git diff --check` passaram.
- Nenhuma migration da Parte 8 foi aplicada remotamente nesta sessao.
- Estado salvo: Partes 1 a 8 locais concluidas; a Parte 9 pode ser iniciada em outra conversa depois da validacao remota.

## Retomada adicional - auditoria de consultas

- Historico, barbeiros, ocupacao, slots e avisos da Home agora respeitam o tenant ativo.
- TypeScript e `git diff --check` passaram.

## Retomada adicional - fluxos operacionais tenant-aware

- Confirmacao, lista de espera, ofertas e notificacoes passaram a respeitar a barbearia selecionada quando existente.
- TypeScript e `git diff --check` passaram.
- O vínculo da CLI usa arquivos temporários em `supabase/.temp`; não foi criado `supabase/config.toml`.
- Próximo passo: **Parte 5 — vitrine e busca**.

### Partes pendentes

1. Parte 5 — Vitrine e busca.
2. Parte 6 — Tema e fluxo nativo por tenant.
3. Parte 7 — Painel do barbeiro multi-barbearia.
4. Parte 8 — Storage, testes e rollout.

## Diagnostico APK Preview - CONCLUIDO (23/08/2026)

- O development abre normalmente porque usa `npx expo start --dev-client` e carrega o `.env` local.
- O perfil `preview` em `eas.json` gera APK standalone, mas nao possui `env` configurado.
- Consulta inicial confirmada no EAS: ambiente `preview` sem variaveis cadastradas.
- Revalidacao em 23/08/2026: o Dashboard agora mostra `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` cadastradas em `preview` (valores nao registrados).
- Build gerado no EAS em 23/08/2026, ID `56c928a6-7985-4012-986b-3b048a2ec258`.
- APK Preview validado com sucesso: abre normalmente no celular.
- `.env` esta ignorado pelo Git; as variaveis nao sao enviadas ao build remoto.
- Causa mais provavel do APK fechar na abertura: `lib/supabase.ts` chama `createClient()` sem `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` no bundle.
- Variaveis cadastradas no EAS Dashboard, ambiente `preview`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- O aviso sobre `cli.version` do eas-cli e informativo e nao e a causa do problema.

Este arquivo serve como um "ponto de salvamento" (save state) para qualquer IA que for interagir com este repositório.
**Regra para IAs:** Leia este arquivo antes de começar qualquer trabalho. Atualize-o sempre que concluir uma etapa significativa.

---

## Estado Atual (Última Atualização: 20/08/2026)

### ✅ Fase 1 — Integração Base com Supabase (CONCLUÍDA)
- **`.env`** criado com as chaves reais (`EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- **`lib/supabase.ts`** — cliente Supabase real com AsyncStorage para persistência de sessão
- **`hooks/useAuth.ts`** — hook que escuta `onAuthStateChange` e `getSession`, com controle de loading seguro
- **`app/_layout.tsx`** — proteção de rotas via `ControleRotas` com redirecionamento de role
- **`app/(pre-auth)/index.tsx`** — tela de login com email + senha conectada ao Supabase (`signInWithPassword`)
- **`app/(pre-auth)/cadastro.tsx`** — tela de cadastro com nome + email + senha (`signUp` com metadado `nome_completo`)
- `tsc --noEmit` ✅ | `eslint` ✅

### ✅ Fase 2 — Banco de Dados + Perfis (CONCLUÍDA)
- **`scripts/schema.sql`** — script inicial com tabelas `perfis`, `servicos`, `agendamentos` e gatilhos de segurança criados e aplicados.
- **`hooks/usePerfil.ts`** — novo hook integrado com o Supabase para resgatar dados da tabela `perfis`.
- **`app/_layout.tsx`** — lógica de redirecionamento aprimorada (cliente vai pra `/(app)/(tabs)`, barbeiro vai pra `/(app)/(barbeiro)/hoje`).
- **`app/(app)/(tabs)/index.tsx` e `perfil.tsx`** — interface adaptada para mostrar as informações reais (nome, telefone/email) e executar logout.

### ✅ Fase 3 — Agendamento Real (CONCLUÍDA)
- **`scripts/schema.sql`** — atualizado com políticas RLS completas para `servicos` e `agendamentos`, visibilidade pública de barbeiros e seeds de serviços.
- **`hooks/useServicos.ts`** — hook que lista serviços ativos direto do Supabase.
- **`hooks/useAgendamento.ts`** — hook que busca barbeiros, horários ocupados por data e insere agendamentos reais no Supabase.
- **`app/(app)/(tabs)/servicos/index.tsx`** — lista serviços do Supabase com pull-to-refresh e navega para seleção de horário.
- **`app/(app)/agendamento/horario.tsx`** — calendário dinâmico sem mocks, cálculo de slots de horário e bloqueio de slots já agendados no Supabase e horários passados no dia atual.
- **`app/(app)/agendamento/confirmacao.tsx`** — grava agendamento real na tabela `agendamentos` com tratamento de loading/erro/sucesso.
- `tsc --noEmit` ✅ | `eslint` ✅

### ✅ UI/UX (concluída)
- Design System completo em `theme/` (cores, tipografia, espaçamentos, sombras, radii)
- Componentes reutilizáveis em `components/` (Botao, Card, Chip, ControleSegmentado, Horario, Avatar, etc.)
- Telas montadas: `(tabs)/index`, `(tabs)/agenda`, `(tabs)/perfil`, `(tabs)/servicos/index`, `agendamento/horario`, `agendamento/confirmacao`, `lista-espera/index`, `lista-espera/oferta`, `(barbeiro)/hoje`, `(barbeiro)/semana`, `(barbeiro)/clientes`, `(barbeiro)/mais`, `(barbeiro)/preparar-agenda`, `notificacoes`.

### ✅ Fase 4 — Agenda do Cliente (CONCLUÍDA)
- **`hooks/useMeusAgendamentos.ts`** — hook com join query (`agendamentos` → `servicos` + `perfis` do barbeiro), separa próximos de histórico.
- **`app/(app)/(tabs)/agenda.tsx`** — lista agendamentos reais com badge de status (cores por estado), data/hora formatadas em local time, preço em BRL, pull-to-refresh e botão "Agendar agora" na tela vazia de próximos.
- `tsc --noEmit` ✅ | `eslint` ✅

### ✅ Fase 5 — Painel do Barbeiro (CONCLUÍDA)
- **`hooks/usePainelBarbeiro.ts`** — hook único com 3 queries: agendamentos de hoje, da semana e lista consolidada de clientes únicos (com contagem e última visita).
- **`app/(app)/(barbeiro)/hoje.tsx`** — exibe saudação com nome real, métricas do dia (qtd de agendamentos + faturamento estimado) e lista de agendamentos de hoje por horário com cliente/serviço/preço.
- **`app/(app)/(barbeiro)/semana.tsx`** — agendamentos da semana agrupados por dia, com badge de contagem por dia.
- **`app/(app)/(barbeiro)/clientes.tsx`** — lista de clientes únicos com avatar, nome, contagem de visitas, última data de atendimento e telefone. Ordenada por maior frequência.
- `tsc --noEmit` ✅ | `eslint` ✅

### ✅ Fase 6 — OAuth Google (CONCLUÍDA & ESTABILIZADA)
- **`expo-web-browser` + `expo-auth-session`** — instalados via npm.
- **`app/(pre-auth)/index.tsx`** — isolado em componente `BotaoGoogleAuth` montado estritamente se as chaves da plataforma existirem no `.env`, eliminando crash `androidClientId must be defined`.
- `tsc --noEmit` ✅

### ✅ Fase 7 — Refatoração do Agendamento (CONCLUÍDA)
- **Paywall (RevenueCat) cancelado** — monetização B2B direta.
- **`app/(app)/agendamento/horario.tsx`** — semanal Ter–Dom da semana atual com 4 slots fixos de manhã (08:00, 09:00, 10:00, 11:00). Tarde = ordem de chegada.
- `tsc --noEmit` ✅

### ✅ Fase 8 — Agenda Semanal, Home Dinâmica e Base de Notificações (CONCLUÍDA)
- `scripts/schema.sql`: agendas semanais, dias, slots, fila de espera, fila de troca, ofertas temporárias, atrasos, tokens/notificações e RLS.
- `scripts/schema.sql`: função `reservar_slot` com validação de agenda aberta, concorrência de horário e limite semanal.
- `hooks/useAgendaSemanal.ts`: leitura da agenda contextual, próxima agenda do barbeiro e contagem de notificações não lidas.
- `app/(app)/(barbeiro)/preparar-agenda.tsx`: preparação da próxima semana e abertura programada.
- `app/(app)/(barbeiro)/hoje.tsx`: ação "Estou atrasado" e normalização.
- `app/(app)/(tabs)/index.tsx`: Home contextual para atendimento, agenda programada, agenda aberta ou semana lotada.
- `app/(app)/lista-espera/index.tsx`: fila funcional com serviço, dias e horários preferidos, persistida no Supabase.
- `app/(app)/lista-espera/oferta.tsx`: aceite de oferta com expiração, lock do slot e criação atômica via `aceitar_oferta_fila`.
- `app/(app)/notificacoes.tsx`: central de notificações com leitura e deep link para ofertas da fila.
- `app/(app)/agendamento/confirmacao.tsx`: usa `reservar_slot` quando a agenda semanal já estiver migrada.
- `supabase/functions/process-notifications/index.ts`: Edge Function deployada no Supabase.
- `supabase/migrations/20260818000000_schema_completo.sql`: migração aplicada remotamente.

### ✅ Fase 9 — Notificações Push e Abertura Automática da Agenda (CONCLUÍDA)
- **`expo-notifications`** integrado de forma segura (silencioso no Expo Go, funcional em builds).
- **`hooks/usePushNotifications.ts`** — gerencia permissões e sincroniza tokens na tabela `notification_tokens`.
- **`supabase/migrations/20260820_fase9_notificacoes.sql`** — migração aplicada:
  - Tabela `lembretes_agendados` com RLS.
  - Trigger `tg_agendar_lembretes` (véspera e 2h antes).
  - RPC `confirmar_presenca`.
  - Trigger `tg_notificar_agenda_aberta`.
  - RPC `registrar_atraso_agenda`.
- **Edge Functions**: `process-notifications` e `auto-open-agenda` deployadas.
- **Deep linking**: configurado em `_layout.tsx` para todos os tipos de push.

### ✅ Fase 10 — Estabilização de Rotas e Compatibilidade Expo Go (CONCLUÍDA)
- Corrigido `router.replace('/(app)/(tabs)')` (removido `/index` inválido que causava "Unmatched Route").
- Criado `app/index.tsx` como tela de transição limpa para carregamento de auth inicial.
- Declarada explicitamente a tela `notificacoes` em `app/(app)/_layout.tsx`.
- Configurado `href: null` para `preparar-agenda` em `app/(app)/(barbeiro)/_layout.tsx` para evitar aba fantasma no painel do barbeiro.
- `tsc --noEmit` ✅ (0 erros)

### ✅ Fase 11 — Configuração de CRONs, RPCs e Preparação de Builds (CONCLUÍDA)
- **`scripts/configurar_crons.sql`** e **`supabase/migrations/20260820_fase10_crons_e_ajustes.sql`** criados:
  - Configuração de agendamento via `pg_cron` e `pg_net` para `auto-open-agenda` (`*/5 * * * *`) e `process-notifications` (`* * * * *`).
  - Refinamento da RPC `confirmar_presenca` para compatibilidade ampla com `status in ('pendente', 'agendado')`.
  - Adicionada política de atualização RLS para agendamentos do cliente.
- **`eas.json`** criado com perfis de `development`, `preview` e `production`.
### ✅ Fase 14 — Novas Variações da Logo Barbearia Vieira (CONCLUÍDA)
- **Ícone do App (Vieira Borda SF)**:
  - Assets oficiais gerados em [`assets/logo-borda-sf.png`](./assets/logo-borda-sf.png), `icon.png`, `adaptive-icon.png`, `splash-icon.png` e `favicon.png` com moldura dourada e safe zone centralizada para Android.
- **Tela de Login e Cadastro (Vieira Navalha)**:
  - Asset oficial em [`assets/logo-navalha.png`](./assets/logo-navalha.png) com fundo transparente e proporção perfeita.
- **Telas de Início e Perfil (Vieira Avatar)**:
  - Asset oficial em [`assets/logo-avatar.png`](./assets/logo-avatar.png) aplicado no cabeçalho da Tela de Início ([`app/(app)/(tabs)/index.tsx`](./app/(app)/(tabs)/index.tsx)) e no card de perfil do usuário ([`app/(app)/(tabs)/perfil.tsx`](./app/(app)/(tabs)/perfil.tsx)).

### ✅ Fase 15 — Catálogo Completo de 14 Serviços e Regras de Negócio (CONCLUÍDA)
- **14 Serviços Oficiais Mapeados**: 4 Cortes (`Corte degradê`, `Corte navalhado`, `Corte Social`, `Social todo na máquina`), 2 Barbas (`Barba desenhada`, `Barba simples`), `Sobrancelha`, `Limpeza de pele` e os 6 `Combos 1 ao 6`.
- **Combos com Tags Individuais (Ideia 1)**: Visualização clara dos serviços inclusos em cada combo (`[✓ Corte...] [✓ Barba...] [✓ Sobrancelha]`), sem cortes de texto.
- **VIP Exclusivo em Combos**: Apenas os 6 combos recebem o badge VIP dourado (`👑 VIP`).
- **Ocultação de Duração para Clientes**: Duração oculta das telas de clientes (`servicos`, `horario`, `confirmacao`, `lista-espera`), mantida internamente para o painel do barbeiro.
- **Guia de Etapas Simplificado**: 3 passos (`1 - Serviço`, `2 - Data e Horário`, `3 - Confirmar`).
- **Lista de Espera com Opção C**: Carrossel horizontal para seleção rápida + Card de Prévia detalhado com as tags e resumo completo.

### ✅ Fase 16 — Padronização Perfeccionista dos 9 Ícones 3D e Layout (CONCLUÍDA)
- **9 Ícones 3D Render Profissionais**:
  - `corte-degrade.png`: Perfil moderno com fade na régua.
  - `corte-navalhado.png`: Navalha clássica de barbeiro aberta em aço Damasco e ouro.
  - `corte-social.png`: Tesoura e pente dourado cruzados.
  - `social-maquina.png`: Máquina de corte profissional sem fio.
  - `combo-vip.png`: Coroa imperial VIP em ouro 24k maciço com veludo e diamantes.
  - `barba-desenhada.png`: Rosto com barba esculpida na régua (100% sem textos/logos).
  - `barba-simples.png`: Rosto barbeado com pele lisa e fresca (clean shaven).
  - `sobrancelha.png`: Pinça de precisão dourada e sobrancelha alinhada.
  - `limpeza-pele.png`: Tratamento facial com sérum dourado e névoa refrescante.
- **Moldura Padronizada**: Chanfro duplo em ouro 24k (`#CBA14A` / `#F0D17D`), squircle de 48px, escala 95% e fundo preto carbono `#141416` em todos os 9 ícones.
- **Cards de Serviço**: Altura mínima travada em `84px`, descrições completas sem truncamento, preço e botão perfeitamente alinhados à direita.
- **Lista de Espera**: Nome `"Social todo na máquina"` com quebra suave em duas linhas sem cortes.

### ✅ Fase 17 — Autenticação Social Google & Apple e Integração Ponta a Ponta (CONCLUÍDA)
- **Módulo Centralizado (`lib/socialAuth.ts`)**:
  - Funções `iniciarLoginSocial`, `processarUrlAuth`, `extrairParametrosUrl` e `obterRedirectUri`.
  - Suporte completo a tokens no Hash (`#access_token=...&refresh_token=...`) e PKCE (`?code=...`).
  - Tratamento e extração explícita de mensagens de erro de provedores OAuth (`error_description`/`error`), eliminando falhas silenciosas.
- **Rota Oficial de Callback (`app/auth/callback.tsx`)**:
  - Captura nativa do deep linking `barbearia-vieira://auth/callback` no Expo Router.
  - Elimina warnings e erros de rotas não encontradas ("Unmatched Route").
- **Proteção e Roteamento (`app/_layout.tsx`)**:
  - `auth/callback` registrado na stack raiz e liberado em `ControleRotas` durante a troca de tokens.
- **Trigger e Perfis no Banco de Dados (`supabase/migrations/20260822_fase17_oauth_trigger.sql` & `scripts/schema.sql`)**:
  - Criação/atualização automática de perfis com fallback de nome para metadados sociais (`full_name`, `name`, `nome_completo` ou prefixo do e-mail).
- **Repositório GitHub Conectado**: [`https://github.com/produtivoalex/barbearia-vieira`](https://github.com/produtivoalex/barbearia-vieira) (branch `main`).
- **Google Sign-In Nativo**: `@react-native-google-signin/google-signin` integrado com um único Web Client ID oficial (`298975067668-h0qn3g0p009vjd4mdtlpkqo7t5e03e68.apps.googleusercontent.com`) e suporte a `signInWithIdToken` em builds de desenvolvimento/produção com fallback web no Expo Go.
- **Botão Apple UX**: Notificação amigável ("Em Breve no iOS 🍏") orientando o usuário a prosseguir com Google ou E-mail enquanto a conta Apple Developer não é integrada.
- `tsc --noEmit` ✅ (0 erros).

### ✅ Fase 18 — Implementação e Refinamento Completo da Área do Barbeiro (CONCLUÍDA)
- **Banco de Dados & RLS (`supabase/migrations/20260822180000_fase18_painel_barbeiro.sql` & `scripts/schema.sql`)**:
  - Política de atualização (`UPDATE`) de agendamentos pelo barbeiro autenticado (`auth.uid() = barbeiro_id`), permitindo concluir e cancelar agendamentos.
  - Política de leitura (`SELECT`) da fila de espera para usuários com papel `barbeiro`.
  - Política de gerenciamento de atrasos da agenda (`atrasos_agenda`).
- **Hook Centralizado (`hooks/usePainelBarbeiro.ts`)**:
  - Query real da fila de espera (`fila_espera` com status `'aguardando'`).
  - Leitura e sincronização de atrasos ativos do dia (`atrasos_agenda`).
  - Funções reativas com atualização otimista/local: `concluirAgendamento`, `cancelarAgendamento` e `definirAtraso`.
- **Painel Diário (`app/(app)/(barbeiro)/hoje.tsx`)**:
  - Métricas reais de agendamentos (concluídos / total), clientes na lista de espera e faturamento diário estimado.
  - Alerta de atraso ativo do dia com botão para normalizar ou alterar (+10, +15, +20, +30 min).
  - Filtros rápidos por status: "Ativos", "Concluídos" e "Todos".
  - Cards interativos com `BadgeStatus` e modal bottom sheet com ações completas: contato direto via WhatsApp (`wa.me`) e Telefone (`tel:`), botão de concluir atendimento e botão de cancelar.
- **Agenda Semanal (`app/(app)/(barbeiro)/semana.tsx`)**:
  - Cabeçalho com métricas da semana (total de agendamentos e faturamento previsto).
  - Agrupamento visual por dia da semana com badge de quantidade e total diário.
  - Toque nos cards para abrir modal de detalhes do cliente e contato rápido.
- **Gestão de Clientes (`app/(app)/(barbeiro)/clientes.tsx`)**:
  - Campo de busca em tempo real por nome ou telefone.
  - Cards com avatar, total de visitas, última data de atendimento e atalho para WhatsApp.
  - Modal com métricas individuais do cliente (total de visitas e data) e ações de contato.
- **Mais Opções & Configurações (`app/(app)/(barbeiro)/mais.tsx`)**:
  - Identidade do barbeiro com avatar Vieira, e-mail e badge "Profissional Vieira".
  - Atalho para preparar a próxima agenda.
  - Modal de consulta rápida da tabela com os 14 serviços e preços ativos da barbearia.
  - Modal informativo com horário e modelo de atendimento (manhã app, tarde livre).
  - Modal informativo de privacidade & segurança.
  - Botão de logout com modal de confirmação conectado ao `supabase.auth.signOut()`.
- **Programação Semanal (`app/(app)/(barbeiro)/preparar-agenda.tsx`)**:
  - Interface escura e consistente com o Design System.
  - Contagem dinâmica de vagas conforme os dias selecionados.
  - Upsert seguro de slots e dias da semana sem duplicidade.
- **Proteção de Rotas (`app/(app)/(barbeiro)/_layout.tsx` e `app/(app)/(tabs)/_layout.tsx`)**:
  - Validação mútua de papéis com auto-redirecionamento dinâmico.
- `tsc --noEmit` ✅ (0 erros).

### ✅ Fase 19 — Melhorias Avançadas do Barbeiro: Encaixes, Horários Granulares e Avisos (CONCLUÍDA)
- **Banco de Dados (`supabase/migrations/20260822190000_fase19_avisos_e_encaixes.sql` & `scripts/schema.sql`)**:
  - Tabela `avisos_funcionamento` para controle diário de tarde fechada com RLS.
  - Política de inserção manual de agendamentos para o barbeiro (`auth.uid() = barbeiro_id`).
- **Modelo Híbrido Inteligente de Concluídos (`hoje.tsx`)**:
  - Contagem inteligente nas métricas: atendimentos cujo horário + duração já decorreu são contabilizados automaticamente como concluídos.
  - Flexibilidade de controle manual: botão no card permite alternar ou marcar não comparecimento.
- **Aviso de Tarde Fechada + Status do WhatsApp (`hoje.tsx` & `(tabs)/index.tsx`)**:
  - Switch no painel do barbeiro para marcar tarde fechada com mensagem oficial direta: *"Informamos que a Barbearia Vieira estará fechada hoje na parte da tarde. Agradecemos a compreensão de todos!"*.
  - Botão "Postar no Status do WhatsApp" integrado com API de compartilhamento nativo.
  - Banner de aviso em destaque na Home dos clientes quando a tarde estiver fechada.
- **Reserva Manual / Encaixe para Cliente Específico (`hoje.tsx`)**:
  - Modal com seleção de horário rápido, cliente cadastrado ou nome/telefone avulso, e escolha dentre os 14 serviços reais.
- **Controle Granular por Horário em Preparar Agenda (`preparar-agenda.tsx`)**:
  - Switch do dia inteiro + chips de ativação/desativação individual para cada horário matinal (`08:00`, `09:00`, `10:00`, `11:00`).
  - Geração de slots estritamente baseada nos horários marcados.
- `tsc --noEmit` ✅ (0 erros).

### ✅ Fase 20 — Reajustes de Preços, Lista Negra, Mensagens em Grupo e Opções Avançadas (CONCLUÍDA)
- **Banco de Dados (`supabase/migrations/20260822200000_fase20_reajustes_e_opcoes_avancadas.sql` & `scripts/schema.sql`)**:
  - Tabelas `reajustes_precos`, `bloqueios_clientes` e `equipe_barbearia` com políticas RLS.
  - Função RPC `notificar_todos_clientes` para disparar comunicados consolidados a todos os clientes.
- **Tabela de Preços com Reajuste Individual e em Lote (`mais.tsx`)**:
  - Reajuste individual ao tocar em qualquer serviço com novo preço, data de vigência e justificativa opcional.
  - Botão de **Reajuste Geral em Lote** para editar múltiplos serviços juntos.
  - Disparo de notificação única consolidada para os clientes com CTA limpo (*"Toque em Saiba mais para ver os detalhes"* sem mencionar justificativa no resumo).
- **Selo IMPORTANTE nas Notificações do Cliente (`notificacoes.tsx`)**:
  - Selo `⚠️ IMPORTANTE (Vigência em DD/MM/AAAA)` ativo até a data da mudança, mesmo após a notificação ser lida.
  - Modal com comparativo (preço antigo -> novo preço) e exibição da mensagem da barbearia se preenchida.
- **Tela de Opções Avançadas do Barbeiro (`opcoes-avancadas.tsx`)**:
  - Botão adicionado na tela *Mais* no lugar do antigo informativo de horários (com `href: null` nas abas inferiores para não poluir a barra de navegação).
  - **Mensagem em Grupo**: envio de notificações diretas com 4 grupos disponíveis (Hoje, Semana, Fila de Espera e Todos os Clientes), com seleção granular para desmarcar destinatários específicos.
  - **Lista Negra / Bloqueio de Clientes**: busca em tempo real por nome, e-mail ou telefone para bloquear com 1 toque, com desbloqueio instantâneo.
  - **Tela de Manutenção Disfarçada (`(tabs)/_layout.tsx`)**: se o cliente bloqueado abrir o app, vê *"🔧 Aplicativo em Manutenção no momento. Por favor, tente novamente mais tarde."*.
  - **Reserva / Encaixe de Clientes Específicos**: busca em tempo real por nome, e-mail ou telefone, com seleção em 1 toque e colinha discreta e resumida dos combos selecionados.
  - **Gestão de Funcionários / Equipe**: cadastro de novos profissionais.
  - **Agendamentos à Tarde com Regra de Justiça**: liberação de horários extras para diminuir a lista de espera nos dias cheios, ativando automaticamente o aviso de que a ordem de chegada estará fechada para garantir transparência.
- **Tela Hoje (`hoje.tsx`)**:
  - Título simplificado para **Fechar à Tarde** (quando aberta) e **Fechada à Tarde** com descrição *"Enviando aviso para clientes"* (quando fechada).
- **Tabela de Serviços & Preços (`mais.tsx`)**:
  - Removido truncamento de texto (`numberOfLines={1}`) das descrições dos serviços, permitindo quebra de linha fluida para leitura completa de todos os detalhes.
  - Rolagem dedicada apenas na lista interna dos 14 serviços no **Reajuste Geral de Todos os Serviços**, mantendo os campos de vigência no topo e o botão de salvar fixo e sempre visível embaixo.
- **Abertura Imediata da Agenda Semanal (`preparar-agenda.tsx` & `semana.tsx`)**:
  - Adicionada a opção/switch **"Liberar Imediatamente (Aberta Agora)"** na tela de *Preparar Agenda*.
  - Adicionado banner com botão **"🚀 Liberar Agora"** diretamente na tela de *Agenda Semanal* (`semana.tsx`).
  - Ao salvar ou acionar o botão, o status muda instantaneamente para `'aberta'` e os clientes já visualizam a agenda liberada para agendar serviços no app.
- **Confirmação e Criação de Agendamentos Resiliente (`confirmacao.tsx`)**:
  - Auto-resolução do barbeiro responsável pelo slot e garantia de perfil cadastrado em `perfis`.
  - Mecanismo de reserva dupla: tenta a procedure `reservar_slot` e executa fallback direto com inserção segura em `agendamentos`.
  - Exibição de tela de sucesso instantânea com detalhes do serviço, data/hora e redirecionamento direto para a aba de agendamentos.
- `tsc --noEmit` ✅ (0 erros).

### ✅ Fase 21 & 22 — Sincronização Dinâmica de Horários e Confirmação Resiliente (CONCLUÍDA)
- **Correção da Trigger de Lembretes no Supabase (`agendar_lembretes_agendamento`)**:
  - Removido acesso ao campo `NEW.slot_id` inexistente na tabela `agendamentos`.
  - Agendamento de notificações automáticas de véspera e 2h antes consumindo diretamente `NEW.data_hora`.
- **Sincronização 100% Dinâmica de Dias e Horários do Cliente (`horario.tsx`)**:
  - Consumo direto dos dias configurados em `agendas_semanais`, `dias_agenda` e `slots_agenda`.
  - Exibição precisa do período da semana aberta (ex: *25 ago – 30 ago*), respeitando dias ativos e horários liberados.
- **Confirmação e Criação de Agendamentos Resiliente (`confirmacao.tsx`)**:
  - Auto-resolução do barbeiro responsável pelo slot e garantia de registro do perfil do cliente em `perfis`.
  - Mecanismo de reserva dupla: tenta procedure `reservar_slot` e executa fallback direto com inserção segura em `agendamentos`.
  - Exibição de tela de sucesso instantânea com detalhes do serviço, data/hora e redirecionamento direto para a aba de agendamentos.
- `tsc --noEmit` ✅ (0 erros).

---

## 🎯 Instruções Imediatas para Próxima Sessão / Testes Locais

### Como Rodar o Development Build Localmente (Mesmo Wi-Fi)
Para testar no dispositivo físico conectado na mesma rede Wi-Fi que o seu computador:

No **PowerShell**:
```powershell
npx expo start --dev-client
```
> **Nota**: Ao abrir o QR Code, abra o aplicativo **Barbearia Vieira (Development Build)** no seu celular e escaneie o código. Se a rede Wi-Fi bloquear portas locais, você também pode usar `npx expo start --dev-client --tunnel`.

### Handoff para próxima conversa
- Todas as funcionalidades das Fases 18 a 22 concluídas com typecheck 100% limpo e testadas com sucesso no app.

---

## Decisões Tomadas

| Decisão | Motivo |
|---|---|
| Rota raiz do app é `/(app)/(tabs)` e `/(app)/(barbeiro)/hoje` | Padrão do Expo Router com route groups. Não usar `/index` nos links. |
| Ícones 3D padronizados em 256x256 com chanfro dourado | Garante visual premium e leitura imediata de todos os serviços da barbearia. |
| Combos com tags douradas dos itens inclusos | Elimina cortes de texto e deixa explícito o que cada combo oferece. |
| Ocultação de duração para clientes | Evita confusão enquanto a barbearia opera com horários fixos. |
| Lista de espera em Opção C | Carrossel horizontal compacto + Card de Prévia destacado com detalhes. |
| Repositório oficial no GitHub `produtivoalex/barbearia-vieira` | Permite builds automáticas pelo EAS/GitHub e versionamento completo. |
| Módulo `socialAuth.ts` + Google Sign-In Nativo | Lê `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` do `.env` com ID Token do Google Play Services. |
| Permissões RLS de Update e Insert Manual para Barbeiro | Permite que o barbeiro faça encaixes manuais e conclua/cancele atendimentos. |
| Modelo Híbrido Inteligente de Concluídos | Evita esforço repetitivo do barbeiro durante atendimentos e mantém métricas precisas. |
| Mensagem simples e direta de tarde fechada | Mantém a comunicação transparente e objetiva com os clientes no app e WhatsApp. |
| Tela de Manutenção Disfarçada para Clientes Bloqueados | Evita atritos e discussões ao restringir clientes problemáticos. |
| Notificação Consolidada de Reajuste em Lote | Não polui a caixa de entrada do cliente com dezenas de mensagens separadas. |
| Selo IMPORTANTE até a data de vigência | Garante que o cliente esteja ciente dos novos valores mesmo após ler o aviso. |
| Regra de Justiça na Liberação de Vagas da Tarde | Avisa que a ordem de chegada estará fechada para evitar que pessoas na fila presencial vejam agendados entrando na frente. |
| Mensagem em Grupo com Seleção Granular | Permite que o barbeiro desmarque clientes específicos que não devem receber o aviso. |
| Opções Avançadas com `href: null` nas tabs | Mantém a barra inferior limpa com apenas 4 abas oficiais (Hoje, Agenda, Clientes, Mais). |
| Busca em tempo real de clientes no Encaixe | Facilita a reserva rápida por nome, e-mail ou telefone sem redigitação. |
| Colinha discreta de combos no Encaixe | Relembra instantaneamente o que está incluso no combo selecionado. |
| Busca de clientes na Lista Negra | Permite localizar e bloquear rapidamente qualquer cliente cadastrado. |
| Quebra de linhas em descrições de serviços | Garante que combos e descrições ricas sejam lidas integralmente sem cortes. |
## Retomada 23/08/2026 - Parte 5 em andamento

- RPCs publicas, hook e telas iniciais de vitrine/busca criados localmente.
- Migration `supabase/migrations/20260823030000_public_storefront_search.sql` ainda nao aplicada remotamente.
- TypeScript e `git diff --check` passaram; lint global permanece com erros legados.

## Retomada adicional 23/08/2026 - Parte 6 inicial

- Criado `contexts/BarbeariaContext.tsx` com persistencia local da barbearia selecionada.
- A selecao no detalhe da vitrine agora filtra catalogo, Home e agenda pelo tenant ativo.
- TypeScript e `git diff --check` passaram.

## Fechamento da Parte 8 e início da Parte 9 - 24/08/2026

- Rollout remoto validado: migrations multi-tenant até `20260823040000` e bucket `barbearia-media` disponíveis no projeto Supabase correto.
- Auditorias confirmaram a Vieira ativa/pública, bucket único e nenhum objeto Storage fora do contrato.
- Tenant privado de teste criado; a vitrine pública não o expõe.
- O usuário operacional de teste tem `role = barbeiro`, vínculo proprietário ativo na Vieira e vínculo gestor ativo no tenant de teste.
- Troca de barbearia no painel foi validada no Development Build.
- Corrigidos o roteamento do modo painel, a consulta direta de vínculos e a seleção de tenant sem passar pelo detalhe público.
- Commits finais enviados para `main`: `21bf314`, `ae0219a`, `6137dc3`, `26600d8` e `d313d6e`.
- Parte 9 iniciada conceitualmente: onboarding, edição/publicação do estabelecimento, membros e mídia por tenant.

## Parte 9 — Gestão de Estabelecimentos, Mídias e Membros (CONCLUÍDA em 25/08/2026)

- Tela `app/(app)/(barbeiro)/gestao-barbearia.tsx` completa com navegação segmentada em 3 abas: Dados Comerciais, Identidade Visual e Equipe/Membros.
- **Identidade Visual**:
  - Logo: preview visual (avatar 1:1), botão alterar com crop quadrado e botão excluir.
  - Banner: preview visual (formato 16:5), botão alterar com crop horizontal e botão excluir.
  - Galeria de Fotos: grade com miniaturas, indicador `X/6 fotos`, botão adicionar (respeitando limite de 6) e botão de exclusão individual com confirmação.
- **Módulo de Storage & Limpeza (`lib/storage.ts`)**:
  - Upload estritamente tenant-aware (`<barbearia_id>/<logo|banner|fotos>/...`).
  - Limpeza e remoção segura de mídias antigas do bucket `barbearia-media` ao substituir logo/banner ou excluir fotos da galeria.
- **Gestão de Equipe & Membros (`hooks/useMembrosBarbearia.ts`)**:
  - Listagem dos membros da barbearia com perfis vinculados.
  - Modal com busca em tempo real de usuários cadastrados no app (`perfis`) por nome ou e-mail.
  - Seleção de papéis: `proprietario`, `gestor`, `barbeiro`, `atendente`.
  - Alteração de papéis e ativação/desativação de membros.
  - **Regra de Segurança de Preservação**: impede que a barbearia fique órfã de gestor bloqueando a desativação ou rebaixamento do último proprietário/gestor ativo.
- **Vitrine Pública & Marketplace**:
  - Detalhe da barbearia (`barbearias/[slug].tsx`) e lista (`barbearias/index.tsx`) adaptados para exibir banner oficial, logo customizada e galeria de fotos quando publicados.
## Rebranding da Plataforma, Molduras de Serviços & Temas Customizados (CONCLUÍDO em 25/08/2026)

- **Rebranding White-Label da Plataforma**:
  - App desacoplado da identidade exclusiva "Barbearia Vieira", transformando-se em uma plataforma SaaS multi-estabelecimentos (*Barber Plataforma*).
  - Telas de Login (`app/(pre-auth)/index.tsx`) e Cadastro (`app/(pre-auth)/cadastro.tsx`) com identidade neutra e moderna.
  - A Barbearia Vieira permanece como um estabelecimento completo cadastrado com todos os seus serviços, histórico e mídias.
- **Fluxo Inteligente de Acesso & Memorização da Barbearia**:
  - Clientes que já escolheram uma barbearia entram **diretamente no app da última barbearia acessada** após o login.
  - Novos clientes que nunca escolheram são direcionados para a **Vitrine Premium** (`app/(app)/barbearias/index.tsx`) para encontrar e escolher barbearias na sua região.
  - Opção de troca de estabelecimento sempre disponível no Perfil e na Home.
- **Moldura Externa Elegante para Fotos de Serviços (`components/IlustracaoServico.tsx`)**:
  - Moldura com chanfro e anel duplo envolvendo as fotos de serviços na cor da identidade do barbeiro (`tema.frameColor` ou `cor_moldura`).
  - Garante que cada barbearia tenha personalidade e distinção visual mesmo utilizando imagens da biblioteca padrão.
- **Biblioteca de 9 Renders 3D Sugeridos & Upload de Fotos**:
  - Cortes (Degradê/Fade, Navalhado, Social Clássico, Máquina), Barba (Desenhada, Simples), Combos VIP, Sobrancelha e Limpeza de Pele.
  - Seletor visual de ilustrações e suporte a upload de fotos da galeria com envio seguro ao Supabase Storage.
- **Identidade Visual & Temas no Painel do Barbeiro (`app/(app)/(barbeiro)/gestao-barbearia.tsx`)**:
  - Nova aba **Tema & Cores** com 7 paletas pré-configuradas de luxo (Ouro Imperial, Rubi Barber, Esmeralda Luxo, Azul Royal, Ametista Cyberpunk, Carbono Silver, Âmbar Cobre).
  - Seletor de cores customizadas (HEX) para cor primária e cor da moldura dos serviços com prévia em tempo real.
- **Editor Completo de Serviços no Painel (`app/(app)/(barbeiro)/mais.tsx`)**:
  - Modal para criar e editar serviços com nome, preço, duração, descrição, categoria, imagem da biblioteca/galeria e cor da moldura.
- **Catálogo do Cliente Atualizado (`app/(app)/(tabs)/servicos/index.tsx`)**:
  - Serviços renderizados com suas respectivas fotos e molduras externas personalizadas na cor do estabelecimento ativo.
- **Localização Antecipada & Proximidade (`hooks/useLocalizacao.ts`)**:
  - `expo-location` instalado e configurado em `app.json` e `package.json`.
  - Permissão solicitada no início do app / tela de login com geolocalização obtida em segundo plano.
  - Vitrine (`barbearias/index.tsx`) ordena automaticamente da barbearia mais próxima para a mais distante com indicador de distância nos cards (`📍 a 1.2 km` / `📍 a 800 m`).
- **Navegação & Retenção de Barbeiros**:
  - Removida a opção de explorar barbearias da Home (`app/(app)/(tabs)/index.tsx`) para não incentivar a perda de clientes.
  - No Perfil (`app/(app)/(tabs)/perfil.tsx`), a troca de barbearia foi movida para a seção de Informações como uma opção discreta (*"Unidade de Atendimento"* -> *"Alterar unidade atual"*).
  - Corrigida a rota para `/(app)/barbearias` eliminando o erro de 404.
- **Persistência em Nuvem da Última Barbearia do Cliente**:
  - Adicionada coluna `ultima_barbearia_id` em `public.perfis` via migration `20260825210000_client_last_barbearia_and_location.sql`.
  - `BarbeariaContext` busca a última barbearia do perfil ou do histórico de agendamentos no banco ao logar, garantindo que clientes recorrentes nunca caiam indevidamente na vitrine.
  - Ao escolher um estabelecimento, a seleção é salva no `AsyncStorage` e atualizada no Supabase.
- **Validações**: `tsc --noEmit`, `npx expo config --type public` e `git diff --check` passaram com 0 erros.

### Handoff / Estado Final da Plataforma White-Label
- Estado atual: Plataforma SaaS Multi-Tenant White-Label 100% implementada, testada e sincronizada com geolocalização e proximidade.
- Banco de dados: Migrations aplicadas até `20260825210000_client_last_barbearia_and_location.sql`.
- Servidor: Development Build pronto para testes em dispositivos físicos e emuladores.
