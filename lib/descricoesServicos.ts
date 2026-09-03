export interface SugestaoServico {
  tipoId: string;
  palavrasChave: string[];
  nomeSugerido: string;
  descricao: string;
  duracaoPadrao: number;
  categoria: 'cortes' | 'barba' | 'combos' | 'quimicas' | 'cuidados' | 'outros';
}

export const BANCO_DESCRICOES_SERVICOS: SugestaoServico[] = [
  {
    tipoId: 'corte_degrade',
    palavrasChave: ['degrade', 'fade', 'disfarcado', 'degradê', 'low fade', 'mid fade', 'high fade', 'taper', 'skin fade', 'degrade navalhado'],
    nomeSugerido: 'Corte Degradê / Fade',
    descricao: 'Degradê moderno com transição suave, acabamento na navalha e alinhamento milimétrico.',
    duracaoPadrao: 30,
    categoria: 'cortes',
  },
  {
    tipoId: 'corte_navalhado',
    palavrasChave: ['navalhado', 'navalha', 'lâmina', 'lamina', 'zero', 'careca', 'raspado'],
    nomeSugerido: 'Corte Navalhado',
    descricao: 'Acabamento ultra preciso com lâmina e contorno impecável, garantindo máxima durabilidade.',
    duracaoPadrao: 35,
    categoria: 'cortes',
  },
  {
    tipoId: 'corte_social',
    palavrasChave: ['social', 'tesoura', 'classico', 'clássico', 'executivo', 'tradicional', 'pente corrida', 'pente corrido'],
    nomeSugerido: 'Corte Social na Tesoura',
    descricao: 'Corte clássico e elegante com caimento natural, acabamento refinado na tesoura e nuca limpa.',
    duracaoPadrao: 30,
    categoria: 'cortes',
  },
  {
    tipoId: 'social_maquina',
    palavrasChave: ['maquina', 'máquina', 'raspada', 'militar', 'buzz cut', 'pente unico', 'pente único'],
    nomeSugerido: 'Corte na Máquina',
    descricao: 'Corte prático e uniforme com pentes ajustados, acabamento no pezinho e lavagem rápida.',
    duracaoPadrao: 20,
    categoria: 'cortes',
  },
  {
    tipoId: 'barba_desenhada',
    palavrasChave: ['barba', 'barboterapia', 'terapia', 'toalha quente', 'barba desenhada', 'barba modelada', 'barba alinhada'],
    nomeSugerido: 'Barboterapia / Barba Desenhada',
    descricao: 'Alinhamento com toalha quente, óleos essenciais, massagem facial e finalização com balm premium.',
    duracaoPadrao: 30,
    categoria: 'barba',
  },
  {
    tipoId: 'barba_simples',
    palavrasChave: ['barba simples', 'aparar barba', 'acertar barba', 'volume barba', 'aparar'],
    nomeSugerido: 'Barba Simples / Aparo',
    descricao: 'Aparo de volume, alinhamento rápido das linhas e hidratação com óleo pós-barba.',
    duracaoPadrao: 15,
    categoria: 'barba',
  },
  {
    tipoId: 'combo_vip',
    palavrasChave: ['combo', 'completo', 'cabelo e barba', 'corte e barba', 'cabelo + barba', 'corte + barba', 'vip', 'premium', 'completao', 'completão'],
    nomeSugerido: 'Combo Cabelo + Barba VIP',
    descricao: 'Experiência completa com corte personalizado, barboterapia com toalha quente e finalização premium.',
    duracaoPadrao: 60,
    categoria: 'combos',
  },
  {
    tipoId: 'sobrancelha',
    palavrasChave: ['sobrancelha', 'pinça', 'pinca', 'design sobrancelha', 'sobrancelhas', 'limpar sobrancelha'],
    nomeSugerido: 'Design de Sobrancelha',
    descricao: 'Alinhamento e limpeza do design de sobrancelha na navalha ou pinça, valorizando o olhar.',
    duracaoPadrao: 10,
    categoria: 'cuidados',
  },
  {
    tipoId: 'limpeza_de_pele',
    palavrasChave: ['limpeza de pele', 'mascara', 'máscara', 'black mask', 'esfoliação', 'esfoliacao', 'cravos', 'pele'],
    nomeSugerido: 'Limpeza de Pele & Black Mask',
    descricao: 'Remoção profunda de cravos e impurezas, esfoliação facial e hidratação relaxante.',
    duracaoPadrao: 30,
    categoria: 'cuidados',
  },
  {
    tipoId: 'platinado',
    palavrasChave: ['platinado', 'nevou', 'descoloracao', 'descoloração', 'luzes', 'mechas', 'reflexo', 'branco', 'loiro'],
    nomeSugerido: 'Platinado / Nevou',
    descricao: 'Descoloração global de alto padrão com neutralização de tons amarelados e hidratação protetora antifios.',
    duracaoPadrao: 90,
    categoria: 'quimicas',
  },
  {
    tipoId: 'pigmentacao',
    palavrasChave: ['pigmentacao', 'pigmentação', 'tintura', 'tinta', 'coloracao', 'coloração', 'cabelo preto', 'tingir'],
    nomeSugerido: 'Pigmentação de Cabelo / Barba',
    descricao: 'Preenchimento e realce dos fios do cabelo ou barba, disfarçando falhas com acabamento super natural.',
    duracaoPadrao: 25,
    categoria: 'quimicas',
  },
  {
    tipoId: 'selagem',
    palavrasChave: ['selagem', 'progressiva', 'botox', 'alisamento', 'relaxamento', 'redutor', 'alisar'],
    nomeSugerido: 'Selagem / Alinhamento Térmico',
    descricao: 'Alinhamento dos fios, redução de volume e controle do frizz com brilho intenso e toque macio.',
    duracaoPadrao: 60,
    categoria: 'quimicas',
  },
  {
    tipoId: 'infantil',
    palavrasChave: ['infantil', 'kids', 'crianca', 'criança', 'bebe', 'bebê', 'garoto'],
    nomeSugerido: 'Corte Infantil Kids',
    descricao: 'Atendimento paciente e especializado para crianças, com cortes modernos e ambiente acolhedor.',
    duracaoPadrao: 30,
    categoria: 'cortes',
  },
  {
    tipoId: 'pezinho',
    palavrasChave: ['pezinho', 'acabamento', 'contorno', 'nuca', 'frente', 'alinhar', 'risquinho', 'risco'],
    nomeSugerido: 'Pezinho / Acabamento',
    descricao: 'Alinhamento dos contornos da nuca, costeletas e testa na navalha com máxima precisão.',
    duracaoPadrao: 15,
    categoria: 'cortes',
  },
  {
    tipoId: 'hidratacao',
    palavrasChave: ['hidratacao', 'hidratação', 'nutricao', 'nutrição', 'lavagem', 'massagem capilar', 'lavar'],
    nomeSugerido: 'Hidratação & Lavagem Especial',
    descricao: 'Tratamento profundo dos fios e couro cabeludo para restaurar a maciez, força e brilho natural.',
    duracaoPadrao: 20,
    categoria: 'cuidados',
  },
];

export function sugerirDescricaoPorNome(nome: string): SugestaoServico | null {
  if (!nome || nome.trim().length < 2) return null;
  const normalizado = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Match exato ou de substring nas palavras-chave
  for (const item of BANCO_DESCRICOES_SERVICOS) {
    for (const kw of item.palavrasChave) {
      const kwNorm = kw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
      if (normalizado.includes(kwNorm) || kwNorm.includes(normalizado)) {
        return item;
      }
    }
  }
  return null;
}
