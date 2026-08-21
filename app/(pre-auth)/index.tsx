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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Botao, LogoBarbearia } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { supabase } from '@/lib/supabase';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

// Necessário para que o WebBrowser feche corretamente após o OAuth
WebBrowser.maybeCompleteAuthSession();

/** Ícone vetorial oficial multicolorido da Google */
function IconeGoogle({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/** Ícone vetorial oficial da Apple */
function IconeApple({ tamanho = 20, cor = '#FFFFFF' }: { tamanho?: number; cor?: string }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 170 170">
      <Path
        d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.88-14.24-6.84-10.42-12.21-22.37-16.1-35.85-3.9-13.48-5.85-25.75-5.85-36.8 0-14.56 3.69-26.65 11.08-36.27 7.39-9.62 16.71-14.54 27.97-14.76 4.78 0 10.22 1.25 16.32 3.75 6.1 2.5 10.05 3.86 11.87 4.08 2.5-.54 6.74-2.07 12.72-4.58 5.98-2.5 11.3-3.65 15.96-3.44 12.39.65 22.39 5.38 30 14.19-10.87 6.63-16.19 15.65-15.97 27.06.22 9.02 3.75 16.63 10.6 22.82 6.85 6.19 14.88 9.68 24.1 10.45-2.39 7.07-5.38 14.02-8.97 20.86zM119.22 33.6c-.11-3.69.87-7.44 2.94-11.25 2.06-3.8 4.99-7.07 8.79-9.79 3.8-2.72 7.72-4.56 11.74-5.54.43 3.69-.54 7.4-2.93 11.14-2.39 3.75-5.32 6.85-8.79 9.3-3.48 2.45-7.39 4.29-11.75 5.54z"
        fill={cor}
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Componente isolado que chama Google.useAuthRequest.
// Só é MONTADO quando as chaves corretas para a plataforma
// estão configuradas no .env — isso é crucial pois hooks
// não podem ser chamados condicionalmente. Ao não montar
// este componente, evitamos o crash "androidClientId must be
// defined" mesmo sem configurar Google Auth.
// ─────────────────────────────────────────────────────────────
interface GoogleAuthProps {
  onCarregando: (v: boolean) => void;
}

function BotaoGoogleAuth({ onCarregando }: GoogleAuthProps) {
  const [carregando, setCarregando] = useState(false);
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'barbearia-vieira',
    path: 'auth/callback',
  });

  const [, googleResponse, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    async function processar() {
      if (googleResponse?.type !== 'success') return;

      const idToken =
        googleResponse.params?.id_token ?? googleResponse.authentication?.idToken;
      const accessToken = googleResponse.authentication?.accessToken;

      if (!idToken) {
        Alert.alert('Erro', 'Não foi possível obter o token do Google.');
        return;
      }

      setCarregando(true);
      onCarregando(true);
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        access_token: accessToken,
      });
      setCarregando(false);
      onCarregando(false);

      if (error) {
        Alert.alert('Erro ao entrar com Google', error.message);
      }
    }
    processar();
  }, [googleResponse, onCarregando]);

  return (
    <TouchableOpacity
      style={[styles.botaoSocial, styles.botaoGoogle, carregando && styles.botaoDesabilitado]}
      onPress={() => promptAsync()}
      activeOpacity={0.8}
      disabled={carregando}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={Colors.textoPrimario} />
      ) : (
        <IconeGoogle tamanho={20} />
      )}
      <Text style={styles.botaoSocialTexto}>
        {carregando ? 'Aguardando Google...' : 'Entrar com o Google'}
      </Text>
    </TouchableOpacity>
  );
}

function BotaoGoogleFallback({ onCarregando }: GoogleAuthProps) {
  async function handleGoogleSimples() {
    try {
      onCarregando(true);
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'barbearia-vieira',
        path: 'auth/callback',
      });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) Alert.alert('Google Auth', error.message);
    } catch (err: any) {
      Alert.alert('Google Auth', err.message || 'Configuração em andamento.');
    } finally {
      onCarregando(false);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.botaoSocial, styles.botaoGoogle]}
      onPress={handleGoogleSimples}
      activeOpacity={0.8}
    >
      <IconeGoogle tamanho={20} />
      <Text style={styles.botaoSocialTexto}>Entrar com o Google</Text>
    </TouchableOpacity>
  );
}

function BotaoAppleAuth({ onCarregando }: { onCarregando: (v: boolean) => void }) {
  async function handleAppleLogin() {
    try {
      onCarregando(true);
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'barbearia-vieira',
        path: 'auth/callback',
      });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        Alert.alert('Apple Sign In', error.message);
      }
    } catch (err: any) {
      Alert.alert('Apple Sign In', err.message || 'Disponível em dispositivos iOS.');
    } finally {
      onCarregando(false);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.botaoSocial, styles.botaoApple]}
      onPress={handleAppleLogin}
      activeOpacity={0.8}
    >
      <IconeApple tamanho={20} cor="#FFFFFF" />
      <Text style={styles.botaoAppleTexto}>Iniciar sessão com a Apple</Text>
    </TouchableOpacity>
  );
}

function googleConfigurado(): boolean {
  if (Platform.OS === 'android') {
    return !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;
  }
  if (Platform.OS === 'ios') {
    return !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
  }
  return !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
}

export default function TelaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoSocial, setCarregandoSocial] = useState(false);

  const temGoogle = googleConfigurado();

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    setCarregando(false);
    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    }
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
          {/* Logo Oficial Barbearia Vieira */}
          <View style={styles.logoContainer}>
            <LogoBarbearia
              tamanho={115}
              mostrarTelefone={true}
              telefoneClicavel={true}
              mensagemWhatsApp="Não estou conseguindo entrar no aplicativo"
            />
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
                  secureTextEntry={!mostrarSenha}
                  value={senha}
                  onChangeText={setSenha}
                  selectionColor={Colors.vermelho}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha((v) => !v)}
                  style={styles.btnOlho}
                  activeOpacity={0.7}
                >
                  {mostrarSenha ? (
                    <EyeOff size={18} color={Colors.textoSecundario} />
                  ) : (
                    <Eye size={18} color={Colors.textoSecundario} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Botao
              label={carregando ? '' : 'Entrar'}
              onPress={handleLogin}
              desabilitado={carregando || carregandoSocial}
              estiloContainer={styles.botaoPrincipal}
            />

            {carregando && (
              <ActivityIndicator color={Colors.vermelho} style={styles.loader} />
            )}

            {/* Divisor */}
            <View style={styles.divisorRow}>
              <View style={styles.divisorLinha} />
              <Text style={styles.divisorTexto}>ou continue com</Text>
              <View style={styles.divisorLinha} />
            </View>

            {/* Botões de Login Social */}
            <View style={styles.sociaisContainer}>
              {temGoogle ? (
                <BotaoGoogleAuth onCarregando={setCarregandoSocial} />
              ) : (
                <BotaoGoogleFallback onCarregando={setCarregandoSocial} />
              )}

              <BotaoAppleAuth onCarregando={setCarregandoSocial} />
            </View>
          </View>

          {/* Rodapé */}
          <TouchableOpacity
            onPress={() => router.push('/(pre-auth)/cadastro')}
            style={styles.rodape}
            activeOpacity={0.7}
          >
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
    gap: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.borda,
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
  btnOlho: {
    padding: 6,
  },
  botaoPrincipal: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  loader: { alignSelf: 'center' },
  divisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  divisorLinha: { flex: 1, height: 1, backgroundColor: Colors.borda },
  divisorTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  sociaisContainer: {
    gap: Spacing.sm,
  },
  botaoSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 50,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
  },
  botaoGoogle: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  botaoApple: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoSocialTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  botaoAppleTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
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
