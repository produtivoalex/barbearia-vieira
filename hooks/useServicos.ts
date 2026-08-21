import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type CategoriaServico =
  | 'todos'
  | 'cortes'
  | 'combos'
  | 'barba'
  | 'sobrancelha'
  | 'limpeza_de_pele';

export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  duracao_minutos: number;
  ativo: boolean;
  categoria?: CategoriaServico;
}

export const CATEGORIAS_CONFIG: { id: CategoriaServico; label: string; iconeEmoji: string }[] = [
  { id: 'todos', label: 'Todos', iconeEmoji: '✨' },
  { id: 'cortes', label: 'Cortes', iconeEmoji: '✂️' },
  { id: 'combos', label: 'Combos VIP', iconeEmoji: '👑' },
  { id: 'barba', label: 'Barba', iconeEmoji: '🧔' },
  { id: 'sobrancelha', label: 'Sobrancelha', iconeEmoji: '📐' },
  { id: 'limpeza_de_pele', label: 'Limpeza de Pele', iconeEmoji: '🧴' },
];

export function deduzirCategoria(nome: string): CategoriaServico {
  const n = nome.toLowerCase();
  if (n.includes('combo')) return 'combos';
  if (n.includes('barba')) return 'barba';
  if (n.includes('sobrancelha')) return 'sobrancelha';
  if (n.includes('limpeza') || n.includes('pele')) return 'limpeza_de_pele';
  return 'cortes';
}

/** Catálogo oficial e completo com todos os 14 serviços reais da Barbearia Vieira */
export const SERVICOS_REAIS_CATALOGO: Servico[] = [
  // Cortes
  {
    id: 'srv-corte-degrade',
    nome: 'Corte degradê',
    descricao: 'Fade moderno na régua com acabamento limpo e alinhado',
    preco: 20.0,
    duracao_minutos: 30,
    ativo: true,
    categoria: 'cortes',
  },
  {
    id: 'srv-corte-navalhado',
    nome: 'Corte navalhado',
    descricao: 'Acabamento ultra preciso na navalhete com contorno impecável',
    preco: 23.0,
    duracao_minutos: 35,
    ativo: true,
    categoria: 'cortes',
  },
  {
    id: 'srv-corte-social',
    nome: 'Corte Social',
    descricao: 'Corte clássico e elegante executado na tesoura e máquina',
    preco: 18.0,
    duracao_minutos: 30,
    ativo: true,
    categoria: 'cortes',
  },
  {
    id: 'srv-social-maquina',
    nome: 'Social todo na máquina',
    descricao: 'Praticidade, agilidade e uniformidade com pentes na máquina',
    preco: 15.0,
    duracao_minutos: 20,
    ativo: true,
    categoria: 'cortes',
  },

  // Combos VIP
  {
    id: 'srv-combo-1',
    nome: 'Combo 1',
    descricao: 'Corte navalhado + barba desenhada + sobrancelha',
    preco: 45.0,
    duracao_minutos: 60,
    ativo: true,
    categoria: 'combos',
  },
  {
    id: 'srv-combo-2',
    nome: 'Combo 2',
    descricao: 'Corte degradê + barba desenhada + sobrancelha',
    preco: 43.0,
    duracao_minutos: 60,
    ativo: true,
    categoria: 'combos',
  },
  {
    id: 'srv-combo-3',
    nome: 'Combo 3',
    descricao: 'Corte social + barba desenhada + sobrancelha',
    preco: 40.0,
    duracao_minutos: 60,
    ativo: true,
    categoria: 'combos',
  },
  {
    id: 'srv-combo-4',
    nome: 'Combo 4',
    descricao: 'Corte navalhado + barba desenhada',
    preco: 35.0,
    duracao_minutos: 50,
    ativo: true,
    categoria: 'combos',
  },
  {
    id: 'srv-combo-5',
    nome: 'Combo 5',
    descricao: 'Corte degradê + barba desenhada',
    preco: 33.0,
    duracao_minutos: 50,
    ativo: true,
    categoria: 'combos',
  },
  {
    id: 'srv-combo-6',
    nome: 'Combo 6',
    descricao: 'Social + barba desenhada',
    preco: 30.0,
    duracao_minutos: 45,
    ativo: true,
    categoria: 'combos',
  },

  // Barba
  {
    id: 'srv-barba-desenhada',
    nome: 'Barba desenhada',
    descricao: 'Alinhamento e contorno milimétrico da barba na navalha',
    preco: 15.0,
    duracao_minutos: 30,
    ativo: true,
    categoria: 'barba',
  },
  {
    id: 'srv-barba-simples',
    nome: 'Barba simples',
    descricao: 'Raspada toda a barba com rapidez e suavidade',
    preco: 8.0,
    duracao_minutos: 20,
    ativo: true,
    categoria: 'barba',
  },

  // Sobrancelha
  {
    id: 'srv-sobrancelha',
    nome: 'Sobrancelha',
    descricao: 'Design e alinhamento de sobrancelha masculino com navalha',
    preco: 10.0,
    duracao_minutos: 15,
    ativo: true,
    categoria: 'sobrancelha',
  },

  // Limpeza de Pele
  {
    id: 'srv-limpeza-pele',
    nome: 'Limpeza de pele',
    descricao: 'Remoção de impurezas, esfoliação facial e revitalização',
    preco: 20.0,
    duracao_minutos: 30,
    ativo: true,
    categoria: 'limpeza_de_pele',
  },
];

export function useServicos(categoriaFiltro: CategoriaServico = 'todos') {
  const [servicos, setServicos] = useState<Servico[]>(SERVICOS_REAIS_CATALOGO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarServicos = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('preco', { ascending: false });

      if (error) {
        setErro(error.message);
        // Mantém os serviços reais do catálogo local como fallback
        setServicos(SERVICOS_REAIS_CATALOGO);
      } else if (data && data.length > 0) {
        const enriquecidos: Servico[] = data.map((item: any) => ({
          ...item,
          categoria: item.categoria || deduzirCategoria(item.nome),
        }));
        setServicos(enriquecidos);
      } else {
        setServicos(SERVICOS_REAIS_CATALOGO);
      }
    } catch {
      setServicos(SERVICOS_REAIS_CATALOGO);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarServicos();
  }, [carregarServicos]);

  const servicosFiltrados = servicos.filter((item) => {
    if (categoriaFiltro === 'todos') return true;
    const cat = item.categoria || deduzirCategoria(item.nome);
    return cat === categoriaFiltro;
  });

  return {
    servicos: servicosFiltrados,
    todosServicos: servicos,
    carregando,
    erro,
    recarregar: carregarServicos,
  };
}
