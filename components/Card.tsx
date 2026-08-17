import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '@/theme';

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

const estilosPorVariante: Record<VarianteCard, ViewStyle> = {
  preenchido: {
    backgroundColor: Colors.superficie,
  },
  contornado: {
    backgroundColor: Colors.transparente,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  transparente: {
    backgroundColor: Colors.transparente,
  },
};
