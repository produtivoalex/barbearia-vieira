-- Atualização dos dados oficiais da Barbearia Vieira (São José do Divino - PI)
update public.barbearias
set
  nome = 'Barbearia Vieira',
  descricao = 'Tradição, estilo e o melhor atendimento para o seu visual. Cortes modernos, barba na navalha e cuidados masculinos de alto nível.',
  cidade = 'São José do Divino',
  bairro = 'Brancas',
  endereco = 'Rua Jeova Monte, 120, Brancas',
  telefone = '(86) 98190-7478',
  whatsapp = '(86) 98190-7478',
  publicada = true,
  status = 'ativa',
  tema = jsonb_build_object(
    'primary', '#CBA14A',
    'secondary', '#141416',
    'background', '#0F0F10',
    'card', '#18181B',
    'text', '#FFFFFF',
    'accent', '#F0D17D',
    'frameColor', '#CBA14A',
    'nomeTema', 'Ouro Imperial'
  ),
  modo_agenda = 'continua',
  dias_janela_agendamento = 14,
  latitude = -3.8118,
  longitude = -41.8318,
  atualizado_em = timezone('utc'::text, now())
where slug = 'barbearia-vieira';
