import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';

export default function AuthCallback() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.ouro} />
      <Text style={styles.texto}>Autenticando na Barbearia Vieira...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  texto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
});
