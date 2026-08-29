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
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
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
  AlertCircle,
  ChevronRight,
  Check,
  Sun,
  Moon,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { usePainelBarbeiro, type AgendamentoBarbeiro } from '@/hooks/usePainelBarbeiro';
import { usePerfil } from '@/hooks/usePerfil';
import { useServicos } from '@/hooks/useServicos';
import { useAuth } from '@/hooks/useAuth';
import { useMembrosBarbearia } from '@/hooks/useMembrosBarbearia';
import { BadgeStatus } from '@/components/BadgeStatus';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

const DIAS_SEMANA_EXT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES_EXT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

// Constantes do Gráfico de Anel Radial
const RING_SIZE = 94;
const STROKE_WIDTH = 8.5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2; // 42.75
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~268.6

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

function obterIniciais(nome: string | null): string {
  if (!nome) return 'CL';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function TelaBarbeiroHoje() {
  const router = useRouter();
  const { theme, isEscuro, setModoTema } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuth();
  const { perfil } = usePerfil();
  const { barbearia } = useBarbearia();
  const { membros } = useMembrosBarbearia(barbearia?.id);
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

  // Modal de Ações Rápidas (Ferramentas do Dia)
  const [modalAcoesRapidas, setModalAcoesRapidas] = useState(false);

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

  // Faturamento já garantido dos atendimentos concluídos ("Já no Caixa")
  const faturamentoConcluido = concluidosInteligentes.reduce((acc, a) => acc + Number(a.servico.preco), 0);
  const faturamentoConcluidoFormatado = faturamentoConcluido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Identificação do papel (Proprietário / Gestor vs Barbeiro comissionado)
  const meuPapel = useMemo(() => {
    if (!session?.user?.id) return 'proprietario';
    const m = membros.find((item) => item.usuario_id === session.user.id && item.ativo);
    return m?.papel || 'proprietario';
  }, [membros, session?.user?.id]);

  const isProprietario = meuPapel === 'proprietario' || meuPapel === 'gestor' || membros.length <= 1;

  const taxaComissao = barbearia?.comissao_padrao !== undefined ? barbearia.comissao_padrao : 50;
  const comissaoDia = (faturamentoDia * taxaComissao) / 100;
  const comissaoFormatada = comissaoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const progressoMetaPct =
    agendamentosValidos.length > 0
      ? Math.min(100, Math.round((concluidosInteligentes.length / agendamentosValidos.length) * 100))
      : 0;

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
        Alert.alert('Tarde Aberta 🔓', 'O atendimento na parte da tarde está normal.');
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
      {/* ─── Header Limpo e Humanizado ─── */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.titulo, { color: theme.textoPrimario }]} numberOfLines={1}>
            Meu Dia
          </Text>
          <Text style={[styles.subtitulo, { color: theme.textoSecundario }]} numberOfLines={1}>
            {dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}
          </Text>
        </View>

        <View style={styles.headerBotoes}>
          <View style={[styles.badgeBarbeiro, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
            <Sparkles size={12} color={theme.ouroTexto} />
            <Text style={[styles.badgeBarbeiroTexto, { color: theme.ouroTexto }]} numberOfLines={1}>
              {nomeBarbearia}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btnHeaderAcoes, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
            onPress={() => setModoTema(isEscuro ? 'claro' : 'escuro')}
            activeOpacity={0.7}
          >
            {isEscuro ? (
              <Sun size={16} color={theme.ouroTexto} />
            ) : (
              <Moon size={16} color={theme.ouroTexto} />
            )}
          </TouchableOpacity>
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
        {/* ─── Banners de Alerta Ativos (Compactos e Não Poluentes) ─── */}
        {minutosAtraso > 0 && (
          <View style={styles.bannerAlertaAtraso}>
            <View style={styles.bannerAlertaConteudo}>
              <Clock size={16} color={Colors.amarelo} />
              <Text style={styles.bannerAlertaTexto}>
                Atraso de +{minutosAtraso} min ativo na previsão dos clientes
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bannerAlertaBtnZerar}
              onPress={() => handleDefinirAtraso(0)}
              activeOpacity={0.7}
            >
              <Text style={styles.bannerAlertaBtnZerarTexto}>Zerar</Text>
            </TouchableOpacity>
          </View>
        )}

        {tardeFechadaHoje && (
          <View style={styles.bannerAlertaTarde}>
            <View style={styles.bannerAlertaConteudo}>
              <AlertCircle size={16} color={theme.erro} />
              <Text style={styles.bannerAlertaTextoTarde}>
                Pausa da tarde ativa hoje
              </Text>
            </View>
            <View style={styles.bannerAlertaAcoes}>
              <TouchableOpacity
                style={styles.bannerAlertaBtnWhats}
                onPress={handlePostarStatusWhatsapp}
                activeOpacity={0.7}
              >
                <Share2 size={13} color="#25D366" />
                <Text style={styles.bannerAlertaBtnWhatsTexto}>Status</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bannerAlertaBtnReabrir}
                onPress={() => handleAlternarTarde(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.bannerAlertaBtnReabrirTexto}>Reabrir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Hero Card com Anel Radial de Conquista (Estilo Apple Watch / Nubank) ─── */}
        <TouchableOpacity
          style={[styles.heroCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
          onPress={() => router.push({ pathname: '/(app)/(barbeiro)/semana', params: { aba: 'evolucao' } })}
          activeOpacity={0.85}
        >
          <View style={styles.heroCorpo}>
            {/* Anel de Progresso Circular SVG */}
            <View style={styles.ringWrapper}>
              <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                <Defs>
                  <LinearGradient id="gradOuroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={theme.ouroClaro} />
                    <Stop offset="100%" stopColor={theme.ouro} />
                  </LinearGradient>
                </Defs>
                {/* Anel de Fundo */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  stroke={theme.superficie2}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />
                {/* Arco de Progresso Ativo */}
                <G rotation="-90" origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke="url(#gradOuroRing)"
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progressoMetaPct / 100)))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </G>
              </Svg>

              {/* Números Centrais do Anel */}
              <View style={styles.ringCentro}>
                <Text style={[styles.ringPctTexto, { color: theme.ouroTexto }]}>
                  {progressoMetaPct}%
                </Text>
                <Text style={[styles.ringSubTexto, { color: theme.textoSecundario }]}>
                  {concluidosInteligentes.length}/{agendamentosValidos.length} cortes
                </Text>
              </View>
            </View>

            {/* Lado Direito: Métricas Financeiras */}
            <View style={styles.heroInfoLado}>
              <View style={styles.heroPillLinha}>
                <View style={[styles.heroPillHeader, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                  <Sparkles size={11} color={theme.ouroTexto} />
                  <Text style={[styles.heroPillHeaderTexto, { color: theme.ouroTexto }]}>FATURAMENTO HOJE</Text>
                </View>
              </View>

              <Text
                style={[styles.heroFaturamentoValor, { color: theme.textoPrimario }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {faturamentoFormatado}
              </Text>

              <View style={styles.heroComissaoLinha}>
                <Text style={[styles.heroComissaoRotulo, { color: theme.textoSecundario }]}>
                  {isProprietario ? 'Já na Conta:' : 'Sua Comissão:'}
                </Text>
                <View
                  style={[
                    styles.badgeComissao,
                    {
                      backgroundColor: isProprietario ? theme.verdeClaro : theme.verdeClaro,
                      borderColor: isProprietario ? theme.verde : theme.verde,
                    },
                  ]}
                >
                  <Text style={[styles.badgeComissaoTexto, { color: theme.verde }]}>
                    {isProprietario
                      ? `${faturamentoConcluidoFormatado} de ${faturamentoFormatado}`
                      : `${comissaoFormatada} (${taxaComissao}%)`}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Rodapé Motivacional do Card */}
          <View style={[styles.heroRodape, { borderTopColor: theme.borda, backgroundColor: theme.superficie2 }]}>
            <Scissors size={13} color={theme.ouroTexto} />
            <Text style={[styles.heroRodapeTexto, { color: theme.textoSecundario }]} numberOfLines={1}>
              {agendamentosValidos.length === 0
                ? 'Sem agendamentos hoje'
                : concluidosInteligentes.length === agendamentosValidos.length
                ? '🎉 Todos os cortes concluídos'
                : `Faltam ${agendamentosValidos.length - concluidosInteligentes.length} corte(s) hoje`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontFamily: FontFamily.semiBold, fontSize: 10.5, color: theme.ouroTexto }}>Ver Mês</Text>
              <ChevronRight size={12} color={theme.ouroTexto} />
            </View>
          </View>
        </TouchableOpacity>

        {/* ─── LIVE STATUS: EM ATENDIMENTO AGORA (Se houver cliente ativo) ─── */}
        {ativosInteligentes.length > 0 && (
          <View style={[styles.cardNaCadeira, { backgroundColor: theme.superficie, borderColor: theme.ouro }]}>
            <View style={styles.naCadeiraHeader}>
              <View style={[styles.naCadeiraLivePill, { backgroundColor: theme.verdeClaro, borderColor: theme.verde }]}>
                <View style={[styles.naCadeiraLiveDot, { backgroundColor: theme.verde }]} />
                <Text style={[styles.naCadeiraLiveTexto, { color: theme.verde }]}>EM ATENDIMENTO AGORA</Text>
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
                style={[styles.btnNaCadeiraConcluir, { backgroundColor: theme.verde }]}
                onPress={() => handleConcluir(ativosInteligentes[0])}
                disabled={processandoAcao}
                activeOpacity={0.85}
              >
                <Scissors size={16} color="#09090B" />
                <Text style={styles.btnNaCadeiraConcluirTexto}>Finalizar Corte</Text>
              </TouchableOpacity>

              {ativosInteligentes[0].cliente.telefone && (
                <TouchableOpacity
                  style={[styles.btnNaCadeiraWhats, { backgroundColor: theme.verdeClaro, borderColor: theme.verde }]}
                  onPress={() => handleEnviarWhatsappConfirmacao(ativosInteligentes[0])}
                  activeOpacity={0.7}
                >
                  <MessageCircle size={18} color={theme.verde} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ─── ÁREA NOBRE: AGENDA DE HOJE ─── */}
        <View style={styles.secaoAgendaHeader}>
          <View>
            <View style={styles.secaoTituloLinhaComRaio}>
              <Text style={[styles.secaoTitulo, { color: theme.textoPrimario }]}>Agenda de Hoje</Text>
              <TouchableOpacity
                style={[
                  styles.btnRaioDiscreto,
                  {
                    backgroundColor: isEscuro ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isEscuro ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
                onPress={() => setModalAcoesRapidas(true)}
                activeOpacity={0.6}
              >
                <Zap size={13} color={theme.ouroTexto} style={{ opacity: 0.7 }} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.secaoSubtitulo, { color: theme.textoSecundario }]}>
              {listaExibida.length} atendimento(s) listado(s)
            </Text>
          </View>

          {/* Abas de Filtros em Pílula */}
          <View style={[styles.filtrosContainer, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
            <TouchableOpacity
              style={[
                styles.filtroPill,
                filtro === 'ativos' && [styles.filtroPillAtivo, { backgroundColor: theme.ouro }],
              ]}
              onPress={() => setFiltro('ativos')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filtroPillTexto,
                  { color: theme.textoSecundario },
                  filtro === 'ativos' && styles.filtroPillTextoAtivo,
                ]}
              >
                Pendentes ({ativosInteligentes.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filtroPill,
                filtro === 'concluidos' && [styles.filtroPillAtivo, { backgroundColor: theme.ouro }],
              ]}
              onPress={() => setFiltro('concluidos')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filtroPillTexto,
                  { color: theme.textoSecundario },
                  filtro === 'concluidos' && styles.filtroPillTextoAtivo,
                ]}
              >
                Concluídos ({concluidosInteligentes.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filtroPill,
                filtro === 'todos' && [styles.filtroPillAtivo, { backgroundColor: theme.ouro }],
              ]}
              onPress={() => setFiltro('todos')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filtroPillTexto,
                  { color: theme.textoSecundario },
                  filtro === 'todos' && styles.filtroPillTextoAtivo,
                ]}
              >
                Todos ({agendamentosValidos.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Listagem de Cards de Agendamentos ─── */}
        {carregando && agendamentosHoje.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.ouro} />
          </View>
        ) : listaExibida.length === 0 ? (
          <View style={[styles.vazio, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <Clock size={36} color={theme.textoDesabilitado} />
            <Text style={[styles.vazioTitulo, { color: theme.textoPrimario }]}>
              {filtro === 'concluidos'
                ? 'Nenhum atendimento concluído hoje'
                : filtro === 'ativos'
                ? 'Nenhum agendamento ativo pendente'
                : 'Nenhum agendamento para hoje'}
            </Text>
            <Text style={[styles.vazioTexto, { color: theme.textoSecundario }]}>
              {filtro === 'ativos'
                ? concluidosInteligentes.length > 0
                  ? 'Parabéns! Você já concluiu todos os agendamentos pendentes'
                  : 'Nenhum agendamento pendente'
                : filtro === 'concluidos'
                ? 'Os cortes finalizados aparecerão listados aqui com o resumo dos valores.'
                : 'Todos os cortes do dia aparecerão listados aqui com o resumo dos valores.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listaCards}>
            {listaExibida.map((item) => {
              const iniciais = obterIniciais(item.cliente.nome_completo);
              const decorrido = isHorarioDecorrido(item.data_hora, item.servico.duracao_minutos);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.cardAgendamento,
                    { backgroundColor: theme.superficie, borderColor: theme.borda },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setAgendamentoSelecionado(item)}
                >
                  {/* Bloco de Horário */}
                  <View style={styles.cardHoraColuna}>
                    <Text style={[styles.cardHora, { color: theme.ouroTexto }]}>
                      {formatarHora(item.data_hora)}
                    </Text>
                    <Text style={[styles.cardDuracao, { color: theme.textoSecundario }]}>
                      {item.servico.duracao_minutos} min
                    </Text>
                  </View>

                  {/* Linha Divisória */}
                  <View style={[styles.cardDivisorVertical, { backgroundColor: theme.borda }]} />

                  {/* Avatar com Iniciais */}
                  <View style={[styles.cardAvatar, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                    <Text style={[styles.cardAvatarTexto, { color: theme.ouroTexto }]}>{iniciais}</Text>
                  </View>

                  {/* Informações do Cliente e Serviço */}
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardClienteNome, { color: theme.textoPrimario }]} numberOfLines={1}>
                      {item.cliente.nome_completo || 'Cliente sem nome'}
                    </Text>
                    <Text style={[styles.cardServico, { color: theme.textoSecundario }]} numberOfLines={1}>
                      {item.servico.nome}
                    </Text>
                  </View>

                  {/* Preço, Badge e Ação Rápida */}
                  <View style={styles.cardPrecoStatus}>
                    <Text style={[styles.cardPreco, { color: theme.ouroTexto }]}>
                      {Number(item.servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                    <View style={styles.cardStatusRow}>
                      <BadgeStatus status={item.status === 'confirmado' && decorrido ? 'concluido' : item.status} />
                      {item.cliente.telefone ? (
                        <TouchableOpacity
                          style={[styles.btnCardWhats, { backgroundColor: theme.verdeClaro, borderColor: theme.verde }]}
                          onPress={() => handleEnviarWhatsappConfirmacao(item)}
                          activeOpacity={0.7}
                        >
                          <MessageCircle size={14} color={theme.verde} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* ─── MODAL BOTTOM SHEET: AÇÕES RÁPIDAS (⚡) ─── */}
      <Modal
        visible={modalAcoesRapidas}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAcoesRapidas(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalAcoesRapidas(false)}>
          <Pressable style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalTraco, { backgroundColor: theme.bordaDestaque }]} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Ferramentas do Dia</Text>
                <Text style={[styles.modalSub, { color: theme.textoSecundario }]}>Ações rápidas de produtividade e avisos</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalAcoesRapidas(false)}
                style={styles.modalBtnFechar}
                activeOpacity={0.7}
              >
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalAcoesCorpo}>
              {/* Opção 1: Encaixe Rápido */}
              <TouchableOpacity
                style={[styles.itemAcaoRapida, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={() => {
                  setModalAcoesRapidas(false);
                  abrirModalEncaixe();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.itemAcaoIcone, { backgroundColor: theme.ouroTranslucido }]}>
                  <Plus size={18} color={theme.ouroTexto} />
                </View>
                <View style={styles.itemAcaoTexto}>
                  <Text style={[styles.itemAcaoTitulo, { color: theme.textoPrimario }]}>Novo Encaixe de Balcão</Text>
                  <Text style={[styles.itemAcaoSub, { color: theme.textoSecundario }]}>Adicione cliente presencial na agenda de hoje</Text>
                </View>
                <ChevronRight size={16} color={theme.textoSecundario} />
              </TouchableOpacity>

              {/* Opção 2: Avisar Próximo Cliente */}
              <TouchableOpacity
                style={[styles.itemAcaoRapida, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={() => {
                  setModalAcoesRapidas(false);
                  if (ativosInteligentes.length > 0) {
                    handleEnviarWhatsappConfirmacao(ativosInteligentes[0]);
                  } else {
                    Alert.alert('Nenhum agendamento', 'Não há agendamentos ativos pendentes para hoje.');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.itemAcaoIcone, { backgroundColor: theme.verdeClaro }]}>
                  <Send size={18} color={theme.verde} />
                </View>
                <View style={styles.itemAcaoTexto}>
                  <Text style={[styles.itemAcaoTitulo, { color: theme.textoPrimario }]}>Avisar Próximo Cliente</Text>
                  <Text style={[styles.itemAcaoSub, { color: theme.textoSecundario }]}>Enviar mensagem de confirmação via WhatsApp</Text>
                </View>
                <ChevronRight size={16} color={theme.textoSecundario} />
              </TouchableOpacity>

              {/* Opção 3: Informar Atraso */}
              <View style={[styles.secaoAcaoCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <View style={styles.secaoAcaoHeader}>
                  <View style={[styles.itemAcaoIcone, { backgroundColor: theme.amareloClaro }]}>
                    <Clock size={18} color={theme.amarelo} />
                  </View>
                  <View style={styles.itemAcaoTexto}>
                    <Text style={[styles.itemAcaoTitulo, { color: theme.textoPrimario }]}>Informar Atraso Geral</Text>
                    <Text style={[styles.itemAcaoSub, { color: theme.textoSecundario }]}>Ajusta a previsão informada aos clientes</Text>
                  </View>
                </View>

                <View style={styles.atrasoOpcoes}>
                  {[10, 15, 20, 30].map((minutos) => (
                    <TouchableOpacity
                      key={minutos}
                      style={[
                        styles.atrasoBotao,
                        { backgroundColor: theme.superficie, borderColor: theme.borda },
                        minutosAtraso === minutos && [styles.atrasoBotaoAtivo, { backgroundColor: theme.ouro, borderColor: theme.ouro }],
                      ]}
                      onPress={() => handleDefinirAtraso(minutos)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.atrasoTexto,
                          { color: theme.textoPrimario },
                          minutosAtraso === minutos && { color: '#09090B', fontFamily: FontFamily.bold },
                        ]}
                      >
                        +{minutos} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {minutosAtraso > 0 && (
                    <TouchableOpacity
                      style={[styles.normalizarBotao, { borderColor: theme.verde }]}
                      onPress={() => handleDefinirAtraso(0)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.normalizarTexto, { color: theme.verde }]}>Zerar atraso</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Opção 4: Pausa da Tarde */}
              <View style={[styles.secaoAcaoCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <View style={styles.tardeHeader}>
                  <View style={styles.tardeTextoWrapper}>
                    <Text style={[styles.itemAcaoTitulo, { color: theme.textoPrimario }]}>
                      {tardeFechadaHoje ? 'Pausa da Tarde Ativa' : 'Pausa da Tarde'}
                    </Text>
                    <Text style={[styles.itemAcaoSub, { color: theme.textoSecundario }]}>
                      {tardeFechadaHoje
                        ? 'Aviso ativo no aplicativo dos clientes'
                        : 'Avisar clientes que não haverá expediente à tarde hoje.'}
                    </Text>
                  </View>
                  <Switch
                    value={tardeFechadaHoje}
                    onValueChange={handleAlternarTarde}
                    trackColor={{ false: theme.borda, true: theme.ouro }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {tardeFechadaHoje && (
                  <TouchableOpacity
                    style={styles.botaoPostarStatus}
                    onPress={handlePostarStatusWhatsapp}
                    activeOpacity={0.8}
                  >
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.botaoPostarStatusTexto}>Postar no Status do WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── MODAL DETALHES DO AGENDAMENTO ─── */}
      <Modal
        visible={agendamentoSelecionado !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAgendamentoSelecionado(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAgendamentoSelecionado(null)}>
          <Pressable style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalTraco, { backgroundColor: theme.bordaDestaque }]} />

            {agendamentoSelecionado && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalClienteNome, { color: theme.textoPrimario }]}>
                      {agendamentoSelecionado.cliente.nome_completo || 'Cliente sem nome'}
                    </Text>
                    <Text style={[styles.modalSub, { color: theme.textoSecundario }]}>
                      Horário: {formatarHora(agendamentoSelecionado.data_hora)} · {agendamentoSelecionado.servico.duracao_minutos} min
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAgendamentoSelecionado(null)}
                    style={styles.modalBtnFechar}
                    activeOpacity={0.7}
                  >
                    <X size={20} color={theme.textoSecundario} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.modalDetalhesCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <View style={styles.modalDetalhesLinha}>
                    <Text style={[styles.modalDetalhesRotulo, { color: theme.textoSecundario }]}>Serviço:</Text>
                    <Text style={[styles.modalDetalhesValor, { color: theme.textoPrimario }]}>{agendamentoSelecionado.servico.nome}</Text>
                  </View>
                  <View style={styles.modalDetalhesLinha}>
                    <Text style={[styles.modalDetalhesRotulo, { color: theme.textoSecundario }]}>Valor:</Text>
                    <Text style={[styles.modalDetalhesValor, { color: theme.ouroTexto, fontFamily: FontFamily.bold }]}>
                      {Number(agendamentoSelecionado.servico.preco).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </Text>
                  </View>
                  <View style={styles.modalDetalhesLinha}>
                    <Text style={[styles.modalDetalhesRotulo, { color: theme.textoSecundario }]}>Status:</Text>
                    <BadgeStatus status={agendamentoSelecionado.status} />
                  </View>
                  {agendamentoSelecionado.cliente.telefone && (
                    <View style={styles.modalDetalhesLinha}>
                      <Text style={[styles.modalDetalhesRotulo, { color: theme.textoSecundario }]}>Telefone:</Text>
                      <Text style={[styles.modalDetalhesValor, { color: theme.textoPrimario }]}>{agendamentoSelecionado.cliente.telefone}</Text>
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
                      style={[styles.botaoConcluir, { backgroundColor: theme.verde }]}
                      onPress={() => handleConcluir(agendamentoSelecionado)}
                      disabled={processandoAcao}
                      activeOpacity={0.8}
                    >
                      {processandoAcao ? (
                        <ActivityIndicator size="small" color="#09090B" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} color="#09090B" />
                          <Text style={[styles.botaoConcluirTexto, { color: '#09090B' }]}>Concluir Atendimento</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {agendamentoSelecionado.status !== 'cancelado' && (
                    <TouchableOpacity
                      style={[styles.botaoCancelar, { backgroundColor: theme.erroClaro, borderColor: theme.erro }]}
                      onPress={() => handleConfirmarCancelar(agendamentoSelecionado)}
                      disabled={processandoAcao}
                      activeOpacity={0.8}
                    >
                      <XCircle size={18} color={theme.erro} />
                      <Text style={[styles.botaoCancelarTexto, { color: theme.erro }]}>Cancelar / Não Compareceu</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── MODAL DE NOVO ENCAIXE DE BALCÃO ─── */}
      <Modal
        visible={modalEncaixe}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEncaixe(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalEncaixe(false)}>
          <Pressable style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalTraco, { backgroundColor: theme.bordaDestaque }]} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Novo Encaixe de Balcão</Text>
                <Text style={[styles.modalSub, { color: theme.textoSecundario }]}>Adicione um cliente presencial à agenda de hoje</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalEncaixe(false)}
                style={styles.modalBtnFechar}
                activeOpacity={0.7}
              >
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalCorpo}>
              {/* Nome */}
              <View style={styles.campoEncaixe}>
                <Text style={[styles.campoEncaixeLabel, { color: theme.textoSecundario }]}>Nome do Cliente *</Text>
                <TextInput
                  style={[styles.inputEncaixe, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                  placeholder="Ex: Carlos Eduardo"
                  placeholderTextColor={theme.textoDesabilitado}
                  value={nomeEncaixe}
                  onChangeText={setNomeEncaixe}
                  autoCapitalize="words"
                />
              </View>

              {/* Telefone / WhatsApp */}
              <View style={styles.campoEncaixe}>
                <Text style={[styles.campoEncaixeLabel, { color: theme.textoSecundario }]}>WhatsApp (Opcional)</Text>
                <TextInput
                  style={[styles.inputEncaixe, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                  placeholder="(86) 99999-9999"
                  placeholderTextColor={theme.textoDesabilitado}
                  value={telefoneEncaixe}
                  onChangeText={setTelefoneEncaixe}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Serviço */}
              <View style={styles.campoEncaixe}>
                <Text style={[styles.campoEncaixeLabel, { color: theme.textoSecundario }]}>Serviço *</Text>
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
                        style={[
                          styles.chipServicoEncaixe,
                          { backgroundColor: theme.superficie2, borderColor: theme.borda },
                          selecionado && [styles.chipServicoEncaixeAtivo, { backgroundColor: theme.ouroTranslucido, borderColor: theme.ouro }],
                        ]}
                        onPress={() => setServicoEncaixeId(s.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipServicoEncaixeTexto,
                            { color: theme.textoSecundario },
                            selecionado && [styles.chipServicoEncaixeTextoAtivo, { color: theme.ouroTexto }],
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
                <Text style={[styles.campoEncaixeLabel, { color: theme.textoSecundario }]}>Horário do Atendimento (HH:MM)</Text>
                <TextInput
                  style={[styles.inputEncaixe, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                  placeholder="14:30"
                  placeholderTextColor={theme.textoDesabilitado}
                  value={horaEncaixe}
                  onChangeText={setHoraEncaixe}
                />
              </View>

              <TouchableOpacity
                style={[styles.botaoSalvarEncaixe, { backgroundColor: theme.ouro }]}
                onPress={handleSalvarEncaixe}
                disabled={salvandoEncaixe}
                activeOpacity={0.8}
              >
                {salvandoEncaixe ? (
                  <ActivityIndicator color="#09090B" size="small" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#09090B" />
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

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.fundo },
    header: {
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerInfo: {
      flex: 1,
      marginRight: Spacing.xs,
    },
    titulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.displayMd,
      color: theme.textoPrimario,
    },
    subtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      marginTop: 2,
    },
    headerBotoes: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeBarbeiro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
      maxWidth: 130,
    },
    badgeBarbeiroTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 11,
      color: theme.ouroTexto,
    },
    btnHeaderAcoes: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      padding: Spacing.telaH,
      gap: Spacing.md,
      paddingBottom: Spacing.giant,
    },

    /* ─── BANNERS DE ALERTA ─── */
    bannerAlertaAtraso: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 214, 10, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255, 214, 10, 0.35)',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radii.md,
      gap: Spacing.xs,
    },
    bannerAlertaTarde: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.erroClaro,
      borderWidth: 1,
      borderColor: theme.erro,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radii.md,
      gap: Spacing.xs,
    },
    bannerAlertaConteudo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bannerAlertaTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.amarelo,
      flex: 1,
    },
    bannerAlertaTextoTarde: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.erro,
      flex: 1,
    },
    bannerAlertaBtnZerar: {
      backgroundColor: theme.amarelo,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radii.sm,
    },
    bannerAlertaBtnZerarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: '#09090B',
    },
    bannerAlertaAcoes: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    bannerAlertaBtnWhats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'rgba(37, 211, 102, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(37, 211, 102, 0.3)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: Radii.sm,
    },
    bannerAlertaBtnWhatsTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.labelXs,
      color: '#25D366',
    },
    bannerAlertaBtnReabrir: {
      backgroundColor: theme.erro,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: Radii.sm,
    },
    bannerAlertaBtnReabrirTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: '#FFFFFF',
    },

    /* ─── HERO CARD COM ANEL RADIAL ─── */
    heroCard: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...Shadows.card,
    },
    heroCorpo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.md,
    },
    ringWrapper: {
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    ringCentro: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringPctTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 18,
    },
    ringSubTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      marginTop: -2,
    },
    heroInfoLado: {
      flex: 1,
      justifyContent: 'center',
      gap: 3,
    },
    heroPillLinha: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroPillHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    heroPillHeaderTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 9.5,
      letterSpacing: 0.5,
    },
    heroFaturamentoValor: {
      fontFamily: FontFamily.bold,
      fontSize: 24,
      marginTop: 2,
    },
    heroComissaoLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 2,
    },
    heroComissaoRotulo: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
    },
    badgeComissao: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.sm,
      borderWidth: 1,
    },
    badgeComissaoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 11,
    },
    heroRodape: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderTopWidth: 1,
      gap: 6,
    },
    heroRodapeTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
      flex: 1,
    },

    /* ─── LIVE STATUS: NA CADEIRA AGORA ─── */
    cardNaCadeira: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1.5,
      borderColor: theme.ouro,
      gap: Spacing.xs,
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
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    naCadeiraLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    naCadeiraLiveTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    naCadeiraHora: {
      fontFamily: FontFamily.bold,
      fontSize: 15,
      color: theme.ouroTexto,
    },
    naCadeiraInfo: {
      gap: 1,
      marginTop: 2,
    },
    naCadeiraClienteNome: {
      fontFamily: FontFamily.bold,
      fontSize: 18,
      color: theme.textoPrimario,
    },
    naCadeiraServico: {
      fontFamily: FontFamily.medium,
      fontSize: 12.5,
      color: theme.textoSecundario,
    },
    naCadeiraAcoes: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: 6,
    },
    btnNaCadeiraConcluir: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: Radii.md,
    },
    btnNaCadeiraConcluirTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13.5,
      color: '#09090B',
    },
    btnNaCadeiraWhats: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radii.md,
      borderWidth: 1,
    },

    /* ─── SEÇÃO AGENDA DE HOJE ─── */
    secaoAgendaHeader: {
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    secaoTituloLinhaComRaio: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    btnRaioDiscreto: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
      color: theme.textoPrimario,
    },
    secaoSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      color: theme.textoSecundario,
      marginTop: 1,
    },
    filtrosContainer: {
      flexDirection: 'row',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: 3,
      borderWidth: 1,
      borderColor: theme.borda,
      marginTop: 4,
    },
    filtroPill: {
      flex: 1,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radii.sm,
    },
    filtroPillAtivo: {
      backgroundColor: theme.ouro,
    },
    filtroPillTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
      color: theme.textoSecundario,
    },
    filtroPillTextoAtivo: {
      color: '#09090B',
      fontFamily: FontFamily.bold,
    },

    /* ─── LISTAGEM DE CARDS ─── */
    listaCards: {
      gap: Spacing.sm,
    },
    loadingContainer: {
      paddingVertical: Spacing.xl,
      alignItems: 'center',
    },
    vazio: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      padding: Spacing.xl,
      alignItems: 'center',
      gap: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.borda,
      marginTop: Spacing.sm,
    },
    vazioTitulo: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyLg,
      color: theme.textoPrimario,
      textAlign: 'center',
      marginTop: 4,
    },
    vazioTexto: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      color: theme.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
    },
    cardAgendamento: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
      ...Shadows.card,
    },
    cardConcluido: {
      opacity: 0.65,
    },
    cardCancelado: {
      opacity: 0.45,
    },
    cardHoraColuna: {
      alignItems: 'center',
      minWidth: 46,
      gap: 2,
    },
    cardHora: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyLg,
      color: theme.textoPrimario,
    },
    cardDuracao: {
      fontFamily: FontFamily.regular,
      fontSize: 10.5,
      color: theme.textoSecundario,
    },
    cardDivisorVertical: {
      width: 1,
      height: '100%',
      backgroundColor: theme.borda,
      alignSelf: 'stretch',
    },
    cardAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    cardAvatarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
    cardInfo: {
      flex: 1,
      gap: 2,
    },
    cardClienteNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    cardServico: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    cardPrecoStatus: {
      alignItems: 'flex-end',
      gap: 4,
    },
    cardPreco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.ouroTexto,
    },
    cardStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    btnCardWhats: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },

    /* ─── BOTÃO FLUTUANTE (FAB) ─── */
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.ouro,
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: Radii.full,
      ...Shadows.cardElevado,
      elevation: 8,
    },
    fabTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
      color: '#09090B',
    },

    /* ─── MODAL GERAL & BOTTOM SHEET ─── */
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
      maxHeight: '90%',
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
    modalTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
      color: theme.textoPrimario,
    },
    modalSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
      marginTop: 2,
    },
    modalBtnFechar: {
      padding: 6,
    },
    modalAcoesCorpo: {
      gap: Spacing.sm,
      paddingBottom: Spacing.md,
    },
    itemAcaoRapida: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: Radii.lg,
      borderWidth: 1,
      gap: Spacing.sm,
    },
    itemAcaoIcone: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemAcaoTexto: {
      flex: 1,
      gap: 1,
    },
    itemAcaoTitulo: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    itemAcaoSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      color: theme.textoSecundario,
    },
    secaoAcaoCard: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    secaoAcaoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    atrasoOpcoes: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: 4,
    },
    atrasoBotao: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.sm,
      borderWidth: 1,
    },
    atrasoBotaoAtivo: {},
    atrasoTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
    },
    normalizarBotao: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Radii.sm,
      borderWidth: 1,
    },
    normalizarTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
    },
    tardeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tardeTextoWrapper: {
      flex: 1,
      marginRight: Spacing.sm,
      gap: 1,
    },
    botaoPostarStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#25D366',
      paddingVertical: 10,
      borderRadius: Radii.md,
      marginTop: 4,
    },
    botaoPostarStatusTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: '#FFFFFF',
    },

    /* ─── MODAL DETALHES AGENDAMENTO ─── */
    modalClienteNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
      color: theme.textoPrimario,
    },
    modalDetalhesCard: {
      borderRadius: Radii.md,
      padding: Spacing.md,
      gap: Spacing.xs,
      borderWidth: 1,
    },
    modalDetalhesLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalDetalhesRotulo: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
    },
    modalDetalhesValor: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
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
      paddingVertical: 14,
      borderRadius: Radii.md,
    },
    botaoConcluirTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    botaoCancelar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: Radii.md,
      borderWidth: 1,
    },
    botaoCancelarTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
    },

    /* ─── MODAL ENCAIXE ─── */
    modalCorpo: {
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    campoEncaixe: {
      gap: 4,
      marginBottom: Spacing.sm,
    },
    campoEncaixeLabel: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
    },
    inputEncaixe: {
      borderWidth: 1,
      borderRadius: Radii.sm,
      paddingHorizontal: Spacing.sm,
      height: 44,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
    },
    servicosEncaixeScroll: {
      gap: Spacing.xs,
      paddingVertical: 4,
    },
    chipServicoEncaixe: {
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radii.full,
    },
    chipServicoEncaixeAtivo: {},
    chipServicoEncaixeTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
    },
    chipServicoEncaixeTextoAtivo: {},
    botaoSalvarEncaixe: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: Radii.md,
      marginTop: Spacing.xs,
    },
    botaoSalvarEncaixeTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: '#09090B',
    },
  });
