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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, Lock, User } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { supabase } from '@/lib/supabase';

export default function TelaCadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleCadastrar() {
    if (!nome || !email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome_completo: nome },
      },
    });
    setCarregando(false);
    if (error) {
      Alert.alert('Erro ao cadastrar', error.message);
    } else {
      Alert.alert(
        'Confirme seu e-mail',
        'Enviamos um link de confirmação para ' + email + '. Verifique sua caixa de entrada.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.btnVoltar}>
              <ChevronLeft size={24} color={Colors.textoPrimario} />
            </TouchableOpacity>
            <Text style={styles.headerTitulo}>Criar conta</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.titulo}>Crie sua conta</Text>
            <Text style={styles.subtitulo}>Acesse sua agenda e histórico em qualquer dispositivo</Text>

            {/* Nome */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Nome completo</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.textoSecundario} style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="João Silva"
                  placeholderTextColor={Colors.textoDesabilitado}
                  autoCapitalize="words"
                  value={nome}
                  onChangeText={setNome}
                  selectionColor={Colors.vermelho}
                />
              </View>
            </View>

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
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={Colors.textoDesabilitado}
                  secureTextEntry
                  value={senha}
                  onChangeText={setSenha}
                  selectionColor={Colors.vermelho}
                />
              </View>
            </View>

            <Botao
              label={carregando ? '' : 'Criar conta'}
              onPress={handleCadastrar}
              desabilitado={carregando}
              estiloContainer={styles.botaoPrincipal}
            />

            {carregando && (
              <ActivityIndicator color={Colors.vermelho} style={styles.loader} />
            )}
          </View>

          {/* Rodapé */}
          <TouchableOpacity onPress={() => router.back()} style={styles.rodape}>
            <Text style={styles.rodapeTexto}>
              Já tem conta?{' '}
              <Text style={styles.rodapeLink}>Entrar</Text>
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
    gap: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  btnVoltar: { width: 40, alignItems: 'flex-start' },
  headerTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
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
