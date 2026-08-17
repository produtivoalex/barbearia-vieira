# [Barbearia Vieira]

## Comportamento

**Cautela > velocidade.** Para tarefa trivial, use bom senso.

- **Pense antes de codar.** Diga suas suposições. Se há mais de uma interpretação,
  mostre as opções — não escolha em silêncio. Se estiver confuso, pare e pergunte.
- **Simplicidade.** Código mínimo que resolve o problema. Sem feature não pedida,
  sem abstração pra uso único, sem "flexibilidade" especulativa.
- **Cirúrgico.** Toque só no que precisa. Não "melhore" código adjacente nem
  formatação. Combine com o estilo existente. Remova só órfãos que sua mudança
  criou — nunca código morto pré-existente sem pedir.
- **Critério de sucesso.** Tarefa vaga → meta verificável. Em tarefa multi-passo,
  declare o plano e como verificar cada etapa antes de começar.
- **Reporte decisões fora do pedido.** Ao fim da tarefa, liste o que você
  decidiu, mudou ou trocou que eu não pedi, tradeoffs que precisou fazer, e
  qualquer coisa que eu deva saber. Sugira o que vale virar regra permanente,
  mas não edite o Antigravity.md sozinho.

## Stack

- React Native + Expo (expo-router), SDK [54], TypeScript
- Supabase (banco, auth, edge functions)
- RevenueCat (assinaturas)
- AsyncStorage (persistência local)

## Decisões de arquitetura

- Backend é só Supabase, sem servidor próprio. Lógica sensível mora em Edge Functions.
  (Por quê: Supabase cobre banco + auth + funções; servidor próprio é infra à toa.)
- Fluxo Onboarding → Paywall → Auth, nessa ordem.
  (Por quê: o usuário se engaja e vê o paywall antes de criar conta — converte melhor.)
- Dados de antes do cadastro ficam no AsyncStorage e migram pro banco após o signup.
  (Por quê: deixa a pessoa usar o app sem conta e não perde o que ela fez.)
- Limite free vs premium é verificado no servidor (Edge Function), nunca no client.
  (Por quê: client é burlável; limite tem que ser imposto fora dele.)
- Chamadas a APIs externas e modelos de IA passam por Edge Functions do Supabase,
  nunca direto do client. Chave de API nunca vai no app.
  (Por quê: chave embutida no app é facilmente extraída do bundle; o servidor
  ainda controla custo e abuso.)

## Comandos

- Rodar: `npx expo start --tunnel`
- Limpar cache: `npx expo start --tunnel --clear`
- Instalar dependência: `npx expo install <pkg>`
- Checar tipos: `npx tsc --noEmit`
- Lint: `npx eslint .`

## Estrutura

- `app/` — telas (expo-router). `(pre-auth)/` e `(app)/`
- `components/` — componentes reutilizáveis
- `hooks/` — acesso a dados
- `lib/` — config do Supabase e RevenueCat
- `theme/` — tokens do design system (cor, tipografia, espaçamento)

## Convenções

- Estilo SEMPRE pelos tokens do design system. Não hardcode cor/tamanho na tela.
- Ícones com lucide-react-native. NUNCA emojis na UI.
- Sem `any`. Tipos simples e legíveis.

## Regras do projeto (IMPORTANTE)

- **Salvar progresso**: Leia sempre o arquivo `PROGRESS.md` ao iniciar e atualize-o antes de encerrar seu turno para manter o "save state" atualizado para as próximas sessões.
- Sem mock data — dados reais ou estado de lista vazia.
- Quando houver mockup/imagem, replique fielmente: layout, espaçamentos, fontes,
  cores, raios e sombras. Não aproxime nem simplifique sem pedir.
- Uma fase por vez. Mostrar o plano e aguardar aprovação antes de executar.
- Não instale bibliotecas novas sem aprovação prévia.
- Antes de terminar qualquer tarefa, rode `npx tsc --noEmit` e o lint, e corrija
  o que aparecer.

## Variáveis de ambiente (.env)

- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_REVENUECAT_API_KEY
