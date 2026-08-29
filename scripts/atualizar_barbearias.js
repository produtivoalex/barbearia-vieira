const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fnvenkcpucpuucovunzf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZudmVua2NwdWNwdXVjb3Z1bnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTMwMTgsImV4cCI6MjEwMjU2OTAxOH0.Oh24sXRZu5yV8KXe9tFHfGlSpmSpaffWBx_dDHMXVVA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Atualizando Barbearia Vieira...');
  const { data: dataV, error: errorV } = await supabase
    .from('barbearias')
    .update({
      descricao: 'Tradição, estilo e o melhor atendimento para o seu visual. Cortes modernos, barba na navalha e cuidados masculinos de alto nível.',
      endereco: 'Rua: Jeova Monte, 120, CEP: 64245-000',
      bairro: 'Brancas',
      cidade: 'São José do Divino - PI',
    })
    .eq('slug', 'barbearia-vieira')
    .select();

  console.log('Resultado Vieira:', { dataV, errorV });

  console.log('Atualizando Barbearia Teste...');
  const { data: dataT, error: errorT } = await supabase
    .from('barbearias')
    .update({
      descricao: 'Teste',
      logo_url: null,
      banner_url: null,
    })
    .eq('slug', 'barbearia-teste-multi-tenant')
    .select();

  console.log('Resultado Teste:', { dataT, errorT });
}

run();
