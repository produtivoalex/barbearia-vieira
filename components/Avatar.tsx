import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { Colors, FontFamily, Radii } from '@/theme';

interface AvatarProps {
  nome?: string;
  uri?: string | null;
  tamanho?: number;
  estilo?: ViewStyle;
  usarNaReguaFallback?: boolean;
}

export function Avatar({
  nome = 'Cliente',
  uri,
  tamanho = 44,
  estilo,
  usarNaReguaFallback = false,
}: AvatarProps) {
  const [erroImagem, setErroImagem] = useState(false);

  if (uri && !erroImagem) {
    return (
      <View
        style={[
          styles.containerImagem,
          { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
          estilo,
        ]}
      >
        <Image
          source={{ uri }}
          style={styles.imagemFill}
          resizeMode="cover"
          onError={() => setErroImagem(true)}
        />
      </View>
    );
  }

  if (usarNaReguaFallback || !nome) {
    return (
      <View
        style={[
          styles.containerImagem,
          { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
          estilo,
        ]}
      >
        <Image
          source={require('@/assets/avatar-na-regua.png')}
          style={styles.imagemFill}
          resizeMode="cover"
        />
      </View>
    );
  }

  const iniciais = nome
    .trim()
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
        {iniciais || 'NR'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.ouro,
  },
  containerImagem: {
    borderWidth: 1.5,
    borderColor: Colors.ouro,
    backgroundColor: Colors.superficie2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagemFill: {
    width: '100%',
    height: '100%',
  },
  iniciais: {
    fontFamily: FontFamily.bold,
    color: Colors.ouro,
  },
});
