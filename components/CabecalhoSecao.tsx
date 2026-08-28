import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontFamily, FontSize, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CabecalhoSecaoProps {
  titulo: string;
  acaoLabel?: string;
  onAcao?: () => void;
  estilo?: ViewStyle;
}

export function CabecalhoSecao({
  titulo,
  acaoLabel,
  onAcao,
  estilo,
}: CabecalhoSecaoProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, estilo]}>
      <Text style={[styles.titulo, { color: theme.textoPrimario }]}>{titulo}</Text>
      {acaoLabel && onAcao && (
        <TouchableOpacity onPress={onAcao} activeOpacity={0.7}>
          <Text style={[styles.acao, { color: theme.ouroTexto }]}>{acaoLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  titulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.headingSm,
  },
  acao: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
  },
});
