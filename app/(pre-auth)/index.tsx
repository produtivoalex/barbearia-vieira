import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { supabase } from '@/lib/supabase';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

// Necessário para que o WebBrowser feche corretamente após o OAuth
WebBrowser.maybeCompleteAuthSession();

export default function TelaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'barbearia-vieira', path: 'auth/callback' });

  // Google Auth: verificação por plataforma para evitar crash de "clientId must be defined"
  // O hook valida o ID específico da plataforma atual (androidClientId no Android, iosClientId no iOS)
  const googleConfigured = (
    Platform.OS === 'android'
      ? !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
      : Platform.OS === 'ios'
      ? !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
      : !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
  );

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest(
    googleConfigured
      ? {
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
          redirectUri,
          scopes: ['openid', 'profile', 'email'],
        }
      : undefined
  );

  useEffect(() => {
    async function processarRespostaGoogle() {
      if (googleResponse?.type !== 'success') return;

      const idToken = googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      const accessToken = googleResponse.authentication?.accessToken;

      if (!idToken) {
        Alert.alert('Erro', 'Não foi possível obter o token do Google.');
        return;
      }

      setCarregandoGoogle(true);
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        access_token: accessToken,
      });
      setCarregandoGoogle(false);

      if (error) {
        Alert.alert('Erro ao entrar com Google', error.message);
      }
      // Sucesso: ControleRotas em _layout.tsx redireciona automaticamente
    }

    processarRespostaGoogle();
  }, [googleResponse]);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    }
    // Sucesso: o ControleRotas em _layout.tsx redireciona automaticamente
  }

  async function handleGoogle() {
    await promptGoogleAsync();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderTexto}>LOGO</Text>
            </View>
            <Text style={styles.nomeApp}>BARBEARIA VIEIRA</Text>
            <Text style={styles.tagline}>(86) 98190-7478</Text>
          </View>

          {/* Card de login */}
          <View style={styles.card}>
            <Text style={styles.titulo}>Bem-vindo de volta!</Text>
            <Text style={styles.subtitulo}>Faça login para continuar</Text>

            {/* E-mail */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.textoSecundario} style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={Colors.textoDesabilitado}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  selectionColor={Colors.vermelho}
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textoSecundario} style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textoDesabilitado}
                  secureTextEntry
                  value={senha}
                  onChangeText={setSenha}
                  selectionColor={Colors.vermelho}
                />
              </View>
            </View>

            <Botao
              label={carregando ? '' : 'Entrar'}
              onPress={handleLogin}
              desabilitado={carregando}
              estiloContainer={styles.botaoPrincipal}
            />

            {carregando && (
              <ActivityIndicator color={Colors.vermelho} style={styles.loader} />
            )}

            {/* Divisor + Botão Google (só aparecem se Google estiver configurado) */}
            {googleConfigured && (
              <>
                <View style={styles.divisorRow}>
                  <View style={styles.divisorLinha} />
                  <Text style={styles.divisorTexto}>ou</Text>
                  <View style={styles.divisorLinha} />
                </View>

                <TouchableOpacity
                  style={[styles.botaoGoogle, carregandoGoogle && styles.botaoDesabilitado]}
                  onPress={handleGoogle}
                  activeOpacity={0.8}
                  disabled={carregandoGoogle}
                >
                  {carregandoGoogle ? (
                    <ActivityIndicator size="small" color={Colors.azulBarbeiro} />
                  ) : (
                    <Text style={styles.botaoGoogleIcone}>G</Text>
                  )}
                  <Text style={styles.botaoGoogleTexto}>
                    {carregandoGoogle ? 'Aguardando Google...' : 'Entrar com Google'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Rodapé */}
          <TouchableOpacity onPress={() => router.push('/(pre-auth)/cadastro')} style={styles.rodape}>
            <Text style={styles.rodapeTexto}>
              Não tem conta?{' '}
              <Text style={styles.rodapeLink}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.telaH,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xxl,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.superficie,
    borderWidth: 2,
    borderColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  logoPlaceholderTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
    letterSpacing: 2,
  },
  nomeApp: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayLg,
    color: Colors.textoPrimario,
    letterSpacing: 3,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.card,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    marginTop: -Spacing.xs,
  },
  campoContainer: { gap: Spacing.xs },
  campoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
    paddingHorizontal: Spacing.sm,
    height: 52,
    gap: Spacing.xs,
  },
  inputIcone: { marginRight: 2 },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    height: '100%',
  },
  botaoPrincipal: { width: '100%', marginTop: Spacing.xs },
  loader: { alignSelf: 'center' },
  divisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  divisorLinha: { flex: 1, height: 1, backgroundColor: Colors.borda },
  divisorTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  botaoGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: Colors.azulBarbeiro,
    backgroundColor: Colors.transparente,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoGoogleIcone: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.azulBarbeiro,
  },
  botaoGoogleTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.azulBarbeiro,
  },
  rodape: { paddingBottom: Spacing.md },
  rodapeTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
  rodapeLink: {
    fontFamily: FontFamily.semiBold,
    color: Colors.vermelho,
  },
});
