import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { FontFamily, FontSize, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.fundo, borderBottomColor: theme.borda }, estilo]}>
      <View style={styles.esquerda}>
        {acaoEsquerda}
      </View>

      <View style={styles.centro}>
        {usarLogo ? (
          <LogoBarbearia tamanho={30} tipo="banner" variante="compacto" />
        ) : (
          <View>
            {titulo && (
              <Text style={[styles.titulo, { color: theme.textoPrimario }]} numberOfLines={1}>
                {titulo}
              </Text>
            )}
            {subtitulo && (
              <Text style={[styles.subtitulo, { color: theme.textoSecundario }]} numberOfLines={1}>
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
    borderBottomWidth: 1,
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
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    textAlign: 'center',
  },
});
