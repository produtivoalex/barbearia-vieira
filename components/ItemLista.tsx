import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[
        styles.container,
        {
          backgroundColor: theme.superficie,
          borderColor: theme.borda,
        },
        estilo,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {iconeEsquerda && (
        <View style={[styles.iconeContainer, { backgroundColor: theme.superficie2 }]}>
          {iconeEsquerda}
        </View>
      )}
      <View style={styles.conteudo}>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo && (
          <Text style={[styles.subtitulo, { color: theme.textoSecundario }]} numberOfLines={1}>
            {subtitulo}
          </Text>
        )}
      </View>
      {elementoDireita && (
        <View style={styles.direita}>{elementoDireita}</View>
      )}
      {mostrarSeta && (
        <ChevronRight size={18} color={theme.textoDesabilitado} />
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
    borderRadius: Radii.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    minHeight: 60,
  },
  iconeContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
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
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
  },
  direita: {
    alignItems: 'flex-end',
  },
});
