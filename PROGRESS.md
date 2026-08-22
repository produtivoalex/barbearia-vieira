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

### 🔄 Fase 17 — Autenticação Social Google & Apple e Integração GitHub (EM ANDAMENTO)
- **Novo Logo Oficial da Apple**: Asset em alta resolução com transparência em [`assets/logo-apple.png`](./assets/logo-apple.png).
- **Repositório GitHub Conectado**: [`https://github.com/produtivoalex/barbearia-vieira`](https://github.com/produtivoalex/barbearia-vieira) (branch `main`).
- **Status da Autenticação Social**: Código atualizado com `WebBrowser.openAuthSessionAsync` e `AuthSession.makeRedirectUri({ scheme: 'barbearia-vieira', path: 'auth/callback' })`.
- **Ajuste Restante**: Realizar o alinhamento de credenciais e configuração de provedores diretamente no Supabase/OAuth credentials para que o login social complete a troca de tokens sem erros na aplicação.

---

## 🎯 Instruções Imediatas para Próxima Sessão
1. **Foco Principal**: Resolver a configuração e fluxo do Login Social (Google e Apple) ponta a ponta com o Supabase.
2. **Ambiente**: O código já está 100% compilando (`tsc --noEmit` com 0 erros) e sincronizado com o GitHub na branch `main`.

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


