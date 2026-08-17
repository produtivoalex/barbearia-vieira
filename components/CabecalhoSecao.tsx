import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';

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
  return (
    <View style={[styles.container, estilo]}>
      <Text style={styles.titulo}>{titulo}</Text>
      {acaoLabel && onAcao && (
        <TouchableOpacity onPress={onAcao} activeOpacity={0.7}>
          <Text style={styles.acao}>{acaoLabel}</Text>
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
    color: Colors.textoPrimario,
  },
  acao: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.vermelho,
  },
});
