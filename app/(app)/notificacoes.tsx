import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, AlertTriangle, X, Scissors, Calendar } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useBarbearia } from '@/contexts/BarbeariaContext';

interface ItemAlterado {
  servico_id: string;
  nome: string;
  preco_anterior: number;
  novo_preco: number;
}

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  dados: {
    ofertaId?: string;
    dataVigencia?: string;
    justificativa?: string | null;
    itens?: ItemAlterado[];
  };
  lida_em: string | null;
  criada_em: string;
}

export default function TelaNotificacoes() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const { session } = useAuth();
  const { barbearia } = useBarbearia();
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [notificacaoReajusteSelecionada, setNotificacaoReajusteSelecionada] = useState<Notificacao | null>(null);

  const carregar = useCallback(async () => {
    if (!session?.user?.id) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    let consulta = supabase
      .from('notifications')
      .select('id, tipo, titulo, mensagem, dados, lida_em, criada_em')
      .eq('usuario_id', session.user.id)
      .order('criada_em', { ascending: false })
      .limit(50);
    if (barbearia?.id) consulta = consulta.eq('barbearia_id', barbearia.id);
    const { data } = await consulta;

    setItens((data as unknown as Notificacao[]) ?? []);
    setCarregando(false);
  }, [session?.user?.id, barbearia?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function abrir(item: Notificacao) {
    if (!item.lida_em) {
      await supabase
        .from('notifications')
        .update({ lida_em: new Date().toISOString() })
        .eq('id', item.id);

      setItens((atual) =>
        atual.map((notificacao) =>
          notificacao.id === item.id ? { ...notificacao, lida_em: new Date().toISOString() } : notificacao
        )
      );
    }

    if (item.tipo === 'oferta_fila' && item.dados?.ofertaId) {
      router.push({
        pathname: '/(app)/lista-espera/oferta',
        params: { ofertaId: item.dados.ofertaId },
      });
    } else if (item.tipo === 'reajuste_preco') {
      setNotificacaoReajusteSelecionada(item);
    }
  }

  function isImportanteAtivo(item: Notificacao): boolean {
    if (item.tipo !== 'reajuste_preco') return false;
    // O selo de importante fica ativo até a data da mudança
    if (!item.dados?.dataVigencia) return true;

    try {
      const partes = item.dados.dataVigencia.split('/');
      if (partes.length === 3) {
        const dataVig = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]), 23, 59, 59);
        return new Date() <= dataVig;
      }
    } catch {
      return true;
    }
    return true;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={theme.textoPrimario} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Notificações</Text>
        <View style={styles.placeholder} />
      </View>

      {carregando && itens.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.ouro} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={carregando}
              onRefresh={carregar}
              tintColor={theme.ouro}
            />
          }
        >
          {itens.length === 0 ? (
            <View style={styles.vazio}>
              <Bell size={42} color={theme.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: theme.textoPrimario }]}>Tudo em dia</Text>
              <Text style={[styles.vazioTexto, { color: theme.textoSecundario }]}>Avisos importantes e comunicados aparecerão aqui.</Text>
            </View>
          ) : (
            itens.map((item) => {
              const temSeloImportante = isImportanteAtivo(item);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    { backgroundColor: theme.superficie, borderColor: theme.borda, borderWidth: 1 },
                    !item.lida_em && { borderLeftWidth: 3, borderLeftColor: theme.ouro },
                    temSeloImportante && { borderColor: 'rgba(234, 179, 8, 0.4)', backgroundColor: isEscuro ? '#181712' : '#FFFDF5' },
                  ]}
                  onPress={() => abrir(item)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.icone, { backgroundColor: theme.superficie2 }, temSeloImportante && styles.iconeImportante]}>
                    {temSeloImportante ? (
                      <AlertTriangle size={18} color={theme.amarelo} />
                    ) : (
                      <Bell size={18} color={item.lida_em ? theme.textoSecundario : theme.ouroTexto} />
                    )}
                  </View>

                  <View style={styles.conteudo}>
                    {/* Selo IMPORTANTE (permanece visível mesmo após lida até a data da mudança) */}
                    {temSeloImportante && (
                      <View style={styles.badgeImportante}>
                        <AlertTriangle size={11} color={theme.amarelo} />
                        <Text style={styles.badgeImportanteTexto}>
                          IMPORTANTE {item.dados?.dataVigencia ? `· VIGÊNCIA EM ${item.dados.dataVigencia}` : ''}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.cardTitulo, { color: theme.textoPrimario }]}>{item.titulo}</Text>
                    <Text style={[styles.mensagem, { color: theme.textoSecundario }]}>{item.mensagem}</Text>
                    <Text style={[styles.data, { color: theme.textoDesabilitado }]}>{new Date(item.criada_em).toLocaleString('pt-BR')}</Text>

                    {item.tipo === 'reajuste_preco' && (
                      <View style={styles.ctaSaibaMais}>
                        <Text style={[styles.ctaSaibaMaisTexto, { color: theme.ouroTexto }]}>Toque para ver os valores e detalhes</Text>
                        <ChevronRight size={14} color={theme.ouroTexto} />
                      </View>
                    )}
                  </View>

                  {item.tipo === 'oferta_fila' && <ChevronRight size={18} color={theme.textoSecundario} />}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ─── Modal de Detalhes do Reajuste ─── */}
      <Modal
        visible={notificacaoReajusteSelecionada !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificacaoReajusteSelecionada(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setNotificacaoReajusteSelecionada(null)}>
          <Pressable style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            {notificacaoReajusteSelecionada && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Scissors size={20} color={theme.ouroTexto} />
                    <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Comunicado de Valores</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setNotificacaoReajusteSelecionada(null)}
                    style={styles.modalBtnFechar}
                  >
                    <X size={20} color={theme.textoSecundario} />
                  </TouchableOpacity>
                </View>

                {notificacaoReajusteSelecionada.dados?.dataVigencia && (
                  <View style={[styles.vigenciaBox, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                    <Calendar size={16} color={theme.ouroTexto} />
                    <Text style={[styles.vigenciaTexto, { color: theme.ouroTexto }]}>
                      Entrada em vigor: <Text style={{ fontFamily: FontFamily.bold, color: theme.textoPrimario }}>{notificacaoReajusteSelecionada.dados.dataVigencia}</Text>
                    </Text>
                  </View>
                )}

                {/* Lista de Itens com Preço Antigo -> Novo Preço */}
                <Text style={[styles.modalSecaoTitulo, { color: theme.textoSecundario }]}>TABELA DE VALORES REAJUSTADOS</Text>
                <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                  {notificacaoReajusteSelecionada.dados?.itens && notificacaoReajusteSelecionada.dados.itens.length > 0 ? (
                    notificacaoReajusteSelecionada.dados.itens.map((item, idx) => (
                      <View key={idx} style={[styles.itemPrecoLinha, { borderBottomColor: theme.borda }]}>
                        <Text style={[styles.itemPrecoNome, { color: theme.textoPrimario }]}>{item.nome}</Text>
                        <View style={styles.itemPrecoValores}>
                          <Text style={[styles.itemPrecoAntigo, { color: theme.textoSecundario }]}>
                            R$ {Number(item.preco_anterior).toFixed(2)}
                          </Text>
                          <Text style={[styles.itemPrecoSeta, { color: theme.ouroTexto }]}>→</Text>
                          <Text style={[styles.itemPrecoNovo, { color: theme.verde }]}>
                            R$ {Number(item.novo_preco).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.mensagemCompleta, { color: theme.textoSecundario }]}>{notificacaoReajusteSelecionada.mensagem}</Text>
                  )}
                </ScrollView>

                {/* Mensagem Opcional do Barbeiro (só exibida se o barbeiro tiver colocado) */}
                {notificacaoReajusteSelecionada.dados?.justificativa && (
                  <View style={[styles.justificativaBox, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                    <Text style={[styles.justificativaTitulo, { color: theme.ouroTexto }]}>Mensagem da Barbearia:</Text>
                    <Text style={[styles.justificativaTexto, { color: theme.textoPrimario }]}>
                      "{notificacaoReajusteSelecionada.dados.justificativa}"
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.botaoEntendido, { backgroundColor: theme.ouro }]}
                  onPress={() => setNotificacaoReajusteSelecionada(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.botaoEntendidoTexto, { color: theme.textoEscuroSobreOuro }]}>Entendido</Text>
                </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.telaH,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  titulo: { fontFamily: FontFamily.bold, fontSize: FontSize.headingSm, color: Colors.textoPrimario },
  placeholder: { width: 24 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lista: { padding: Spacing.telaH, gap: Spacing.sm, paddingBottom: Spacing.giant },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
  },
  cardNaoLido: { borderLeftWidth: 3, borderLeftColor: Colors.ouro },
  cardComImportante: {
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    backgroundColor: Colors.superficie,
  },
  icone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.superficie2,
    marginTop: 2,
  },
  iconeImportante: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  conteudo: { flex: 1, gap: 3 },
  badgeImportante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  badgeImportanteTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.amarelo,
    letterSpacing: 0.5,
  },
  cardTitulo: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyMd, color: Colors.textoPrimario },
  mensagem: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, color: Colors.textoSecundario },
  data: { fontFamily: FontFamily.regular, fontSize: FontSize.labelXs, color: Colors.textoDesabilitado, marginTop: 2 },
  ctaSaibaMais: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  ctaSaibaMaisTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
  },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, padding: Spacing.telaH },
  vazioTitulo: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyLg, color: Colors.textoPrimario },
  vazioTexto: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: Colors.textoSecundario },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    gap: Spacing.sm,
    maxHeight: '85%',
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
  modalTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
  modalBtnFechar: { padding: 4 },
  vigenciaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(203, 161, 74, 0.12)',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.25)',
  },
  vigenciaTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  modalSecaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  itemPrecoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  itemPrecoNome: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
  },
  itemPrecoValores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemPrecoAntigo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    textDecorationLine: 'line-through',
  },
  itemPrecoSeta: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
  },
  itemPrecoNovo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.verde,
  },
  mensagemCompleta: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#D4D4D8',
    lineHeight: 20,
    paddingVertical: Spacing.xs,
  },
  justificativaBox: {
    backgroundColor: Colors.superficie2,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.bordaDestaque,
    gap: 2,
  },
  justificativaTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
  },
  justificativaTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#E4E4E7',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  botaoEntendido: {
    backgroundColor: Colors.ouro,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  botaoEntendidoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoEscuroSobreOuro,
  },
});
