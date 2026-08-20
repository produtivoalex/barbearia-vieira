-- Migração Fase 12: Atualização com os 14 serviços reais da Barbearia Vieira

-- Adiciona coluna de categoria se ainda não existir
alter table public.servicos add column if not exists categoria text;

-- Deleta serviços fictícios anteriores ou atualiza
delete from public.servicos where nome in ('Corte de Cabelo', 'Barba Completa', 'Combo Cabelo + Barba', 'Pézinho / Acabamento');

-- Insere o catálogo oficial dos 14 serviços reais
insert into public.servicos (nome, descricao, preco, duracao_minutos, ativo, categoria)
values
  -- Cortes
  ('Corte degradê', 'Degradê na régua com fade moderno e acabamento limpo', 20.00, 30, true, 'cortes'),
  ('Corte navalhado', 'Acabamento ultra preciso na navalhete e contorno alinhado', 23.00, 35, true, 'cortes'),
  ('Corte Social', 'Corte tradicional e elegante executado na tesoura e máquina', 18.00, 30, true, 'cortes'),
  ('Social todo na máquina', 'Praticidade, agilidade e uniformidade com pentes na máquina', 15.00, 20, true, 'cortes'),

  -- Combos
  ('Combo 1', 'Corte navalhado + barba desenhada + sobrancelha', 45.00, 60, true, 'combos'),
  ('Combo 2', 'Corte degradê + barba desenhada + sobrancelha', 43.00, 60, true, 'combos'),
  ('Combo 3', 'Corte social + barba desenhada + sobrancelha', 40.00, 50, true, 'combos'),
  ('Combo 4', 'Corte navalhado + barba desenhada', 35.00, 45, true, 'combos'),
  ('Combo 5', 'Corte degradê + barba desenhada', 33.00, 45, true, 'combos'),
  ('Combo 6', 'Social + barba desenhada', 30.00, 40, true, 'combos'),

  -- Barbas
  ('Barba desenhada', 'Alinhamento e contorno milimétrico da barba na navalha', 15.00, 25, true, 'barba'),
  ('Barba simples', 'Raspada toda a barba com rapidez e suavidade', 5.00, 15, true, 'barba'),

  -- Sobrancelha
  ('Sobrancelha', 'Design e alinhamento de sobrancelha masculino com pinça e navalha', 10.00, 15, true, 'sobrancelha'),

  -- Limpeza de Pele
  ('Limpeza de pele', 'Remoção profunda de impurezas faciais, esfoliação e revitalização', 20.00, 25, true, 'limpeza_de_pele')
on conflict do nothing;
