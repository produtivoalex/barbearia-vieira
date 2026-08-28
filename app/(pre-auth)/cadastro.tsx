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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Mail, Lock, User, Eye, EyeOff, Scissors, Store, Sparkles } from 'lucide-react-native';
import { Botao, LogoBarbearia } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

type TipoConta = 'cliente' | 'barbeiro';

export default function TelaCadastro() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const params = useLocalSearchParams<{ tipo?: string }>();

  const [tipoConta, setTipoConta] = useState<TipoConta>(
    params.tipo === 'barbeiro' ? 'barbeiro' : 'cliente'
  );
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
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

    try {
      const emailLimpo = email.trim().toLowerCase();
      const nomeLimpo = nome.trim();

      const { data: authData, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          data: {
            nome_completo: nomeLimpo,
            role: tipoConta,
          },
        },
      });

      if (error) {
        Alert.alert('Erro ao cadastrar', error.message);
        setCarregando(false);
        return;
      }

      // Se o usuário foi autenticado imediatamente
      if (authData.user?.id) {
        // Assegura que o perfil tenha a role correta no banco
        await supabase
          .from('perfis')
          .update({
            nome_completo: nomeLimpo,
            role: tipoConta,
          })
          .eq('id', authData.user.id);

        if (tipoConta === 'barbeiro') {
          Alert.alert(
            'Conta Profissional Criada! 💈',
            'Bem-vindo ao Na Régua Empresas! Vamos cadastrar seu estabelecimento agora.',
            [
              {
                text: 'Cadastrar Minha Barbearia',
                onPress: () => router.replace('/(app)/(barbeiro)/cadastrar-barbearia'),
              },
            ]
          );
        } else {
          Alert.alert(
            'Conta Criada com Sucesso! 💈',
            'Bem-vindo ao Na Régua! Você já pode explorar as barbearias e agendar seus cortes.',
            [
              {
                text: 'Explorar Barbearias',
                onPress: () => router.replace('/(app)/barbearias'),
              },
            ]
          );
        }
      } else {
        // Se necessitar de confirmação de e-mail ou redirecionamento ao login
        Alert.alert(
          'Conta Criada com Sucesso! 💈',
          tipoConta === 'barbeiro'
            ? 'Sua conta profissional foi criada! Faça login para cadastrar sua barbearia.'
            : 'Sua conta foi criada! Faça login para começar a agendar.',
          [{ text: 'Fazer Login', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Erro no cadastro', err?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header com voltar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.btnVoltar, { backgroundColor: theme.superficie, borderColor: theme.borda }]} activeOpacity={0.7}>
              <ChevronLeft size={24} color={theme.textoPrimario} />
            </TouchableOpacity>
            <LogoBarbearia tamanho={38} tipo="avatar" variante="compacto" />
            <View style={{ width: 40 }} />
          </View>

          {/* Seletor de Perfil (Tabs) */}
          <View style={[styles.seletorPerfil, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <TouchableOpacity
              style={[
                styles.seletorItem,
                tipoConta === 'cliente' && { backgroundColor: theme.ouro },
              ]}
              onPress={() => setTipoConta('cliente')}
              activeOpacity={0.8}
            >
              <Scissors size={18} color={tipoConta === 'cliente' ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
              <Text style={[
                styles.seletorTexto,
                { color: theme.textoSecundario },
                tipoConta === 'cliente' && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}>
                Sou Cliente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.seletorItem,
                tipoConta === 'barbeiro' && { backgroundColor: theme.ouro },
              ]}
              onPress={() => setTipoConta('barbeiro')}
              activeOpacity={0.8}
            >
              <Store size={18} color={tipoConta === 'barbeiro' ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
              <Text style={[
                styles.seletorTexto,
                { color: theme.textoSecundario },
                tipoConta === 'barbeiro' && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}>
                Sou Barbeiro / Dono
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card de Cadastro */}
          <View style={[styles.card, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.titulo, { color: theme.textoPrimario }]}>
                {tipoConta === 'barbeiro' ? 'Criar Conta Profissional' : 'Crie sua conta'}
              </Text>
              <Text style={[styles.subtitulo, { color: theme.textoSecundario }]}>
                {tipoConta === 'barbeiro'
                  ? 'Cadastre sua barbearia, gerencie horários, serviços e sua equipe em um só lugar.'
                  : 'Acesse sua agenda, encontre barbearias e acompanhe seus agendamentos.'}
              </Text>
            </View>

            {tipoConta === 'barbeiro' && (
              <View style={[styles.badgeProfissional, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Sparkles size={16} color={theme.ouroTexto} />
                <Text style={[styles.badgeProfissionalTexto, { color: theme.ouroTexto }]}>
                  Você poderá cadastrar e gerenciar seu estabelecimento logo após o registro.
                </Text>
              </View>
            )}

            {/* Nome */}
            <View style={styles.campoContainer}>
              <Text style={[styles.campoLabel, { color: theme.textoSecundario }]}>
                {tipoConta === 'barbeiro' ? 'Seu Nome / Nome Profissional' : 'Nome completo'}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <User size={18} color={theme.textoSecundario} style={styles.inputIcone} />
                <TextInput
                  style={[styles.input, { color: theme.textoPrimario }]}
                  placeholder={tipoConta === 'barbeiro' ? 'Ex: Carlos Silva' : 'Seu nome'}
                  placeholderTextColor={theme.textoDesabilitado}
                  autoCapitalize="words"
                  value={nome}
                  onChangeText={setNome}
                  selectionColor={theme.ouro}
                />
              </View>
            </View>

            {/* E-mail */}
            <View style={styles.campoContainer}>
              <Text style={[styles.campoLabel, { color: theme.textoSecundario }]}>E-mail de Acesso</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <Mail size={18} color={theme.textoSecundario} style={styles.inputIcone} />
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
            <View style={styles.campoContainer}>
              <Text style={[styles.campoLabel, { color: theme.textoSecundario }]}>Senha</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <Lock size={18} color={theme.textoSecundario} style={styles.inputIcone} />
                <TextInput
                  style={[styles.input, { color: theme.textoPrimario }]}
                  placeholder="Mínimo 6 caracteres"
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
              label={
                carregando
                  ? ''
                  : tipoConta === 'barbeiro'
                  ? 'Criar Conta & Cadastrar Barbearia'
                  : 'Criar Minha Conta'
              }
              onPress={handleCadastrar}
              desabilitado={carregando}
              estiloContainer={styles.botaoPrincipal}
            />

            {carregando && (
              <ActivityIndicator color={theme.ouro} style={styles.loader} />
            )}
          </View>

          {/* Rodapé */}
          <TouchableOpacity onPress={() => router.back()} style={styles.rodape} activeOpacity={0.7}>
            <Text style={[styles.rodapeTexto, { color: theme.textoSecundario }]}>
              Já tem conta?{' '}
              <Text style={[styles.rodapeLink, { color: theme.ouroTexto }]}>Faça login</Text>
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
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  btnVoltar: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  seletorPerfil: {
    flexDirection: 'row',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: 4,
  },
  seletorItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  seletorItemAtivo: {
    backgroundColor: Colors.ouro,
  },
  seletorTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  seletorTextoAtivo: {
    color: Colors.textoEscuroSobreOuro,
    fontFamily: FontFamily.bold,
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
  cardHeader: { gap: 4 },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    lineHeight: 20,
  },
  badgeProfissional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.ouroTranslucido,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
    borderRadius: Radii.md,
    padding: Spacing.sm,
  },
  badgeProfissionalTexto: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.ouroClaro,
    lineHeight: 18,
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
  btnOlho: { padding: 6 },
  botaoPrincipal: { width: '100%', marginTop: Spacing.xs },
  loader: { alignSelf: 'center' },
  rodape: { paddingVertical: Spacing.md, alignItems: 'center' },
  rodapeTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  rodapeLink: {
    fontFamily: FontFamily.bold,
    color: Colors.ouro,
  },
});
