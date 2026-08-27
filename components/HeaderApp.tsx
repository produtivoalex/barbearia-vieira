import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';

import { LogoBarbearia } from './LogoBarbearia';

interface HeaderAppProps {
  titulo?: string;
  subtitulo?: string;
  usarLogo?: boolean;
  acaoDireita?: React.ReactNode;
  acaoEsquerda?: React.ReactNode;
  estilo?: ViewStyle;
}

export function HeaderApp({
  titulo,
  subtitulo,
  usarLogo = false,
  acaoDireita,
  acaoEsquerda,
  estilo,
}: HeaderAppProps) {
  return (
    <View style={[styles.container, estilo]}>
      <View style={styles.esquerda}>
        {acaoEsquerda}
      </View>

      <View style={styles.centro}>
        {usarLogo ? (
          <LogoBarbearia tamanho={30} tipo="banner" variante="compacto" />
        ) : (
          <View>
            {titulo && (
              <Text style={styles.titulo} numberOfLines={1}>
                {titulo}
              </Text>
            )}
            {subtitulo && (
              <Text style={styles.subtitulo} numberOfLines={1}>
                {subtitulo}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.direita}>
        {acaoDireita}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.headerV,
    backgroundColor: Colors.fundo,
    minHeight: 56,
  },
  esquerda: {
    width: 40,
    alignItems: 'flex-start',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
  },
  direita: {
    width: 40,
    alignItems: 'flex-end',
  },
  logoPlaceholder: {
    // Substituir por Image quando tiver logo.png
  },
  logoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    letterSpacing: 1.5,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
});
