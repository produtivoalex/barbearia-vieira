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

/** Identifica o tipo de ilustração usando o nome oficial do serviço. */
export function identificarTipoServico(id?: string, nome?: string, categoria?: string): TipoServicoId {
  const str = `${id || ''} ${nome || ''}`.toLowerCase();
  const nomeNorm = (nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // ── Combos (maior prioridade) ──
  if (nomeNorm.includes('combo') || categoria === 'combos') return 'combo_vip';

  // ── Coloração & Tratamento ──
  if (nomeNorm.includes('nevou')) return 'nevou';
  if (nomeNorm.includes('platinado') || nomeNorm.includes('loiro') || nomeNorm.includes('descolorid')) return 'platinado';
  if (nomeNorm.includes('pigmentacao') || nomeNorm.includes('pigmenta') || nomeNorm.includes('cobertura de branco') || categoria === 'coloracao') return 'pigmentacao_capilar';
  if (nomeNorm.includes('luzes') || nomeNorm.includes('mechas') || nomeNorm.includes('mechas')) return 'luzes_masculinas';

  // ── Cortes Especiais ──
  if (nomeNorm.includes('infantil') || nomeNorm.includes('crianca') || nomeNorm.includes('bebe') || nomeNorm.includes('junior')) return 'corte_infantil';
  if (nomeNorm.includes('moicano') || nomeNorm.includes('undercut')) return 'corte_moicano';
  if (nomeNorm.includes('cacheado') || nomeNorm.includes('black') || nomeNorm.includes('afro') || nomeNorm.includes('cachos')) return 'corte_cacheado';
  if (nomeNorm.includes('acabamento') || nomeNorm.includes('lineup') || nomeNorm.includes('refino') || nomeNorm.includes('reto')) return 'acabamento';
  if (nomeNorm.includes('desenho') && (nomeNorm.includes('cabelo') || nomeNorm.includes('capilar'))) return 'desenho_cabelo';

  // ── Cortes Clássicos ──
  if (nomeNorm.includes('corte degrade') || nomeNorm.includes('fade') || nomeNorm.includes('degrade')) return 'corte_degrade';
  if (nomeNorm.includes('corte navalhado') || nomeNorm.includes('navalha') || nomeNorm.includes('navalhado')) return 'corte_navalhado';
  if (nomeNorm.includes('social todo na maquina') || nomeNorm.includes('corte na maquina') || nomeNorm.includes('maquina')) return 'social_maquina';
  if (nomeNorm.includes('corte social') || nomeNorm.includes('social')) return 'corte_social';

  // ── Barba ──
  if (nomeNorm.includes('hot towel') || nomeNorm.includes('toalha quente') || nomeNorm.includes('shave')) return 'hot_towel';
  if (nomeNorm.includes('barba completa') || nomeNorm.includes('barba premium') || nomeNorm.includes('barba tratamento')) return 'barba_completa';
  if (nomeNorm.includes('barba desenhada') || nomeNorm.includes('barba modelada')) return 'barba_desenhada';
  if (nomeNorm.includes('barba simples') || nomeNorm.includes('barba aparada')) return 'barba_simples';
  if (nomeNorm.includes('barba') || categoria === 'barba') return 'barba_desenhada';

  // ── Estética ──
  if (nomeNorm.includes('micropigmentacao') || nomeNorm.includes('micropigmenta') || nomeNorm.includes('falhas') || nomeNorm.includes('calvicie') || categoria === 'micropigmentacao') return 'micropigmentacao';
  if (nomeNorm.includes('sobrancelha') || categoria === 'sobrancelha') return 'sobrancelha';
  if (nomeNorm.includes('limpeza') || nomeNorm.includes('pele') || nomeNorm.includes('mascara') || categoria === 'limpeza_de_pele') return 'limpeza_de_pele';

  // ── Fallbacks via id/str genérico ──
  if (str.includes('combo')) return 'combo_vip';
  if (str.includes('nevou')) return 'nevou';
  if (str.includes('platinado') || str.includes('loiro')) return 'platinado';
  if (str.includes('degrad') || str.includes('fade')) return 'corte_degrade';
  if (str.includes('navalhad') || str.includes('navalha')) return 'corte_navalhado';
  if (str.includes('maquina') || str.includes('máquina')) return 'social_maquina';
  if (str.includes('infantil') || str.includes('crianca')) return 'corte_infantil';
  if (str.includes('moicano')) return 'corte_moicano';
  if (str.includes('cacheado') || str.includes('afro')) return 'corte_cacheado';
  if (str.includes('social') || categoria === 'cortes') return 'corte_social';
  if (str.includes('barba desenhada') || str.includes('desenhada')) return 'barba_desenhada';
  if (str.includes('hot towel') || str.includes('toalha')) return 'hot_towel';
  if (str.includes('barba')) return 'barba_desenhada';

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
