import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { FontFamily, FontSize, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthCallback() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.fundo }]}>
      <ActivityIndicator size="large" color={theme.ouro} />
      <Text style={[styles.texto, { color: theme.textoSecundario }]}>Autenticando no Na Régua...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  texto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    textAlign: 'center',
  },
});
