import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, Radii } from '@/theme';

interface AvatarProps {
  nome: string;
  uri?: string;
  tamanho?: number;
  estilo?: ViewStyle;
}

export function Avatar({ nome, uri: _uri, tamanho = 44, estilo }: AvatarProps) {
  // Placeholder com iniciais — substituir por <Image> quando tiver URI real
  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.container,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
        estilo,
      ]}
    >
      <Text style={[styles.iniciais, { fontSize: tamanho * 0.38 }]}>
        {iniciais}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.vermelhoClaro,
  },
  iniciais: {
    fontFamily: FontFamily.bold,
    color: Colors.textoPrimario,
  },
});
