-- SCRIPT PARA EXECUTAR NO SUPABASE DASHBOARD -> SQL EDITOR
-- Atualiza as coordenadas exatas da Barbearia Vieira no Piauí

begin;

update public.barbearias
set
  cidade = 'São José do Divino',
  bairro = 'Brancas',
  endereco = 'Rua Jeova Monte, 120, Brancas',
  latitude = -3.8118,
  longitude = -41.8318,
  atualizado_em = timezone('utc'::text, now())
where slug = 'barbearia-vieira';

-- Valida o resultado
select id, slug, nome, cidade, bairro, endereco, latitude, longitude
from public.barbearias
where slug = 'barbearia-vieira';

commit;
