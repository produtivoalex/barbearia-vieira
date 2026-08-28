import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Radii, Shadows, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

type VarianteCard = 'preenchido' | 'contornado' | 'transparente';

interface CardProps {
  children: React.ReactNode;
  variante?: VarianteCard;
  elevado?: boolean;
  estilo?: ViewStyle;
}

export function Card({
  children,
  variante = 'preenchido',
  elevado = false,
  estilo,
}: CardProps) {
  const { theme, isEscuro } = useTheme();

  const estilosPorVariante: Record<VarianteCard, ViewStyle> = {
    preenchido: {
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    contornado: {
      backgroundColor: theme.transparente,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    transparente: {
      backgroundColor: theme.transparente,
    },
  };

  return (
    <View
      style={[
        styles.base,
        estilosPorVariante[variante],
        elevado && Shadows.cardElevado,
        !elevado && Shadows.card,
        estilo,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.md,
    padding: Spacing.cardInterno,
    overflow: 'hidden',
  },
});
