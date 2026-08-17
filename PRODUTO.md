# Especificação Completa de Produto — Barbearia Vieira

> **Documento de Referência Absoluta:** Todas as decisões de arquitetura, telas, regras de negócio e fluxos do aplicativo devem seguir rigorosamente este documento.

---

## 1. Princípios e Filosofia do Produto

- **Não é um simples sistema genérico de agendamento:** A Barbearia Vieira já possui demanda suficiente e preenche todos os horários da manhã em poucos minutos via Status do WhatsApp.
- **Objetivo central:** Não é adquirir novos clientes, mas sim:
  1. Melhorar radicalmente a experiência dos clientes fiéis/recorrentes.
  2. Automatizar tarefas repetitivas do barbeiro.
  3. Organizar a demanda excedente (fila de espera e fila de troca).
  4. Facilitar cancelamentos e reagendamentos com recuperação automática instantânea de horários liberados.
  5. Reduzir mensagens manuais no WhatsApp (ex: aviso de atrasos).
  6. Dar liberdade total para o barbeiro definir quando e quais dias deseja trabalhar.
- **Ciclo de Ouro do App:** `preparar agenda → abrir automaticamente → reservar → lembrar → cancelar/reagendar → recuperar vaga pela fila → atender`.
- **O que NÃO implementar:** Nada de marketplace, rede social, chat interno, loja, sistema de pontos, paywall/assinatura, IA decorativa, estoque ou relatórios contábeis complexos.

---

## 2. Regras Operacionais da Barbearia (v1)

1. **Horário de Atendimento:** Apenas manhãs (**08:00 às 12:00**).
2. **Período da Tarde:** Funciona exclusivamente por **ordem de chegada física** no local. Não faz parte do sistema de agendamento digital nesta versão. (Deixar arquitetura extensível para uma futura "fila digital da tarde").
3. **Dias de Trabalho:** Terça-feira a Domingo (Segunda-feira é folga e preparação). O sistema nunca deve pressupor que todos os dias de terça a domingo estarão automaticamente disponíveis.
4. **Capacidade Diária:** Apenas **4 vagas por manhã**:
   - `08:00`
   - `09:00`
   - `10:00`
   - `11:00`
5. **Duração do Slot:** Cada cliente reserva um bloco fixo de **1 hora**, independentemente do serviço escolhido. Mesmo que o corte termine antes, o tempo restante serve para descanso, preparação ou absorção de atrasos. Não otimizar com base na duração.
6. **Desacoplamento Técnico no Banco:** A tabela de serviços e a duração de slot devem ser separadas no banco de dados para permitir suporte futuro a durações variáveis por serviço.
7. **Limite por Cliente:** Regra padrão de **1 agendamento ativo por cliente por semana** (evita reservas múltiplas predatórias). Configurável administrativamente com exceções manuais pelo barbeiro.

---

## 3. Preparação e Ciclo da Agenda Semanal

Substitui a dependência do Status do WhatsApp por uma experiência automatizada e previsível.

### Os 3 Estados da Agenda Semanal
1. **Em preparação:** Visível e modificável exclusivamente pelo barbeiro.
2. **Programada:** Configurada com data/hora exata de abertura (ex: Segunda-feira às 19:30). O app do cliente exibe "A próxima agenda abre segunda-feira às 19:30" com opção de ativar lembrete.
3. **Aberta:** Clientes podem reservar em tempo real.

### Tela do Barbeiro: "Preparar Agenda" / "Próxima Semana"
- Apresenta os dias de Terça a Domingo da semana seguinte (com 08:00, 09:00, 10:00, 11:00).
- Toggle de ativação/desativação rápida por dia (ex: desativa terça por compromisso pessoal em 1 toque, sem precisar justificar).
- Botão **"Usar configuração da semana passada"**.
- Exibição de vagas totais (ex: "20 vagas serão abertas").
- **Horário de Abertura Programada:** Seletores rápidos (18:00, 19:00, 20:00, 21:00), seletor de horário customizado ou opção de abertura manual.
- **Notificações:** Opção de disparar push aos clientes no momento da abertura e/ou aviso prévio configurável (ex: 15 min antes).
- **Lembrete ao Barbeiro:** Se na segunda-feira antes do horário padrão a agenda não tiver sido preparada, enviar notificação ao barbeiro: *"A próxima semana ainda não está preparada. Revise os dias antes de abrir a agenda."*
- **Bloqueio e Liberação Extraordinária:**
  - Barbeiro pode bloquear um dia antes ou após publicação.
  - Se abrir um dia bloqueado posteriormente (ex: decide na quinta trabalhar na sexta), o sistema aciona a ação *"Liberar vagas deste dia"* e notifica automaticamente clientes compatíveis na lista de espera.

---

## 4. Experiência do Cliente

### Duas Experiências no Mesmo App
- Mesmo codebase identifica a role (`cliente` vs `barbeiro`) e renderiza a respectiva interface.
- Cliente nunca vê opções administrativas; barbeiro autenticado acessa o painel operacional.

### Navegação (3 Abas Inferiores)
1. **Início (Home Dinâmica e Contextual):**
   - *Agenda Programada:* Mostra quando abrirá (ex: "Próxima agenda: segunda-feira às 19:30") + "Ativar lembrete".
   - *Agenda Aberta & Sem Agendamento:* Grade de dias da semana + vagas livres + atalho **"Seu de sempre"** (último serviço/favorito, ex: "Seu de sempre: Corte + Barba" -> "Ver horários").
   - *Agenda Lotada:* Mensagem positiva: *"A agenda desta semana lotou, mas você ainda pode conseguir uma vaga"* + botão em destaque **"Entrar na fila de espera"**.
   - *Com Agendamento Ativo:* Card de destaque com Próximo Atendimento (data, hora, serviço, status, rota, reagendar, cancelar, e **"Quero outro horário / Fila de troca"**).
2. **Agendamentos:** Próximo atendimento detalhado e histórico anterior com botão "Agendar novamente".
3. **Barbearia:** Endereço, mapa interativo, rota, WhatsApp, telefone, Instagram, horário de funcionamento e informações institucionais. (Avatar discreto na Home dá acesso a dados pessoais e preferências).

### Fluxo de Agendamento Ultrarrápido
- **Zero burocracia:** Não obriga cadastro tradicional com senha de imediato; no primeiro uso pede apenas Nome e WhatsApp/Telefone (salvos localmente/na conta). Preparado para verificação via código SMS/WhatsApp no futuro.
- **Catálogo de Serviços (~14 serviços):** Categorizado em *"Mais escolhidos"*, *"Cabelo"*, *"Barba"*, *"Combos"*, *"Outros"*. Destaques configuráveis pelo barbeiro.
- **Seleção Semanal Direta:** Cards Terça a Domingo com os 4 slots (`08:00`, `09:00`, `10:00`, `11:00`). Dias cheios marcados como "Lotado", horários ocupados riscados/desabilitados.
- **Concorrência & Reserva Temporária (~60 segundos):** Ao selecionar um slot, o servidor realiza um lock atômico temporário de 60s. Se outro cliente tocar no mesmo horário, recebe aviso imediato de que o horário acabou de ser escolhido e a grade atualiza em tempo real.
- **Prevenção de Overbooking:** Criação definitiva do agendamento validada e executada atomicamente no backend.
- **Confirmação e Sucesso:** Feedback háptico, botão "Adicionar ao Calendário" nativo do celular, abrir localização e ver agendamento.

---

## 5. Fila de Espera Inteligente e Fila de Troca

### A. Fila de Espera (Para quem não conseguiu vaga)
- O cliente informa suas preferências:
  - **Dias possíveis:** dias específicos (ex: apenas sábado) ou "Qualquer dia".
  - **Horários possíveis:** horários específicos (`08:00`, `09:00`, `10:00`, `11:00`) ou "Qualquer horário".
  - **Serviço:** serviço escolhido ou "Seu favorito".
- Timestamp de entrada registrado para ordenação de prioridade.
- **Oferta Sequencial Temporizada (Sem correria):**
  - Ao liberar uma vaga (por cancelamento ou liberação de dia), o backend identifica o 1º candidato compatível.
  - Envia notificação: *"Surgiu uma vaga: quinta-feira às 09:00. Você tem alguns minutos para aceitar."*
  - Bloqueio temporário da vaga de **3 a 5 minutos** (configurável pelo barbeiro).
  - Se aceitar: reserva confirmada atomicamente.
  - Se recusar ou o timer expirar: vaga é oferecida imediatamente ao próximo elegível da fila.
  - Registro de histórico completo: ofertas realizadas, aceitas, recusadas e expiradas.

### B. Fila de Troca (Para quem já tem vaga, mas quer outro horário)
- O cliente possui uma vaga (ex: quinta 08:00), mas prefere outra (ex: sábado 10:00).
- Ele marca **"Quero trocar se surgir vaga no sábado"**.
- Ao surgir a vaga compatível e o cliente aceitar:
  - **Operação atômica:** Reserva o novo horário -> move o agendamento -> só então libera o horário antigo para a Fila de Espera.
  - **Garantia:** O cliente **NUNCA perde o horário atual antes de garantir o novo**.

### C. Política de Prioridade
- Regra padrão: Priorizar quem **ainda não tem nenhum horário na semana** antes de quem está em fila de troca. Configurável pelo barbeiro.

---

## 6. Cancelamento, Reagendamento e Lembretes

- **Reagendamento Real:** Se houver outra vaga livre, troca direto. Se não houver, oferece "Manter meu horário" ou "Entrar na fila de troca".
- **Política de Cancelamento:** Prazo limite configurável (ex: 2h, 4h, 6h, 12h, 24h antes). Dentro do prazo, cancela/reagenda sozinho. Fora do prazo, orienta contato. Sem multas obrigatórias no MVP.
- **Recuperação Automática:** Cancelou -> vaga liberada no backend -> motor da fila de espera dispara oferta sequencial instantaneamente. Barbeiro não precisa abrir WhatsApp.
- **Lembretes & Confirmação:** Lembretes push configuráveis (véspera e horas antes) com botão *"Confirmar presença"*. Barbeiro vê status "Confirmado" ou "Ainda não confirmou" (não cancela automaticamente, serve de alerta de risco de ausência).

---

## 7. Painel do Barbeiro e Ferramenta "Estou Atrasado"

### A. Ferramenta "Estou Atrasado" (Crítica)
- Se um atendimento atrasar, em 1 toque o barbeiro escolhe: `+10 min`, `+15 min`, `+20 min`, `+30 min` ou personalizado.
- O sistema calcula automaticamente todos os clientes restantes daquela manhã e envia push: *"Pequeno atraso na agenda. Seu atendimento das 10:00 deve começar aproximadamente às 10:15."*
- O horário oficial do banco permanece 10:00, mas a tela exibe previsão ajustada. Barbeiro recebe feedback: *"3 clientes avisados"*.
- **Normalização:** Se recuperar o tempo, pode reduzir o atraso ou tocar em *"Agenda normalizada"*. Só notifica novamente se houver variação relevante (>= 10 min).

### B. Telas do Barbeiro
1. **Hoje:**
   - Visual limpo: 4 horários da manhã em sequência (`08:00`, `09:00`, `10:00`, `11:00`), nome do cliente, serviço, valor, status de confirmação e botão "Estou atrasado". Toque no card abre WhatsApp, histórico e ações.
2. **Semana:**
   - Ocupação por dia (ex: "Quarta 4/4 - Lotado", "Quinta 3/4 - 1 vaga", "Sexta Indisponível").
   - **Contador de Fila:** Exibe o total de pessoas na fila de espera daquela semana (revela demanda reprimida invisível).
3. **Clientes e Histórico Privado:**
   - Nome, telefone, histórico de visitas, serviços favoritos, faltas registradas e **observações internas privadas** (ex: *"costuma pedir degradê navalhado baixo"*). Nunca visíveis ao cliente.
   - Status de atendimento: `Agendado`, `Confirmado`, `Concluído`, `Cancelado`, `Não compareceu`.
4. **Gerenciamento de Serviços:**
   - CRUD de serviços: nome, categoria, preço, descrição, posição, destaque, ativo/inativo.
5. **Configurações Operacionais:**
   - Dias/horários padrão, tempo de slot (1h), prazos de cancelamento, tempo de expiração da oferta de fila (3-5min), prioridade da fila, limites por cliente.
6. **Métricas Úteis:**
   - Vagas abertas, taxa de ocupação, pessoas na fila, cancelamentos e **vagas recuperadas automaticamente pela fila**.

---

## 8. Identidade Visual e UX Emocional

- **Identidade:** Estética tradicional Vieira com visual moderno, refinado e minimalista.
  - Fundo: Carvão/Preto (`#0E0E0E`, `#1A1A1A`) e Marfim/Branco quente.
  - Ação: Vermelho Vieira (`#D32F2F` / `#B71C1C`).
  - Destaque: Dourado fosco (`#D4AF37` / `#C5A059`) usado com extrema parcimônia e elegância.
- **Tom de Comunicação Positivo:** Nunca usar textos frustrantes ("Nenhum horário"). Usar *"A agenda desta semana lotou, mas podemos avisar se surgir uma vaga"*.
- **Qualidade Técnica:** Skeletons de carregamento profissionais, feedback háptico, animações suaves, acessibilidade de fontes e contrastes, suporte impecável a celulares de entrada.
- **Deep Links Contextuais:**
  - Push de agenda aberta -> abre direto na seleção de horários.
  - Push de oferta de vaga -> abre direto na tela de aceite da oferta.
  - Push de lembrete -> abre detalhe do agendamento.
  - Push de atraso -> abre agendamento com horário previsto atualizado.

---

## 9. Fluxo de Demonstração (Cenário Obrigatório para Validação)

1. Barbeiro prepara a próxima semana desativando terça-feira e ativando quarta a domingo (16 vagas).
2. Programa abertura para segunda às 19:30.
3. Simulação da abertura automática com push aos clientes.
4. Cliente A entra, escolhe "Seu de sempre" e reserva quinta 09:00.
5. Vagas da semana esgotam. Cliente B entra e se cadastra na fila de espera para quinta/sexta de manhã.
6. Cliente A cancela sua vaga de quinta 09:00.
7. O sistema oferece automaticamente a vaga para o Cliente B com timer de 3 minutos.
8. Cliente B aceita a vaga -> agendamento criado e vaga recuperada.
9. Na tela "Hoje", o barbeiro simula atraso de +15 minutos -> todos os clientes afetados da manhã recebem aviso push automático.

---

## 10. Cenários Críticos de Teste Obrigatórios

- [ ] Dois clientes tentando reservar o mesmo horário no mesmo segundo (reserva temporária e atomicidade).
- [ ] Cliente fechando o app durante a confirmação da reserva.
- [ ] Cancelamento com clientes aguardando na fila (disparo imediato da oferta).
- [ ] Oferta da fila expirando sem resposta e passando para o próximo.
- [ ] Cliente aceitando oferta no último segundo.
- [ ] Cliente na fila de troca aceitando nova vaga (transferência atômica sem perder a antiga antes da confirmação).
- [ ] Barbeiro bloqueando dia sem reservas vs tentando bloquear dia com reservas já feitas.
- [ ] Barbeiro liberando dia extraordinário (notificação automática para interessados da fila).
- [ ] Mudança de horário de abertura antes da publicação.
- [ ] Falha de conexão durante agendamento (nunca confirmar só localmente sem resposta do Supabase).
- [ ] Push aberto após a vaga ofertada já ter expirado.
- [ ] Ajuste e normalização de atraso pelo barbeiro.
- [ ] Tentativa de agendar mais de 1 vaga na mesma semana pelo mesmo cliente.
- [ ] Tentativa de invasão ou visualização de dados de outros clientes / observações privadas (Row Level Security).

---

## Anexo: Prompt Original na Íntegra (Transcrição Fiel)

```text
Um aplicativo nativo completo, moderno, extremamente simples e rápido para a Barbearia Vieira. O aplicativo deve ser desenvolvido com foco principal em Android e iOS, preferencialmente usando React Native com Expo e Expo Router, mantendo arquitetura preparada para também disponibilizar posteriormente uma versão web leve do agendamento. O backend pode usar Supabase com PostgreSQL, autenticação, Row Level Security, funções seguras no servidor, notificações e recursos em tempo real. O aplicativo não deve ser tratado como um simples sistema genérico de agendamento para barbearias. A Barbearia Vieira já possui demanda suficiente e atualmente consegue preencher todos os horários disponíveis da manhã em poucos minutos. Portanto, o principal objetivo do aplicativo não é adquirir novos clientes, e sim melhorar radicalmente a experiência dos clientes atuais, automatizar tarefas repetitivas do barbeiro, organizar a demanda excedente, facilitar cancelamentos e reagendamentos, recuperar automaticamente horários liberados, reduzir mensagens manuais no WhatsApp e dar mais liberdade para o barbeiro definir quando deseja trabalhar.

A operação atual da barbearia deve ser respeitada. O aplicativo inicialmente será utilizado apenas para os atendimentos da manhã, entre 08:00 e 12:00. O período da tarde continuará funcionando por ordem de chegada e não deve fazer parte do sistema de agendamento nesta primeira versão. O barbeiro trabalha normalmente de terça-feira a domingo e não trabalha às segundas-feiras. Atualmente cada cliente reserva um bloco fixo de uma hora, independentemente do serviço escolhido. Existem apenas quatro vagas possíveis por manhã: 08:00, 09:00, 10:00 e 11:00. Essa regra deve ser mantida integralmente nesta versão. Não tente otimizar a agenda com base na duração do serviço. Mesmo que alguns cortes terminem antes de uma hora, o tempo restante pode ser utilizado pelo barbeiro para descanso, preparação ou absorção de pequenos atrasos. Entretanto, a arquitetura do banco de dados deve separar serviço e duração de slot de modo que no futuro seja possível implementar tempos diferentes por serviço sem precisar reconstruir o aplicativo.

O funcionamento atual da agenda semanal é o seguinte: normalmente na segunda-feira entre aproximadamente 18:00 e 21:00 o barbeiro publica em seu Status do WhatsApp o link do sistema de agendamento. Em questão de minutos praticamente todas as vagas são preenchidas. Clientes que visualizam o Status meia hora ou uma hora depois frequentemente ficam sem horário durante toda a semana. O aplicativo deve substituir essa dependência do Status do WhatsApp por uma experiência automática e previsível. O barbeiro deve conseguir preparar a semana antecipadamente, selecionar quais dias efetivamente deseja trabalhar e definir quando a agenda será publicada. Ele deve continuar tendo total liberdade para não abrir determinados dias caso tenha compromissos pessoais. O sistema nunca deve pressupor que todos os dias de terça a domingo estarão automaticamente disponíveis.

Crie um sistema de preparação semanal da agenda. O barbeiro deve acessar uma tela denominada algo como “Próxima semana” ou “Preparar agenda”. Nessa tela devem aparecer os dias de terça-feira a domingo da semana seguinte, todos usando inicialmente a configuração padrão de 08:00, 09:00, 10:00 e 11:00. Ele deve conseguir ativar ou desativar cada dia com extrema facilidade. Por exemplo, se tiver compromisso na terça-feira, basta desativar terça. Se quiser atender apenas quarta, quinta, sexta e sábado, basta manter esses dias ativos. Deve existir uma opção “Usar configuração da semana passada” para evitar que ele precise configurar tudo novamente. Depois disso, o sistema deve mostrar claramente quantas vagas serão disponibilizadas. Se cinco dias estiverem ativos, mostrar algo como “20 vagas serão abertas”. O barbeiro deve poder programar o horário de abertura da agenda para a segunda-feira. Como atualmente ele costuma liberar entre 18:00 e 21:00, forneça opções rápidas como 18:00, 19:00, 20:00 e 21:00, além da possibilidade de escolher qualquer outro horário ou abrir manualmente.

Crie três estados claros para uma agenda semanal futura: “Em preparação”, quando apenas o barbeiro consegue visualizá-la e modificá-la; “Programada”, quando já foi configurada para abrir em determinada data e horário; e “Aberta”, quando os clientes já podem reservar. Quando estiver programada, o aplicativo do cliente deve mostrar algo como “A próxima agenda abre segunda-feira às 19:30” e permitir que o cliente ative lembrete. Quando chegar o horário configurado, a agenda deve abrir automaticamente sem nenhuma ação do barbeiro. Os clientes com notificações habilitadas devem receber uma notificação push informando que a agenda foi aberta. O barbeiro também deve ter a possibilidade de escolher se deseja enviar apenas uma notificação no momento da abertura ou também uma notificação alguns minutos antes. Não envie uma notificação prévia obrigatoriamente; deixe isso configurável.

O barbeiro deve poder bloquear um dia antes da publicação da agenda simplesmente deixando aquele dia indisponível. Não deve precisar informar aos clientes o motivo. Também deve conseguir bloquear ou retirar um dia enquanto a agenda ainda estiver em preparação. Se, por outro lado, ele inicialmente não disponibilizar um dia e posteriormente descobrir que poderá trabalhar, deve existir uma ação como “Liberar vagas deste dia”. Ao liberar novas vagas após a publicação original da semana, clientes compatíveis da lista de espera devem receber aviso automaticamente. Exemplo: sexta-feira inicialmente não estava disponível, mas na quinta-feira o barbeiro decide trabalhar na sexta. Ele abre quatro vagas e o sistema notifica os clientes que indicaram interesse em sexta-feira.

O aplicativo deve possuir duas experiências distintas dentro do mesmo projeto: experiência do cliente e experiência do barbeiro. Não crie dois aplicativos independentes. O mesmo código deve identificar o tipo de usuário e apresentar a interface correspondente. O cliente não deve visualizar opções administrativas. O barbeiro autenticado deve ter acesso ao painel operacional. O aplicativo precisa parecer extremamente leve e intuitivo, evitando qualquer aparência de sistema empresarial complexo.

A experiência do cliente deve ser construída em torno de uma Home dinâmica. A Home deve mudar conforme o estado atual do usuário. Se a agenda ainda não abriu, mostrar claramente quando abrirá, por exemplo “Próxima agenda: segunda-feira às 19:30”, com opção de ativar lembrete. Se a agenda estiver aberta e o cliente ainda não possuir reserva, mostrar imediatamente os dias disponíveis e facilitar o início do agendamento. Se toda a semana estiver lotada, não mostrar simplesmente “sem horários”; mostrar uma mensagem positiva como “A agenda desta semana lotou, mas você ainda pode conseguir uma vaga” e apresentar um botão destacado “Entrar na fila de espera”. Se o cliente já possuir um agendamento, a Home deve priorizar o próximo horário, mostrando data, hora, serviço, status, possibilidade de reagendar, cancelar, abrir rota e entrar em uma fila de troca caso prefira outro horário.

A navegação do cliente deve ser mínima. Use preferencialmente três áreas principais na barra inferior: “Início”, “Agendamentos” e “Barbearia”. Evite adicionar uma aba “Perfil” apenas por convenção. Dados pessoais e preferências podem ficar acessíveis dentro de “Agendamentos” ou “Barbearia”, ou por um avatar discreto na Home. A aba “Início” deve concentrar a jornada principal. A aba “Agendamentos” deve mostrar próximo atendimento e histórico. A aba “Barbearia” deve concentrar endereço, localização, WhatsApp, telefone, Instagram, horário de funcionamento, informações institucionais e demais detalhes que não precisam ocupar espaço na Home.

O fluxo de agendamento deve ser extremamente curto. Um cliente recorrente deve conseguir reservar em poucos segundos. Não obrigue o cliente a criar uma conta tradicional com e-mail e senha antes de agendar. No primeiro uso, solicite apenas as informações realmente necessárias, como nome e número de WhatsApp ou telefone. Esses dados devem ficar salvos com segurança para as próximas reservas. Caso seja necessário no futuro permitir recuperação em outro aparelho, a arquitetura deve estar preparada para autenticação por código enviado ao telefone, mas a experiência inicial deve evitar burocracia.

A seleção de serviço deve organizar de forma clara os aproximadamente 14 serviços atualmente existentes. Não mostre uma lista longa e confusa. Organize os serviços em categorias como “Mais escolhidos”, “Cabelo”, “Barba”, “Combos” e “Outros”, ajustando os nomes às opções reais da barbearia quando os dados forem cadastrados. O barbeiro deve conseguir escolher quais serviços aparecem como destaque. Cada serviço deve possuir nome, categoria, preço, descrição curta opcional, ativo ou inativo e posição de exibição. Nesta versão todos os serviços devem ocupar exatamente um slot de uma hora. A duração comercial do serviço não deve interferir na agenda. O sistema deve guardar essa separação internamente para permitir alterações futuras.

Depois que o cliente realizar alguns atendimentos, o aplicativo deve salvar seu histórico e facilitar reservas futuras. Exiba uma seção como “Seu de sempre” ou “Agendar novamente”, mostrando o último serviço ou o serviço mais frequente. Um cliente recorrente não deveria precisar navegar pelos 14 serviços toda semana. Se normalmente escolhe “Corte + Barba”, a Home pode mostrar diretamente “Seu de sempre: Corte + Barba” e um botão “Ver horários”. Permita também salvar preferências como serviço favorito, dias mais utilizados e faixa de horário preferida. Essas preferências não devem limitar o cliente, apenas acelerar a experiência.

Na seleção de data e horário, não use um calendário mensal como interface principal. Como a agenda é semanal e possui apenas quatro horários por manhã, apresente a semana de forma extremamente simples. Exemplo: quarta-feira, quinta-feira, sexta-feira, sábado e domingo, cada uma exibindo 08:00, 09:00, 10:00 e 11:00 conforme disponibilidade. Dias lotados podem aparecer como “Lotado”. Horários ocupados podem desaparecer ou ficar claramente desabilitados. O usuário deve compreender tudo em poucos segundos. A seleção de um horário deve realizar uma reserva temporária no backend para impedir que duas pessoas confirmem a mesma vaga durante a abertura concorrida da agenda. Como os horários atuais lotam em poucos minutos, trate concorrência como requisito crítico. Quando alguém toca em um slot, o servidor deve reservá-lo temporariamente por um curto período, como aproximadamente 60 segundos, enquanto o usuário confirma. Se outro cliente tentar selecionar o mesmo horário, o sistema deve informar imediatamente que aquele horário acabou de ser escolhido e atualizar a grade em tempo real. A criação definitiva do agendamento deve ocorrer de forma atômica no backend, nunca confiando apenas no estado mostrado no celular.

O banco de dados deve impedir tecnicamente overbooking. Não aceite dois agendamentos ativos para o mesmo dia e horário. Todas as validações relevantes devem ocorrer no servidor. O cliente jamais deve poder alterar manualmente preço, serviço, dia ou status enviando dados manipulados. O servidor deve validar o serviço selecionado, confirmar que o slot existe, verificar se o dia está publicado, confirmar que a vaga está livre e somente depois registrar a reserva.

Considere uma regra padrão de apenas um agendamento ativo por cliente em uma mesma semana, devido à escassez de vagas. Essa regra deve existir como configuração administrativa, permitindo ao barbeiro alterá-la ou criar manualmente exceções. O objetivo é evitar que um único cliente reserve vários horários apenas para decidir depois qual utilizar.

A tela de confirmação deve ser simples. Mostrar serviço, data, horário e valor, juntamente com os dados do cliente já preenchidos. Para clientes recorrentes, idealmente deve bastar selecionar o horário e confirmar. Após a reserva, mostre uma tela de sucesso elegante, com feedback visual e háptico, mensagem “Horário confirmado”, botão para adicionar ao calendário do dispositivo, opção de abrir a localização da barbearia e opção de visualizar o agendamento.

Crie um sistema completo de notificações push. As notificações são parte central do valor do aplicativo. O cliente deve poder receber aviso quando a agenda semanal abrir, lembrete antes do atendimento, aviso sobre cancelamentos ou reagendamentos, notificação de vaga liberada, oferta de vaga da fila de espera, alteração relevante por atraso e confirmação de alterações. Solicite permissão para notificações em um momento contextual, preferencialmente depois que o cliente compreender a utilidade do aplicativo ou após o primeiro agendamento, com uma explicação simples como “Quer que a Vieira avise quando a próxima agenda abrir e lembre você do seu horário?”.

Crie uma fila de espera inteligente. Quando a semana estiver lotada, o cliente deve poder entrar na fila. Não crie apenas uma fila global sem preferências. Pergunte em quais dias o cliente consegue comparecer e quais horários aceita. Como existem apenas quatro horários por dia, permita selecionar dias e horários específicos ou uma opção “Qualquer horário”. O cliente também deve selecionar o serviço desejado ou utilizar automaticamente seu serviço favorito. Armazene a data e a hora de entrada na fila para fins de prioridade.

Quando surgir uma vaga por cancelamento, não envie obrigatoriamente uma notificação simultânea para dezenas de pessoas criando outra corrida. Implemente um sistema de oferta sequencial configurável. O backend identifica os clientes da fila compatíveis com aquela vaga, ordena segundo as regras definidas e oferece a vaga ao primeiro cliente elegível. A notificação pode dizer “Surgiu uma vaga: quinta-feira às 09:00. Você tem alguns minutos para aceitar”. Durante o período da oferta, aquela vaga fica temporariamente reservada para esse cliente. Se ele aceitar, o agendamento é criado e a vaga é retirada da fila. Se ignorar ou recusar até o fim do prazo, a oferta passa automaticamente ao próximo cliente. O tempo da oferta deve ser configurável pelo barbeiro. Deixe inicialmente um valor razoável, como três a cinco minutos. O sistema deve registrar ofertas realizadas, aceitas, recusadas e expiradas para evitar notificações duplicadas ou loops.

A fila deve considerar compatibilidade. Se o cliente pediu apenas sábado, não deve receber uma vaga de quinta. Se pediu qualquer dia, pode receber. Se pediu somente 10:00 ou 11:00, não deve receber 08:00. A prioridade pode inicialmente usar ordem de entrada na fila entre candidatos compatíveis. Deixe essa política modular para futuras alterações.

Crie também uma “fila de troca”. Ela é diferente da fila de espera normal. A fila de espera serve para pessoas que não conseguiram nenhum agendamento. A fila de troca serve para clientes que já possuem uma vaga, mas gostariam de outro dia ou horário. Exemplo: o cliente possui quinta-feira às 08:00, mas prefere sábado. Ele não deve precisar cancelar sua vaga atual para tentar outra. Deve conseguir indicar “Quero trocar se surgir sábado”. Se surgir uma vaga compatível, o aplicativo oferece a troca. Se ele aceitar, a operação deve ocorrer de forma atômica: reservar o novo horário, mover o agendamento e somente depois liberar o antigo. Em seguida, a vaga antiga entra automaticamente no processo normal da fila de espera. Nunca libere o horário atual antes de garantir o novo.

Dê prioridade configurável entre fila de espera e fila de troca. Como regra inicial, considere priorizar clientes que ainda não possuem nenhum horário naquela semana antes de clientes que já possuem uma reserva, pois isso tende a distribuir as vagas de maneira mais justa. Entretanto, permita ao barbeiro alterar essa política futuramente.

Crie cancelamento e reagendamento de verdade. Atualmente o “reagendamento” na prática é apenas cancelamento porque a semana já está lotada. No novo aplicativo, se houver outra vaga livre, o cliente deve conseguir trocar de horário diretamente sem perder o que possui antes de garantir o novo. Se não houver nenhuma vaga, ofereça “Manter meu horário” e “Entrar na fila de troca”. O sistema não deve incentivar o usuário a cancelar precipitadamente.

Crie uma política de cancelamento configurável. Como ainda não existe uma regra definida pela barbearia, não imponha multas ou pagamentos nesta versão. O barbeiro deve conseguir escolher um prazo limite para cancelamento ou reagendamento automático, como 2, 4, 6, 12 ou 24 horas antes do atendimento, além de um valor personalizado. Antes do prazo, o cliente pode cancelar ou reagendar sozinho. Depois do prazo, o sistema pode mostrar uma opção como “Solicitar cancelamento” ou orientar contato com a barbearia, dependendo da configuração escolhida pelo barbeiro. Deixe a arquitetura preparada para adicionar no futuro sinal via Pix, taxa de ausência ou políticas diferentes para clientes com histórico de faltas, mas não implemente cobranças obrigatórias sem autorização.

O cancelamento deve ser tratado como uma oportunidade de recuperar automaticamente o horário. Quando um cliente cancela, a vaga deve ser liberada no backend e imediatamente iniciar o mecanismo da fila de espera. O barbeiro não deveria precisar pegar o celular e divulgar a vaga manualmente. O sistema deve tentar preencher automaticamente o horário liberado. Registre métricas de quantas vagas canceladas foram recuperadas por meio da fila.

Crie lembretes e confirmações de atendimento. O barbeiro deve poder configurar quando os clientes receberão lembretes. Um exemplo razoável é um lembrete no dia anterior e, se desejado, outro algumas horas antes. O cliente pode receber uma ação “Confirmar presença”. A confirmação deve aparecer na agenda do barbeiro. Um cliente que não confirmou não deve ter seu horário cancelado automaticamente por padrão. Mostre apenas um estado como “Ainda não confirmou” para ajudar o barbeiro a identificar risco de ausência. Futuramente essa regra pode ser tornada mais rígida.

Crie uma função extremamente importante chamada algo como “Estou atrasado” no painel do barbeiro. A necessidade vem de uma situação real: se um cliente anterior se atrasa, o barbeiro atualmente precisa enviar mensagens manualmente para os clientes seguintes informando que haverá um pequeno atraso. No aplicativo, o barbeiro deve poder tocar uma única vez em “Estou atrasado” e escolher opções rápidas como +10 minutos, +15 minutos, +20 minutos, +30 minutos ou valor personalizado. O sistema deve calcular quais clientes do restante daquela manhã serão afetados e enviar automaticamente notificações. O horário oficial do agendamento não deve ser alterado. Um cliente originalmente agendado às 10:00 continua possuindo agendamento às 10:00, mas o aplicativo pode mostrar “Previsão atual: aproximadamente 10:15”. As notificações devem dizer algo como “Pequeno atraso na agenda. Seu atendimento das 10:00 deve começar aproximadamente às 10:15”. O barbeiro deve receber uma confirmação simples como “3 clientes avisados”.

Permita atualizar ou normalizar o atraso. Caso o barbeiro recupere parte do tempo, pode alterar de +20 para +10 ou tocar em “Agenda normalizada”. Não envie notificações excessivas por mudanças mínimas. Crie um limiar razoável e configurável, por exemplo só notificar novamente quando houver alteração relevante de aproximadamente dez minutos ou mais. Se a agenda voltar ao normal, uma notificação positiva pode ser enviada apenas se realmente ajudar o cliente.

No painel do barbeiro, crie uma tela “Hoje” extremamente limpa. Como existem apenas quatro clientes na manhã, não crie dashboards empresariais poluídos. Mostre a data, quantidade de vagas ocupadas e os quatro horários em sequência. Cada item deve mostrar hora, nome do cliente, serviço e status de confirmação. Exemplo: 08:00 João, Corte, confirmado; 09:00 Alex, Corte + Barba, confirmado; 10:00 Pedro, Corte, confirmado; 11:00 Lucas, Combo, ainda não confirmou. A ação “Estou atrasado” deve estar facilmente acessível. Permita tocar em um cliente para abrir detalhes, WhatsApp, histórico e ações administrativas.

Crie uma tela semanal para o barbeiro. Mostre cada dia, ocupação e estado de forma direta, por exemplo “Quarta 4/4 – Lotado”, “Quinta 3/4 – 1 vaga”, “Sexta indisponível”. Mostre também a quantidade de pessoas na fila de espera naquela semana. Esse número é uma métrica importante porque hoje a demanda perdida é invisível para o barbeiro. Se 20 vagas foram preenchidas e ainda existem 14 pessoas na fila, o sistema deve deixar isso claro. O objetivo não é pressionar o barbeiro a atender mais, mas fornecer informação para que ele decida conscientemente se deseja abrir algum horário adicional.

Crie uma funcionalidade opcional para liberar horários extraordinários. Se houver muitas pessoas na fila e o barbeiro decidir excepcionalmente trabalhar em um período adicional ou em um dia inicialmente bloqueado, ele deve conseguir liberar novos slots manualmente. Como o funcionamento da tarde atualmente é por ordem de chegada, não crie agendamentos da tarde automaticamente nesta versão. Apenas deixe a arquitetura extensível para uma futura funcionalidade de “fila digital da tarde”, em que clientes poderiam entrar remotamente em uma fila por ordem de chegada, visualizar quantidade aproximada de pessoas à frente e receber aviso quando sua vez estiver próxima. Não implemente essa fila da tarde no MVP principal, mas organize o projeto de forma que ela possa ser adicionada futuramente sem grandes refatorações.

Crie um sistema de clientes e histórico. O barbeiro deve conseguir abrir o perfil de um cliente e visualizar nome, telefone, quantidade de atendimentos, serviços mais utilizados, último atendimento, próximos agendamentos, cancelamentos e faltas registradas. Permita observações internas opcionais como preferências de corte, por exemplo “costuma pedir degradê baixo”. Essas observações são privadas e nunca devem aparecer para o cliente. Não transforme isso em um CRM complexo. A finalidade é apenas ajudar o barbeiro a lembrar preferências e histórico.

Crie estados de atendimento como “Agendado”, “Confirmado”, “Concluído”, “Cancelado” e “Não compareceu”. Outros estados operacionais como “Em atendimento” podem existir se realmente forem úteis, mas não obrigue o barbeiro a atualizar constantemente o aplicativo enquanto trabalha. A experiência deve reduzir trabalho, não criar novas tarefas. O sistema pode marcar atendimento como concluído manualmente ou permitir uma rotina simples no fim do dia. O registro de faltas deve ser utilizado futuramente para identificar clientes problemáticos. Não mostre ao cliente nenhum “score” público de confiabilidade. Internamente, o barbeiro pode enxergar histórico de comparecimento. Deixe preparado para uma futura regra em que apenas clientes com faltas frequentes precisem pagar sinal ou confirmar antecipadamente.

Crie uma tela de gerenciamento dos serviços para o barbeiro. Ele deve conseguir criar, editar, ativar, desativar e reorganizar serviços. Cada serviço pode possuir nome, categoria, preço, descrição curta, posição de exibição e destaque. Os serviços devem permanecer separados dos slots da agenda. Para esta versão, qualquer serviço reservado deve ocupar uma hora. Deixe explicitamente preparado um campo futuro de duração estimada, mas não use essa duração para gerar disponibilidade até que o barbeiro opte por isso.

Crie uma área de configurações operacionais. Ela deve incluir dias padrão de trabalho, horários padrão 08:00, 09:00, 10:00 e 11:00, tempo padrão do slot de uma hora, horário preferido de publicação da agenda semanal, notificações, prazo de cancelamento, duração da oferta de uma vaga da fila, política de prioridade da fila, limite de reservas por cliente e outras regras importantes. Não sobrecarregue essa tela; agrupe as opções por seções e use valores padrão sensatos.

Crie um lembrete para o próprio barbeiro caso a próxima semana ainda não tenha sido preparada. Exemplo: na segunda-feira antes do horário em que ele normalmente abre a agenda, se ainda não houver uma programação pronta, enviar uma notificação como “A próxima semana ainda não está preparada. Revise os dias antes de abrir a agenda.” Se a agenda já estiver preparada, não envie a notificação.

Inclua métricas úteis no painel administrativo, mas mantenha-as secundárias. Não crie gráficos apenas por estética. Métricas realmente úteis incluem: vagas abertas naquela semana, vagas ocupadas, taxa de ocupação, quantidade de pessoas na fila, cancelamentos, vagas recuperadas automaticamente pela fila, quantidade de notificações úteis enviadas, clientes sem vaga e histórico de semanas. Uma futura tela de resumo pode mostrar algo como “20/20 vagas ocupadas”, “13 pessoas na fila”, “3 cancelamentos”, “3 vagas recuperadas automaticamente”. O objetivo dessas métricas é demonstrar valor operacional e demanda reprimida, não criar um sistema de BI.

A identidade visual deve ser inspirada na marca existente da Barbearia Vieira, que possui estética tradicional de barbearia, brasão, elementos clássicos, vermelho, dourado, preto e referências de barber shop. Entretanto, não transforme o aplicativo em uma interface temática cheia de madeira, tesouras, navalhas e ornamentos. A marca pode ser clássica; o produto deve parecer moderno, premium e extremamente limpo. Use a logo completa em splash, sobre a barbearia e contextos institucionais. Para navegação, cabeçalhos e ícone do aplicativo, prefira uma versão simplificada da identidade. Utilize fundo claro marfim ou branco quente, carvão/preto para estrutura, vermelho Vieira para principais ações e dourado apenas como detalhe premium. Evite excesso de dourado e excesso de vermelho. Use bastante espaço em branco, cards com cantos suaves, hierarquia tipográfica clara, ícones consistentes e animações discretas. O aplicativo deve transmitir profissionalismo, tradição e conveniência sem parecer antigo.

Dê atenção especial à experiência emocional. Quando a semana lotar, não use linguagem frustrante como “Nenhum horário disponível”. Prefira “A agenda desta semana lotou, mas podemos avisar se surgir uma vaga”. Quando surgir uma vaga, a mensagem deve parecer uma oportunidade positiva. Quando um horário for confirmado, utilize microanimação e feedback háptico discreto. Quando o barbeiro resolver alguma tarefa administrativa, confirme de forma objetiva sem modais desnecessários. Evite excesso de etapas, campos e telas intermediárias.

Implemente estados de carregamento profissionais usando skeletons em vez de textos como “Carregando serviços”. Trate estados vazios, erros de conexão e sincronização em tempo real. Em caso de internet instável durante uma abertura concorrida da agenda, jamais confirme uma reserva apenas localmente. Só mostre sucesso depois que o backend confirmar a criação. Caso o horário tenha sido ocupado enquanto o usuário tentava reservar, explique claramente e ofereça imediatamente os outros horários ainda disponíveis ou a fila de espera.

Implemente segurança corretamente. Use autenticação segura para o barbeiro, sessão persistente e, depois do primeiro login, suporte opcional a biometria do dispositivo. Proteja tabelas administrativas com Row Level Security. Clientes nunca devem conseguir consultar informações pessoais de outros clientes. O cliente só pode visualizar e alterar seus próprios agendamentos e preferências. Observações internas do barbeiro nunca devem estar acessíveis ao usuário final. Operações críticas de agenda, fila, troca, cancelamento e criação de reserva devem ocorrer em funções ou transações seguras no backend.

Estruture o banco de dados com entidades semelhantes a: staff ou users administrativos; customers; services; weekly_schedules; schedule_days; slots; appointments; waitlist_entries; swap_waitlist_entries ou fila de troca; waitlist_offers; customer_preferences; customer_notes; notification_tokens; notifications; blocked_days ou availability_exceptions; settings e eventualmente appointment_events para histórico de mudanças. Não é obrigatório usar exatamente esses nomes, mas mantenha responsabilidades bem separadas. Registre timestamps e histórico suficiente para auditar cancelamentos, reagendamentos, ofertas de fila e alterações administrativas.

Use um identificador de semana ou intervalo semanal para organizar as agendas. As vagas não devem existir eternamente de maneira genérica sem relação com uma agenda publicada. O sistema precisa saber a qual semana cada configuração pertence, quais dias foram disponibilizados e quando aquela agenda foi aberta. Isso permite consultar histórico, duplicar a semana anterior e medir demanda.

A arquitetura de notificações deve suportar agendamentos futuros, lembretes, eventos em tempo real e ofertas temporárias. Uma oferta de fila precisa expirar corretamente mesmo se o aplicativo do cliente estiver fechado. Não confie em timers locais do celular para lógica crítica. Controle expirações e disponibilidade no backend. Se o cliente abrir a notificação depois que a oferta expirou, mostre uma mensagem adequada e, se ainda estiver na fila, mantenha-o nela conforme a regra definida.

Implemente deep links. Ao tocar em “Agenda aberta”, o cliente deve entrar diretamente na tela de horários. Ao tocar em uma oferta de vaga, abrir diretamente a tela da oferta. Ao tocar em lembrete de atendimento, abrir o detalhe do agendamento. Ao tocar em aviso de atraso, mostrar seu agendamento atualizado. Não faça o usuário navegar manualmente desde a Home depois de tocar numa notificação contextual.

Na área “Agendamentos” do cliente, mostre primeiro o próximo atendimento. Exiba data, horário, serviço, valor e status. Ofereça ações “Reagendar”, “Cancelar”, “Como chegar” e, quando aplicável, “Quero outro horário”. Abaixo, mostre histórico de atendimentos anteriores com opção “Agendar novamente”. Evite transformar o histórico em uma lista excessivamente detalhada.

A área “Barbearia” deve mostrar identidade institucional, endereço, mapa, botão de rota, telefone, WhatsApp, Instagram, horário de funcionamento e observações relevantes. O acesso administrativo não deve competir visualmente com o cliente. Se for necessário disponibilizá-lo pelo mesmo aplicativo, deixe-o discreto ou identifique automaticamente contas administrativas durante o login.

No primeiro uso, crie um onboarding extremamente curto ou dispense onboarding completo. Caso utilize onboarding, limite a poucas telas que comuniquem benefícios concretos, como “Saiba exatamente quando a agenda abre”, “Entre na fila se a semana lotar” e “Receba aviso se surgir uma vaga”. Não faça apresentação longa sobre a barbearia antes de permitir usar o aplicativo.

Crie acessibilidade adequada: botões com tamanhos de toque confortáveis, contraste suficiente, suporte a tamanho de fonte do sistema quando possível, labels para leitores de tela e comunicação de estados que não dependa exclusivamente de cor. O app deve funcionar bem em celulares Android de entrada e intermediários, mantendo animações leves e carregamento rápido.

O projeto deve ser organizado profissionalmente. Separe componentes reutilizáveis, hooks, serviços, lógica de domínio, validações, tipos e camada de dados. Não concentre toda a lógica em componentes de tela. Use TypeScript. Crie esquema de banco e migrations versionadas. Centralize temas, tipografia, espaçamentos, ícones e componentes em um pequeno design system. Garanta tratamento consistente de datas e timezone da barbearia, evitando bugs por UTC ou mudança de dia. Todas as datas de agenda devem ser interpretadas no fuso local da barbearia.

Prepare dados fictícios ou seed para demonstração. Crie clientes, os quatro horários do dia, uma semana quase lotada, algumas entradas na fila, um cliente em fila de troca e um exemplo de atraso. Isso permitirá demonstrar o aplicativo ao barbeiro imediatamente sem precisar cadastrar tudo manualmente. Os dados fictícios devem ser facilmente removíveis antes da versão real.

A demonstração deve possibilitar um cenário completo: primeiro mostrar o barbeiro preparando a próxima semana, desativando terça-feira por compromisso e deixando quarta a domingo ativos; depois programando a abertura para segunda às 19:30; em seguida simular a abertura automática e uma notificação para os clientes; mostrar um cliente escolhendo serviço e reservando um dos quatro horários; mostrar outro cliente chegando depois que a agenda já lotou e entrando na fila de espera; simular o primeiro cliente cancelando; demonstrar a oferta automática daquela vaga para a fila; mostrar o cliente aceitando; depois, na tela “Hoje” do barbeiro, simular um atraso de 15 minutos e demonstrar que todos os clientes afetados foram avisados automaticamente. Esse fluxo de demonstração é extremamente importante porque revela o valor do produto melhor do que simplesmente navegar pelas telas.

Mantenha como princípios centrais do produto: o barbeiro não precisa do aplicativo para conseguir clientes; ele precisa do aplicativo para administrar melhor uma demanda que já existe. Portanto, qualquer recurso que não reduza trabalho, aumente controle, recupere horários, melhore a experiência do cliente ou revele demanda reprimida deve ser tratado como secundário. Não adicione funcionalidades genéricas de marketplace, rede social, chat interno, loja, sistema de pontos, assinatura, inteligência artificial, estoque, contabilidade completa ou dezenas de relatórios apenas para tornar o app maior. A primeira versão deve dominar perfeitamente o ciclo “preparar agenda → abrir automaticamente → reservar → lembrar → cancelar/reagendar → recuperar vaga pela fila → atender”.

O aplicativo deve ser desenvolvido já com espaço arquitetural para futuras evoluções, mas sem implementá-las desnecessariamente. As principais evoluções futuras possíveis são: duração variável por serviço para permitir mais clientes quando o barbeiro desejar; fila digital da tarde por ordem de chegada; sinal via Pix ou política contra faltas; regras especiais para clientes com histórico ruim; agendamentos recorrentes; mais de um barbeiro; múltiplas unidades; programa de fidelidade; previsão estimada de espera; integração com WhatsApp; relatórios financeiros e outros recursos. Não deixe essas possibilidades complicarem a experiência atual.

Ao concluir o desenvolvimento, o aplicativo deve oferecer uma experiência em que um cliente recorrente consiga abrir o app, visualizar que a agenda abriu, escolher “Seu de sempre”, tocar em um dos horários disponíveis e confirmar em poucos segundos. Um cliente que chegou tarde deve conseguir entrar na fila em vez de simplesmente perder a semana. Um cliente que já tem horário deve conseguir manter sua reserva enquanto procura uma alternativa. O barbeiro deve conseguir preparar a próxima semana em poucos toques, escolher quando ela abrirá, ver os quatro clientes de cada manhã, bloquear dias, liberar vagas extras, receber dados de demanda, processar cancelamentos automaticamente por meio da fila e avisar todos os clientes afetados por um atraso usando apenas uma ação. Todo o produto deve transmitir a sensação de que a agenda trabalha sozinha para ele.

Antes de considerar o aplicativo pronto, teste cuidadosamente os seguintes cenários: dois clientes tentando reservar o mesmo horário simultaneamente; cliente fechando o aplicativo durante a confirmação; cancelamento de uma vaga com pessoas na fila; oferta da fila expirando; cliente aceitando uma oferta no último segundo; cliente em fila de troca recebendo nova vaga; troca que libera a antiga vaga para outro cliente; barbeiro bloqueando um dia ainda não publicado; barbeiro tentando bloquear um dia com reservas existentes; liberação extraordinária de um dia; mudança do horário de abertura antes da publicação; falha de internet durante a abertura da agenda; push aberto depois que uma vaga já expirou; alteração de atraso; agenda voltando ao normal; cliente tentando criar mais reservas do que o limite permitido; cliente tentando acessar dados de outro cliente e qualquer tentativa de overbooking. O sistema deve permanecer consistente em todos esses casos.

O resultado final deve parecer um produto real pronto para ser utilizado diariamente pela Barbearia Vieira, e não apenas um protótipo visual. Priorize simplicidade, confiabilidade, excelente experiência mobile, rapidez, automação e clareza. Sempre que existir escolha entre adicionar mais recursos ou reduzir o número de ações necessárias para uma tarefa importante, prefira reduzir as ações.
```
