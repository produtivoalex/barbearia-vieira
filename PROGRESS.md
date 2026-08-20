# Progresso do Projeto (App Barbearia)

Este arquivo serve como um "ponto de salvamento" (save state) para qualquer IA que for interagir com este repositório.
**Regra para IAs:** Leia este arquivo antes de começar qualquer trabalho. Atualize-o sempre que concluir uma etapa significativa.

---

## Estado Atual (Última Atualização: 18/08/2026)

### ✅ Fase 1 — Integração Base com Supabase (CONCLUÍDA)
- **`.env`** criado com as chaves reais (`EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- **`lib/supabase.ts`** — cliente Supabase real com AsyncStorage para persistência de sessão
- **`hooks/useAuth.ts`** — hook que escuta `onAuthStateChange`, retorna `{ carregando, autenticado, session }`
- **`app/_layout.tsx`** — proteção de rotas via `ControleRotas`: não autenticado → `/(pre-auth)`, autenticado → `/(app)/(tabs)` ou `/(app)/(barbeiro)`
- **`app/(pre-auth)/index.tsx`** — tela de login com email + senha conectada ao Supabase (`signInWithPassword`)
- **`app/(pre-auth)/cadastro.tsx`** — tela de cadastro com nome + email + senha (`signUp` com metadado `nome_completo`)
- `tsc --noEmit` ✅ | `eslint` ✅

### ✅ Fase 2 — Banco de Dados + Perfis (CONCLUÍDA)
- **`scripts/schema.sql`** — script inicial com tabelas `perfis`, `servicos`, `agendamentos` e gatilhos de segurança criados e aplicados.
- **`hooks/usePerfil.ts`** — novo hook integrado com o Supabase para resgatar dados da tabela `perfis`.
- **`app/_layout.tsx`** — lógica de redirecionamento aprimorada (cliente vai pra `/(tabs)`, barbeiro vai pra `/(barbeiro)`).
- **`app/(app)/(tabs)/index.tsx` e `perfil.tsx`** — interface adaptada para mostrar as informações reais (nome, telefone/email) e executar logout.

### ✅ Fase 3 — Agendamento Real (CONCLUÍDA)
- **`scripts/schema.sql`** — atualizado com políticas RLS completas para `servicos` e `agendamentos`, visibilidade pública de barbeiros e seeds de serviços.
- **`hooks/useServicos.ts`** — hook que lista serviços ativos direto do Supabase.
- **`hooks/useAgendamento.ts`** — hook que busca barbeiros, horários ocupados por data e insere agendamentos reais no Supabase.
- **`app/(app)/(tabs)/servicos/index.tsx`** — lista serviços do Supabase com pull-to-refresh e navega para seleção de horário.
- **`app/(app)/agendamento/horario.tsx`** — calendário dinâmico sem mocks, cálculo de slots de horário e bloqueio de slots já agendados no Supabase e horários passados no dia atual.
- **`app/(app)/agendamento/confirmacao.tsx`** — grava agendamento real na tabela `agendamentos` com tratamento de loading/erro/sucesso.
- `tsc --noEmit` ✅ | `eslint` ✅

### ✅ UI/UX (concluída anteriormente)
- Design System completo em `theme/` (cores, tipografia, espaçamentos, sombras, radii)
- Componentes reutilizáveis em `components/` (Botao, Card, Chip, ControleSegmentado, Horario, Avatar, etc.)
- Telas montadas: `(tabs)/index`, `(tabs)/agenda`, `(tabs)/perfil`, `(tabs)/servicos/index`, `agendamento/horario`, `agendamento/confirmacao`, `lista-espera/index`, `lista-espera/oferta`, `(barbeiro)/hoje`, `(barbeiro)/semana`, `(barbeiro)/clientes`, `(barbeiro)/mais`

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

### ✅ Fase 6 — OAuth Google (CONCLUÍDA)
- **`expo-web-browser` + `expo-auth-session`** — instalados via npm.
- **`app/(pre-auth)/index.tsx`** — `handleGoogle` implementado com `Google.useAuthRequest`, `makeRedirectUri` e `supabase.auth.signInWithIdToken`. Botão exibe loading enquanto aguarda resposta.
- ⚠️ **Requer configuração manual** (ver abaixo nas Decisões Tomadas).
- `tsc --noEmit` ✅

### ✅ Fase 7 — Refatoração do Agendamento (CONCLUÍDA)
- **Paywall (RevenueCat) cancelado** — não faz sentido para um app operacional de uma única barbearia. A monetização é B2B (barbeiro paga pelo serviço), não assinatura de usuário final.
- **`app/(app)/agendamento/horario.tsx`** — reescrito completamente:
  - Substituído calendário mensal por visualização semanal (Ter–Dom da semana atual)
  - Apenas 4 slots fixos de manhã: 08:00, 09:00, 10:00, 11:00
  - Grade da tarde removida (tarde = por ordem de chegada, fora do sistema)
  - Cada dia exibe badge "X vagas" / "Lotado" em tempo real
  - Slots ocupados/passados com linha e opacidade reduzida
  - Todos os 6 dias buscam ocupação simultaneamente via `Promise.all`
- `tsc --noEmit` ✅

---

## 🎯 Instruções Imediatas para a Próxima IA (O Que Fazer Agora)

> **Atenção Próxima IA:**
> Leia obrigatoriamente [`PRODUTO.md`](./PRODUTO.md) antes de qualquer implementação. Ele contém a especificação exaustiva das regras de negócio, ciclo de agenda, fila de espera/troca, ferramenta "Estou atrasado" e cenários de teste.

### 📍 Próxima Fase: Fase 8 — Sistema de Agenda Semanal do Barbeiro & Home Dinâmica

#### 1. Banco de Dados / Supabase (`scripts/schema.sql`):
- Criar migração/tabelas para suportar o ciclo semanal e a fila:
  - `agendas_semanais` (`id`, `data_inicio`, `data_fim`, `status` ['em_preparacao', 'programada', 'aberta'], `data_abertura_programada`, `notificar_abertura`, `notificar_antecedencia_minutos`)
  - `dias_agenda` (`id`, `agenda_semana_id`, `data`, `ativo`)
  - `fila_espera` (`id`, `cliente_id`, `servico_id`, `dias_preferidos`, `horarios_preferidos`, `status` ['aguardando', 'ofertado', 'atendido', 'cancelado'], `created_at`)
  - `fila_troca` (`id`, `agendamento_id`, `dias_desejados`, `horarios_desejados`, `status` ['aguardando', 'trocado', 'cancelado'])
  - `ofertas_fila` (`id`, `fila_espera_id`, `slot_data_hora`, `expira_em`, `status` ['pendente', 'aceita', 'recusada', 'expirada'])
  - `atrasos_agenda` (`id`, `data`, `minutos_atraso`, `normalizado_em`, `created_at`)

#### 2. Painel do Barbeiro:
## ✅ Fase 8 — Agenda Semanal, Home Dinâmica e Base de Notificações (CONCLUÍDA)
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
- `supabase/functions/process-notifications/index.ts`: Edge Function deployada no Supabase (ref fnvenkcpucpuucovunzf).
- `supabase/migrations/20260818000000_schema_completo.sql`: migração aplicada remotamente via `supabase db push`.
- `agenda_lembretes`: base para o cliente ativar lembrete da abertura da agenda.
- `.env` recriado sem BOM com URL + anon key corretas (projeto fnvenkcpucpuucovunzf).
- `scripts/schema.sql` corrigido: `uuid_generate_v4()` → `gen_random_uuid()` (PG17 nativo).
- `tsc --noEmit` ✅ | `eslint` ✅ (3 avisos preexistentes de imports não usados)

### ✅ Fase 9 — Notificações Push e Abertura Automática da Agenda (CONCLUÍDA)
- **`expo-notifications`** integrado para obter tokens de push Expo e registrar canais de notificação no Android.
- **`hooks/usePushNotifications.ts`** — gerencia permissões e sincroniza tokens na tabela `notification_tokens` do Supabase.
- **`supabase/migrations/20260820_fase9_notificacoes.sql`** — migração aplicada com sucesso no Supabase (`supabase db push`):
  - Tabela `lembretes_agendados` com RLS e políticas de acesso.
  - Trigger `tg_agendar_lembretes` gerando lembretes de véspera e 2h antes a cada novo agendamento.
  - RPC `confirmar_presenca` para confirmação rápida pelo cliente.
  - Trigger `tg_notificar_agenda_aberta` criando notificações de abertura para todos os clientes com token ativo.
  - RPC `registrar_atraso_agenda` disparando notificações automáticas para clientes com horários no dia.
- **Edge Function `process-notifications`** — aprimorada e deployada no Supabase para envio em lote de push notifications reais via Expo Push API + processamento de lembretes automáticos.
- **Edge Function `auto-open-agenda`** — criada e deployada para abertura automática de agendas programadas e envio de lembrete nas segundas-feiras para barbeiros sem agenda preparada.
- **`app/_layout.tsx`** — deep linking completo para notificações push (`agenda_aberta`, `oferta_fila`, `lembrete`, `atraso`, `barbeiro_sem_agenda`).
- **`app/(app)/(tabs)/index.tsx`** — banner contextual para solicitar permissão de notificações e atalho com permissão ao ativar lembrete.
- **`app/(app)/(tabs)/agenda.tsx`** — botão "Confirmar presença" em agendamentos pendentes com feedback visual.
- **`app/(app)/(barbeiro)/hoje.tsx`** — ferramenta "Estou atrasado" conectada ao RPC e notificações reais.
- `tsc --noEmit` ✅ | Bundle Android ✅ (2903 módulos)

---

## 🎯 Próximos Passos
- Configurar cron schedules para `auto-open-agenda` e `process-notifications` no Supabase Dashboard (Database -> Extensions -> pg_cron ou HTTP Cron).
- Realizar testes ponta a ponta com múltiplos dispositivos/contas em staging.

## Decisões Tomadas

| Decisão | Motivo |
|---|---|
| Login: email + senha + OAuth Google | Usuário escolheu. Google OAuth implementado na Fase 6. |
| `npm install --legacy-peer-deps` para instalar `@supabase/supabase-js` | Conflito de peer deps entre `expo-router@4.0.21` e `expo-constants`. Não afeta o funcionamento. |
| `ControleRotas` como componente separado dentro de `_layout.tsx` | Hooks React não podem ser usados diretamente no render de um componente que retorna outra árvore de componentes sem quebrar as regras de hooks. |
| Calendário semanal (Ter–Dom) em vez de calendário mensal | O escopo original proíbe explicitamente calendário mensal. A barbearia tem agenda semanal com 4 slots fixos de manhã (08–11h). |
| Tarde fora do sistema de agendamento | Regra operacional: tarde funciona por ordem de chegada física, sem agendamento digital nesta versão. |
| Paywall / RevenueCat cancelado | Sem sentido para app de barbearia dedicado. Monetização é B2B (operador paga), não assinatura de usuário final. |
