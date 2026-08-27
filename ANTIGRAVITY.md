# [Na Régua]

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

- React Native + Expo (expo-router), SDK 54, TypeScript
- Supabase (banco PostgreSQL, auth, RLS, real-time, Edge Functions)
- AsyncStorage (persistência local)

## Decisões de arquitetura e regras de negócio

- **Fonte da Verdade:** Leia e siga rigorosamente o arquivo [`PRODUTO.md`](./PRODUTO.md).
- Backend é exclusivamente Supabase, sem servidor próprio. Lógica sensível e concorrência moram no PostgreSQL / Edge Functions.
- O app é exclusivo da Barbearia Vieira: sem paywall para usuários finais (decisão B2B).
- Grade fixa matutina (08:00 às 12:00, 4 slots de 1h: 08:00, 09:00, 10:00, 11:00, Terça a Domingo). Tarde por ordem de chegada física (fora do app v1).
- Concorrência tratada via reservas temporárias e transações atômicas no banco para impedir overbooking.
- Fila de espera sequencial com oferta temporizada (3-5 min) e Fila de troca atômica sem perda prévia de vaga.
- Atrasos comunicados em 1 toque via botão "Estou atrasado" no painel do barbeiro.

## Comandos

- Rodar: `npx expo start --tunnel`
- Limpar cache: `npx expo start --tunnel --clear`
- Instalar dependência: `npx expo install <pkg>`
- Checar tipos: `npx tsc --noEmit`
- Lint: `npx eslint .`

## Estrutura

- `app/` — telas (expo-router). `(pre-auth)/` e `(app)/` (`(tabs)/` e `(barbeiro)/`)
- `components/` — componentes reutilizáveis
- `hooks/` — acesso a dados e regras de negócio
- `lib/` — cliente e configs do Supabase
- `theme/` — tokens do design system (cor, tipografia, espaçamento, sombras, radii)
- `scripts/` — scripts utilitários e `schema.sql` do banco

## Convenções

- Estilo SEMPRE pelos tokens do design system (`theme/`). Não hardcode cor/tamanho na tela.
- Ícones com `lucide-react-native`. NUNCA emojis na UI.
- Sem `any`. Tipos simples e legíveis com TypeScript estrito.

## Regras do projeto (IMPORTANTE)

- **Salvar progresso**: Leia sempre o arquivo `PROGRESS.md` ao iniciar e atualize-o antes de encerrar seu turno para manter o "save state" atualizado para as próximas sessões.
- **Especificação de Produto**: Consulte `PRODUTO.md` para qualquer dúvida sobre fluxos, regras da agenda, filas e comportamento das telas.
- Sem mock data — dados reais ou estado de lista vazia.
- Uma fase por vez. Mostrar o plano e aguardar aprovação antes de executar.
- Não instale bibliotecas novas sem aprovação prévia.
- Antes de terminar qualquer tarefa, rode `npx tsc --noEmit` e o lint, e corrija o que aparecer.

## Variáveis de ambiente (.env)

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB`
