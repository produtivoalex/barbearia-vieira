-- Migration: Atualização das Coordenadas Oficiais da Barbearia Vieira (São José do Divino - PI)
-- Local: Rua Jeová Monte, 120, Brancas, São José do Divino - PI (CEP: 64245-000)
-- Coordenadas de alta precisão: Latitude -3.8118, Longitude -41.8318

update public.barbearias
set
  cidade = 'São José do Divino',
  bairro = 'Brancas',
  endereco = 'Rua Jeova Monte, 120, Brancas',
  latitude = -3.8118,
  longitude = -41.8318,
  atualizado_em = timezone('utc'::text, now())
where slug = 'barbearia-vieira';
