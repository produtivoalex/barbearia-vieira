import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType, ViewStyle } from 'react-native';
import { Colors } from '@/theme';

export type TipoServicoId =
  // ── Cortes Clássicos ──
  | 'corte_degrade'
  | 'corte_navalhado'
  | 'corte_social'
  | 'social_maquina'
  // ── Cortes Especiais ──
  | 'corte_infantil'
  | 'corte_moicano'
  | 'corte_cacheado'
  | 'acabamento'
  // ── Coloração & Tratamento Capilar ──
  | 'nevou'
  | 'platinado'
  | 'pigmentacao_capilar'
  | 'luzes_masculinas'
  // ── Barba ──
  | 'barba_desenhada'
  | 'barba_simples'
  | 'barba_completa'
  | 'hot_towel'
  // ── Combos & Premium ──
  | 'combo_vip'
  | 'desenho_cabelo'
  // ── Estética Masculina ──
  | 'sobrancelha'
  | 'limpeza_de_pele'
  | 'micropigmentacao';

export const IMAGENS_SERVICOS: Record<TipoServicoId, ImageSourcePropType> = {
  // ── Cortes Clássicos ──
  corte_degrade: require('@/assets/servicos/corte-social.png'),
  corte_navalhado: require('@/assets/servicos/corte-navalhado.png'),
  corte_social: require('@/assets/servicos/corte-degrade.png'),
  social_maquina: require('@/assets/servicos/barba-desenhada.png'),
  // ── Cortes Especiais ──
  corte_infantil: require('@/assets/servicos/corte-infantil.png'),
  corte_moicano: require('@/assets/servicos/corte-moicano.png'),
  corte_cacheado: require('@/assets/servicos/corte-cacheado.png'),
  acabamento: require('@/assets/servicos/acabamento.png'),
  // ── Coloração & Tratamento Capilar ──
  nevou: require('@/assets/servicos/nevou.png'),
  platinado: require('@/assets/servicos/platinado.png'),
  pigmentacao_capilar: require('@/assets/servicos/pigmentacao-capilar.png'),
  luzes_masculinas: require('@/assets/servicos/luzes-masculinas.png'),
  // ── Barba ──
  barba_desenhada: require('@/assets/servicos/social-maquina.png'),
  barba_simples: require('@/assets/servicos/sobrancelha.png'),
  barba_completa: require('@/assets/servicos/barba-completa.png'),
  hot_towel: require('@/assets/servicos/hot-towel.png'),
  // ── Combos & Premium ──
  combo_vip: require('@/assets/servicos/limpeza-pele.png'),
  desenho_cabelo: require('@/assets/servicos/desenho-cabelo.png'),
  // ── Estética Masculina ──
  sobrancelha: require('@/assets/servicos/barba-simples.png'),
  limpeza_de_pele: require('@/assets/servicos/combo-vip.png'),
  micropigmentacao: require('@/assets/servicos/micropigmentacao.png'),
};

export const BIBLIOTECA_SERVICOS: {
  id: TipoServicoId;
  label: string;
  categoria: string;
  descricao: string;
}[] = [
  // ── Cortes Clássicos ──
  {
    id: 'corte_degrade',
    label: 'Degradê / Fade',
    categoria: 'cortes',
    descricao: 'Corte moderno com fade na régua e transição suave.',
  },
  {
    id: 'corte_navalhado',
    label: 'Corte Navalhado',
    categoria: 'cortes',
    descricao: 'Acabamento ultra preciso com lâmina e contorno impecável.',
  },
  {
    id: 'corte_social',
    label: 'Social Clássico',
    categoria: 'cortes',
    descricao: 'Estilo clássico na tesoura e máquina com perfil alinhado.',
  },
  {
    id: 'social_maquina',
    label: 'Corte na Máquina',
    categoria: 'cortes',
    descricao: 'Prático e rápido com um ou dois pentes uniformes.',
  },
  // ── Cortes Especiais ──
  {
    id: 'corte_infantil',
    label: 'Corte Infantil',
    categoria: 'cortes',
    descricao: 'Corte especializado para crianças, com carinho e cuidado.',
  },
  {
    id: 'corte_moicano',
    label: 'Moicano / Undercut',
    categoria: 'cortes',
    descricao: 'Estilo arrojado com laterais raspadas e topo volumoso.',
  },
  {
    id: 'corte_cacheado',
    label: 'Corte Cacheado / Black',
    categoria: 'cortes',
    descricao: 'Técnica especializada para cabelos cacheados e afro.',
  },
  {
    id: 'acabamento',
    label: 'Acabamento / Lineup',
    categoria: 'cortes',
    descricao: 'Refino de degradê, nuca e entradas com navalha.',
  },
  // ── Coloração & Tratamento ──
  {
    id: 'nevou',
    label: 'Nevou (Cabelo Branco)',
    categoria: 'coloracao',
    descricao: 'Descoloração total para o visual nevou todo branco.',
  },
  {
    id: 'platinado',
    label: 'Platinado / Loiro',
    categoria: 'coloracao',
    descricao: 'Descoloração e tonalização para o efeito platinado.',
  },
  {
    id: 'pigmentacao_capilar',
    label: 'Pigmentação Capilar',
    categoria: 'coloracao',
    descricao: 'Cobertura de fios brancos com pigmento de alta fixação.',
  },
  {
    id: 'luzes_masculinas',
    label: 'Luzes / Mechas',
    categoria: 'coloracao',
    descricao: 'Pontos de luz e mechas para realçar o corte masculino.',
  },
  // ── Barba ──
  {
    id: 'barba_desenhada',
    label: 'Barba Desenhada',
    categoria: 'barba',
    descricao: 'Modelagem com toalha quente, contorno e hidratação de barba.',
  },
  {
    id: 'barba_simples',
    label: 'Barba Simples / Aparada',
    categoria: 'barba',
    descricao: 'Aparo de volume e alinhamento básico.',
  },
  {
    id: 'barba_completa',
    label: 'Barba Completa Premium',
    categoria: 'barba',
    descricao: 'Tratamento completo: toalha, navalha, hidratação e finalizador.',
  },
  {
    id: 'hot_towel',
    label: 'Shave com Toalha Quente',
    categoria: 'barba',
    descricao: 'Ritual clássico com toalha quente e barbeador tradicional.',
  },
  // ── Combos & Premium ──
  {
    id: 'combo_vip',
    label: 'Combo VIP Completo',
    categoria: 'combos',
    descricao: 'Cabelo, barba completa e finalização exclusiva.',
  },
  {
    id: 'desenho_cabelo',
    label: 'Desenho no Cabelo',
    categoria: 'cortes',
    descricao: 'Arte e design exclusivos raspados no cabelo.',
  },
  // ── Estética Masculina ──
  {
    id: 'sobrancelha',
    label: 'Design de Sobrancelha',
    categoria: 'sobrancelha',
    descricao: 'Alinhamento preciso na navalha ou pinça.',
  },
  {
    id: 'limpeza_de_pele',
    label: 'Limpeza de Pele / Black Mask',
    categoria: 'limpeza_de_pele',
    descricao: 'Remoção de impurezas e hidratação facial relaxante.',
  },
  {
    id: 'micropigmentacao',
    label: 'Micropigmentação Capilar',
    categoria: 'micropigmentacao',
    descricao: 'Técnica de pigmentação para cobrir falhas e calvície.',
  },
];

/** Identifica o tipo de ilustração usando o nome oficial ou parcial do serviço. */
export function identificarTipoServico(id?: string, nome?: string, categoria?: string): TipoServicoId {
  const str = `${id || ''} ${nome || ''}`.toLowerCase();
  const nomeNorm = (nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // ── 1. Cortes Especiais (Altíssima especificidade: Infantil, Kids, Moicano, Cacheado, etc.) ──
  // Deve vir antes de tudo para evitar que palavras como "corte infantil" caiam em "corte_social"
  if (
    nomeNorm.startsWith('inf') ||
    nomeNorm.includes('infant') ||
    nomeNorm.includes('kid') ||
    nomeNorm.includes('crianc') ||
    nomeNorm.includes('bebe') ||
    nomeNorm.includes('junior') ||
    nomeNorm.includes('garoto') ||
    nomeNorm.includes('menino')
  ) {
    return 'corte_infantil';
  }

  // ── 2. Nevou (Cabelo Todo Branco - DEVE vir antes de platinado/descoloração) ──
  if (
    nomeNorm.startsWith('nev') ||
    nomeNorm.includes('nevou') ||
    nomeNorm.includes('nevo') ||
    nomeNorm.includes('nevado') ||
    nomeNorm.includes('cabelo branco') ||
    nomeNorm.includes('fio branco')
  ) {
    return 'nevou';
  }

  // ── 3. Platinado & Loiro ──
  if (
    nomeNorm.startsWith('plat') ||
    nomeNorm.includes('platinad') ||
    nomeNorm.includes('platina') ||
    nomeNorm.includes('loiro') ||
    nomeNorm.includes('loira') ||
    nomeNorm.includes('descolor') ||
    nomeNorm.includes('blonde')
  ) {
    return 'platinado';
  }

  // ── 4. Luzes & Mechas ──
  if (
    nomeNorm.startsWith('luz') ||
    nomeNorm.includes('luzes') ||
    nomeNorm.includes('mecha') ||
    nomeNorm.includes('reflexo') ||
    nomeNorm.includes('touca')
  ) {
    return 'luzes_masculinas';
  }

  // ── 5. Micropigmentação (DEVE vir antes de pigmentação geral) ──
  if (
    nomeNorm.startsWith('micro') ||
    nomeNorm.includes('micropigment') ||
    nomeNorm.includes('calvic') ||
    nomeNorm.includes('camuflagem') ||
    categoria === 'micropigmentacao'
  ) {
    return 'micropigmentacao';
  }

  // ── 6. Pigmentação Capilar & Barba ──
  if (
    nomeNorm.startsWith('pigment') ||
    nomeNorm.includes('pigmenta') ||
    nomeNorm.includes('tintura') ||
    nomeNorm.includes('tingir') ||
    nomeNorm.includes('cobertura de branco') ||
    categoria === 'coloracao'
  ) {
    return 'pigmentacao_capilar';
  }

  // ── 7. Moicano & Undercut ──
  if (
    nomeNorm.startsWith('moic') ||
    nomeNorm.includes('moican') ||
    nomeNorm.includes('undercut') ||
    nomeNorm.includes('mohawk')
  ) {
    return 'corte_moicano';
  }

  // ── 8. Cacheado, Afro & Black Power ──
  if (
    nomeNorm.startsWith('cach') ||
    nomeNorm.includes('cachead') ||
    nomeNorm.includes('afro') ||
    nomeNorm.includes('black') ||
    nomeNorm.includes('crespo') ||
    nomeNorm.includes('sponge') ||
    nomeNorm.includes('nudred')
  ) {
    return 'corte_cacheado';
  }

  // ── 9. Desenho & Freestyle no Cabelo ──
  if (
    !nomeNorm.includes('barba') &&
    (nomeNorm.startsWith('desen') ||
      nomeNorm.includes('desenh') ||
      nomeNorm.includes('hair tattoo') ||
      nomeNorm.includes('freestyle') ||
      nomeNorm.includes('risco') ||
      nomeNorm.includes('risquinh') ||
      nomeNorm.includes('tribal'))
  ) {
    return 'desenho_cabelo';
  }

  // ── 10. Acabamento & Pezinho ──
  if (
    nomeNorm.startsWith('pez') ||
    nomeNorm.includes('pezinho') ||
    nomeNorm.startsWith('acab') ||
    nomeNorm.includes('acabament') ||
    nomeNorm.includes('lineup') ||
    nomeNorm.includes('line up') ||
    nomeNorm.includes('contorno') ||
    nomeNorm.includes('costeleta')
  ) {
    return 'acabamento';
  }

  // ── 11. Toalha Quente & Shave Ritual ──
  if (
    nomeNorm.startsWith('toalh') ||
    nomeNorm.includes('toalha quente') ||
    nomeNorm.includes('hot towel') ||
    nomeNorm.startsWith('shav') ||
    nomeNorm.includes('shave')
  ) {
    return 'hot_towel';
  }

  // ── 12. Barba Completa & Barboterapia Premium ──
  if (
    nomeNorm.includes('barba completa') ||
    nomeNorm.includes('barboterap') ||
    nomeNorm.includes('terapia da barba') ||
    nomeNorm.includes('barba premium') ||
    nomeNorm.includes('spa da barba') ||
    nomeNorm.includes('barba vip')
  ) {
    return 'barba_completa';
  }

  // ── 13. Barba Desenhada & Modelada ──
  if (
    nomeNorm.includes('barba desenhada') ||
    nomeNorm.includes('barba modelada') ||
    nomeNorm.includes('desenhar barba') ||
    nomeNorm.includes('modelar barba')
  ) {
    return 'barba_desenhada';
  }

  // ── 14. Barba Simples & Aparo ──
  if (
    nomeNorm.includes('barba simples') ||
    nomeNorm.includes('aparar barba') ||
    nomeNorm.includes('acertar barba') ||
    nomeNorm.includes('baixar barba') ||
    nomeNorm.includes('barba rapida')
  ) {
    return 'barba_simples';
  }

  // ── 15. Barba Genérico ──
  if (nomeNorm.startsWith('barb') || nomeNorm.includes('barba') || categoria === 'barba') {
    return 'barba_desenhada';
  }

  // ── 16. Sobrancelha ──
  if (
    nomeNorm.startsWith('sobran') ||
    nomeNorm.includes('sobrancelh') ||
    nomeNorm.includes('pinca') ||
    categoria === 'sobrancelha'
  ) {
    return 'sobrancelha';
  }

  // ── 17. Limpeza de Pele & Estética ──
  if (
    nomeNorm.startsWith('limp') ||
    nomeNorm.includes('limpeza') ||
    nomeNorm.includes('black mask') ||
    nomeNorm.includes('esfoliac') ||
    nomeNorm.includes('facial') ||
    nomeNorm.includes('cravos') ||
    categoria === 'limpeza_de_pele'
  ) {
    return 'limpeza_de_pele';
  }

  // ── 18. Combos & VIP ──
  if (
    nomeNorm.includes('combo') ||
    nomeNorm.includes('cabelo e barba') ||
    nomeNorm.includes('corte e barba') ||
    nomeNorm.includes('cabelo + barba') ||
    nomeNorm.includes('corte + barba') ||
    nomeNorm.includes('barba e cabelo') ||
    nomeNorm.includes('vip') ||
    categoria === 'combos'
  ) {
    return 'combo_vip';
  }

  // ── 19. Corte Navalhado ──
  if (
    nomeNorm.startsWith('naval') ||
    nomeNorm.includes('navalhad') ||
    nomeNorm.includes('navalha') ||
    nomeNorm.includes('zero navalha') ||
    nomeNorm.includes('lamina')
  ) {
    return 'corte_navalhado';
  }

  // ── 20. Corte na Máquina / Militar ──
  if (
    nomeNorm.startsWith('maq') ||
    nomeNorm.includes('maquina') ||
    nomeNorm.includes('militar') ||
    nomeNorm.includes('buzz cut') ||
    nomeNorm.includes('raspado') ||
    nomeNorm.includes('pente unico')
  ) {
    return 'social_maquina';
  }

  // ── 21. Degradê / Fade ──
  if (
    nomeNorm.startsWith('deg') ||
    nomeNorm.includes('degrad') ||
    nomeNorm.startsWith('fad') ||
    nomeNorm.includes('fade') ||
    nomeNorm.includes('disfarc') ||
    nomeNorm.includes('taper')
  ) {
    return 'corte_degrade';
  }

  // ── 22. Corte Social / Tesoura Clássico ──
  if (
    nomeNorm.includes('social') ||
    nomeNorm.includes('tesour') ||
    nomeNorm.includes('classic') ||
    nomeNorm.includes('executiv') ||
    nomeNorm.includes('tradicion')
  ) {
    return 'corte_social';
  }

  // ── Fallbacks via str / id ──
  if (str.includes('infant') || str.includes('kid') || str.includes('crianc')) return 'corte_infantil';
  if (str.includes('nevou') || str.includes('nevo')) return 'nevou';
  if (str.includes('platinad') || str.includes('loiro')) return 'platinado';
  if (str.includes('luzes') || str.includes('mecha')) return 'luzes_masculinas';
  if (str.includes('combo')) return 'combo_vip';
  if (str.includes('degrad') || str.includes('fade')) return 'corte_degrade';
  if (str.includes('navalhad') || str.includes('navalha')) return 'corte_navalhado';
  if (str.includes('maquina')) return 'social_maquina';
  if (str.includes('moicano')) return 'corte_moicano';
  if (str.includes('cacheado') || str.includes('afro')) return 'corte_cacheado';
  if (str.includes('desenho')) return 'desenho_cabelo';
  if (str.includes('pezinho') || str.includes('acabamento')) return 'acabamento';
  if (str.includes('toalha') || str.includes('shave')) return 'hot_towel';
  if (str.includes('sobrancelha')) return 'sobrancelha';
  if (str.includes('limpeza')) return 'limpeza_de_pele';
  if (str.includes('barba')) return 'barba_desenhada';

  if (categoria === 'barba') return 'barba_desenhada';
  if (categoria === 'coloracao' || categoria === 'quimicas') return 'pigmentacao_capilar';
  if (categoria === 'sobrancelha') return 'sobrancelha';
  if (categoria === 'limpeza_de_pele' || categoria === 'cuidados') return 'limpeza_de_pele';
  if (categoria === 'combos') return 'combo_vip';

  return 'corte_social';
}

interface IlustracaoServicoProps {
  id?: string;
  nome?: string;
  categoria?: string;
  imagemUrl?: string | null;
  tipoPredefinido?: TipoServicoId | null;
  corMoldura?: string | null;
  tamanho?: number;
  estiloContainer?: ViewStyle;
}

export function IlustracaoServico({
  id,
  nome,
  categoria,
  imagemUrl,
  tipoPredefinido,
  corMoldura,
  tamanho = 52,
  estiloContainer,
}: IlustracaoServicoProps) {
  // 1. Determina a fonte da imagem (URL remota, tipo predefinido ou dedução automática)
  let source: ImageSourcePropType;
  if (imagemUrl) {
    source = { uri: imagemUrl };
  } else if (tipoPredefinido && IMAGENS_SERVICOS[tipoPredefinido]) {
    source = IMAGENS_SERVICOS[tipoPredefinido];
  } else {
    const tipoDeduzido = identificarTipoServico(id, nome, categoria);
    source = IMAGENS_SERVICOS[tipoDeduzido] || IMAGENS_SERVICOS.corte_social;
  }

  // 2. Cor da moldura externa (identidade visual do barbeiro / serviço)
  const corBorda = corMoldura || Colors.ouro;
  const borderRadius = Math.round(tamanho * 0.24);

  return (
    <View
      style={[
        styles.molduraExterna,
        {
          width: tamanho,
          height: tamanho,
          borderRadius,
          borderColor: corBorda,
        },
        estiloContainer,
      ]}
    >
      <Image source={source} style={styles.imagem} resizeMode="cover" />
      <View
        pointerEvents="none"
        style={[styles.molduraOverlay, { borderRadius, borderColor: corBorda }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  molduraExterna: {
    backgroundColor: '#121214',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  molduraOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
  },
});
