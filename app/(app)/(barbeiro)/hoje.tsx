import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  Linking,
  Switch,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  Scissors,
  User,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Share2,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type AgendamentoBarbeiro } from '@/hooks/usePainelBarbeiro';
import { usePerfil } from '@/hooks/usePerfil';
import { BadgeStatus } from '@/components/BadgeStatus';

const DIAS_SEMANA_EXT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES_EXT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Verifica se um agendamento já passou do horário (considerando hora + duração) */
function isHorarioDecorrido(dataHoraIso: string, duracaoMinutos: number): boolean {
  const dataAgendamento = new Date(dataHoraIso);
  const dataFimAgendamento = new Date(dataAgendamento.getTime() + (duracaoMinutos || 30) * 60 * 1000);
  return new Date() > dataFimAgendamento;
}

export default function TelaBarbeiroHoje() {
  const { perfil } = usePerfil();
  const {
    agendamentosHoje,
    totalNaFila,
    minutosAtraso,
    tardeFechadaHoje,
    carregando,
    recarregar,
    concluirAgendamento,
    cancelarAgendamento,
    definirAtraso,
    alternarTardeFechada,
  } = usePainelBarbeiro();

  const [filtro, setFiltro] = useState<'ativos' | 'concluidos' | 'todos'>('ativos');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoBarbeiro | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const agora = new Date();
  const dataFormatada = `${DIAS_SEMANA_EXT[agora.getDay()]}, ${agora.getDate()} de ${MESES_EXT[agora.getMonth()]}`;
  const primeiroNome = perfil?.nome_completo?.split(' ')[0] || 'Barbeiro';

  // ─── MODELO HÍBRIDO INTELIGENTE ───
  const agendamentosValidos = agendamentosHoje.filter((a) => a.status !== 'cancelado');
  const concluidosInteligentes = agendamentosHoje.filter(
    (a) => a.status === 'concluido' || (a.status === 'confirmado' && isHorarioDecorrido(a.data_hora, a.servico.duracao_minutos))
  );
  const ativosInteligentes = agendamentosHoje.filter(
    (a) => (a.status === 'pendente' || a.status === 'confirmado') && !isHorarioDecorrido(a.data_hora, a.servico.duracao_minutos)
  );

  const faturamentoDia = agendamentosValidos.reduce((acc, a) => acc + Number(a.servico.preco), 0);
  const faturamentoFormatado = faturamentoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Lista filtrada
  const listaExibida = useMemo(() => {
    return agendamentosHoje.filter((item) => {
      if (filtro === 'ativos') {
        return (item.status === 'pendente' || item.status === 'confirmado') && !isHorarioDecorrido(item.data_hora, item.servico.duracao_minutos);
      }
      if (filtro === 'concluidos') {
        return item.status === 'concluido' || (item.status === 'confirmado' && isHorarioDecorrido(item.data_hora, item.servico.duracao_minutos));
      }
      return true; // 'todos'
    });
  }, [agendamentosHoje, filtro]);

  async function handleDefinirAtraso(minutos: number) {
    try {
      const afetados = await definirAtraso(minutos);
      if (minutos === 0) {
        Alert.alert('Agenda Normalizada 💈', 'Os horários de atendimento voltaram à previsão padrão.');
      } else {
        const qtdMsg = typeof afetados === 'number' && afetados > 0 ? ` (${afetados} cliente(s) notificado(s))` : '';
        Alert.alert('Atraso Registrado ⏳', `+${minutos} minutos adicionados à previsão de hoje.${qtdMsg}`);
      }
    } catch (err: any) {
      Alert.alert('Erro ao registrar atraso', err.message || 'Tente novamente.');
    }
  }

  async function handleAlternarTarde(valor: boolean) {
    try {
      await alternarTardeFechada(valor);
      if (valor) {
        Alert.alert(
          'Tarde Marcada como Fechada 🔒',
          'O aviso já está visível para os clientes no aplicativo. Deseja postar no status do WhatsApp agora?',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Postar no Status', onPress: handlePostarStatusWhatsapp },
          ]
        );
      } else {
        Alert.alert('Tarde Aberta 🔓', 'O atendimento por ordem de chegada na parte da tarde está ativo.');
      }
    } catch (err: any) {
      Alert.alert('Erro ao atualizar aviso', err.message || 'Tente novamente.');
    }
  }

  function handlePostarStatusWhatsapp() {
    const mensagemFechamento = 'Informamos que a Barbearia Vieira estará fechada hoje na parte da tarde. Agradecemos a compreensão de todos!';

    Share.share({
      message: mensagemFechamento,
    }).catch(() => {
      const urlWhats = `whatsapp://send?text=${encodeURIComponent(mensagemFechamento)}`;
      Linking.openURL(urlWhats).catch(() => {
        Alert.alert('Aviso', 'Não foi possível abrir o WhatsApp automaticamente.');
      });
    });
  }

  async function handleConcluir(agendamento: AgendamentoBarbeiro) {
    setProcessandoAcao(true);
    try {
      await concluirAgendamento(agendamento.id);
      setAgendamentoSelecionado(null);
      Alert.alert('Atendimento Concluído! ✂️', `Atendimento de ${agendamento.cliente.nome_completo || 'Cliente'} marcado como realizado.`);
    } catch (err: any) {
      Alert.alert('Erro ao concluir', err.message || 'Não foi possível atualizar o status.');
    } finally {
      setProcessandoAcao(false);
    }
  }

  function handleConfirmarCancelar(agendamento: AgendamentoBarbeiro) {
    Alert.alert(
      'Cancelar Atendimento',
      `Deseja realmente cancelar o agendamento de ${agendamento.cliente.nome_completo || 'Cliente'} às ${formatarHora(agendamento.data_hora)}? O horário será ofertado para quem está na lista de espera.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setProcessandoAcao(true);
            try {
              await cancelarAgendamento(agendamento.id);
              setAgendamentoSelecionado(null);
              Alert.alert('Agendamento Cancelado', 'O horário foi liberado com sucesso.');
            } catch (err: any) {
              Alert.alert('Erro ao cancelar', err.message || 'Não foi possível cancelar.');
            } finally {
              setProcessandoAcao(false);
            }
          },
        },
      ]
    );
  }

  function handleAbrirWhatsApp(telefone: string | null, nomeCliente: string | null) {
    if (!telefone) {
      Alert.alert('Sem telefone', 'Este cliente não possui número cadastrado.');
      return;
    }
    const limpo = telefone.replace(/\D/g, '');
    const numFinal = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const msg = encodeURIComponent(`Olá ${nomeCliente || ''}, aqui é da Barbearia Vieira sobre o seu atendimento.`);
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Olá, {primeiroNome}!</Text>
          <Text style={styles.subtitulo}>{dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}</Text>
        </View>
        <View style={styles.badgeBarbeiro}>
          <Sparkles size={12} color={Colors.ouro} />
          <Text style={styles.badgeBarbeiroTexto}>Barbeiro Vieira</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={carregando}
            onRefresh={recarregar}
            tintColor={Colors.vermelho}
            colors={[Colors.vermelho]}
          />
        }
      >
        {/* ─── Métricas (Modelo Híbrido Inteligente) ─── */}
        <View style={styles.metricasRow}>
          <View style={styles.metricaCard}>
            <Text style={styles.metricaValor}>
              {concluidosInteligentes.length}/{agendamentosValidos.length}
            </Text>
            <Text style={styles.metricaLabel}>Concluídos</Text>
          </View>
          <View style={styles.metricaCard}>
            <Text style={[styles.metricaValor, styles.metricaValorDestaque]}>{totalNaFila}</Text>
            <Text style={styles.metricaLabel}>Na lista de espera</Text>
          </View>
          <View style={styles.metricaCard}>
            <Text style={[styles.metricaValor, styles.metricaValorPequeno]}>{faturamentoFormatado}</Text>
            <Text style={styles.metricaLabel}>Faturamento</Text>
          </View>
        </View>

        {/* ─── Controle de Fechamento da Tarde ─── */}
        <View style={[styles.tardeBox, tardeFechadaHoje && styles.tardeBoxFechada]}>
          <View style={styles.tardeHeader}>
            <View style={styles.tardeTextoWrapper}>
              <Text style={styles.tardeTitulo}>
                {tardeFechadaHoje ? 'Fechada à Tarde' : 'Fechar à Tarde'}
              </Text>
              <Text style={styles.tardeSubtitulo}>
                {tardeFechadaHoje
                  ? 'Enviando aviso para clientes'
                  : 'Ao fechar, os clientes serão avisados que a barbearia não abrirá à tarde.'}
              </Text>
            </View>
            <Switch
              value={tardeFechadaHoje}
              onValueChange={handleAlternarTarde}
              trackColor={{ false: '#262629', true: Colors.vermelho }}
              thumbColor="#FFFFFF"
            />
          </View>

          {tardeFechadaHoje && (
            <View style={styles.tardeAvisoContainer}>
              <View style={styles.tardeMensagemCard}>
                <Text style={styles.tardeMensagemTexto}>
                  "Informamos que a Barbearia Vieira estará fechada hoje na parte da tarde. Agradecemos a compreensão de todos!"
                </Text>
              </View>
              <TouchableOpacity
                style={styles.botaoPostarStatus}
                onPress={handlePostarStatusWhatsapp}
                activeOpacity={0.8}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.botaoPostarStatusTexto}>Postar no Status do WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Controle de Atraso ─── */}
        <View style={styles.atrasoBox}>
          <View style={styles.atrasoHeader}>
            <View style={styles.atrasoTituloLinha}>
              <Clock size={16} color={minutosAtraso > 0 ? Colors.amarelo : Colors.textoSecundario} />
              <Text style={styles.atrasoTitulo}>
                {minutosAtraso > 0 ? `Atraso ativo hoje: +${minutosAtraso} min` : 'Estou atrasado'}
              </Text>
            </View>
            {minutosAtraso > 0 && (
              <TouchableOpacity
                style={styles.badgeNormalizar}
                onPress={() => handleDefinirAtraso(0)}
                activeOpacity={0.7}
              >
                <Text style={styles.badgeNormalizarTexto}>Normalizar agora</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.atrasoOpcoes}>
            {[10, 15, 20, 30].map((minutos) => (
              <TouchableOpacity
                key={minutos}
                style={[
                  styles.atrasoBotao,
                  minutosAtraso === minutos && styles.atrasoBotaoAtivo,
                ]}
                onPress={() => handleDefinirAtraso(minutos)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.atrasoTexto,
                    minutosAtraso === minutos && styles.atrasoTextoAtivo,
                  ]}
                >
                  +{minutos} min
                </Text>
              </TouchableOpacity>
            ))}
            {minutosAtraso > 0 && (
              <TouchableOpacity
                style={styles.normalizarBotao}
                onPress={() => handleDefinirAtraso(0)}
                activeOpacity={0.7}
              >
                <Text style={styles.normalizarTexto}>Zerar atraso</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ─── Segmentos / Filtros ─── */}
        <View style={styles.secaoHeaderLinha}>
          <Text style={styles.secaoTitulo}>Agenda de hoje</Text>
          <View style={styles.filtrosRow}>
            <TouchableOpacity
              style={[styles.filtroChip, filtro === 'ativos' && styles.filtroChipAtivo]}
              onPress={() => setFiltro('ativos')}
            >
              <Text style={[styles.filtroChipTexto, filtro === 'ativos' && styles.filtroChipTextoAtivo]}>
                Ativos ({ativosInteligentes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroChip, filtro === 'concluidos' && styles.filtroChipAtivo]}
              onPress={() => setFiltro('concluidos')}
            >
              <Text style={[styles.filtroChipTexto, filtro === 'concluidos' && styles.filtroChipTextoAtivo]}>
                Concluídos ({concluidosInteligentes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroChip, filtro === 'todos' && styles.filtroChipAtivo]}
              onPress={() => setFiltro('todos')}
            >
              <Text style={[styles.filtroChipTexto, filtro === 'todos' && styles.filtroChipTextoAtivo]}>
                Todos ({agendamentosHoje.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Lista de Cards ─── */}
        {carregando && agendamentosHoje.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.vermelho} />
          </View>
        ) : listaExibida.length === 0 ? (
          <View style={styles.vazio}>
            <Clock size={36} color={Colors.textoDesabilitado} />
            <Text style={styles.vazioTitulo}>
              {filtro === 'concluidos'
                ? 'Nenhum atendimento concluído hoje'
                : filtro === 'ativos'
                ? 'Nenhum agendamento ativo pendente'
                : 'Nenhum agendamento para hoje'}
            </Text>
            <Text style={styles.vazioTexto}>
              Toque em um agendamento para gerenciar detalhes, contatos ou concluir.
            </Text>
          </View>
        ) : (
          listaExibida.map((item) => {
            const decorrido = isHorarioDecorrido(item.data_hora, item.servico.duracao_minutos);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.cardAgendamento,
                  (item.status === 'concluido' || decorrido) && styles.cardConcluido,
                  item.status === 'cancelado' && styles.cardCancelado,
                ]}
                activeOpacity={0.75}
                onPress={() => setAgendamentoSelecionado(item)}
              >
                <View style={styles.cardHoraColuna}>
                  <Text style={styles.cardHora}>{formatarHora(item.data_hora)}</Text>
                  <Text style={styles.cardDuracao}>{item.servico.duracao_minutos} min</Text>
                </View>

                <View style={styles.cardDivisorVertical} />

                <View style={styles.cardInfo}>
                  <View style={styles.cardLinha}>
                    <User size={14} color={Colors.textoSecundario} />
                    <Text style={styles.cardClienteNome} numberOfLines={1}>
                      {item.cliente.nome_completo || 'Cliente'}
                    </Text>
                  </View>
                  <View style={styles.cardLinha}>
                    <Scissors size={14} color={Colors.ouro} />
                    <Text style={styles.cardServico} numberOfLines={1}>
                      {item.servico.nome}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardPrecoStatus}>
                  <Text style={styles.cardPreco}>
                    {Number(item.servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                  <BadgeStatus status={item.status === 'confirmado' && decorrido ? 'concluido' : item.status} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ─── Modal de Ação do Agendamento ─── */}
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
                  <View>
                    <Text style={styles.modalClienteNome}>
                      {agendamentoSelecionado.cliente.nome_completo || 'Cliente sem nome'}
                    </Text>
                    <Text style={styles.modalSub}>
                      Horário: {formatarHora(agendamentoSelecionado.data_hora)} · {agendamentoSelecionado.servico.duracao_minutos} min
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAgendamentoSelecionado(null)}
                    style={styles.modalBtnFechar}
                    activeOpacity={0.7}
                  >
                    <X size={20} color={Colors.textoSecundario} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalDetalhesCard}>
                  <View style={styles.modalDetalhesLinha}>
                    <Text style={styles.modalDetalhesRotulo}>Serviço:</Text>
                    <Text style={styles.modalDetalhesValor}>{agendamentoSelecionado.servico.nome}</Text>
                  </View>
                  <View style={styles.modalDetalhesLinha}>
                    <Text style={styles.modalDetalhesRotulo}>Valor:</Text>
                    <Text style={[styles.modalDetalhesValor, styles.modalDetalhesOuro]}>
                      {Number(agendamentoSelecionado.servico.preco).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalDetalhesLinha}>
                    <Text style={styles.modalDetalhesRotulo}>Status:</Text>
                    <BadgeStatus status={agendamentoSelecionado.status} />
                  </View>
                  {agendamentoSelecionado.cliente.telefone && (
                    <View style={styles.modalDetalhesLinha}>
                      <Text style={styles.modalDetalhesRotulo}>Telefone:</Text>
                      <Text style={styles.modalDetalhesValor}>{agendamentoSelecionado.cliente.telefone}</Text>
                    </View>
                  )}
                </View>

                {/* Ações de Contato Rápido */}
                {agendamentoSelecionado.cliente.telefone && (
                  <View style={styles.contatoRow}>
                    <TouchableOpacity
                      style={styles.botaoWhatsapp}
                      onPress={() =>
                        handleAbrirWhatsApp(
                          agendamentoSelecionado.cliente.telefone,
                          agendamentoSelecionado.cliente.nome_completo
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={18} color="#FFFFFF" />
                      <Text style={styles.botaoContatoTexto}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.botaoTelefone}
                      onPress={() => handleFazerLigacao(agendamentoSelecionado.cliente.telefone)}
                      activeOpacity={0.8}
                    >
                      <Phone size={18} color="#FFFFFF" />
                      <Text style={styles.botaoContatoTexto}>Ligar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Ações de Status (Concluir / Cancelar) */}
                <View style={styles.acoesStatusContainer}>
                  {agendamentoSelecionado.status !== 'concluido' && agendamentoSelecionado.status !== 'cancelado' && (
                    <TouchableOpacity
                      style={styles.botaoConcluir}
                      onPress={() => handleConcluir(agendamentoSelecionado)}
                      disabled={processandoAcao}
                      activeOpacity={0.8}
                    >
                      {processandoAcao ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} color="#FFFFFF" />
                          <Text style={styles.botaoConcluirTexto}>Concluir Atendimento</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {agendamentoSelecionado.status !== 'cancelado' && (
                    <TouchableOpacity
                      style={styles.botaoCancelar}
                      onPress={() => handleConfirmarCancelar(agendamentoSelecionado)}
                      disabled={processandoAcao}
                      activeOpacity={0.8}
                    >
                      <XCircle size={18} color={Colors.erro} />
                      <Text style={styles.botaoCancelarTexto}>Cancelar / Não Compareceu</Text>
                    </TouchableOpacity>
                  )}
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
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: '#FFFFFF',
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: '#8E8E93',
    marginTop: 2,
  },
  badgeBarbeiro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
  },
  badgeBarbeiroTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.ouro,
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.md,
    paddingBottom: Spacing.giant,
  },
  metricasRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metricaCard: {
    flex: 1,
    backgroundColor: '#161618',
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#262629',
    ...Shadows.card,
  },
  metricaValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: '#FFFFFF',
  },
  metricaValorDestaque: {
    color: Colors.ouro,
  },
  metricaValorPequeno: {
    fontSize: FontSize.bodyMd,
    color: Colors.verde,
  },
  metricaLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
    textAlign: 'center',
  },
  tardeBox: {
    backgroundColor: '#161618',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#262629',
  },
  tardeBoxFechada: {
    borderColor: 'rgba(229, 57, 53, 0.4)',
    backgroundColor: '#1F1414',
  },
  tardeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tardeTextoWrapper: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.sm,
  },
  tardeTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  tardeSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  tardeAvisoContainer: {
    gap: Spacing.sm,
    marginTop: 4,
  },
  tardeMensagemCard: {
    backgroundColor: '#261818',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.3)',
  },
  tardeMensagemTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#F87171',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  botaoPostarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  botaoPostarStatusTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  atrasoBox: {
    backgroundColor: '#161618',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#262629',
  },
  atrasoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atrasoTituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  atrasoTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  badgeNormalizar: {
    backgroundColor: 'rgba(61, 191, 106, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(61, 191, 106, 0.3)',
  },
  badgeNormalizarTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
    color: Colors.verde,
  },
  atrasoOpcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  atrasoBotao: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    backgroundColor: '#26262A',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  atrasoBotaoAtivo: {
    backgroundColor: Colors.amarelo,
    borderColor: Colors.amarelo,
  },
  atrasoTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  atrasoTextoAtivo: {
    color: Colors.fundo,
  },
  normalizarBotao: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.verde,
  },
  normalizarTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.verde,
  },
  secaoHeaderLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
    gap: 6,
  },
  secaoTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.headingSm,
    color: '#FFFFFF',
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 4,
  },
  filtroChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: '#1E1E22',
  },
  filtroChipAtivo: {
    backgroundColor: Colors.vermelho,
  },
  filtroChipTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  filtroChipTextoAtivo: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semiBold,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  vazio: {
    backgroundColor: '#161618',
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#262629',
  },
  vazioTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  vazioTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: '#8E8E93',
    textAlign: 'center',
  },
  cardAgendamento: {
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
  cardConcluido: {
    opacity: 0.65,
    borderColor: '#1E1E22',
  },
  cardCancelado: {
    opacity: 0.5,
    borderColor: '#2D1B1B',
  },
  cardHoraColuna: {
    alignItems: 'center',
    minWidth: 44,
    gap: 2,
  },
  cardHora: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
  },
  cardDuracao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  cardDivisorVertical: {
    width: 1,
    height: '100%',
    backgroundColor: '#262629',
    alignSelf: 'stretch',
  },
  cardInfo: {
    flex: 1,
    gap: 5,
  },
  cardLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardClienteNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
    flex: 1,
  },
  cardServico: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
    flex: 1,
  },
  cardPrecoStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
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
  modalClienteNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: '#FFFFFF',
  },
  modalSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalBtnFechar: {
    padding: 6,
  },
  modalDetalhesCard: {
    backgroundColor: '#222226',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  modalDetalhesLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalDetalhesRotulo: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
  },
  modalDetalhesValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  modalDetalhesOuro: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
  },
  contatoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  botaoWhatsapp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  botaoTelefone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  botaoContatoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  acoesStatusContainer: {
    gap: Spacing.xs,
  },
  botaoConcluir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.verde,
    paddingVertical: 14,
    borderRadius: Radii.md,
  },
  botaoConcluirTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  botaoCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.3)',
  },
  botaoCancelarTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.erro,
  },
});
