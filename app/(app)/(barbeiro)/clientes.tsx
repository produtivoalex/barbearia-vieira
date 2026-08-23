import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Phone, MessageCircle, Search, X, Calendar, Award } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type ClienteResumo } from '@/hooks/usePainelBarbeiro';
import { Avatar } from '@/components';
import { useBarbearia } from '@/contexts/BarbeariaContext';

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatarDataCurta(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function TelaClientes() {
  const { barbearia } = useBarbearia();
  const { clientes, carregando, recarregar } = usePainelBarbeiro(barbearia?.id);
  const [busca, setBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteResumo | null>(null);

  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;
    const termo = busca.toLowerCase().trim();
    return clientes.filter(
      (c) =>
        (c.nome_completo && c.nome_completo.toLowerCase().includes(termo)) ||
        (c.telefone && c.telefone.includes(termo))
    );
  }, [clientes, busca]);

  function handleAbrirWhatsApp(telefone: string | null, nomeCliente: string | null) {
    if (!telefone) {
      Alert.alert('Sem telefone', 'Este cliente não possui número de WhatsApp cadastrado.');
      return;
    }
    const limpo = telefone.replace(/\D/g, '');
    const numFinal = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const msg = encodeURIComponent(`Olá ${nomeCliente || ''}, tudo bem? Aqui é da Barbearia Vieira!`);
    Linking.openURL(`https://wa.me/${numFinal}?text=${msg}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  }

  function handleFazerLigacao(telefone: string | null) {
    if (!telefone) {
      Alert.alert('Sem telefone', 'Este cliente não possui telefone cadastrado.');
      return;
    }
    const limpo = telefone.replace(/\D/g, '');
    Linking.openURL(`tel:${limpo}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível iniciar a chamada.');
    });
  }

  function renderCliente({ item }: { item: ClienteResumo }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => setClienteSelecionado(item)}
      >
        <Avatar nome={item.nome_completo || 'C'} tamanho={46} />

        <View style={styles.info}>
          <Text style={styles.nome} numberOfLines={1}>
            {item.nome_completo || 'Cliente sem nome'}
          </Text>
          <Text style={styles.detalhe}>
            {item.totalAgendamentos} {item.totalAgendamentos === 1 ? 'visita' : 'visitas'}
            {' · '}último: {formatarDataCurta(item.ultimoAtendimento)}
          </Text>
          {item.telefone && (
            <View style={styles.telefoneLinha}>
              <Phone size={12} color={Colors.verde} />
              <Text style={styles.telefone}>{item.telefone}</Text>
            </View>
          )}
        </View>

        <View style={styles.acoesCard}>
          {item.telefone && (
            <TouchableOpacity
              style={styles.botaoMiniWhats}
              onPress={() => handleAbrirWhatsApp(item.telefone, item.nome_completo)}
              activeOpacity={0.7}
            >
              <MessageCircle size={16} color={Colors.verde} />
            </TouchableOpacity>
          )}
          <View style={styles.visitasBadge}>
            <Text style={styles.visitasBadgeTexto}>{item.totalAgendamentos}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Clientes</Text>
        {!carregando && (
          <Text style={styles.contagem}>
            {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}
          </Text>
        )}
      </View>

      {/* Barra de Busca */}
      <View style={styles.buscaContainer}>
        <View style={styles.buscaWrapper}>
          <Search size={18} color="#8E8E93" />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar por nome ou telefone..."
            placeholderTextColor="#636366"
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} activeOpacity={0.7}>
              <X size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista */}
      {carregando && clientes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.vermelho} />
        </View>
      ) : (
        <FlatList
          data={clientesFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderCliente}
          refreshControl={
            <RefreshControl
              refreshing={carregando}
              onRefresh={recarregar}
              tintColor={Colors.vermelho}
              colors={[Colors.vermelho]}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Users size={48} color={Colors.textoDesabilitado} />
              <Text style={styles.vazioTitulo}>
                {busca.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
              </Text>
              <Text style={styles.vazioSubtitulo}>
                {busca.trim()
                  ? `Nenhum resultado corresponde a "${busca}".`
                  : 'Os clientes aparecerão aqui automaticamente após os atendimentos.'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.lista}
        />
      )}

      {/* ─── Modal de Detalhes do Cliente ─── */}
      <Modal
        visible={clienteSelecionado !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setClienteSelecionado(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setClienteSelecionado(null)}>
          <Pressable style={styles.modalConteudo} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />

            {clienteSelecionado && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalPerfilRow}>
                    <Avatar nome={clienteSelecionado.nome_completo || 'C'} tamanho={52} />
                    <View style={styles.modalPerfilTexto}>
                      <Text style={styles.modalNome}>
                        {clienteSelecionado.nome_completo || 'Cliente sem nome'}
                      </Text>
                      <Text style={styles.modalSub}>
                        Cliente Barbearia Vieira
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setClienteSelecionado(null)}
                    style={styles.modalBtnFechar}
                    activeOpacity={0.7}
                  >
                    <X size={20} color={Colors.textoSecundario} />
                  </TouchableOpacity>
                </View>

                {/* Métricas do Cliente */}
                <View style={styles.modalCardsGrid}>
                  <View style={styles.modalStatCard}>
                    <Award size={20} color={Colors.ouro} />
                    <Text style={styles.modalStatValor}>{clienteSelecionado.totalAgendamentos}</Text>
                    <Text style={styles.modalStatLabel}>Atendimentos</Text>
                  </View>

                  <View style={styles.modalStatCard}>
                    <Calendar size={20} color={Colors.verde} />
                    <Text style={styles.modalStatData}>
                      {formatarDataCurta(clienteSelecionado.ultimoAtendimento)}
                    </Text>
                    <Text style={styles.modalStatLabel}>Última Visita</Text>
                  </View>
                </View>

                {/* Contatos */}
                {clienteSelecionado.telefone && (
                  <View style={styles.contatoRow}>
                    <TouchableOpacity
                      style={styles.botaoWhatsapp}
                      onPress={() =>
                        handleAbrirWhatsApp(
                          clienteSelecionado.telefone,
                          clienteSelecionado.nome_completo
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={18} color="#FFFFFF" />
                      <Text style={styles.botaoContatoTexto}>Conversar no WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botaoTelefone}
                      onPress={() => handleFazerLigacao(clienteSelecionado.telefone)}
                      activeOpacity={0.8}
                    >
                      <Phone size={18} color="#FFFFFF" />
                      <Text style={styles.botaoContatoTexto}>Ligar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: '#FFFFFF',
  },
  contagem: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
  },
  buscaContainer: {
    paddingHorizontal: Spacing.telaH,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F22',
  },
  buscaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#262629',
  },
  buscaInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    flexGrow: 1,
    padding: Spacing.telaH,
    paddingBottom: Spacing.giant,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#262629',
    ...Shadows.card,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  detalhe: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
  },
  telefoneLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  telefone: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.verde,
  },
  acoesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botaoMiniWhats: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(61, 191, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitasBadge: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitasBadgeTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.vermelhoClaro,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.telaH,
    paddingTop: Spacing.giant,
  },
  vazioTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  vazioSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 280,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.giant,
    borderWidth: 1,
    borderColor: '#2E2E33',
    gap: Spacing.md,
  },
  modalTraco: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalPerfilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  modalPerfilTexto: {
    flex: 1,
    gap: 2,
  },
  modalNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: '#FFFFFF',
  },
  modalSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  modalBtnFechar: {
    padding: 6,
  },
  modalCardsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: '#222226',
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  modalStatValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: '#FFFFFF',
  },
  modalStatData: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalStatLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  contatoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  botaoWhatsapp: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: Radii.md,
  },
  botaoTelefone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: Radii.md,
  },
  botaoContatoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
});
