import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ChipProps {
  label: string;
  selecionado?: boolean;
  onPress?: () => void;
  estilo?: ViewStyle;
}

export function Chip({ label, selecionado = false, onPress, estilo }: ChipProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: selecionado ? theme.ouro : theme.superficie2,
          borderColor: selecionado ? theme.ouro : theme.borda,
        },
        estilo,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.texto,
          {
            color: selecionado ? theme.textoEscuroSobreOuro : theme.textoSecundario,
            fontFamily: selecionado ? FontFamily.bold : FontFamily.medium,
          },
        ]}
      >
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
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  texto: {
    fontSize: FontSize.bodySm,
  },
});
