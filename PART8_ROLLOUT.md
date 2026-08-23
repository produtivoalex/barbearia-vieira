# Parte 8 — Storage, testes e rollout

## Entregue localmente

- Migration `20260823040000_multi_tenant_storage.sql` cria o bucket `barbearia-media`.
- O caminho obrigatório é `<barbearia_id>/<logo|banner|fotos>/<arquivo>`.
- Leitura é pública somente quando a barbearia está publicada e ativa.
- Upload, atualização e remoção exigem membro com papel `proprietario` ou `gestor` no tenant do caminho.
- Tipos aceitos: JPEG, PNG e WebP; limite por arquivo: 10 MiB.
- `scripts/multi_tenant_rollout_audit.sql` verifica preenchimento, cruzamentos de tenant, membros inválidos e objetos fora do contrato.

## Sequência de publicação

1. Confirmar o projeto Supabase vinculado e revisar o dry-run.
2. Aplicar migrations até `20260823040000`.
3. Executar `multi_tenant_audit.sql` e `multi_tenant_rollout_audit.sql`.
4. Criar uma segunda barbearia de teste e um membro gestor sintético.
5. Validar que o gestor consegue escrever apenas em seu prefixo e que o cliente consegue ler apenas mídias de tenants publicados.
6. Testar regressão da Vieira: login, catálogo, agenda, reserva, fila, notificações e painel do barbeiro.
7. Gerar development build; depois gerar preview somente após a validação funcional.

## Estado e bloqueios

- As migrations e auditorias foram criadas localmente.
- Nenhuma migration desta Parte 8 foi aplicada remotamente nesta sessão.
- A criação da segunda barbearia e os testes RLS reais dependem de executar no projeto Supabase correto com credenciais autorizadas.
- Não há segredo ou valor de credencial registrado neste documento.
