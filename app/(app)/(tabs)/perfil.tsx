
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  CreditCard,
  MapPin,
  Shield,
  Lock,
  HelpCircle,
  Info,
  LogOut,
} from 'lucide-react-native';
import { Avatar, ItemLista } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii } from '@/theme';

import { usePerfil } from '@/hooks/usePerfil';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function TelaPerfil() {
  const { perfil, carregandoPerfil } = usePerfil();
  const { session } = useAuth();

  async function handleSair() {
    await supabase.auth.signOut();
    // O ControleRotas em _layout.tsx cuidará do redirecionamento
  }

  const opcoes = [
    { id: 'perfil', label: 'Meu perfil', icone: <User size={18} color={Colors.textoSecundario} /> },
    { id: 'notificacoes', label: 'Notificações', icone: <Bell size={18} color={Colors.textoSecundario} /> },
    { id: 'pagamento', label: 'Formas de pagamento', icone: <CreditCard size={18} color={Colors.textoSecundario} /> },
    { id: 'enderecos', label: 'Endereços', icone: <MapPin size={18} color={Colors.textoSecundario} /> },
    { id: 'seguranca', label: 'Segurança', icone: <Shield size={18} color={Colors.textoSecundario} /> },
    { id: 'privacidade', label: 'Privacidade', icone: <Lock size={18} color={Colors.textoSecundario} /> },
    { id: 'ajuda', label: 'Ajuda e suporte', icone: <HelpCircle size={18} color={Colors.textoSecundario} /> },
    { id: 'sobre', label: 'Sobre o app', icone: <Info size={18} color={Colors.textoSecundario} /> },
  ];

  const nomeExibicao = carregandoPerfil ? 'Carregando...' : perfil?.nome_completo || 'Usuário';
  const emailExibicao = session?.user?.email || '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Configurações</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar e dados */}
        <View style={styles.perfilCard}>
          <Avatar nome={nomeExibicao} tamanho={64} />
          <View style={styles.perfilInfo}>
            <Text style={styles.perfilNome}>{nomeExibicao}</Text>
            <Text style={styles.perfilTelefone}>{perfil?.telefone || emailExibicao}</Text>
          </View>
        </View>

        {/* Lista de opções */}
        <View style={styles.listaOpcoes}>
          {opcoes.map((opcao) => (
            <ItemLista
              key={opcao.id}
              titulo={opcao.label}
              iconeEsquerda={opcao.icone}
              mostrarSeta
              onPress={() => {
                // TODO: navegar para cada opção
              }}
              estilo={styles.itemOpcao}
            />
          ))}
        </View>

        {/* Sair */}
        <TouchableOpacity style={styles.botaoSair} onPress={handleSair} activeOpacity={0.7}>
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
    gap: Spacing.md,
    paddingBottom: Spacing.giant,
  },
  perfilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
  },
  perfilInfo: { gap: 4 },
  perfilNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
  perfilTelefone: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  listaOpcoes: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    overflow: 'hidden',
    gap: 1,
  },
  itemOpcao: {
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  botaoSairTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.erro,
  },
});
