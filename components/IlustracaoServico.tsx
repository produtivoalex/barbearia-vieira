import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';

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

const IMAGENS_SERVICOS: Record<TipoServicoId, ImageSourcePropType> = {
  corte_degrade: require('@/assets/servicos/corte-degrade.png'),
  corte_navalhado: require('@/assets/servicos/corte-navalhado.png'),
  corte_social: require('@/assets/servicos/corte-social.png'),
  social_maquina: require('@/assets/servicos/social-maquina.png'),
  combo_vip: require('@/assets/servicos/combo-vip.png'),
  barba_desenhada: require('@/assets/servicos/barba-desenhada.png'),
  barba_simples: require('@/assets/servicos/barba-simples.png'),
  sobrancelha: require('@/assets/servicos/sobrancelha.png'),
  limpeza_de_pele: require('@/assets/servicos/limpeza-pele.png'),
};

/** Identifica o tipo de ilustração baseado no nome ou id do serviço */
export function identificarTipoServico(id?: string, nome?: string, categoria?: string): TipoServicoId {
  const str = `${id || ''} ${nome || ''}`.toLowerCase();

  if (str.includes('combo') || categoria === 'combos') return 'combo_vip';

  if (str.includes('degrad') || str.includes('fade')) return 'corte_degrade';
  if (str.includes('navalhad') || str.includes('navalha')) return 'corte_navalhado';
  if (str.includes('máquina') || str.includes('maquina')) return 'social_maquina';
  if (str.includes('social') || categoria === 'cortes') return 'corte_social';

  if (str.includes('barba desenhada') || str.includes('desenhada')) return 'barba_desenhada';
  if (str.includes('barba simples') || str.includes('simples') || str.includes('raspada')) return 'barba_simples';
  if (str.includes('barba') || categoria === 'barba') return 'barba_desenhada';

  if (str.includes('sobrancelha') || categoria === 'sobrancelha') return 'sobrancelha';
  if (str.includes('limpeza') || str.includes('pele') || categoria === 'limpeza_de_pele') return 'limpeza_de_pele';

  return 'corte_social';
}

interface IlustracaoServicoProps {
  id?: string;
  nome?: string;
  categoria?: string;
  tamanho?: number;
}

export function IlustracaoServico({
  id,
  nome,
  categoria,
  tamanho = 48,
}: IlustracaoServicoProps) {
  const tipo = identificarTipoServico(id, nome, categoria);
  const source = IMAGENS_SERVICOS[tipo] || IMAGENS_SERVICOS.corte_social;
  const borderRadius = Math.round(tamanho * 0.22);

  return (
    <View style={[styles.container, { width: tamanho, height: tamanho, borderRadius }]}>
      <Image
        source={source}
        style={[styles.imagem, { width: tamanho, height: tamanho, borderRadius }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0F0F12',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
});
