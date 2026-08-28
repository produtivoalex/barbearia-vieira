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
import { Users, Phone, MessageCircle, Search, X, Calendar, Award, Gift } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type ClienteResumo } from '@/hooks/usePainelBarbeiro';
import { Avatar } from '@/components';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatarDataCurta(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]} de ${d.getFullYear()}`;
}

function calcularDiasDesdeUltimo(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function TelaClientes() {
  const { theme, isEscuro } = useTheme();
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

  function handleAbrirWhatsApp(telefone: string | null, nomeCliente: string | null, diasAusente?: number | null) {
    if (!telefone) {
      Alert.alert('Sem telefone', 'Este cliente não possui número de WhatsApp cadastrado.');
      return;
    }
    const limpo = telefone.replace(/\D/g, '');
    const numFinal = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const nomeBarbearia = barbearia?.nome || 'Na Régua';
    const primeiroNome = nomeCliente?.split(' ')[0] || 'amigo';
    const mimoTitulo = barbearia?.mimo_ativo?.ativo ? barbearia.mimo_ativo.titulo : 'um mimo exclusivo';

    let msgTexto = `Olá, ${primeiroNome}! Tudo bem? Aqui é da ${nomeBarbearia}!`;
    if (diasAusente && diasAusente >= 20) {
      msgTexto = `Fala, ${primeiroNome}! Tudo ótimo? Passando para te avisar que a ${nomeBarbearia} liberou um presente especial para você: ${mimoTitulo}! Para resgatar, basta agendar seu horário no aplicativo ou me avisar por aqui. Abraço!`;
    }

    const msg = encodeURIComponent(msgTexto);
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
    const diasAusente = calcularDiasDesdeUltimo(item.ultimoAtendimento);
    const estaAusente = diasAusente !== null && diasAusente >= 20;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.superficie, borderColor: theme.borda, borderWidth: 1 },
          estaAusente && { borderColor: 'rgba(234, 179, 8, 0.4)', backgroundColor: isEscuro ? '#191712' : '#FFFDF5' },
        ]}
        activeOpacity={0.75}
        onPress={() => setClienteSelecionado(item)}
      >
        <Avatar nome={item.nome_completo || 'C'} tamanho={46} />

        <View style={styles.info}>
          <View style={styles.nomeLinha}>
            <Text style={[styles.nome, { color: theme.textoPrimario }]} numberOfLines={1}>
              {item.nome_completo || 'Cliente sem nome'}
            </Text>
            {estaAusente && (
              <View style={[styles.badgeMimo, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Gift size={10} color={theme.ouroTexto} />
                <Text style={[styles.badgeMimoTexto, { color: theme.ouroTexto }]}>Mimo VIP</Text>
              </View>
            )}
          </View>
          <Text style={[styles.detalhe, { color: theme.textoSecundario }]}>
            {item.totalAgendamentos} {item.totalAgendamentos === 1 ? 'visita' : 'visitas'}
            {' · '}último: {formatarDataCurta(item.ultimoAtendimento)}
          </Text>
          {item.telefone && (
            <View style={styles.telefoneLinha}>
              <Phone size={12} color={theme.verde} />
              <Text style={[styles.telefone, { color: theme.textoSecundario }]}>{item.telefone}</Text>
            </View>
          )}
        </View>

        <View style={styles.acoesCard}>
          {item.telefone && (
            <TouchableOpacity
              style={[styles.botaoMiniWhats, { backgroundColor: theme.superficie2 }, estaAusente && { backgroundColor: theme.ouroTranslucido }]}
              onPress={() => handleAbrirWhatsApp(item.telefone, item.nome_completo, diasAusente)}
              activeOpacity={0.7}
            >
              {estaAusente ? (
                <Gift size={16} color={theme.ouroTexto} />
              ) : (
                <MessageCircle size={16} color={theme.verde} />
              )}
            </TouchableOpacity>
          )}
          <View style={[styles.visitasBadge, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
            <Text style={[styles.visitasBadgeTexto, { color: theme.ouroTexto }]}>{item.totalAgendamentos}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Clientes</Text>
        {!carregando && (
          <Text style={[styles.contagem, { color: theme.textoSecundario }]}>
            {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}
          </Text>
        )}
      </View>

      {/* Barra de Busca */}
      <View style={styles.buscaContainer}>
        <View style={[styles.buscaWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
          <Search size={18} color={theme.textoSecundario} />
          <TextInput
            style={[styles.buscaInput, { color: theme.textoPrimario }]}
            placeholder="Buscar por nome ou telefone..."
            placeholderTextColor={theme.textoDesabilitado}
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} activeOpacity={0.7}>
              <X size={16} color={theme.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista */}
      {carregando && clientes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.ouro} />
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
              tintColor={theme.ouro}
              colors={[theme.ouro]}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Users size={48} color={theme.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: theme.textoPrimario }]}>
                {busca.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
              </Text>
              <Text style={[styles.vazioSubtitulo, { color: theme.textoSecundario }]}>
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
          <Pressable style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            {clienteSelecionado && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalPerfilRow}>
                    <Avatar nome={clienteSelecionado.nome_completo || 'C'} tamanho={52} />
                    <View style={styles.modalPerfilTexto}>
                      <Text style={[styles.modalNome, { color: theme.textoPrimario }]}>
                        {clienteSelecionado.nome_completo || 'Cliente sem nome'}
                      </Text>
                      <Text style={[styles.modalSub, { color: theme.textoSecundario }]}>
                        Cliente {barbearia?.nome || 'Na Régua'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setClienteSelecionado(null)}
                    style={styles.modalBtnFechar}
                    activeOpacity={0.7}
                  >
                    <X size={20} color={theme.textoSecundario} />
                  </TouchableOpacity>
                </View>

                {/* Métricas do Cliente */}
                <View style={styles.modalCardsGrid}>
                  <View style={[styles.modalStatCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                    <Award size={20} color={theme.ouroTexto} />
                    <Text style={[styles.modalStatValor, { color: theme.textoPrimario }]}>{clienteSelecionado.totalAgendamentos}</Text>
                    <Text style={[styles.modalStatLabel, { color: theme.textoSecundario }]}>Atendimentos</Text>
                  </View>

                  <View style={[styles.modalStatCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                    <Calendar size={20} color={theme.verde} />
                    <Text style={[styles.modalStatData, { color: theme.textoPrimario }]}>
                      {formatarDataCurta(clienteSelecionado.ultimoAtendimento)}
                    </Text>
                    <Text style={[styles.modalStatLabel, { color: theme.textoSecundario }]}>Última Visita</Text>
                  </View>
                </View>

                {/* Se estiver ausente há +20 dias, exibe o Card de Mimo VIP */}
                {(() => {
                  const dias = calcularDiasDesdeUltimo(clienteSelecionado.ultimoAtendimento);
                  if (!dias || dias < 20) return null;
                  return (
                    <View style={[styles.modalCardMimo, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                      <View style={[styles.modalMimoIcone, { backgroundColor: theme.ouroTranslucido }]}>
                        <Gift size={20} color={theme.ouroTexto} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.modalMimoTitulo, { color: theme.ouroTexto }]}>
                          {barbearia?.mimo_ativo?.ativo ? barbearia.mimo_ativo.titulo : 'Mimo VIP de Reativação 🎁'}
                        </Text>
                        <Text style={[styles.modalMimoDesc, { color: theme.textoSecundario }]}>
                          {barbearia?.mimo_ativo?.descricao || 'Cliente ausente há +20 dias com presente exclusivo liberado.'}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Contatos */}
                {clienteSelecionado.telefone && (
                  <View style={styles.contatoRow}>
                    <TouchableOpacity
                      style={styles.botaoWhatsapp}
                      onPress={() => {
                        const dias = calcularDiasDesdeUltimo(clienteSelecionado.ultimoAtendimento);
                        handleAbrirWhatsApp(
                          clienteSelecionado.telefone,
                          clienteSelecionado.nome_completo,
                          dias
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={18} color="#FFFFFF" />
                      <Text style={styles.botaoContatoTexto}>
                        {(() => {
                          const dias = calcularDiasDesdeUltimo(clienteSelecionado.ultimoAtendimento);
                          return dias && dias >= 20 ? 'Enviar Oferta VIP no WhatsApp' : 'Conversar no WhatsApp';
                        })()}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.botaoTelefone, { backgroundColor: theme.superficie2, borderColor: theme.borda, borderWidth: 1 }]}
                      onPress={() => handleFazerLigacao(clienteSelecionado.telefone)}
                      activeOpacity={0.8}
                    >
                      <Phone size={18} color={theme.textoPrimario} />
                      <Text style={[styles.botaoContatoTexto, { color: theme.textoPrimario }]}>Ligar</Text>
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
  safe: { flex: 1, backgroundColor: Colors.fundo },
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
    color: Colors.textoPrimario,
  },
  contagem: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  buscaContainer: {
    paddingHorizontal: Spacing.telaH,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  buscaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  buscaInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
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
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  cardAusente: {
    borderColor: 'rgba(240, 165, 0, 0.3)',
    backgroundColor: Colors.superficie2,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nomeLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  nome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
    flexShrink: 1,
  },
  badgeMimo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.ouroTranslucido,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.bordaOuro,
  },
  badgeMimoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.ouro,
  },
  detalhe: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
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
  botaoMiniMimo: {
    backgroundColor: Colors.ouroTranslucido,
    borderWidth: 1,
    borderColor: Colors.bordaOuro,
  },
  visitasBadge: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitasBadgeTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
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
    color: Colors.textoPrimario,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  vazioSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
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
    backgroundColor: Colors.superficie,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.giant,
    borderWidth: 1,
    borderColor: Colors.bordaDestaque,
    gap: Spacing.md,
  },
  modalTraco: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bordaDestaque,
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
    color: Colors.textoPrimario,
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
    backgroundColor: Colors.superficie2,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.bordaDestaque,
  },
  modalStatValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  modalStatData: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  modalStatLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  modalCardMimo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(203, 161, 74, 0.08)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.bordaOuro,
  },
  modalMimoIcone: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.ouroTranslucido,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMimoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.ouro,
  },
  modalMimoDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textoSecundario,
    lineHeight: 16,
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
    color: Colors.textoPrimario,
  },
});
