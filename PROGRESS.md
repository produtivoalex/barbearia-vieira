# Progresso do Projeto (App Barbearia)

Este arquivo serve como um "ponto de salvamento" (save state) para qualquer IA que for interagir com este repositório.
**Regra para IAs:** Leia este arquivo antes de começar qualquer trabalho. Atualize-o sempre que concluir uma etapa significativa.

---

## Estado Atual (Última Atualização: 17/08/2026)

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
- Criar a tela/fluxo **"Preparar Agenda"** (Terça a Domingo, toggle de dias, botão "Usar semana passada", programação de abertura para segunda-feira às 18h/19h/20h/21h).
- Implementar na tela `(barbeiro)/hoje.tsx` a ação **"Estou atrasado"** (+10, +15, +20, +30 min e "Agenda normalizada").

#### 3. Experiência do Cliente:
- Transformar a Home `app/(app)/(tabs)/index.tsx` em **Home Dinâmica**:
  - Estado 1: Agenda Programada (contagem/data de abertura + ativar lembrete)
  - Estado 2: Agenda Aberta (dias com vagas + botão "Seu de sempre")
  - Estado 3: Agenda Lotada (mensagem acolhedora + botão "Entrar na fila de espera")
  - Estado 4: Com Agendamento Ativo (card de destaque com status, rota, reagendar, cancelar e "Quero outro horário / Fila de troca")

---

## Decisões Tomadas

| Decisão | Motivo |
|---|---|
| Login: email + senha + OAuth Google | Usuário escolheu. Google OAuth implementado na Fase 6. |
| `npm install --legacy-peer-deps` para instalar `@supabase/supabase-js` | Conflito de peer deps entre `expo-router@4.0.21` e `expo-constants`. Não afeta o funcionamento. |
| `ControleRotas` como componente separado dentro de `_layout.tsx` | Hooks React não podem ser usados diretamente no render de um componente que retorna outra árvore de componentes sem quebrar as regras de hooks. |
| Calendário semanal (Ter–Dom) em vez de calendário mensal | O escopo original proíbe explicitamente calendário mensal. A barbearia tem agenda semanal com 4 slots fixos de manhã (08–11h). |
| Tarde fora do sistema de agendamento | Regra operacional: tarde funciona por ordem de chegada física, sem agendamento digital nesta versão. |
| Paywall / RevenueCat cancelado | Sem sentido para app de barbearia dedicado. Monetização é B2B (operador paga), não assinatura de usuário final. |


