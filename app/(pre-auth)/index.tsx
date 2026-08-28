import React, { useState } from 'react';
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
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Store, ChevronRight } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { iniciarLoginGoogle } from '@/lib/socialAuth';
import { useLocalizacao } from '@/hooks/useLocalizacao';

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

/** Ícone oficial da Apple (novo asset transparente de alta definição) */
function IconeApple({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <Image
      source={require('@/assets/logo-apple.png')}
      style={{ width: tamanho * 0.85, height: tamanho }}
      resizeMode="contain"
    />
  );
}

interface SocialAuthProps {
  onCarregando: (v: boolean) => void;
  altura?: number;
}

function BotaoGoogleAuth({ onCarregando, altura = 48 }: SocialAuthProps) {
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleGoogleLogin() {
    try {
      setCarregando(true);
      onCarregando(true);
      const session = await iniciarLoginGoogle();
      if (session) {
        router.replace('/(app)/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In', err?.message || 'Não foi possível completar o login com Google.');
    } finally {
      setCarregando(false);
      onCarregando(false);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.botaoSocial, styles.botaoGoogle, { height: altura }, carregando && styles.botaoDesabilitado]}
      onPress={handleGoogleLogin}
      activeOpacity={0.8}
      disabled={carregando}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={Colors.textoPrimario} />
      ) : (
        <IconeGoogle tamanho={18} />
      )}
      <Text style={styles.botaoSocialTexto}>
        {carregando ? '...' : 'Google'}
      </Text>
    </TouchableOpacity>
  );
}

function BotaoAppleAuth({ onCarregando, altura = 48 }: SocialAuthProps) {
  function handleAppleLogin() {
    Alert.alert(
      'Em Breve no iOS 🍏',
      'O início de sessão com a Apple estará disponível na versão para iPhone.\n\nPara continuar agora, você pode entrar rapidamente com o Google ou cadastrar seu e-mail e senha!',
      [{ text: 'Entendido', style: 'default' }]
    );
  }

  return (
    <TouchableOpacity
      style={[styles.botaoSocial, styles.botaoApple, { height: altura }]}
      onPress={handleAppleLogin}
      activeOpacity={0.8}
    >
      <IconeApple tamanho={18} />
      <Text style={styles.botaoAppleTexto}>
        Apple
      </Text>
    </TouchableOpacity>
  );
}

export default function TelaLogin() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const { height, width } = useWindowDimensions();

  // Breakpoints responsivos para telas pequenas, médias e grandes
  const isPequeno = height < 720;
  const isMuitoAlto = height >= 840;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoSocial, setCarregandoSocial] = useState(false);

  // Solicita permissão e busca localização em background antecipadamente
  useLocalizacao(true);

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

  // Dimensões responsivas proporcionais
  const logoWidth = isPequeno ? 190 : isMuitoAlto ? 260 : 230;
  const logoHeight = isPequeno ? 50 : isMuitoAlto ? 74 : 64;
  const cardPadding = isPequeno ? 16 : isMuitoAlto ? 24 : 20;
  const cardGap = isPequeno ? 10 : isMuitoAlto ? 16 : 14;
  const inputHeight = isPequeno ? 46 : isMuitoAlto ? 54 : 50;
  const btnHeight = isPequeno ? 46 : isMuitoAlto ? 52 : 48;
  const socialBtnHeight = isPequeno ? 42 : isMuitoAlto ? 48 : 46;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingVertical: isPequeno ? Spacing.sm : Spacing.lg,
              gap: isPequeno ? 10 : isMuitoAlto ? 20 : 14,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.conteudoCentral}>
            {/* Header da Plataforma Na Régua */}
            <View style={[styles.logoContainer, { marginBottom: isPequeno ? 4 : 8 }]}>
              <Image
                source={require('@/assets/banner-na-regua.png')}
                style={{ width: logoWidth, height: logoHeight, alignSelf: 'center' }}
                resizeMode="contain"
              />
              <Text style={[styles.plataformaSlogan, { color: theme.textoSecundario, fontSize: isPequeno ? 12 : 13 }]}>
                Sua barbearia favorita a um toque
              </Text>
            </View>

            {/* Card de login */}
            <View style={[styles.card, { backgroundColor: theme.superficie, borderColor: theme.borda, padding: cardPadding, gap: cardGap }]}>
              <View style={styles.cardTopo}>
                <Text style={[styles.titulo, { color: theme.textoPrimario, fontSize: isPequeno ? 22 : 26 }]}>
                  Bem-vindo!
                </Text>
                <Text style={[styles.subtitulo, { color: theme.textoSecundario, fontSize: isPequeno ? 12 : 14 }]}>
                  Acesse sua conta para agendar
                </Text>
              </View>

              {/* E-mail */}
              <View style={[styles.campoContainer, { gap: isPequeno ? 3 : 5 }]}>
                <Text style={[styles.campoLabel, { color: theme.textoSecundario }]}>E-mail</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda, height: inputHeight }]}>
                  <Mail size={17} color={theme.textoSecundario} style={styles.inputIcone} />
                  <TextInput
                    style={[styles.input, { color: theme.textoPrimario }]}
                    placeholder="seu@email.com"
                    placeholderTextColor={theme.textoDesabilitado}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    selectionColor={theme.ouro}
                  />
                </View>
              </View>

              {/* Senha */}
              <View style={[styles.campoContainer, { gap: isPequeno ? 3 : 5 }]}>
                <Text style={[styles.campoLabel, { color: theme.textoSecundario }]}>Senha</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda, height: inputHeight }]}>
                  <Lock size={17} color={theme.textoSecundario} style={styles.inputIcone} />
                  <TextInput
                    style={[styles.input, { color: theme.textoPrimario }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textoDesabilitado}
                    secureTextEntry={!mostrarSenha}
                    value={senha}
                    onChangeText={setSenha}
                    selectionColor={theme.ouro}
                  />
                  <TouchableOpacity
                    onPress={() => setMostrarSenha((v) => !v)}
                    style={styles.btnOlho}
                    activeOpacity={0.7}
                  >
                    {mostrarSenha ? (
                      <EyeOff size={18} color={theme.textoSecundario} />
                    ) : (
                      <Eye size={18} color={theme.textoSecundario} />
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
                <ActivityIndicator color={theme.ouro} style={styles.loader} />
              )}

              {/* Divisor */}
              <View style={styles.divisorRow}>
                <View style={[styles.divisorLinha, { backgroundColor: theme.borda }]} />
                <Text style={[styles.divisorTexto, { color: theme.textoDesabilitado }]}>ou entre com</Text>
                <View style={[styles.divisorLinha, { backgroundColor: theme.borda }]} />
              </View>

              {/* Botões de Login Social Lado a Lado */}
              <View style={styles.sociaisContainer}>
                <BotaoGoogleAuth onCarregando={setCarregandoSocial} altura={socialBtnHeight} />
                <BotaoAppleAuth onCarregando={setCarregandoSocial} altura={socialBtnHeight} />
              </View>
            </View>

            {/* Banner para Donos de Estabelecimentos */}
            <TouchableOpacity
              style={[
                styles.bannerBarbeiro,
                {
                  backgroundColor: theme.superficie,
                  borderColor: theme.borda,
                  paddingVertical: isPequeno ? 10 : 14,
                  paddingHorizontal: isPequeno ? 14 : 16,
                  marginTop: isPequeno ? 10 : 14,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(pre-auth)/cadastro', params: { tipo: 'barbeiro' } })}
            >
              <View style={[styles.bannerBarbeiroIcone, { backgroundColor: theme.ouroTranslucido, width: isPequeno ? 36 : 42, height: isPequeno ? 36 : 42 }]}>
                <Store size={isPequeno ? 18 : 22} color={theme.ouroTexto} />
              </View>
              <View style={styles.bannerBarbeiroTextos}>
                <Text style={[styles.bannerBarbeiroTitulo, { color: theme.textoPrimario, fontSize: isPequeno ? 13 : 14.5 }]}>
                  É Dono de Barbearia?
                </Text>
                <Text style={[styles.bannerBarbeiroDesc, { color: theme.textoSecundario, fontSize: isPequeno ? 10.5 : 11.5, lineHeight: isPequeno ? 14 : 16 }]}>
                  Cadastre seu estabelecimento e gerencie sua agenda
                </Text>
              </View>
              <ChevronRight size={18} color={theme.ouroTexto} />
            </TouchableOpacity>

            {/* Rodapé */}
            <TouchableOpacity
              onPress={() => router.push('/(pre-auth)/cadastro')}
              style={[styles.rodape, { marginTop: isPequeno ? 8 : 14 }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.rodapeTexto, { color: theme.textoSecundario, fontSize: isPequeno ? 13 : 14 }]}>
                Não tem conta?{' '}
                <Text style={[styles.rodapeLink, { color: theme.ouroTexto }]}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudoCentral: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  plataformaSlogan: {
    fontFamily: FontFamily.regular,
    color: Colors.textoSecundario,
    letterSpacing: 0.2,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.xl,
    ...Shadows.card,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  cardTopo: {
    marginBottom: 2,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    color: Colors.textoPrimario,
    letterSpacing: 0.3,
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  campoContainer: {},
  campoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.textoSecundario,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie2,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  inputIcone: { marginRight: 2 },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
    height: '100%',
  },
  btnOlho: {
    padding: 6,
  },
  botaoPrincipal: {
    width: '100%',
    marginTop: 4,
  },
  loader: { alignSelf: 'center' },
  divisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: 4,
  },
  divisorLinha: { flex: 1, height: 1, backgroundColor: Colors.borda },
  divisorTexto: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: Colors.textoSecundario,
  },
  sociaisContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  botaoSocial: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
  },
  botaoGoogle: {
    backgroundColor: Colors.superficie2,
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
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
  },
  botaoAppleTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  bannerBarbeiro: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
    ...Shadows.card,
  },
  bannerBarbeiroIcone: {
    borderRadius: Radii.md,
    backgroundColor: Colors.ouroTranslucido,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBarbeiroTextos: {
    flex: 1,
    gap: 2,
  },
  bannerBarbeiroTitulo: {
    fontFamily: FontFamily.bold,
    color: Colors.ouro,
  },
  bannerBarbeiroDesc: {
    fontFamily: FontFamily.regular,
    color: Colors.textoSecundario,
  },
  rodape: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  rodapeTexto: {
    fontFamily: FontFamily.regular,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
  rodapeLink: {
    fontFamily: FontFamily.bold,
    color: Colors.ouro,
  },
});
