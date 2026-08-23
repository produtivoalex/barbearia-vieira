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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Botao, LogoBarbearia } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { supabase } from '@/lib/supabase';
import { iniciarLoginGoogle } from '@/lib/socialAuth';

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
}

function BotaoGoogleAuth({ onCarregando }: SocialAuthProps) {
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
      style={[styles.botaoSocial, styles.botaoGoogle, carregando && styles.botaoDesabilitado]}
      onPress={handleGoogleLogin}
      activeOpacity={0.8}
      disabled={carregando}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={Colors.textoPrimario} />
      ) : (
        <IconeGoogle tamanho={20} />
      )}
      <Text style={styles.botaoSocialTexto}>
        {carregando ? 'Conectando...' : 'Entrar com o Google'}
      </Text>
    </TouchableOpacity>
  );
}

function BotaoAppleAuth({ onCarregando }: SocialAuthProps) {
  function handleAppleLogin() {
    Alert.alert(
      'Em Breve no iOS 🍏',
      'O início de sessão com a Apple estará disponível na versão para iPhone.\n\nPara continuar agora, você pode entrar rapidamente com o Google ou cadastrar seu e-mail e senha!',
      [{ text: 'Entendido', style: 'default' }]
    );
  }

  return (
    <TouchableOpacity
      style={[styles.botaoSocial, styles.botaoApple]}
      onPress={handleAppleLogin}
      activeOpacity={0.8}
    >
      <IconeApple tamanho={20} />
      <Text style={styles.botaoAppleTexto}>
        Iniciar sessão com a Apple
      </Text>
    </TouchableOpacity>
  );
}

export default function TelaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoSocial, setCarregandoSocial] = useState(false);

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
              <BotaoGoogleAuth onCarregando={setCarregandoSocial} />
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
