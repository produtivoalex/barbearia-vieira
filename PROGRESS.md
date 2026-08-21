# Progresso do Projeto (App Barbearia)

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
### ✅ Fase 15 — Ícones 3D Render Profissionais e Exclusivos para Todos os Serviços (CONCLUÍDA)
- **Geração de Artes 3D de Luxo (Assets Oficiais)**:
  - 🪒 **Corte Navalhado** ([`assets/servicos/corte-navalhado.png`](./assets/servicos/corte-navalhado.png)): Navalha de barbear clássica aberta em aço Damasco com cabo trabalhado em ouro.
  - 🧔 **Barba Desenhada** ([`assets/servicos/barba-desenhada.png`](./assets/servicos/barba-desenhada.png)): Perfil masculino com barba e bigode volumosos e perfeitamente esculpidos na régua.
  - ✨ **Barba Simples** ([`assets/servicos/barba-simples.png`](./assets/servicos/barba-simples.png)): Rosto masculino jovem e limpo, sem barba, exibindo pele macia e lisa após o barbear.
  - 🧴 **Limpeza de Pele** ([`assets/servicos/limpeza-pele.png`](./assets/servicos/limpeza-pele.png)): Rosto masculino relaxando em tratamento facial de spa com bolhas de purificação e gotas douradas de sérum.
  - 👑 **Combos VIP** ([`assets/servicos/combo-vip.png`](./assets/servicos/combo-vip.png)): Coroa imperial majestosa em ouro 24k maciço com veludo rubi e diamantes lapidados.
  - ✂️ **Corte Degradê** ([`assets/servicos/corte-degrade.png`](./assets/servicos/corte-degrade.png)): Perfil com corte skin fade moderno na régua.
  - 💈 **Corte Social** ([`assets/servicos/corte-social.png`](./assets/servicos/corte-social.png)): Tesoura de alfaiataria/barbeiro cruzada com pente dourado.
  - ⚡ **Social Máquina** ([`assets/servicos/social-maquina.png`](./assets/servicos/social-maquina.png)): Máquina de corte profissional sem fio em acabamento dourado e grafite.
  - 📐 **Sobrancelha** ([`assets/servicos/sobrancelha.png`](./assets/servicos/sobrancelha.png)): Pinça de alta precisão dourada e design de sobrancelha masculina.
- **Componente `IlustracaoServico.tsx` Otimizado**:
  - Renderização nativa de alto desempenho via `<Image />` com cantos arredondados, aspect ratio perfeito e contraste de luxo.
- `tsc --noEmit` ✅ (0 erros)

---


## 🎯 Instruções Imediatas (Como Executar / Testar Agora)

### 1. Aplicar CRONs no Supabase
Execute o script [`scripts/configurar_crons.sql`](./scripts/configurar_crons.sql) no SQL Editor do seu Supabase Dashboard substituindo `<SUA_SUPABASE_URL>` e `<SUA_SUPABASE_SERVICE_ROLE_KEY>`.

### 2. Validação dos Fluxos Ponta a Ponta
- **Fluxo do Cliente**:
  1. Cadastro e Login (`/` e `/cadastro`).
  2. Escolha de serviço e slot matinal (08:00–11:00) em `/(app)/(tabs)/servicos` e `agendamento/horario`.
  3. Confirmação do agendamento (`agendamento/confirmacao`) e visualização na aba "Agenda" (`/(app)/(tabs)/agenda`).
  4. Botão "Confirmar presença" na aba "Agenda".
  5. Fila de espera em `/(app)/lista-espera`.
- **Fluxo do Barbeiro**:
  1. Login com conta `role = 'barbeiro'`.
  2. Visualização do dia em `/(app)/(barbeiro)/hoje` com métricas e botão "Estou atrasado".
  3. Visualização semanal em `/(app)/(barbeiro)/semana`.
  4. Preparação da próxima semana em `/(app)/(barbeiro)/preparar-agenda` com toggle de dias e horário de abertura.
  5. Histórico e métricas de clientes em `/(app)/(barbeiro)/clientes`.

### 3. Development Build Gerado (Push Notifications Remotas Reais)
- **EAS Build Link**: https://expo.dev/accounts/produtivoalexs-team/projects/barbearia-vieira/builds/cbf5b73c-eb73-46df-823c-efbc991c0e9a
- **Perfil**: `development` (Android APK com `expo-dev-client`)
- **Como usar no celular**:
  1. Acesse o link acima no celular ou escaneie o QR Code fornecido pelo EAS ao término da compilação.
  2. Baixe e instale o APK (`barbearia-vieira.apk`).
  3. Com o servidor local ativo (`npx expo start`), abra o app instalado no celular para carregar o bundle com suporte nativo total a push notifications remotas em background.

---

## Decisões Tomadas

| Decisão | Motivo |
|---|---|
| Rota raiz do app é `/(app)/(tabs)` e `/(app)/(barbeiro)/hoje` | Padrão do Expo Router com route groups. Não usar `/index` nos links. |
| Login: email + senha + OAuth Google | Google OAuth condicional à presença das chaves no `.env` para evitar crashes no Android. |
| Push Notifications com fallback no Expo Go | `usePushNotifications` detecta Expo Go e evita chamadas bloqueantes a tokens remotos. |
| Calendário semanal matinal (Ter–Dom, 08h-11h) | Regra operacional da barbearia: slots de 1h de manhã, tarde por ordem de chegada. |
| Monetização B2B | Barbeiro paga pelo serviço da plataforma; cliente final não paga assinatura. |
| Agendamento CRON via pg_cron + pg_net | Automatiza abertura de agendas e envio contínuo de lembretes direto no PostgreSQL. |
| Development Build com expo-dev-client | Permite testar notificações push nativas e segundo plano reais no aparelho físico. |


