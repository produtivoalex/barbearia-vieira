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
  TextInput,
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
  Plus,
  Send,
  Zap,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type AgendamentoBarbeiro } from '@/hooks/usePainelBarbeiro';
import { usePerfil } from '@/hooks/usePerfil';
import { useServicos } from '@/hooks/useServicos';
import { BadgeStatus } from '@/components/BadgeStatus';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme, isEscuro } = useTheme();
  const { perfil } = usePerfil();
  const { barbearia } = useBarbearia();
  const { servicos } = useServicos('todos', barbearia?.id);
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
    criarReservaManual,
  } = usePainelBarbeiro(barbearia?.id);

  const [filtro, setFiltro] = useState<'ativos' | 'concluidos' | 'todos'>('ativos');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoBarbeiro | null>(null);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  // Estados de Encaixe Rápido
  const [modalEncaixe, setModalEncaixe] = useState(false);
  const [nomeEncaixe, setNomeEncaixe] = useState('');
  const [telefoneEncaixe, setTelefoneEncaixe] = useState('');
  const [servicoEncaixeId, setServicoEncaixeId] = useState<string>('');
  const [horaEncaixe, setHoraEncaixe] = useState<string>('');
  const [salvandoEncaixe, setSalvandoEncaixe] = useState(false);

  const agora = new Date();
  const dataFormatada = `${DIAS_SEMANA_EXT[agora.getDay()]}, ${agora.getDate()} de ${MESES_EXT[agora.getMonth()]}`;
  const primeiroNome = perfil?.nome_completo?.split(' ')[0] || 'Barbeiro';
  const nomeBarbearia = barbearia?.nome || 'Na Régua';

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

  const taxaComissao = barbearia?.comissao_padrao !== undefined ? barbearia.comissao_padrao : 50;
  const comissaoDia = (faturamentoDia * taxaComissao) / 100;
  const comissaoFormatada = comissaoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    const mensagemFechamento = `Informamos que ${nomeBarbearia} estará fechada hoje na parte da tarde. Agradecemos a compreensão de todos!`;

    Share.share({
      message: mensagemFechamento,
    }).catch(() => {
      const urlWhats = `whatsapp://send?text=${encodeURIComponent(mensagemFechamento)}`;
      Linking.openURL(urlWhats).catch(() => {
        Alert.alert('Aviso', 'Não foi possível abrir o WhatsApp automaticamente.');
      });
    });
  }

  function handleEnviarWhatsappConfirmacao(item: AgendamentoBarbeiro) {
    const tel = item.cliente.telefone?.replace(/\D/g, '') || '';
    if (!tel) {
      Alert.alert('Sem telefone', 'Este cliente não possui número de WhatsApp cadastrado.');
      return;
    }
    const numFinal = tel.startsWith('55') ? tel : `55${tel}`;
    const horaStr = formatarHora(item.data_hora);
    const nomeCli = item.cliente.nome_completo?.split(' ')[0] || 'Cliente';
    const msg = encodeURIComponent(
      `Olá, ${nomeCli}! 💈\nPassando para confirmar seu horário para ${item.servico.nome} hoje às ${horaStr} na ${nomeBarbearia}.\nTe aguardamos!`
    );
    Linking.openURL(`https://wa.me/${numFinal}?text=${msg}`).catch(() => {
      Alert.alert('Aviso', 'Não foi possível abrir o WhatsApp.');
    });
  }

  function abrirModalEncaixe() {
    const d = new Date();
    const horaAtual = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    setNomeEncaixe('');
    setTelefoneEncaixe('');
    setServicoEncaixeId(servicos[0]?.id || '');
    setHoraEncaixe(horaAtual);
    setModalEncaixe(true);
  }

  async function handleSalvarEncaixe() {
    if (!nomeEncaixe.trim()) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }
    if (!servicoEncaixeId) {
      Alert.alert('Atenção', 'Selecione um serviço.');
      return;
    }
    setSalvandoEncaixe(true);
    try {
      const agoraD = new Date();
      const [hStr, mStr] = horaEncaixe.split(':');
      const dataHoraEncaixe = new Date(
        agoraD.getFullYear(),
        agoraD.getMonth(),
        agoraD.getDate(),
        Number(hStr || agoraD.getHours()),
        Number(mStr || agoraD.getMinutes())
      );

      await criarReservaManual({
        nomeCliente: nomeEncaixe.trim(),
        telefone: telefoneEncaixe.trim() || undefined,
        servicoId: servicoEncaixeId,
        dataHora: dataHoraEncaixe.toISOString(),
      });

      setModalEncaixe(false);
      Alert.alert('Encaixe Realizado! 💈', `${nomeEncaixe.trim()} foi adicionado aos atendimentos de hoje.`);
    } catch (err: any) {
      Alert.alert('Erro ao criar encaixe', err.message || 'Tente novamente.');
    } finally {
      setSalvandoEncaixe(false);
    }
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
    const msg = encodeURIComponent(`Olá ${nomeCliente || ''}, aqui é da ${nomeBarbearia} sobre o seu atendimento.`);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <View>
          <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Cockpit de Hoje</Text>
          <Text style={[styles.subtitulo, { color: theme.textoSecundario }]}>{dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)} • {primeiroNome}</Text>
        </View>
        <View style={[styles.badgeBarbeiro, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
          <Sparkles size={12} color={theme.ouroTexto} />
          <Text style={[styles.badgeBarbeiroTexto, { color: theme.ouroTexto }]}>{nomeBarbearia}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={carregando}
            onRefresh={recarregar}
            tintColor={theme.ouro}
            colors={[theme.ouro]}
          />
        }
      >
        {/* ─── LIVE COCKPIT: NA CADEIRA AGORA ─── */}
        {ativosInteligentes.length > 0 && (
          <View style={[styles.cardNaCadeira, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={styles.naCadeiraHeader}>
              <View style={[styles.naCadeiraLivePill, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <View style={[styles.naCadeiraLiveDot, { backgroundColor: theme.ouro }]} />
                <Text style={[styles.naCadeiraLiveTexto, { color: theme.ouroTexto }]}>NA CADEIRA AGORA</Text>
              </View>
              <Text style={[styles.naCadeiraHora, { color: theme.ouroTexto }]}>
                {formatarHora(ativosInteligentes[0].data_hora)}
              </Text>
            </View>

            <View style={styles.naCadeiraInfo}>
              <Text style={[styles.naCadeiraClienteNome, { color: theme.textoPrimario }]} numberOfLines={1}>
                {ativosInteligentes[0].cliente.nome_completo || 'Cliente'}
              </Text>
              <Text style={[styles.naCadeiraServico, { color: theme.textoSecundario }]}>
                {ativosInteligentes[0].servico.nome} • {Number(ativosInteligentes[0].servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • {ativosInteligentes[0].servico.duracao_minutos} min
              </Text>
            </View>

            <View style={styles.naCadeiraAcoes}>
              <TouchableOpacity
                style={styles.btnNaCadeiraConcluir}
                onPress={() => handleConcluir(ativosInteligentes[0])}
                disabled={processandoAcao}
                activeOpacity={0.85}
              >
                <Scissors size={17} color="#FFFFFF" />
                <Text style={styles.btnNaCadeiraConcluirTexto}>Finalizar Corte</Text>
              </TouchableOpacity>

              {ativosInteligentes[0].cliente.telefone && (
                <TouchableOpacity
                  style={styles.btnNaCadeiraWhats}
                  onPress={() => handleEnviarWhatsappConfirmacao(ativosInteligentes[0])}
                  activeOpacity={0.7}
                >
                  <MessageCircle size={18} color={Colors.verde} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ─── Progresso da Meta Diária ─── */}
        {agendamentosValidos.length > 0 && (
          <View style={styles.metaCard}>
            <View style={styles.metaHeader}>
              <Text style={styles.metaTitulo}>Meta do Dia</Text>
              <Text style={styles.metaContador}>
                {concluidosInteligentes.length} de {agendamentosValidos.length} cortes realizados
              </Text>
            </View>
            <View style={styles.metaTrilho}>
              <View
                style={[
                  styles.metaPreenchimento,
                  {
                    width: `${Math.min(100, Math.round((concluidosInteligentes.length / agendamentosValidos.length) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* ─── Métricas (Modelo Híbrido Inteligente) ─── */}
        <View style={styles.metricasRow}>
          <View style={styles.metricaCard}>
            <Text style={styles.metricaValor}>
              {concluidosInteligentes.length}/{agendamentosValidos.length}
            </Text>
            <Text style={styles.metricaLabel}>Concluídos</Text>
          </View>
          <View style={styles.metricaCard}>
            <Text style={[styles.metricaValor, styles.metricaValorDestaque]}>{faturamentoFormatado}</Text>
            <Text style={styles.metricaLabel}>Total do Dia</Text>
          </View>
          <View style={styles.metricaCard}>
            <Text style={[styles.metricaValor, styles.metricaValorPequeno, { color: Colors.verde }]}>{comissaoFormatada}</Text>
            <Text style={styles.metricaLabel}>Comissão ({taxaComissao}%)</Text>
          </View>
        </View>

        {/* ─── Barra de Ações Rápidas de Produtividade ─── */}
        <View style={styles.barraAcoesRapidas}>
          <TouchableOpacity
            style={styles.botaoAcaoRapidaDestaque}
            onPress={abrirModalEncaixe}
            activeOpacity={0.8}
          >
            <Plus size={16} color={Colors.textoEscuroSobreOuro} />
            <Text style={styles.botaoAcaoRapidaDestaqueTexto}>Encaixe de Balcão</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoAcaoRapida}
            onPress={() => {
              if (ativosInteligentes.length > 0) {
                handleEnviarWhatsappConfirmacao(ativosInteligentes[0]);
              } else {
                Alert.alert('Nenhum agendamento', 'Não há agendamentos ativos pendentes para hoje.');
              }
            }}
            activeOpacity={0.7}
          >
            <Send size={15} color={Colors.ouro} />
            <Text style={styles.botaoAcaoRapidaTexto}>Avisar Próximo</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Controle de Fechamento da Tarde ─── */}
        <View style={[styles.tardeBox, tardeFechadaHoje && styles.tardeBoxFechada]}>
          <View style={styles.tardeHeader}>
            <View style={styles.tardeTextoWrapper}>
              <Text style={styles.tardeTitulo}>
                {tardeFechadaHoje ? 'Pausa da Tarde Ativa' : 'Pausa da Tarde'}
              </Text>
              <Text style={styles.tardeSubtitulo}>
                {tardeFechadaHoje
                  ? 'Aviso ativo no app dos clientes'
                  : 'Avisar clientes que não haverá expediente à tarde hoje.'}
              </Text>
            </View>
            <Switch
              value={tardeFechadaHoje}
              onValueChange={handleAlternarTarde}
              trackColor={{ false: Colors.borda, true: Colors.ouro }}
              thumbColor="#FFFFFF"
            />
          </View>

          {tardeFechadaHoje && (
            <View style={styles.tardeAvisoContainer}>
              <View style={styles.tardeMensagemCard}>
                <Text style={styles.tardeMensagemTexto}>
                  "Informamos que {nomeBarbearia} estará fechada hoje na parte da tarde. Agradecemos a compreensão de todos!"
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
            <ActivityIndicator size="large" color={Colors.ouro} />
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
                  <View style={styles.cardStatusRow}>
                    <BadgeStatus status={item.status === 'confirmado' && decorrido ? 'concluido' : item.status} />
                    {item.cliente.telefone ? (
                      <TouchableOpacity
                        style={styles.btnCardWhats}
                        onPress={() => handleEnviarWhatsappConfirmacao(item)}
                        activeOpacity={0.7}
                      >
                        <MessageCircle size={14} color={Colors.verde} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
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

      {/* ─── Modal de Encaixe Rápido ─── */}
      <Modal
        visible={modalEncaixe}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEncaixe(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalEncaixe(false)}>
          <Pressable style={styles.modalConteudo} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitulo}>Novo Encaixe de Balcão</Text>
                <Text style={styles.modalSub}>Adicione um cliente presencial à agenda de hoje</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalEncaixe(false)}
                style={styles.modalBtnFechar}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalCorpo}>
              {/* Nome */}
              <View style={styles.campoEncaixe}>
                <Text style={styles.campoEncaixeLabel}>Nome do Cliente *</Text>
                <TextInput
                  style={styles.inputEncaixe}
                  placeholder="Ex: Carlos Eduardo"
                  placeholderTextColor={Colors.textoDesabilitado}
                  value={nomeEncaixe}
                  onChangeText={setNomeEncaixe}
                  autoCapitalize="words"
                />
              </View>

              {/* Telefone / WhatsApp */}
              <View style={styles.campoEncaixe}>
                <Text style={styles.campoEncaixeLabel}>WhatsApp (Opcional)</Text>
                <TextInput
                  style={styles.inputEncaixe}
                  placeholder="(86) 99999-9999"
                  placeholderTextColor={Colors.textoDesabilitado}
                  value={telefoneEncaixe}
                  onChangeText={setTelefoneEncaixe}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Serviço */}
              <View style={styles.campoEncaixe}>
                <Text style={styles.campoEncaixeLabel}>Serviço *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.servicosEncaixeScroll}
                >
                  {servicos.map((s) => {
                    const selecionado = servicoEncaixeId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.chipServicoEncaixe, selecionado && styles.chipServicoEncaixeAtivo]}
                        onPress={() => setServicoEncaixeId(s.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipServicoEncaixeTexto,
                            selecionado && styles.chipServicoEncaixeTextoAtivo,
                          ]}
                        >
                          {s.nome} • R$ {Number(s.preco).toFixed(0)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Horário */}
              <View style={styles.campoEncaixe}>
                <Text style={styles.campoEncaixeLabel}>Horário do Atendimento (HH:MM)</Text>
                <TextInput
                  style={styles.inputEncaixe}
                  placeholder="14:30"
                  placeholderTextColor={Colors.textoDesabilitado}
                  value={horaEncaixe}
                  onChangeText={setHoraEncaixe}
                />
              </View>

              <TouchableOpacity
                style={styles.botaoSalvarEncaixe}
                onPress={handleSalvarEncaixe}
                disabled={salvandoEncaixe}
                activeOpacity={0.8}
              >
                {salvandoEncaixe ? (
                  <ActivityIndicator color={Colors.textoEscuroSobreOuro} size="small" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color={Colors.textoEscuroSobreOuro} />
                    <Text style={styles.botaoSalvarEncaixeTexto}>Confirmar Encaixe</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  metricaValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
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
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
  tardeBox: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  tardeBoxFechada: {
    borderColor: 'rgba(229, 57, 53, 0.4)',
    backgroundColor: Colors.erroClaro,
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
    color: Colors.textoPrimario,
  },
  tardeSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  tardeAvisoContainer: {
    gap: Spacing.sm,
    marginTop: 4,
  },
  tardeMensagemCard: {
    backgroundColor: Colors.erroClaro,
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
    color: Colors.textoPrimario,
  },
  atrasoBox: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
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
    color: Colors.textoPrimario,
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
    backgroundColor: Colors.superficie2,
    borderWidth: 1,
    borderColor: Colors.bordaDestaque,
  },
  atrasoBotaoAtivo: {
    backgroundColor: Colors.amarelo,
    borderColor: Colors.amarelo,
  },
  atrasoTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
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
    color: Colors.textoPrimario,
  },
  filtrosRow: {
    flexDirection: 'row',
    gap: 4,
  },
  filtroChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: Colors.superficie2,
  },
  filtroChipAtivo: {
    backgroundColor: Colors.vermelho,
  },
  filtroChipTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  filtroChipTextoAtivo: {
    color: Colors.textoPrimario,
    fontFamily: FontFamily.semiBold,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  vazio: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  vazioTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    textAlign: 'center',
    marginTop: 4,
  },
  vazioTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
  cardAgendamento: {
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
  cardConcluido: {
    opacity: 0.65,
    borderColor: Colors.superficie2,
  },
  cardCancelado: {
    opacity: 0.5,
    borderColor: Colors.bordaDestaque,
  },
  cardHoraColuna: {
    alignItems: 'center',
    minWidth: 44,
    gap: 2,
  },
  cardHora: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  cardDuracao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  cardDivisorVertical: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.borda,
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
    color: Colors.textoPrimario,
    flex: 1,
  },
  cardServico: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
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
  modalTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
  modalCorpo: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  modalClienteNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
  },
  modalSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  modalBtnFechar: {
    padding: 6,
  },
  modalDetalhesCard: {
    backgroundColor: Colors.superficie2,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.bordaDestaque,
  },
  modalDetalhesLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalDetalhesRotulo: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  modalDetalhesValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
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
    color: Colors.textoPrimario,
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
    color: Colors.textoPrimario,
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
  barraAcoesRapidas: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  botaoAcaoRapidaDestaque: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.ouro,
    paddingVertical: 12,
    borderRadius: Radii.md,
    ...Shadows.card,
  },
  botaoAcaoRapidaDestaqueTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.textoEscuroSobreOuro,
  },
  botaoAcaoRapida: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.4)',
    paddingVertical: 12,
    borderRadius: Radii.md,
    ...Shadows.card,
  },
  botaoAcaoRapidaTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnCardWhats: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  campoEncaixe: {
    gap: 4,
    marginBottom: Spacing.sm,
  },
  campoEncaixeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#CCCCCC',
  },
  inputEncaixe: {
    backgroundColor: Colors.superficie2,
    borderWidth: 1,
    borderColor: '#333338',
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    height: 44,
    color: Colors.textoPrimario,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
  },
  servicosEncaixeScroll: {
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  chipServicoEncaixe: {
    backgroundColor: Colors.superficie2,
    borderWidth: 1,
    borderColor: '#333338',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  chipServicoEncaixeAtivo: {
    backgroundColor: 'rgba(203, 161, 74, 0.2)',
    borderColor: Colors.ouro,
  },
  chipServicoEncaixeTexto: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#AAAAAA',
  },
  chipServicoEncaixeTextoAtivo: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
  },
  botaoSalvarEncaixe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.ouro,
    paddingVertical: 14,
    borderRadius: Radii.md,
    marginTop: Spacing.xs,
  },
  botaoSalvarEncaixeTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoEscuroSobreOuro,
  },

  /* ─── LIVE COCKPIT: NA CADEIRA AGORA ─── */
  cardNaCadeira: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.ouro,
    gap: Spacing.sm,
    ...Shadows.cardElevado,
  },
  naCadeiraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  naCadeiraLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  naCadeiraLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.verde,
  },
  naCadeiraLiveTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: Colors.verde,
    letterSpacing: 0.5,
  },
  naCadeiraHora: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: Colors.ouro,
  },
  naCadeiraInfo: {
    gap: 2,
  },
  naCadeiraClienteNome: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.textoPrimario,
  },
  naCadeiraServico: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#A0A0AA',
  },
  naCadeiraAcoes: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  btnNaCadeiraConcluir: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.verde,
    paddingVertical: 14,
    borderRadius: Radii.lg,
  },
  btnNaCadeiraConcluirTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textoPrimario,
  },
  btnNaCadeiraWhats: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },

  /* ─── META DIÁRIA ─── */
  metaCard: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: Spacing.xs,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.textoPrimario,
  },
  metaContador: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Colors.ouro,
  },
  metaTrilho: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.superficie2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metaPreenchimento: {
    height: '100%',
    backgroundColor: Colors.ouro,
    borderRadius: 3,
  },
});
