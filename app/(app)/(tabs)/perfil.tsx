import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  MessageCircle,
  MapPin,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { Avatar } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function TelaPerfil() {
  const { perfil, carregandoPerfil } = usePerfil();
  const { session } = useAuth();

  async function handleSair() {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja encerrar sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  }

  function handleAbrirWhatsApp() {
    const numero = '5586981907478';
    const msg = encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre a Barbearia Vieira.');
    Linking.openURL(`https://wa.me/${numero}?text=${msg}`).catch(() => {
      Alert.alert('Contato', 'Telefone Barbearia Vieira: (86) 98190-7478');
    });
  }

  function handleVerEndereco() {
    Alert.alert(
      'Barbearia Vieira 💈',
      'Atendimento de Terça a Domingo\n• Manhã: 08:00 às 11:00 (Agendamento no app)\n• Tarde: 13:30 às 18:00 (Ordem de chegada)\n\nContato: (86) 98190-7478'
    );
  }

  function handleVerPrivacidade() {
    Alert.alert(
      'Privacidade & Termos',
      'Seus dados são protegidos com segurança e criptografia de ponta a ponta na nuvem da Barbearia Vieira.'
    );
  }

  const nomeExibicao = carregandoPerfil
    ? 'Carregando...'
    : perfil?.nome_completo || 'Cliente Vieira';
  const emailExibicao = session?.user?.email || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Principal de Identidade */}
        <View style={styles.perfilCard}>
          <View style={styles.avatarWrapper}>
            <Avatar nome={nomeExibicao} tamanho={68} />
          </View>

          <View style={styles.perfilInfo}>
            <Text style={styles.perfilNome}>{nomeExibicao}</Text>
            <Text style={styles.perfilContato}>{perfil?.telefone || emailExibicao}</Text>
            <View style={styles.badgeCliente}>
              <Sparkles size={11} color={Colors.ouro} />
              <Text style={styles.badgeClienteTexto}>Cliente Barbearia Vieira</Text>
            </View>
          </View>
        </View>

        {/* Seção 1: Minha Conta */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>MINHA CONTA</Text>
          <View style={styles.cardGrupo}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert('Dados da Conta', `Nome: ${nomeExibicao}\nE-mail: ${emailExibicao}`);
              }}
            >
              <View style={styles.itemIconeContainer}>
                <User size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Dados do perfil</Text>
                <Text style={styles.itemSubtitulo}>Nome e informações de login</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert('Notificações', 'Lembretes automáticos por push estão ativos para seus agendamentos.');
              }}
            >
              <View style={styles.itemIconeContainer}>
                <Bell size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Notificações & Lembretes</Text>
                <Text style={styles.itemSubtitulo}>Avisos de abertura de agenda e cortes</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 2: Barbearia Vieira */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>BARBEARIA VIEIRA</Text>
          <View style={styles.cardGrupo}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={handleAbrirWhatsApp}
            >
              <View style={[styles.itemIconeContainer, styles.iconeWhatsapp]}>
                <MessageCircle size={18} color={Colors.verde} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>WhatsApp Oficial</Text>
                <Text style={styles.itemSubtitulo}>(86) 98190-7478 • Falar com o barbeiro</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={handleVerEndereco}
            >
              <View style={styles.itemIconeContainer}>
                <MapPin size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Horários & Atendimento</Text>
                <Text style={styles.itemSubtitulo}>Terça a Domingo (08:00 às 18:00)</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 3: Informações do App */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>INFORMAÇÕES</Text>
          <View style={styles.cardGrupo}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={handleVerPrivacidade}
            >
              <View style={styles.itemIconeContainer}>
                <ShieldCheck size={18} color={Colors.textoSecundario} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Privacidade e Segurança</Text>
                <Text style={styles.itemSubtitulo}>Proteção e tratamento dos seus dados</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <View style={styles.itemLinha}>
              <View style={styles.itemIconeContainer}>
                <Info size={18} color={Colors.textoSecundario} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Versão do aplicativo</Text>
                <Text style={styles.itemSubtitulo}>Barbearia Vieira v1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botão Sair */}
        <TouchableOpacity
          style={styles.botaoSair}
          onPress={handleSair}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={Colors.erro} />
          <Text style={styles.botaoSairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.lg,
    paddingBottom: Spacing.giant,
  },
  perfilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: Colors.ouro,
    borderRadius: 40,
    padding: 2,
  },
  perfilInfo: {
    flex: 1,
    gap: 3,
  },
  perfilNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
  perfilContato: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  badgeCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
  },
  badgeClienteTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.ouro,
  },
  secao: {
    gap: Spacing.xs,
  },
  secaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    letterSpacing: 1,
    marginLeft: 4,
  },
  cardGrupo: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borda,
    overflow: 'hidden',
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  itemIconeContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeWhatsapp: {
    backgroundColor: 'rgba(61, 191, 106, 0.15)',
  },
  itemTextoContainer: {
    flex: 1,
    gap: 2,
  },
  itemTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  itemSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  divisorItem: {
    height: 1,
    backgroundColor: Colors.borda,
    marginLeft: 56,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.25)',
  },
  botaoSairTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.erro,
  },
});
