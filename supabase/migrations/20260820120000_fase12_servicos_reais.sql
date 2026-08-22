-- Migração: Atualização oficial com os 14 serviços reais da Barbearia Vieira

-- Adiciona coluna de categoria se ainda não existir
alter table public.servicos add column if not exists categoria text;

-- Garante constraint unique no nome do serviço para suportar upsert
alter table public.servicos drop constraint if exists servicos_nome_unique;
alter table public.servicos add constraint servicos_nome_unique unique (nome);

-- Deleta serviços legados/fictícios anteriores
delete from public.servicos where nome in (
  'Corte de Cabelo',
  'Barba Completa',
  'Combo Cabelo + Barba',
  'Combo (Cabelo + Barba)',
  'Pézinho / Acabamento'
);

-- Insere ou atualiza o catálogo oficial dos 14 serviços reais
insert into public.servicos (nome, descricao, preco, duracao_minutos, ativo, categoria)
values
  -- 1. Cortes (4)
  ('Corte degradê', 'Fade moderno na régua com acabamento limpo e alinhado', 20.00, 30, true, 'cortes'),
  ('Corte navalhado', 'Acabamento ultra preciso na navalhete com contorno impecável', 23.00, 35, true, 'cortes'),
  ('Corte Social', 'Corte clássico e elegante executado na tesoura e máquina', 18.00, 30, true, 'cortes'),
  ('Social todo na máquina', 'Praticidade, agilidade e uniformidade com pentes na máquina', 15.00, 20, true, 'cortes'),

  -- 2. Combos VIP (6)
  ('Combo 1', 'Corte navalhado + Barba desenhada + Sobrancelha', 45.00, 60, true, 'combos'),
  ('Combo 2', 'Corte degradê + Barba desenhada + Sobrancelha', 43.00, 60, true, 'combos'),
  ('Combo 3', 'Corte social + Barba desenhada + Sobrancelha', 40.00, 60, true, 'combos'),
  ('Combo 4', 'Corte navalhado + Barba desenhada', 35.00, 50, true, 'combos'),
  ('Combo 5', 'Corte degradê + Barba desenhada', 33.00, 50, true, 'combos'),
  ('Combo 6', 'Corte social + Barba desenhada', 30.00, 45, true, 'combos'),

  -- 3. Barba (2)
  ('Barba desenhada', 'Alinhamento e contorno milimétrico da barba na navalha', 15.00, 30, true, 'barba'),
  ('Barba simples', 'Raspada toda a barba com rapidez e suavidade', 8.00, 20, true, 'barba'),

  -- 4. Sobrancelha (1)
  ('Sobrancelha', 'Design e alinhamento de sobrancelha masculino com navalha', 10.00, 15, true, 'sobrancelha'),

  -- 5. Limpeza de Pele (1)
  ('Limpeza de pele', 'Remoção de impurezas, esfoliação facial e revitalização profunda', 20.00, 30, true, 'limpeza_de_pele')
on conflict (nome) do update set
  descricao = excluded.descricao,
  preco = excluded.preco,
  duracao_minutos = excluded.duracao_minutos,
  ativo = excluded.ativo,
  categoria = excluded.categoria;

