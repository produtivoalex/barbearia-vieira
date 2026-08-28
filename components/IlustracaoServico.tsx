import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType, ViewStyle } from 'react-native';
import { Colors } from '@/theme';

export type TipoServicoId =
  | 'corte_degrade'
  | 'corte_navalhado'
  | 'corte_social'
  | 'social_maquina'
  | 'combo_vip'
  | 'barba_desenhada'
  | 'barba_simples'
  | 'sobrancelha'
  | 'limpeza_de_pele';

export const IMAGENS_SERVICOS: Record<TipoServicoId, ImageSourcePropType> = {
  // O nome semântico do serviço precisa seguir o conteúdo visual do asset.
  corte_degrade: require('@/assets/servicos/corte-social.png'),
  corte_navalhado: require('@/assets/servicos/corte-navalhado.png'),
  corte_social: require('@/assets/servicos/corte-degrade.png'),
  social_maquina: require('@/assets/servicos/barba-desenhada.png'),
  combo_vip: require('@/assets/servicos/limpeza-pele.png'),
  barba_desenhada: require('@/assets/servicos/social-maquina.png'),
  barba_simples: require('@/assets/servicos/sobrancelha.png'),
  sobrancelha: require('@/assets/servicos/barba-simples.png'),
  limpeza_de_pele: require('@/assets/servicos/combo-vip.png'),
};

export const BIBLIOTECA_SERVICOS: {
  id: TipoServicoId;
  label: string;
  categoria: string;
  descricao: string;
}[] = [
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
  {
    id: 'combo_vip',
    label: 'Combo VIP Completo',
    categoria: 'combos',
    descricao: 'Cabelo, barba completa e finalização exclusiva.',
  },
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
];

/** Identifica o tipo de ilustração usando o nome oficial do serviço. */
export function identificarTipoServico(id?: string, nome?: string, categoria?: string): TipoServicoId {
  const str = `${id || ''} ${nome || ''}`.toLowerCase();
  const nomeNormalizado = (nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (nomeNormalizado.includes('combo') || categoria === 'combos') return 'combo_vip';
  if (nomeNormalizado.includes('corte degrade') || nomeNormalizado.includes('fade')) return 'corte_degrade';
  if (nomeNormalizado.includes('corte navalhado') || nomeNormalizado.includes('navalha')) return 'corte_navalhado';
  if (nomeNormalizado.includes('social todo na maquina') || nomeNormalizado.includes('corte na maquina')) return 'social_maquina';
  if (nomeNormalizado.includes('corte social')) return 'corte_social';
  if (nomeNormalizado.includes('barba desenhada')) return 'barba_desenhada';
  if (nomeNormalizado.includes('barba simples')) return 'barba_simples';
  if (nomeNormalizado.includes('sobrancelha') || categoria === 'sobrancelha') return 'sobrancelha';
  if (nomeNormalizado.includes('limpeza') || nomeNormalizado.includes('pele') || categoria === 'limpeza_de_pele') return 'limpeza_de_pele';

  if (str.includes('combo')) return 'combo_vip';
  if (str.includes('degrad') || str.includes('fade')) return 'corte_degrade';
  if (str.includes('navalhad') || str.includes('navalha')) return 'corte_navalhado';
  if (str.includes('máquina') || str.includes('maquina')) return 'social_maquina';
  if (str.includes('social') || categoria === 'cortes') return 'corte_social';
  if (str.includes('barba desenhada') || str.includes('desenhada')) return 'barba_desenhada';
  if (str.includes('barba simples') || str.includes('simples') || str.includes('raspada')) return 'barba_simples';
  if (str.includes('barba') || categoria === 'barba') return 'barba_desenhada';

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
