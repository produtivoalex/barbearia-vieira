# Inventário Multi-Tenant — Parte 1

Data: 23/08/2026

## Resultado

Parte 1 concluída. Nenhuma migration foi aplicada e nenhum código operacional foi alterado nesta etapa.

## Diagnóstico estrutural

- A entidade operacional atual é o barbeiro (`barbeiro_id`), não uma barbearia.
- `perfis.role` aceita somente `cliente` e `barbeiro`; não existe vínculo explícito entre usuário e estabelecimento.
- `servicos` não possui `barbearia_id` e os nomes/preços são globais.
- `agendamentos` possui cliente, barbeiro e serviço, mas não possui tenant explícito.
- Agendas, slots, fila, atrasos, avisos, reajustes, bloqueios e equipe dependem direta ou indiretamente do barbeiro.
- As policies atuais autorizam principalmente por `auth.uid() = barbeiro_id` ou por `role = 'barbeiro'`.
- O front-end consulta tabelas diretamente via Supabase; não há camada de API própria para introduzir antes da migração.

## Tabelas atuais e ação planejada

| Tabela | Dependência atual | Ação multi-tenant |
|---|---|---|
| `perfis` | usuário global e `role` | manter global; usar tabela de membros |
| `servicos` | global | adicionar `barbearia_id`; unicidade por tenant |
| `agendamentos` | `cliente_id`, `barbeiro_id`, `servico_id` | adicionar tenant e validar os três vínculos |
| `agendas_semanais` | `barbeiro_id` | adicionar tenant |
| `dias_agenda` | agenda semanal | herdar/validar tenant pela agenda |
| `slots_agenda` | `barbeiro_id` e dia | adicionar tenant e validar agenda |
| `fila_espera` | cliente e serviço global | adicionar tenant |
| `fila_troca` | agendamento | validar tenant pelo agendamento |
| `ofertas_fila` | fila e slot | validar tenant pelos relacionamentos |
| `atrasos_agenda` | `barbeiro_id` e data | adicionar tenant |
| `avisos_funcionamento` | `barbeiro_id` e data | adicionar tenant |
| `reajustes_precos` | `barbeiro_id` | adicionar tenant |
| `bloqueios_clientes` | `barbeiro_id` | adicionar tenant; bloqueio não global |
| `equipe_barbearia` | hoje usa `barbeiro_id` como proprietário | remodelar para `barbearia_id` e membro opcional |
| `agenda_lembretes` | agenda e cliente | adicionar/validar tenant |
| `lembretes_agendados` | agendamento | adicionar/validar tenant |
| `notifications` | usuário | adicionar tenant opcional para notificações operacionais |
| `notification_tokens` | usuário/dispositivo | permanecer global por usuário |

## Dependências de banco

### RPCs e triggers que exigem revisão

- `reservar_slot`
- `aceitar_oferta_fila`
- `oferecer_proxima_vaga`
- `disparar_oferta_apos_cancelamento`
- `agendar_lembretes_agendamento`
- `confirmar_presenca`
- `notificar_agenda_aberta`
- `registrar_atraso_agenda`
- `notificar_todos_clientes`
- trigger `on_auth_user_created`
- trigger `agendamento_cancelado_oferece_vaga`
- trigger `tg_agendar_lembretes`
- trigger `tg_notificar_agenda_aberta`

### Migrations existentes que formam o contrato atual

- `20260818000000_schema_completo.sql`
- `20260820090000_fase9_notificacoes.sql`
- `20260820100000_fase10_crons_e_ajustes.sql`
- `20260820120000_fase12_servicos_reais.sql`
- `20260822170000_fase17_oauth_trigger.sql`
- `20260822180000_fase18_painel_barbeiro.sql`
- `20260822190000_fase19_avisos_e_encaixes.sql`
- `20260822200000_fase20_reajustes_e_opcoes_avancadas.sql`
- `20260822210000_fase21_email_perfil_e_melhorias.sql`
- `20260822220000_fase22_politicas_agendas_e_slots.sql`

## Dependências do aplicativo

### Hooks que precisam receber contexto de barbearia

- `hooks/useServicos.ts`
- `hooks/useAgendamento.ts`
- `hooks/useAgendaSemanal.ts`
- `hooks/usePainelBarbeiro.ts`
- `hooks/useMeusAgendamentos.ts`
- `hooks/usePushNotifications.ts`

### Telas com consultas diretas que exigirão filtro/contexto

- `app/(app)/(tabs)/index.tsx`
- `app/(app)/(tabs)/agenda.tsx`
- `app/(app)/(tabs)/servicos/index.tsx`
- `app/(app)/agendamento/horario.tsx`
- `app/(app)/agendamento/confirmacao.tsx`
- `app/(app)/lista-espera/index.tsx`
- `app/(app)/lista-espera/oferta.tsx`
- `app/(app)/notificacoes.tsx`
- `app/(app)/(barbeiro)/hoje.tsx`
- `app/(app)/(barbeiro)/semana.tsx`
- `app/(app)/(barbeiro)/clientes.tsx`
- `app/(app)/(barbeiro)/mais.tsx`
- `app/(app)/(barbeiro)/preparar-agenda.tsx`
- `app/(app)/(barbeiro)/opcoes-avancadas.tsx`

### Edge Functions

- `supabase/functions/process-notifications/index.ts`
- `supabase/functions/auto-open-agenda/index.ts`

Ambas precisarão carregar o `barbearia_id` dos registros processados e não usar consultas globais.

## Desenho da migration base

### Novas tabelas

#### `barbearias`

Campos mínimos: `id`, `slug`, `nome`, `descricao`, `telefone`, `whatsapp`, `email`, `cidade`, `bairro`, `endereco`, `latitude`, `longitude`, `logo_url`, `banner_url`, `fotos`, `tema`, `status`, `publicada`, `criado_em`, `atualizado_em`.

#### `barbearia_membros`

Campos mínimos: `id`, `barbearia_id`, `usuario_id`, `papel`, `ativo`, `criado_em`.

Papéis iniciais: `proprietario`, `gestor`, `barbeiro`, `atendente`.

Restrições: `unique (barbearia_id, usuario_id)` e foreign keys com `on delete cascade`.

### Alterações não destrutivas da Parte 2

Adicionar `barbearia_id` inicialmente como nullable em:

```text
servicos, agendamentos, agendas_semanais, slots_agenda,
fila_espera, fila_troca, ofertas_fila, atrasos_agenda,
avisos_funcionamento, reajustes_precos, bloqueios_clientes,
equipe_barbearia, agenda_lembretes, notifications
```

O backfill será feito na Parte 2. Somente após auditoria os campos poderão se tornar `not null`.

### Funções de autorização planejadas

- `usuario_e_membro(p_barbearia_id uuid)`
- `usuario_e_gestor(p_barbearia_id uuid)`
- `usuario_e_barbeiro(p_barbearia_id uuid)`

Essas funções serão criadas na Parte 3, junto com as novas policies. Não substituir as policies atuais antes do backfill e dos testes.

## Consultas de auditoria para a Parte 2

Antes de tornar qualquer coluna obrigatória, executar contagens de:

```sql
select count(*) from public.servicos where barbearia_id is null;
select count(*) from public.agendamentos where barbearia_id is null;
select count(*) from public.agendas_semanais where barbearia_id is null;
select count(*) from public.slots_agenda where barbearia_id is null;
select count(*) from public.fila_espera where barbearia_id is null;
```

Também validar inconsistências:

```text
agendamento.servico_id pertence a outra barbearia;
agendamento.barbeiro_id não é membro da barbearia;
slot não pertence à agenda da mesma barbearia;
serviço ativo sem barbearia;
barbeiro operacional sem vínculo de membro.
```

## Decisões desta etapa

- Não criar API Node separada no MVP; manter Supabase REST/RPC/Edge Functions.
- Não colocar `barbearia_id` diretamente em `perfis` como vínculo único; usar `barbearia_membros` para permitir múltiplos vínculos no futuro.
- Não remover `perfis.role` ainda; manter compatibilidade até a Parte 3.
- Não ativar PostGIS nem alterar o banco remoto na Parte 1; isso será tratado junto da vitrine/busca quando necessário.

## Próxima etapa

Parte 2 — criar a migration estrutural, criar o tenant da Vieira, vincular o proprietário e executar o backfill com colunas ainda nullable.
