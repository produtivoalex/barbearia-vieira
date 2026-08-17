# Visão de Produto e Especificação — Barbearia Vieira

## 1. Visão Geral e Propósito do Aplicativo

Um aplicativo nativo completo, moderno, extremamente simples e rápido para a **Barbearia Vieira** (iOS, Android e preparado para versão Web leve futura).

### Princípio Fundamental de Negócio
- A Barbearia Vieira **já possui demanda suficiente** e atualmente preenche todos os horários da manhã em poucos minutos via Status do WhatsApp.
- O objetivo principal do aplicativo **NÃO é adquirir novos clientes**, mas sim:
  1. Melhorar radicalmente a experiência dos clientes fiéis/recorrentes.
  2. Automatizar tarefas repetitivas do barbeiro.
  3. Organizar a demanda excedente (fila de espera e fila de troca).
  4. Facilitar cancelamentos e reagendamentos com recuperação automática de vagas.
  5. Reduzir mensagens manuais no WhatsApp (ex: aviso de atrasos).
  6. Dar liberdade ao barbeiro para definir quando e como deseja trabalhar.

---

## 2. Regras Operacionais da Barbearia (v1)

- **Período de Agendamento:** Apenas manhãs (**08:00 às 12:00**).
- **Tarde:** Funciona exclusivamente por **ordem de chegada física** (fora do sistema de agendamento digital nesta versão).
- **Dias de Trabalho:** Terça-feira a Domingo (Segunda-feira é folga/preparação).
- **Grade Fixa da Manhã:** Apenas **4 vagas por dia**: `08:00`, `09:00`, `10:00` e `11:00`.
- **Duração do Slot:** Todo agendamento ocupa um bloco fixo de 1 hora nesta versão (mesmo que o corte termine antes, o tempo é para descanso, preparo ou absorção de atrasos). O banco de dados separa a entidade do serviço da duração do slot para permitir evolução futura.
- **Limite por Cliente:** 1 agendamento ativo por cliente por semana (configurável administrativamente).

---

## 3. Preparação e Ciclo da Agenda Semanal

Substitui a publicação manual em Status do WhatsApp por um ciclo previsível e automatizado.

### Estados da Agenda Semanal
1. **Em preparação:** Visível e editável apenas pelo barbeiro.
2. **Programada:** Configurada com data/hora de abertura automática (ex: Segunda-feira às 19:30). Clientes visualizam "A próxima agenda abre segunda-feira às 19:30" e podem ativar lembrete.
3. **Aberta:** Clientes podem reservar horários em tempo real.

### Tela do Barbeiro: "Preparar Agenda" / "Próxima Semana"
- Apresenta os dias de Terça a Domingo da semana seguinte.
- Ativação/desativação rápida de cada dia (se tiver compromisso na terça, desativa com 1 toque).
- Botão "Usar configuração da semana passada".
- Resumo claro de vagas (ex: "20 vagas serão abertas").
- Programação do horário de abertura (atalhos: 18:00, 19:00, 20:00, 21:00 ou horário livre).
- Configuração de envio de push (na abertura exata e/ou aviso prévio configurável).
- Bloqueio e liberação extraordinária de dias posteriores à publicação (com notificação para clientes compatíveis na fila).

---

## 4. Experiência do Cliente

### Navegação Simplificada (3 Abas Principais)
1. **Início (Home Dinâmica):**
   - *Se a agenda não abriu:* Contagem regressiva / data de abertura + botão de ativar lembrete.
   - *Se aberta e sem agendamento:* Dias e vagas disponíveis da semana, atalho "Seu de sempre" (último serviço/favorito) para agendamento em poucos segundos.
   - *Se lotada:* Mensagem positiva ("A agenda desta semana lotou, mas você ainda pode conseguir uma vaga") + botão destacado "Entrar na fila de espera".
   - *Se já possui agendamento:* Card do próximo atendimento (data, hora, serviço, status, rota, reagendar, cancelar, "Quero outro horário / Fila de troca").
2. **Agendamentos:** Próximo atendimento detalhado e histórico simples com opção "Agendar novamente".
3. **Barbearia:** Endereço, mapa/rota, WhatsApp, Instagram, horários de funcionamento e informações institucionais. (Avatar discreto na Home para dados).

### Agendamento Rápido & Sem Fricção
- Sem burocracia: no primeiro uso solicita apenas Nome e WhatsApp/Telefone (salvos localmente/na conta).
- Catálogo de serviços organizado em categorias ("Mais escolhidos", "Cabelo", "Barba", "Combos", "Outros").
- Visualização semanal direta (Terça a Domingo com os 4 horários da manhã).
- **Reserva temporária atômica (concorrência):** Ao tocar no slot, bloqueio temporário de ~60s no servidor para evitar conflito na abertura simultânea.
- Prevenção total de overbooking via restrições no backend.
- Feedback pós-confirmação: háptico, adicionar ao calendário nativo do dispositivo, rota.

---

## 5. Fila de Espera Inteligente e Fila de Troca

### Fila de Espera (Para quem não conseguiu horário)
- Cadastro de preferências: dias possíveis (ex: somente sábado, ou qualquer dia), horários aceitos (`08:00`, `09:00`, `10:00`, `11:00` ou qualquer), serviço desejado.
- **Oferta Sequencial Temporizada:** Ao surgir cancelamento, o backend encontra o 1º candidato compatível e envia notificação de oferta exclusiva com timer (3 a 5 minutos configuráveis).
- Se aceitar: agendamento criado atomicamente.
- Se recusar ou expirar: oferta passa automaticamente para o próximo candidato elegível.

### Fila de Troca (Para quem já tem horário, mas prefere outro)
- Cliente mantém seu horário garantido e indica interesse em trocar (ex: tem quinta 08:00, quer sábado).
- Se surgir vaga compatível: oferta é enviada.
- Ao aceitar: transação atômica move o agendamento para o novo horário e libera o horário antigo diretamente para a Fila de Espera. O cliente **nunca perde o horário antes de garantir o novo**.

### Política de Prioridade
- Prioridade padrão: clientes sem nenhum agendamento antes de clientes em fila de troca (distribuição justa). Configurável pelo barbeiro.

---

## 6. Cancelamentos, Reagendamentos e Recuperação Automática

- Sem multas financeiras nesta versão.
- Prazo limite configurável pelo barbeiro para cancelamento/reagendamento automático (ex: 2h, 4h, 12h ou 24h antes).
- **Recuperação Automática:** Todo cancelamento aciona imediatamente o motor da fila de espera no backend, sem necessidade de aviso manual pelo WhatsApp.
- Métricas de vagas recuperadas registradas no sistema.

---

## 7. Painel Operacional do Barbeiro

Interface limpa e objetiva (não é um ERP corporativo):

1. **Tela "Hoje":**
   - Data, ocupação do dia (ex: 4/4) e lista dos 4 horários com cliente, serviço, telefone e status ("Confirmado", "Ainda não confirmou").
   - Botão **"Estou atrasado"**: seleção rápida (+10min, +15min, +20min, +30min). O sistema calcula os clientes impactados da manhã e dispara notificação automática sem alterar o horário original do agendamento.
   - Opção de "Agenda normalizada" ao recuperar o tempo.
2. **Tela "Semana":**
   - Visão dos dias da semana, taxa de ocupação (ex: "Quinta 3/4 - 1 vaga", "Sexta Lotado") e contador de pessoas aguardando na fila de espera (revela demanda reprimida).
   - Ação para liberar horários ou dias extraordinários.
3. **Clientes e Histórico:**
   - Lista de clientes com frequência, último atendimento, telefone, faltas registradas e **notas internas privadas** (ex: "prefere degradê navalhado").
4. **Gerenciamento de Serviços:**
   - Criar, editar, ativar, desativar, ordenar e destacar serviços.
5. **Configurações Operacionais:**
   - Dias padrão, horários padrão, prazo de cancelamento, tempo de tolerância da oferta de fila, limites de agendamento por cliente.

---

## 8. Identidade Visual e Design System

- **Inspiração:** Marca clássica Barbearia Vieira (tradição, brasão), executada com sofisticação moderna e minimalista.
- **Paleta de Cores:**
  - Fundo: Carvão/Preto profundo (`#0E0E0E`, `#1A1A1A`) e Marfim/Branco quente.
  - Primária: Vermelho Vieira (`#D32F2F` / `#B71C1C`).
  - Acentos: Dourado fosco (`#D4AF37` / `#C5A059`) usado com moderação.
- **Componentes:** Cards elegantes, cantos arredondados, tipografia de alta legibilidade (Montserrat / Inter), micro-animações, skeletons em vez de textos genéricos de loading.

---

## 9. Arquitetura Técnica

- **Mobile:** React Native com Expo, Expo Router, TypeScript.
- **Backend & DB:** Supabase (PostgreSQL, Row Level Security, Edge Functions para timers/expirações, Realtime).
- **Notificações:** Expo Push Notifications integradas ao backend.
- **Estrutura de Dados:**
  - `perfis` (roles: cliente, barbeiro)
  - `servicos`
  - `agendas_semanais` (semanas, status: preparação, programada, aberta)
  - `dias_agenda` / `slots_agenda`
  - `agendamentos` (status: agendado, confirmado, concluido, cancelado, nao_compareceu)
  - `fila_espera` & `fila_troca`
  - `ofertas_fila` (timers de expiração e status)
  - `atrasos_agenda`
  - `configuracoes_barbearia`
  - `notificacoes_log`
