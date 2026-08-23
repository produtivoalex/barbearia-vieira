import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Scissors, User, Phone, MessageCircle, X, Calendar, Zap, CalendarPlus } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type AgendamentoBarbeiro } from '@/hooks/usePainelBarbeiro';
import { useAgendaSemanal } from '@/hooks/useAgendaSemanal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatarDataCurta(iso: string) {
  const d = new Date(iso);
  return `${DIAS_CURTOS[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TelaBarbeiroSemana() {
  const router = useRouter();
  const { session } = useAuth();
  const { agendamentosSemana, carregando, recarregar } = usePainelBarbeiro();
  const { carregarProximaParaBarbeiro } = useAgendaSemanal();
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoBarbeiro | null>(null);
  const [agendaProxima, setAgendaProxima] = useState<any | null>(null);
  const [liberando, setLiberando] = useState(false);

  const carregarStatusAgenda = useCallback(async () => {
    const dados = await carregarProximaParaBarbeiro();
    setAgendaProxima(dados);
  }, [carregarProximaParaBarbeiro]);

  useEffect(() => {
    carregarStatusAgenda();
  }, [carregarStatusAgenda]);

  // Agrupa agendamentos por dia (chave: YYYY-MM-DD)
  const porDia = useMemo(() => {
    const mapa = new Map<string, AgendamentoBarbeiro[]>();
    for (const ag of agendamentosSemana) {
      const chave = ag.data_hora.slice(0, 10);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(ag);
    }
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [agendamentosSemana]);

  // Métricas da semana
  const { labelSemana, totalFaturamentoSemana } = useMemo(() => {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const diffSeg = diaSemana === 0 ? -6 : 1 - diaSemana;
    const segunda = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + diffSeg);
    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);

    const fmtData = (d: Date) => `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`;
    const faturamento = agendamentosSemana.reduce((acc, a) => acc + Number(a.servico.preco), 0);

    return {
      labelSemana: `${fmtData(segunda)} – ${fmtData(domingo)}`,
      totalFaturamentoSemana: faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    };
  }, [agendamentosSemana]);

  async function handleLiberarAgendaAgora() {
    if (!session?.user?.id || !agendaProxima?.id) return;
    setLiberando(true);
    try {
      const { error } = await supabase
        .from('agendas_semanais')
        .update({
          status: 'aberta',
          data_abertura_programada: new Date().toISOString(),
        })
        .eq('id', agendaProxima.id);

      if (error) throw error;

      await supabase.rpc('notificar_todos_clientes', {
        p_titulo: 'Agenda Semanal Aberta! 💈',
        p_mensagem: 'A agenda da próxima semana está aberta! Escolha seu serviço e garanta seu horário.',
        p_tipo: 'abertura_agenda',
        p_dados: { agenda_id: agendaProxima.id },
      });

      await carregarStatusAgenda();
      Alert.alert('Agenda Liberada! 🚀', 'A agenda foi aberta e já está disponível para qualquer cliente agendar no aplicativo.');
    } catch (err: any) {
      Alert.alert('Erro ao liberar', err.message || 'Tente novamente.');
    } finally {
      setLiberando(false);
    }
  }

  function handleAbrirWhatsApp(telefone: string | null, nomeCliente: string | null) {
    if (!telefone) {
      Alert.alert('Sem telefone', 'Este cliente não possui número cadastrado.');
      return;
    }
    const limpo = telefone.replace(/\D/g, '');
    const numFinal = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const msg = encodeURIComponent(`Olá ${nomeCliente || ''}, aqui é da Barbearia Vieira sobre o seu agendamento.`);
    Linking.openURL(`https://wa.me/${numFinal}?text=${msg}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  }

  function handleFazerLigacao(telefone: string | null) {
    if (!telefone) {
      Alert.alert('Sem telefone', 'Este cliente não possui número cadastrado.');
      return;
    }
    const limpo = telefone.replace(/\D/g, '');
    Linking.openURL(`tel:${limpo}`).catch(() => {
      Alert.alert('Erro', 'Não foi possível iniciar a chamada.');
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Agenda Semanal</Text>
          <Text style={styles.subtitulo}>{labelSemana}</Text>
        </View>
        <View style={styles.metricasTopo}>
          <Text style={styles.metricasTopoAgendamentos}>{agendamentosSemana.length} cortes</Text>
          <Text style={styles.metricasTopoValor}>{totalFaturamentoSemana}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={carregando}
            onRefresh={() => {
              recarregar();
              carregarStatusAgenda();
            }}
            tintColor={Colors.vermelho}
            colors={[Colors.vermelho]}
          />
        }
      >
        {/* Banner de Gerenciamento / Liberação Rápida da Próxima Semana */}
        <View style={styles.cardAberturaRapida}>
          {agendaProxima?.status === 'programada' ? (
            <View style={styles.linhaAberturaProgramada}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.aberturaRapidaTitulo}>Próxima Semana Programada</Text>
                <Text style={styles.aberturaRapidaSub}>Abertura agendada para segunda-feira</Text>
              </View>
              <TouchableOpacity
                style={styles.botaoLiberarAgora}
                onPress={handleLiberarAgendaAgora}
                disabled={liberando}
                activeOpacity={0.8}
              >
                {liberando ? (
                  <ActivityIndicator size="small" color="#0E0E0E" />
                ) : (
                  <>
                    <Zap size={14} color="#0E0E0E" />
                    <Text style={styles.botaoLiberarAgoraTexto}>Liberar Agora</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : agendaProxima?.status === 'aberta' ? (
            <View style={styles.linhaAberturaAberta}>
              <View style={styles.badgeAberta}>
                <Zap size={14} color={Colors.verde} />
                <Text style={styles.badgeAbertaTexto}>AGENDA DA PRÓXIMA SEMANA ABERTA 🟢</Text>
              </View>
              <TouchableOpacity
                style={styles.btnEditarAgenda}
                onPress={() => router.push('/(app)/(barbeiro)/preparar-agenda')}
                activeOpacity={0.7}
              >
                <Text style={styles.btnEditarAgendaTexto}>Ajustar Vagas</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.btnCriarAgenda}
              onPress={() => router.push('/(app)/(barbeiro)/preparar-agenda')}
              activeOpacity={0.8}
            >
              <CalendarPlus size={16} color="#FFFFFF" />
              <Text style={styles.btnCriarAgendaTexto}>Preparar Agenda da Próxima Semana</Text>
            </TouchableOpacity>
          )}
        </View>

        {carregando && agendamentosSemana.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.vermelho} />
          </View>
        ) : porDia.length === 0 ? (
          <View style={styles.vazio}>
            <Calendar size={36} color={Colors.textoDesabilitado} />
            <Text style={styles.vazioTitulo}>Sem agendamentos nesta semana</Text>
            <Text style={styles.vazioTexto}>
              Assim que os clientes realizarem agendamentos, eles serão organizados aqui por dia.
            </Text>
          </View>
        ) : (
          porDia.map(([chave, itens]) => {
            const faturamentoDia = itens.reduce((acc, a) => acc + Number(a.servico.preco), 0);
            return (
              <View key={chave} style={styles.grupodia}>
                {/* Cabeçalho do dia */}
                <View style={styles.diaCabecalho}>
                  <Text style={styles.diaNome}>{formatarDataCurta(itens[0].data_hora)}</Text>
                  <View style={styles.diaBadges}>
                    <Text style={styles.diaFaturamento}>
                      {faturamentoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeTexto}>{itens.length} {itens.length === 1 ? 'ag.' : 'ag.'}</Text>
                    </View>
                  </View>
                </View>

                {/* Cards do dia */}
                {itens.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.cardItem}
                    activeOpacity={0.75}
                    onPress={() => setAgendamentoSelecionado(item)}
                  >
                    <View style={styles.cardHorario}>
                      <Text style={styles.cardHora}>{formatarHora(item.data_hora)}</Text>
                      <Text style={styles.cardDuracao}>{item.servico.duracao_minutos}min</Text>
                    </View>

                    <View style={styles.divisorVertical} />

                    <View style={styles.cardInfo}>
                      <Text style={styles.clienteNome} numberOfLines={1}>
                        {item.cliente.nome_completo || 'Cliente'}
                      </Text>
                      <Text style={styles.servicoNome} numberOfLines={1}>
                        {item.servico.nome}
                      </Text>
                    </View>

                    <View style={styles.cardFim}>
                      <Text style={styles.preco}>
                        {Number(item.servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Detalhes do Agendamento */}
      <Modal
        visible={agendamentoSelecionado !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAgendamentoSelecionado(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAgendamentoSelecionado(null)}>
          <Pressable style={styles.modalConteudo} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />

            {agendamentoSelecionado && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.modalTitulo}>Detalhes do Agendamento</Text>
                    <Text style={styles.modalSubtitulo}>
                      {formatarDataCurta(agendamentoSelecionado.data_hora)} às {formatarHora(agendamentoSelecionado.data_hora)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAgendamentoSelecionado(null)}
                    style={styles.modalBtnFechar}
                  >
                    <X size={20} color={Colors.textoSecundario} />
                  </TouchableOpacity>
                </View>

                {/* Card do Cliente */}
                <View style={styles.modalCardCliente}>
                  <View style={styles.avatar}>
                    <User size={20} color={Colors.ouro} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.modalClienteNome}>
                      {agendamentoSelecionado.cliente.nome_completo || 'Cliente'}
                    </Text>
                    <Text style={styles.modalClienteTelefone}>
                      {agendamentoSelecionado.cliente.telefone || 'Sem telefone'}
                    </Text>
                  </View>
                </View>

                {/* Detalhes do Serviço */}
                <View style={styles.modalCardServico}>
                  <View style={styles.modalLinhaInfo}>
                    <Scissors size={16} color={Colors.ouro} />
                    <Text style={styles.modalServicoNome}>{agendamentoSelecionado.servico.nome}</Text>
                  </View>
                  <View style={styles.modalLinhaValores}>
                    <Text style={styles.modalDuracao}>{agendamentoSelecionado.servico.duracao_minutos} min</Text>
                    <Text style={styles.modalPreco}>
                      {Number(agendamentoSelecionado.servico.preco).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.modalBotoesAcao}>
                  <TouchableOpacity
                    style={[styles.modalBtnAcao, styles.btnWhatsApp]}
                    activeOpacity={0.8}
                    onPress={() =>
                      handleAbrirWhatsApp(
                        agendamentoSelecionado.cliente.telefone,
                        agendamentoSelecionado.cliente.nome_completo
                      )
                    }
                  >
                    <MessageCircle size={18} color="#FFFFFF" />
                    <Text style={styles.modalBtnAcaoTexto}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtnAcao, styles.btnLigar]}
                    activeOpacity={0.8}
                    onPress={() => handleFazerLigacao(agendamentoSelecionado.cliente.telefone)}
                  >
                    <Phone size={18} color="#FFFFFF" />
                    <Text style={styles.modalBtnAcaoTexto}>Ligar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: '#FFFFFF',
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  metricasTopo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metricasTopoAgendamentos: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  metricasTopoValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.verde,
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.lg,
    paddingBottom: Spacing.giant,
  },
  cardAberturaRapida: {
    backgroundColor: '#161618',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#262629',
    ...Shadows.card,
  },
  linhaAberturaProgramada: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  aberturaRapidaTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  aberturaRapidaSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  botaoLiberarAgora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.ouro,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.sm,
  },
  botaoLiberarAgoraTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: '#0E0E0E',
  },
  linhaAberturaAberta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeAberta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeAbertaTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.verde,
  },
  btnEditarAgenda: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnEditarAgendaTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
  },
  btnCriarAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.vermelho,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  btnCriarAgendaTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  vazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  vazioTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
    marginTop: Spacing.xs,
  },
  vazioTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    textAlign: 'center',
    lineHeight: 20,
  },
  grupodia: {
    gap: Spacing.xs,
  },
  diaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F22',
  },
  diaNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
    textTransform: 'capitalize',
  },
  diaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  diaFaturamento: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
    color: Colors.verde,
  },
  badge: {
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#262629',
    gap: Spacing.sm,
  },
  cardHorario: {
    alignItems: 'center',
    minWidth: 44,
  },
  cardHora: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  cardDuracao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  divisorVertical: {
    width: 1,
    height: 32,
    backgroundColor: '#262629',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  clienteNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  servicoNome: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  cardFim: {
    alignItems: 'flex-end',
  },
  preco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    backgroundColor: '#161618',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.giant,
    borderWidth: 1,
    borderColor: '#262629',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
  },
  modalSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
    marginTop: 2,
  },
  modalBtnFechar: {
    padding: 4,
  },
  modalCardCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#1E1E22',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#262629',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClienteNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  modalClienteTelefone: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  modalCardServico: {
    backgroundColor: '#1E1E22',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#262629',
    gap: Spacing.xs,
  },
  modalLinhaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalServicoNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  modalLinhaValores: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  modalDuracao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  modalPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.verde,
  },
  modalBotoesAcao: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtnAcao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 14,
    borderRadius: Radii.md,
  },
  btnWhatsApp: {
    backgroundColor: '#25D366',
  },
  btnLigar: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  modalBtnAcaoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
});
