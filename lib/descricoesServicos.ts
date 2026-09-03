import { TipoServicoId } from '@/components/IlustracaoServico';

export interface SugestaoServico {
  tipoId: TipoServicoId;
  palavrasChave: string[];
  nomeSugerido: string;
  descricao: string;
  duracaoPadrao: number;
  categoria: 'cortes' | 'barba' | 'combos' | 'quimicas' | 'cuidados' | 'outros';
}

export const BANCO_DESCRICOES_SERVICOS: SugestaoServico[] = [
  // ── Cortes Especiais (Altíssima especificidade) ──
  {
    tipoId: 'corte_infantil',
    palavrasChave: [
      'infantil', 'inf', 'infa', 'kids', 'kid', 'crianca', 'criança', 'criancas', 'crianças',
      'bebe', 'bebê', 'bebes', 'bebês', 'junior', 'menino', 'garoto', 'pequeno',
    ],
    nomeSugerido: 'Corte Infantil Kids',
    descricao: 'Atendimento paciente e especializado para crianças, com cortes modernos, ambiente acolhedor e técnicas que deixam os pequenos confortáveis.',
    duracaoPadrao: 30,
    categoria: 'cortes',
  },
  {
    tipoId: 'corte_moicano',
    palavrasChave: [
      'moicano', 'moic', 'undercut', 'underc', 'mohawk', 'moicano fade',
      'moicano disfarçado', 'moicano disfarcado', 'moicanozinho',
    ],
    nomeSugerido: 'Moicano / Undercut Moderno',
    descricao: 'Estilo audacioso e marcante com laterais disfarçadas ou raspadas e faixa central volumosa com textura e atitude.',
    duracaoPadrao: 35,
    categoria: 'cortes',
  },
  {
    tipoId: 'corte_cacheado',
    palavrasChave: [
      'cacheado', 'cachos', 'cacho', 'cach', 'afro', 'black', 'black power',
      'crespo', 'ondulado', 'sponge', 'nudred', 'texturizacao', 'texturização',
    ],
    nomeSugerido: 'Corte Cacheado / Black Power',
    descricao: 'Técnica e finalização especializada para definição de cachos, valorização do volume e caimento natural de cabelos afro e crespos.',
    duracaoPadrao: 35,
    categoria: 'cortes',
  },
  {
    tipoId: 'desenho_cabelo',
    palavrasChave: [
      'desenho', 'desen', 'hair tattoo', 'freestyle', 'free', 'risco', 'risquinho',
      'riscado', 'arte no cabelo', 'listra no cabelo', 'tribal',
    ],
    nomeSugerido: 'Desenho no Cabelo / Freestyle',
    descricao: 'Arte capilar e designs exclusivos esculpidos com lâmina e máquina, criando riscos ou desenhos personalizados no corte.',
    duracaoPadrao: 25,
    categoria: 'cortes',
  },
  {
    tipoId: 'acabamento',
    palavrasChave: [
      'pezinho', 'pez', 'acabamento', 'acab', 'lineup', 'line up', 'contorno',
      'alinhar pezinho', 'nuca', 'costeleta', 'perfil', 'refino',
    ],
    nomeSugerido: 'Pezinho / Acabamento na Navalha',
    descricao: 'Definição milimétrica dos contornos da nuca, costeletas e testa com lâmina de alta precisão e toalha refrescante.',
    duracaoPadrao: 15,
    categoria: 'cortes',
  },

  // ── Coloração & Descoloração Específica ──
  {
    tipoId: 'nevou',
    palavrasChave: [
      'nevou', 'nevo', 'nev', 'cabelo branco', 'fio branco', 'platinado nevou',
      'nevado', 'nevada', 'todo branco', 'totalmente branco',
    ],
    nomeSugerido: 'Nevou (Cabelo Todo Branco)',
    descricao: 'Descoloração global de alto padrão com efeito nevou 100% branco uniforme, neutralização matizadora e proteção antifios.',
    duracaoPadrao: 90,
    categoria: 'quimicas',
  },
  {
    tipoId: 'platinado',
    palavrasChave: [
      'platinado', 'platina', 'plat', 'descoloracao', 'descoloração', 'descolorir',
      'loiro platinado', 'loiro', 'loira', 'blonde',
    ],
    nomeSugerido: 'Platinado / Loiro Global',
    descricao: 'Descoloração e matização para efeito platinado sofisticado e homogêneo, com tratamento protetor para manutenção da fibra capilar.',
    duracaoPadrao: 90,
    categoria: 'quimicas',
  },
  {
    tipoId: 'luzes_masculinas',
    palavrasChave: [
      'luzes', 'luz', 'mechas', 'mecha', 'reflexo', 'reflexos',
      'luzes masculinas', 'mechas loiras', 'touca',
    ],
    nomeSugerido: 'Luzes / Mechas Masculinas',
    descricao: 'Clareamento estratégico em mechas para iluminação do corte masculino, garantindo contraste moderno, naturalidade e estilo.',
    duracaoPadrao: 60,
    categoria: 'quimicas',
  },
  {
    tipoId: 'micropigmentacao',
    palavrasChave: [
      'micropigmentacao', 'micropigmentação', 'micro', 'micro capilar',
      'calvicie', 'calvície', 'entradas', 'camuflagem capilar', 'smp', 'falhas cabelo',
    ],
    nomeSugerido: 'Micropigmentação Capilar',
    descricao: 'Procedimento de alta precisão para reprodução de folículos capilares, preenchendo falhas, entradas e calvície com naturalidade.',
    duracaoPadrao: 120,
    categoria: 'cuidados',
  },
  {
    tipoId: 'pigmentacao_capilar',
    palavrasChave: [
      'pigmentacao', 'pigmentação', 'pigmentar', 'pigmentada', 'pigment',
      'tintura', 'tinta', 'cobertura de brancos', 'tingir cabelo', 'coloracao capilar',
    ],
    nomeSugerido: 'Pigmentação Capilar / Barba',
    descricao: 'Camuflagem natural de fios brancos e realce da densidade dos cabelos e contornos com pigmento especial de longa duração.',
    duracaoPadrao: 25,
    categoria: 'quimicas',
  },

  // ── Barba & Tratamentos de Barba ──
  {
    tipoId: 'hot_towel',
    palavrasChave: [
      'toalha quente', 'hot towel', 'hot', 'shave', 'ritual toalha',
      'barba com toalha', 'barbear tradicional',
    ],
    nomeSugerido: 'Shave com Toalha Quente',
    descricao: 'Ritual clássico e relaxante com aplicação de toalha aquecida, óleos aromáticos essenciais e lâmina de barbear tradicional sem irritação.',
    duracaoPadrao: 30,
    categoria: 'barba',
  },
  {
    tipoId: 'barba_completa',
    palavrasChave: [
      'barba completa', 'barboterapia', 'terapia da barba', 'barba premium',
      'spa da barba', 'tratamento barba', 'barba vip', 'barboterap',
    ],
    nomeSugerido: 'Barba Completa / Barboterapia',
    descricao: 'Tratamento completo com toalha quente, alinhamento na lâmina, esfoliação facial, massagem relaxante e hidratação com óleos nobres.',
    duracaoPadrao: 35,
    categoria: 'barba',
  },
  {
    tipoId: 'barba_desenhada',
    palavrasChave: [
      'barba', 'barba desenhada', 'barba modelada', 'desenhar barba', 'modelar barba',
      'alinhamento de barba', 'barba alinhada', 'barba navalha',
    ],
    nomeSugerido: 'Barba Desenhada / Modelada',
    descricao: 'Alinhamento sob medida das linhas da bochecha e pescoço com lâmina afiada, criando contornos simétricos e elegantes.',
    duracaoPadrao: 25,
    categoria: 'barba',
  },
  {
    tipoId: 'barba_simples',
    palavrasChave: [
      'barba simples', 'aparar barba', 'acertar barba', 'baixar barba',
      'barba rapida', 'barba rápida', 'aparar', 'acerto de barba',
    ],
    nomeSugerido: 'Barba Simples / Aparo',
    descricao: 'Aparo rápido e uniforme do volume da barba na máquina ou tesoura com alinhamento prático de linhas para o dia a dia.',
    duracaoPadrao: 15,
    categoria: 'barba',
  },

  // ── Combos & Premium ──
  {
    tipoId: 'combo_vip',
    palavrasChave: [
      'combo', 'completo', 'cabelo e barba', 'corte e barba', 'cabelo + barba',
      'corte + barba', 'barba e cabelo', 'barba + corte', 'vip', 'pacote', 'completao', 'completão',
    ],
    nomeSugerido: 'Combo Cabelo + Barba VIP',
    descricao: 'A experiência completa combinando corte personalizado de cabelo e barboterapia relaxante com toalha quente e finalização premium.',
    duracaoPadrao: 60,
    categoria: 'combos',
  },

  // ── Estética Masculina ──
  {
    tipoId: 'sobrancelha',
    palavrasChave: [
      'sobrancelha', 'sobrancelhas', 'sobran', 'pinça', 'pinca',
      'design de sobrancelha', 'design sobrancelha', 'limpar sobrancelha',
    ],
    nomeSugerido: 'Design de Sobrancelha',
    descricao: 'Alinhamento e limpeza do design de sobrancelha masculina na navalha ou pinça, valorizando a harmonia do olhar sem excessos.',
    duracaoPadrao: 10,
    categoria: 'cuidados',
  },
  {
    tipoId: 'limpeza_de_pele',
    palavrasChave: [
      'limpeza de pele', 'limpeza pele', 'limp', 'mascara', 'máscara', 'black mask',
      'esfoliação', 'esfoliacao', 'cravos', 'facial', 'skincare', 'pele',
    ],
    nomeSugerido: 'Limpeza de Pele / Black Mask',
    descricao: 'Remoção profunda de impurezas e cravos, esfoliação facial refrescante e máscara de hidratação intensa para revitalizar a pele.',
    duracaoPadrao: 30,
    categoria: 'cuidados',
  },

  // ── Cortes Clássicos (Genéricos no final da lista) ──
  {
    tipoId: 'corte_navalhado',
    palavrasChave: [
      'navalhado', 'navalha', 'naval', 'zero navalha', 'corte navalhado',
      'fade navalhado', 'lâmina', 'lamina', 'careca navalhado',
    ],
    nomeSugerido: 'Corte Navalhado',
    descricao: 'Acabamento ultra rente e liso com lâmina de precisão na nuca e laterais, garantindo durabilidade máxima do corte.',
    duracaoPadrao: 35,
    categoria: 'cortes',
  },
  {
    tipoId: 'social_maquina',
    palavrasChave: [
      'maquina', 'máquina', 'maq', 'militar', 'buzz cut', 'raspado', 'raspada',
      'pente unico', 'pente único', 'corte maquina', 'corte máquina',
    ],
    nomeSugerido: 'Corte na Máquina / Militar',
    descricao: 'Corte prático e uniforme com pentes ajustados de máquina, finalizado com pezinho alinhado e lavagem rápida.',
    duracaoPadrao: 20,
    categoria: 'cortes',
  },
  {
    tipoId: 'corte_degrade',
    palavrasChave: [
      'degrade', 'degradê', 'degrad', 'fade', 'fad', 'disfarcado', 'disfarçado',
      'low fade', 'mid fade', 'high fade', 'taper', 'taper fade', 'skin fade',
    ],
    nomeSugerido: 'Corte Degradê / Fade',
    descricao: 'Degradê moderno com transição milimétrica suave e precisa da pele ao topo, alinhamento impecável e perfil alinhado.',
    duracaoPadrao: 30,
    categoria: 'cortes',
  },
  {
    tipoId: 'corte_social',
    palavrasChave: [
      'social', 'tesoura', 'tesour', 'classico', 'clássico', 'executivo',
      'tradicional', 'pente corrido', 'pente corrida', 'corte social',
    ],
    nomeSugerido: 'Corte Social na Tesoura',
    descricao: 'Corte tradicional e sofisticado esculpido na tesoura, respeitando o caimento natural dos fios com acabamento refinado.',
    duracaoPadrao: 30,
    categoria: 'cortes',
  },
];

/**
 * Sugere inteligentemente descrição, duração, categoria e ilustração baseado no nome digitado.
 * Usa pontuação por afinidade para garantir que termos específicos (ex: 'nevou', 'infantil', 'kids')
 * NUNCA sejam sobrescritos por termos genéricos (ex: 'platinado', 'corte').
 */
export function sugerirDescricaoPorNome(nome: string): SugestaoServico | null {
  if (!nome || nome.trim().length < 2) return null;
  const normalizado = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  let melhorSugestao: SugestaoServico | null = null;
  let melhorScore = 0;

  for (const item of BANCO_DESCRICOES_SERVICOS) {
    for (const kw of item.palavrasChave) {
      const kwNorm = kw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

      let score = 0;

      // 1. Igualdade exata (Score 100)
      if (normalizado === kwNorm) {
        score = 100;
      }
      // 2. O texto digitado contém a palavra-chave exata (Score 85)
      // Ex: "corte infantil completo" contém "infantil"
      else if (normalizado.includes(kwNorm)) {
        score = 85 + Math.min(10, kwNorm.length);
      }
      // 3. A palavra-chave começa com o que o usuário digitou (Score 75)
      // Ex: "inf" -> "infantil", "nev" -> "nevou"
      else if (kwNorm.startsWith(normalizado) && normalizado.length >= 2) {
        score = 75 + (normalizado.length / kwNorm.length) * 10;
      }
      // 4. A palavra-chave contém o que o usuário digitou (Score 50)
      else if (kwNorm.includes(normalizado) && normalizado.length >= 3) {
        score = 50;
      }

      if (score > melhorScore) {
        melhorScore = score;
        melhorSugestao = item;
      }
    }
  }

  return melhorScore >= 50 ? melhorSugestao : null;
}
