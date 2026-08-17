import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

interface ChipProps {
  label: string;
  selecionado?: boolean;
  onPress?: () => void;
  estilo?: ViewStyle;
}

export function Chip({ label, selecionado = false, onPress, estilo }: ChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        selecionado ? styles.selecionado : styles.padrao,
        estilo,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={[styles.texto, selecionado ? styles.textoSelecionado : styles.textoPadrao]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.xs,
    alignSelf: 'flex-start',
  },
  padrao: {
    backgroundColor: Colors.superficie2,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  selecionado: {
    backgroundColor: Colors.vermelho,
    borderWidth: 1,
    borderColor: Colors.vermelho,
  },
  texto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
  },
  textoPadrao: {
    color: Colors.textoSecundario,
  },
  textoSelecionado: {
    color: Colors.textoPrimario,
  },
});
