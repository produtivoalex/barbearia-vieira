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
import {
  Users,
  Phone,
  MessageCircle,
  Search,
  X,
  Calendar,
  Award,
  Gift,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
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
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { barbearia } = useBarbearia();
  const { clientes, carregando, recarregar, enviarMimoCliente } = usePainelBarbeiro(barbearia?.id);
  const [busca, setBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteResumo | null>(null);
  const [enviandoMimo, setEnviandoMimo] = useState(false);

  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;
    const termo = busca.toLowerCase().trim();
    return clientes.filter(
      (c) =>
        (c.nome_completo && c.nome_completo.toLowerCase().includes(termo)) ||
        (c.telefone && c.telefone.includes(termo))
    );
  }, [clientes, busca]);

  async function handleEnviarNotificacaoApp(cliente: ClienteResumo) {
    if (!barbearia?.id) return;
    setEnviandoMimo(true);
    try {
      const mimoTitulo = barbearia?.mimo_ativo?.ativo ? barbearia.mimo_ativo.titulo : 'Mimo VIP de Reativação 🎁';
      const mimoDesc = barbearia?.mimo_ativo?.descricao || 'Passando para te avisar que preparamos um presente especial para você na barbearia!';
      await enviarMimoCliente(cliente.id, mimoTitulo, mimoDesc);
      Alert.alert('Notificação Enviada! 🔔', `O mimo foi enviado para o aplicativo de ${cliente.nome_completo || 'Cliente'}.`);
      if (clienteSelecionado?.id === cliente.id) {
        setClienteSelecionado((prev) => (prev ? { ...prev, mimoNotificacao: { id: 'temp', criada_em: new Date().toISOString(), lida_em: null } } : null));
      }
    } catch (err: any) {
      Alert.alert('Erro ao enviar', err.message || 'Tente novamente.');
    } finally {
      setEnviandoMimo(false);
    }
  }

  function handleAbrirWhatsApp(telefone: string | null, nomeCliente: string | null, diasAusente?: number | null, mimoNaoVisto?: boolean) {
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
    if (diasAusente && diasAusente >= 40) {
      msgTexto = `Fala, ${primeiroNome}! Tudo ótimo? Sentimos sua falta na ${nomeBarbearia}! Preparamos um presente especial para o seu próximo corte: ${mimoTitulo}! Para garantir, é só agendar pelo app ou responder essa mensagem. Te esperamos! 💈`;
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
    const estaAusente = diasAusente !== null && diasAusente >= 40;
    const mimo = item.mimoNotificacao;
    const diasDesdeNotificacao = mimo ? Math.floor((Date.now() - new Date(mimo.criada_em).getTime()) / (1000 * 60 * 60 * 24)) : null;
    const mimoNaoVistoApos3Dias = estaAusente && !!mimo && !mimo.lida_em && diasDesdeNotificacao !== null && diasDesdeNotificacao >= 3;
    const mimoLido = estaAusente && !!mimo && !!mimo.lida_em;
    const mimoAguardando = estaAusente && !!mimo && !mimo.lida_em && diasDesdeNotificacao !== null && diasDesdeNotificacao < 3;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.superficie, borderColor: theme.borda, borderWidth: 1 },
          estaAusente && { borderColor: 'rgba(234, 179, 8, 0.4)', backgroundColor: isEscuro ? '#191712' : '#FFFDF5' },
          mimoNaoVistoApos3Dias && { borderColor: 'rgba(239, 68, 68, 0.4)' },
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
            {mimoNaoVistoApos3Dias ? (
              <View style={[styles.badgeMimo, { backgroundColor: theme.erroClaro, borderColor: theme.erro }]}>
                <AlertCircle size={10} color={theme.erro} />
                <Text style={[styles.badgeMimoTexto, { color: theme.erro }]}>WhatsApp Pendente</Text>
              </View>
            ) : mimoLido ? (
              <View style={[styles.badgeMimo, { backgroundColor: theme.verdeClaro, borderColor: theme.verde }]}>
                <CheckCircle2 size={10} color={theme.verde} />
                <Text style={[styles.badgeMimoTexto, { color: theme.verde }]}>Viu no App</Text>
              </View>
            ) : mimoAguardando ? (
              <View style={[styles.badgeMimo, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Clock size={10} color={theme.ouroTexto} />
                <Text style={[styles.badgeMimoTexto, { color: theme.ouroTexto }]}>No App ({diasDesdeNotificacao}d)</Text>
              </View>
            ) : estaAusente ? (
              <View style={[styles.badgeMimo, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Gift size={10} color={theme.ouroTexto} />
                <Text style={[styles.badgeMimoTexto, { color: theme.ouroTexto }]}>Ausente 40d+</Text>
              </View>
            ) : null}
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
              style={[
                styles.botaoMiniWhats,
                { backgroundColor: theme.superficie2 },
                estaAusente && { backgroundColor: theme.ouroTranslucido },
                mimoNaoVistoApos3Dias && { backgroundColor: '#25D366' },
              ]}
              onPress={() => handleAbrirWhatsApp(item.telefone, item.nome_completo, diasAusente, mimoNaoVistoApos3Dias)}
              activeOpacity={0.7}
            >
              {mimoNaoVistoApos3Dias ? (
                <MessageCircle size={16} color="#FFFFFF" />
              ) : estaAusente ? (
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
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Clientes</Text>
        {!carregando && (
          <Text style={[styles.contagem, { color: theme.textoSecundario }]}>
            {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}
          </Text>
        )}
      </View>

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
          contentContainerStyle={[
            styles.lista,
            clientesFiltrados.length === 0 && styles.listaVazia,
          ]}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Users size={48} color={theme.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: theme.textoPrimario }]}>
                {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </Text>
              <Text style={[styles.vazioSubtitulo, { color: theme.textoSecundario }]}>
                {busca
                  ? 'Tente outro termo de busca.'
                  : 'Os clientes aparecerão aqui conforme realizarem agendamentos.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de Detalhes do Cliente */}
      <Modal
        visible={!!clienteSelecionado}
        transparent
        animationType="slide"
        onRequestClose={() => setClienteSelecionado(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setClienteSelecionado(null)} />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda, maxHeight: '88%' }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.bordaDestaque }]} />

            {clienteSelecionado && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalPerfilRow}>
                    <Avatar nome={clienteSelecionado.nome_completo || 'C'} tamanho={52} />
                    <View style={styles.modalPerfilTexto}>
                      <Text style={[styles.modalNome, { color: theme.textoPrimario }]} numberOfLines={1}>
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
                    <Text style={[styles.modalStatLabel, { color: theme.textoSecundario }]}>
                      Última Visita ({calcularDiasDesdeUltimo(clienteSelecionado.ultimoAtendimento)}d atrás)
                    </Text>
                  </View>
                </View>

                {/* Se estiver ausente há +40 dias, exibe o Fluxo Inteligente de Reativação */}
                {(() => {
                  const dias = calcularDiasDesdeUltimo(clienteSelecionado.ultimoAtendimento);
                  if (!dias || dias < 40) return null;

                  const mimo = clienteSelecionado.mimoNotificacao;
                  const diasDesdeNotificacao = mimo ? Math.floor((Date.now() - new Date(mimo.criada_em).getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const mimoNaoVistoApos3Dias = !!mimo && !mimo.lida_em && diasDesdeNotificacao !== null && diasDesdeNotificacao >= 3;
                  const mimoLido = !!mimo && !!mimo.lida_em;
                  const mimoAguardando = !!mimo && !mimo.lida_em && diasDesdeNotificacao !== null && diasDesdeNotificacao < 3;

                  return (
                    <View style={[styles.modalCardMimo, { backgroundColor: theme.superficie2, borderColor: mimoNaoVistoApos3Dias ? theme.erro : theme.bordaOuro }]}>
                      <View style={[styles.modalMimoIcone, { backgroundColor: theme.ouroTranslucido }]}>
                        <Gift size={20} color={theme.ouroTexto} />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.modalMimoTitulo, { color: theme.ouroTexto }]}>
                            {barbearia?.mimo_ativo?.ativo ? barbearia.mimo_ativo.titulo : 'Mimo VIP de Reativação 🎁'}
                          </Text>
                        </View>
                        <Text style={[styles.modalMimoDesc, { color: theme.textoSecundario }]}>
                          {barbearia?.mimo_ativo?.descricao || 'Cliente ausente há +40 dias. Reative este cliente com um presente.'}
                        </Text>

                        {/* Status da Esteira */}
                        {!mimo ? (
                          <View style={styles.mimoStatusContainer}>
                            <Text style={[styles.mimoStatusTexto, { color: theme.textoSecundario }]}>
                              Passo 1: Envie primeiro a notificação com o mimo pelo aplicativo.
                            </Text>
                            <TouchableOpacity
                              style={[styles.btnEnviarMimoApp, { backgroundColor: theme.ouro }]}
                              onPress={() => handleEnviarNotificacaoApp(clienteSelecionado)}
                              disabled={enviandoMimo}
                              activeOpacity={0.8}
                            >
                              {enviandoMimo ? (
                                <ActivityIndicator size="small" color={theme.textoEscuroSobreOuro} />
                              ) : (
                                <>
                                  <Bell size={14} color={theme.textoEscuroSobreOuro} />
                                  <Text style={[styles.btnEnviarMimoAppTexto, { color: theme.textoEscuroSobreOuro }]}>
                                    Enviar Notificação no App
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        ) : mimoAguardando ? (
                          <View style={[styles.mimoAvisoBox, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                            <Clock size={14} color={theme.ouroTexto} />
                            <Text style={[styles.mimoAvisoTexto, { color: theme.ouroTexto }]}>
                              Notificação enviada no app ({diasDesdeNotificacao === 0 ? 'hoje' : `há ${diasDesdeNotificacao}d`}). Aguardando leitura (3 dias de prazo antes do WhatsApp).
                            </Text>
                          </View>
                        ) : mimoNaoVistoApos3Dias ? (
                          <View style={[styles.mimoAvisoBox, { backgroundColor: theme.erroClaro, borderColor: theme.erro }]}>
                            <AlertCircle size={14} color={theme.erro} />
                            <Text style={[styles.mimoAvisoTexto, { color: theme.erro }]}>
                              Cliente não abriu o app há {diasDesdeNotificacao} dias. Recomendado enviar a mensagem no WhatsApp abaixo!
                            </Text>
                          </View>
                        ) : mimoLido ? (
                          <View style={[styles.mimoAvisoBox, { backgroundColor: theme.verdeClaro, borderColor: theme.verde }]}>
                            <CheckCircle2 size={14} color={theme.verde} />
                            <Text style={[styles.mimoAvisoTexto, { color: theme.verde }]}>
                              Cliente visualizou a notificação do presente no aplicativo!
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })()}

                {/* Contatos */}
                {clienteSelecionado.telefone && (
                  <View style={styles.contatoRow}>
                    {(() => {
                      const dias = calcularDiasDesdeUltimo(clienteSelecionado.ultimoAtendimento);
                      const estaAusente = dias !== null && dias >= 40;
                      const mimo = clienteSelecionado.mimoNotificacao;
                      const diasDesdeNotificacao = mimo ? Math.floor((Date.now() - new Date(mimo.criada_em).getTime()) / (1000 * 60 * 60 * 24)) : null;
                      const mimoNaoVistoApos3Dias = estaAusente && !!mimo && !mimo.lida_em && diasDesdeNotificacao !== null && diasDesdeNotificacao >= 3;

                      return (
                        <TouchableOpacity
                          style={[
                            styles.botaoWhatsapp,
                            mimoNaoVistoApos3Dias && { borderWidth: 2, borderColor: '#FFFFFF' },
                          ]}
                          onPress={() => {
                            handleAbrirWhatsApp(
                              clienteSelecionado.telefone,
                              clienteSelecionado.nome_completo,
                              dias,
                              mimoNaoVistoApos3Dias
                            );
                          }}
                          activeOpacity={0.8}
                        >
                          <MessageCircle size={18} color="#FFFFFF" />
                          <Text style={styles.botaoContatoTexto}>
                            {mimoNaoVistoApos3Dias
                              ? 'Enviar Oferta no WhatsApp'
                              : 'Conversar no WhatsApp'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })()}

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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.fundo },
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
      color: theme.textoPrimario,
    },
    contagem: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    buscaContainer: {
      paddingHorizontal: Spacing.telaH,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
    },
    buscaWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      gap: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    buscaInput: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
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
    listaVazia: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      padding: Spacing.md,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
      ...Shadows.card,
    },
    cardAusente: {
      borderColor: theme.ouro,
      backgroundColor: theme.superficie2,
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
      color: theme.textoPrimario,
      flexShrink: 1,
    },
    badgeMimo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    badgeMimoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
      color: theme.ouroTexto,
    },
    detalhe: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
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
      color: theme.verde,
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
      backgroundColor: theme.verdeClaro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botaoMiniMimo: {
      backgroundColor: theme.ouroTranslucido,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    visitasBadge: {
      width: 32,
      height: 32,
      borderRadius: Radii.full,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    visitasBadgeTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.ouroTexto,
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
      color: theme.textoPrimario,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    vazioSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      color: theme.textoSecundario,
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
      backgroundColor: theme.superficie,
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.giant,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: Spacing.md,
    },
    modalTraco: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.bordaDestaque,
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
      color: theme.textoPrimario,
    },
    modalSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.ouroTexto,
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
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.md,
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    modalStatValor: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.displayMd,
      color: theme.textoPrimario,
    },
    modalStatData: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
      textAlign: 'center',
    },
    modalStatLabel: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
    },
    modalCardMimo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.ouroTranslucido,
      borderRadius: Radii.md,
      padding: Spacing.md,
      gap: Spacing.md,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    modalMimoIcone: {
      width: 40,
      height: 40,
      borderRadius: Radii.md,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalMimoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
      color: theme.ouroTexto,
    },
    modalMimoDesc: {
      fontFamily: FontFamily.regular,
      fontSize: 12,
      color: theme.textoSecundario,
      lineHeight: 16,
    },
    mimoStatusContainer: {
      marginTop: 4,
      gap: 6,
    },
    mimoStatusTexto: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      lineHeight: 15,
    },
    btnEnviarMimoApp: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: Radii.sm,
      marginTop: 2,
    },
    btnEnviarMimoAppTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
    mimoAvisoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 8,
      borderRadius: Radii.sm,
      borderWidth: 1,
      marginTop: 4,
    },
    mimoAvisoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
      flex: 1,
      lineHeight: 14,
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
