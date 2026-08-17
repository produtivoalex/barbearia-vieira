import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

interface ItemListaProps {
  titulo: string;
  subtitulo?: string;
  iconeEsquerda?: React.ReactNode;
  elementoDireita?: React.ReactNode;
  mostrarSeta?: boolean;
  onPress?: () => void;
  estilo?: ViewStyle;
}

export function ItemLista({
  titulo,
  subtitulo,
  iconeEsquerda,
  elementoDireita,
  mostrarSeta = false,
  onPress,
  estilo,
}: ItemListaProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.container, estilo]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {iconeEsquerda && (
        <View style={styles.iconeContainer}>{iconeEsquerda}</View>
      )}
      <View style={styles.conteudo}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo && (
          <Text style={styles.subtitulo} numberOfLines={1}>
            {subtitulo}
          </Text>
        )}
      </View>
      {elementoDireita && (
        <View style={styles.direita}>{elementoDireita}</View>
      )}
      {mostrarSeta && (
        <ChevronRight size={18} color={Colors.textoDesabilitado} />
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.sm,
    gap: Spacing.sm,
    minHeight: 60,
  },
  iconeContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  direita: {
    alignItems: 'flex-end',
  },
});
