import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';
import { processarUrlAuth } from '@/lib/socialAuth';

/**
 * Rota oficial de callback para redirecionamentos OAuth do Supabase.
 * Permite que deep links como "barbearia-vieira://auth/callback#access_token=..."
 * sejam capturados nativamente pelo Expo Router sem erro de rota não encontrada.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let montado = true;

    async function handleAuth() {
      try {
        // Garante o fechamento de qualquer sessão suspensa no navegador
        WebBrowser.maybeCompleteAuthSession();
        WebBrowser.dismissAuthSession();

        const url = await Linking.getInitialURL();
        if (url) {
          await processarUrlAuth(url);
        }
      } catch (err: any) {
        if (!montado) return;
        console.warn('[AuthCallback] Erro ao processar retorno OAuth:', err);
        setErro(err?.message || 'Falha ao autenticar.');
      }
    }

    handleAuth();

    return () => {
      montado = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.ouro} />
      <Text style={styles.texto}>
        {erro ? `Erro: ${erro}` : 'Autenticando na Barbearia Vieira...'}
      </Text>
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
