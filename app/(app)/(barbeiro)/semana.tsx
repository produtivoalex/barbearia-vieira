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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Scissors,
  User,
  Phone,
  MessageCircle,
  X,
  Calendar,
  Zap,
  CalendarPlus,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
} from 'lucide-react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, G, Line, Text as SvgText } from 'react-native-svg';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { usePainelBarbeiro, type AgendamentoBarbeiro } from '@/hooks/usePainelBarbeiro';
import { useAgendaSemanal } from '@/hooks/useAgendaSemanal';
import { useDesempenhoMensal, type DiaDesempenho } from '@/hooks/useDesempenhoMensal';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Formata uma data local para string ISO YYYY-MM-DD sem shift de timezone UTC */
function formatarDataLocal(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Extrai a data no formato local YYYY-MM-DD a partir de um timestamp ISO do banco */
function extrairDataLocal(dataHoraIso: string): string {
  if (!dataHoraIso) return '';
  const d = new Date(dataHoraIso);
  return formatarDataLocal(d);
}

function formatarDataCurta(dataStrOuIso: string) {
  if (!dataStrOuIso) return '';
  const str = dataStrOuIso.length > 10 ? extrairDataLocal(dataStrOuIso) : dataStrOuIso;
  const [anoStr, mesStr, diaStr] = str.split('-');
  const d = new Date(Number(anoStr), Number(mesStr) - 1, Number(diaStr));
  return `${DIAS_CURTOS[d.getDay()]}, ${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`;
}

function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TelaBarbeiroSemana() {
  const router = useRouter();
  const params = useLocalSearchParams<{ aba?: string }>();
  const { theme } = useTheme();
  const { width: larguraTela } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuth();
  const { barbearia } = useBarbearia();

  // Controle de Aba Principal: 'agenda' (Semana Atual) vs 'evolucao' (Mês / Progresso)
  const [abaAtiva, setAbaAtiva] = useState<'agenda' | 'evolucao'>(
    params.aba === 'evolucao' ? 'evolucao' : 'agenda'
  );

  // Modo de visualização do gráfico de evolução: 'mes' (Mês Completo) ou 'semana' (Semana a Semana)
  // Por padrão vem aberta na visualização mensal
  const [modoGraficoEvolucao, setModoGraficoEvolucao] = useState<'mes' | 'semana'>('mes');
  const [semanaGraficoIdx, setSemanaGraficoIdx] = useState<number>(0);

  useEffect(() => {
    if (params.aba === 'evolucao') {
      setAbaAtiva('evolucao');
    }
  }, [params.aba]);

  // Hook da Agenda Semanal
  const { agendamentosSemana, carregando: carregandoSemana, recarregar: recarregarSemana } = usePainelBarbeiro(barbearia?.id);
  const { carregarProximaParaBarbeiro } = useAgendaSemanal(barbearia?.id);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoBarbeiro | null>(null);
  const [agendaProxima, setAgendaProxima] = useState<any | null>(null);
  const [liberando, setLiberando] = useState(false);
  const [diaSemanaFiltrado, setDiaSemanaFiltrado] = useState<string | null>(null);

  // Hook do Desempenho Mensal
  const mensal = useDesempenhoMensal(barbearia?.id);
  const [diaSelecionado, setDiaSelecionado] = useState<DiaDesempenho | null>(null);
  const [semanasExpandidas, setSemanasExpandidas] = useState<Record<number, boolean>>({});

  const toggleSemana = (num: number) => {
    setSemanasExpandidas((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const carregarStatusAgenda = useCallback(async () => {
    const dados = await carregarProximaParaBarbeiro();
    setAgendaProxima(dados);
  }, [carregarProximaParaBarbeiro]);

  useEffect(() => {
    carregarStatusAgenda();
  }, [carregarStatusAgenda]);

  // Agrupa agendamentos da semana por dia (chave: YYYY-MM-DD local)
  const porDia = useMemo(() => {
    const mapa = new Map<string, AgendamentoBarbeiro[]>();
    for (const ag of agendamentosSemana) {
      const chave = extrairDataLocal(ag.data_hora);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(ag);
    }
    const lista = Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (diaSemanaFiltrado) {
      return lista.filter(([chave]) => chave === diaSemanaFiltrado);
    }
    return lista;
  }, [agendamentosSemana, diaSemanaFiltrado]);

  // Métricas e cálculo dos 7 dias da Semana Atual (Segunda a Domingo com datas locais)
  const { labelSemana, totalFaturamentoSemana, diasSemanaAtual, maxFaturamentoSemanal } = useMemo(() => {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const diffSeg = diaSemana === 0 ? -6 : 1 - diaSemana;
    const segunda = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + diffSeg, 0, 0, 0);
    const domingo = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + 6, 23, 59, 59);

    const hojeStr = formatarDataLocal(agora);
    const fmtData = (d: Date) => `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`;
    const faturamento = agendamentosSemana.reduce((acc, a) => acc + Number(a.servico?.preco || 0), 0);

    const dias = [];

    for (let i = 0; i < 7; i++) {
      const dataDia = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + i, 0, 0, 0);
      const dataStr = formatarDataLocal(dataDia);
      const agsDia = agendamentosSemana.filter((a) => extrairDataLocal(a.data_hora) === dataStr);
      const fatDia = agsDia.reduce((acc, a) => acc + Number(a.servico?.preco || 0), 0);

      dias.push({
        diaNumero: dataDia.getDate(),
        sigla: DIAS_CURTOS[dataDia.getDay()],
        dataStr,
        faturamento: fatDia,
        totalCortes: agsDia.length,
        isHoje: dataStr === hojeStr,
        agendamentos: agsDia,
      });
    }

    const maxFat = Math.max(1, ...dias.map((d) => d.faturamento));

    return {
      labelSemana: `${fmtData(segunda)} – ${fmtData(domingo)}`,
      totalFaturamentoSemana: faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      diasSemanaAtual: dias,
      maxFaturamentoSemanal: maxFat,
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
    const nomeBarbearia = barbearia?.nome || 'Na Régua';
    const msg = encodeURIComponent(`Olá ${nomeCliente || ''}, aqui é da ${nomeBarbearia} sobre o seu agendamento.`);
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

  // Dimensões do gráfico
  const LARGURA_GRAFICO = Math.max(300, larguraTela - Spacing.telaH * 2 - 32);
  const ALTURA_GRAFICO_SEMANAL = 85;
  const ALTURA_GRAFICO_MENSAL = 100;

  const slotSemanal = LARGURA_GRAFICO / 7;
  const larguraBarraSemanal = Math.min(24, slotSemanal - 8);

  const totalBarrasMes = mensal.dias.length;
  const larguraBarraMes = Math.max(5.5, (LARGURA_GRAFICO - totalBarrasMes * 2) / totalBarrasMes);

  // Semana selecionada para a visualização semanal do gráfico de evolução
  const semanaEvolucaoAtual = mensal.semanas[semanaGraficoIdx] || mensal.semanas[0];
  const maxFatSemanaEvolucao = semanaEvolucaoAtual
    ? Math.max(1, ...semanaEvolucaoAtual.dias.map((d) => d.faturamento))
    : 1;
  const slotSemanaEvolucao = semanaEvolucaoAtual && semanaEvolucaoAtual.dias.length > 0
    ? LARGURA_GRAFICO / semanaEvolucaoAtual.dias.length
    : slotSemanal;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* ─── Header Limpo e Sem Redundância ─── */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.titulo, { color: theme.textoPrimario }]}>
            {abaAtiva === 'agenda' ? 'Semana Atual' : 'Evolução do Mês'}
          </Text>
          <Text style={[styles.subtitulo, { color: theme.textoSecundario }]}>
            {abaAtiva === 'agenda' ? labelSemana : `${mensal.mesNome} de ${mensal.ano}`}
          </Text>
        </View>

        {abaAtiva === 'agenda' ? (
          <View style={styles.metricasTopo}>
            <Text style={[styles.metricasTopoAgendamentos, { color: theme.ouroTexto }]}>
              {agendamentosSemana.length} {agendamentosSemana.length === 1 ? 'corte' : 'cortes'}
            </Text>
            <Text style={[styles.metricasTopoValor, { color: theme.verde }]}>{totalFaturamentoSemana}</Text>
          </View>
        ) : (
          /* Navegador Compacto de Mês */
          <View style={[styles.navegadorTopoCompacto, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
            <TouchableOpacity onPress={mensal.voltarMes} style={styles.btnNavTopo} activeOpacity={0.7}>
              <ChevronLeft size={16} color={theme.textoPrimario} />
            </TouchableOpacity>
            <Text style={[styles.navegadorTopoTexto, { color: theme.textoPrimario }]}>
              {mensal.mesNome.slice(0, 3)}/{mensal.ano}
            </Text>
            <TouchableOpacity onPress={mensal.avancarMes} style={styles.btnNavTopo} activeOpacity={0.7}>
              <ChevronRight size={16} color={theme.textoPrimario} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── Seletor de Abas Principais ─── */}
      <View style={styles.segmentosContainer}>
        <View style={[styles.segmentosTrilho, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
          <TouchableOpacity
            style={[
              styles.segmentoBtn,
              abaAtiva === 'agenda' && [styles.segmentoBtnAtivo, { backgroundColor: theme.ouro }],
            ]}
            onPress={() => setAbaAtiva('agenda')}
            activeOpacity={0.8}
          >
            <BarChart3 size={14} color={abaAtiva === 'agenda' ? '#09090B' : theme.textoSecundario} />
            <Text
              style={[
                styles.segmentoTexto,
                { color: theme.textoSecundario },
                abaAtiva === 'agenda' && styles.segmentoTextoAtivo,
              ]}
            >
              Semana Atual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentoBtn,
              abaAtiva === 'evolucao' && [styles.segmentoBtnAtivo, { backgroundColor: theme.ouro }],
            ]}
            onPress={() => setAbaAtiva('evolucao')}
            activeOpacity={0.8}
          >
            <TrendingUp size={14} color={abaAtiva === 'evolucao' ? '#09090B' : theme.textoSecundario} />
            <Text
              style={[
                styles.segmentoTexto,
                { color: theme.textoSecundario },
                abaAtiva === 'evolucao' && styles.segmentoTextoAtivo,
              ]}
            >
              Evolução do Mês
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── CONTEÚDO DA ABA 1: SEMANA ATUAL ─── */}
      {abaAtiva === 'agenda' ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={carregandoSemana}
              onRefresh={() => {
                recarregarSemana();
                carregarStatusAgenda();
              }}
              tintColor={theme.ouro}
              colors={[theme.ouro]}
            />
          }
        >
          {/* ─── GRÁFICO SEMANAL DE 7 DIAS ─── */}
          <View style={[styles.cardGraficoSemanal, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={styles.graficoSemanalHeader}>
              <View>
                <Text style={[styles.graficoSemanalTitulo, { color: theme.textoPrimario }]}>
                  Ritmo da Semana
                </Text>
                <Text style={[styles.graficoSemanalSub, { color: theme.textoSecundario }]}>
                  Toque em um dia para filtrar a lista
                </Text>
              </View>
              <View style={[styles.pillBadgeSemana, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Sparkles size={11} color={theme.ouroTexto} />
                <Text style={[styles.pillBadgeSemanaTexto, { color: theme.ouroTexto }]}>7 DIAS</Text>
              </View>
            </View>

            {/* SVG das 7 Barras da Semana */}
            <View style={styles.svgSemanalWrapper}>
              <Svg width={LARGURA_GRAFICO} height={ALTURA_GRAFICO_SEMANAL}>
                <Defs>
                  <LinearGradient id="gradBarraSemanal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={theme.ouroClaro} />
                    <Stop offset="100%" stopColor={theme.ouro} />
                  </LinearGradient>
                  <LinearGradient id="gradBarraSemanalHoje" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={theme.ouroVibrante} />
                    <Stop offset="100%" stopColor={theme.ouro} />
                  </LinearGradient>
                </Defs>

                {/* Linha de base horizontal */}
                <Line x1="0" y1={ALTURA_GRAFICO_SEMANAL - 2} x2={LARGURA_GRAFICO} y2={ALTURA_GRAFICO_SEMANAL - 2} stroke={theme.borda} strokeWidth="1" />

                {/* 7 Barras */}
                {diasSemanaAtual.map((d, index) => {
                  const alturaBarra = d.faturamento > 0
                    ? Math.max(14, (d.faturamento / maxFaturamentoSemanal) * (ALTURA_GRAFICO_SEMANAL - 20))
                    : 3;
                  const x = index * slotSemanal + (slotSemanal - larguraBarraSemanal) / 2;
                  const y = ALTURA_GRAFICO_SEMANAL - alturaBarra - 2;
                  const isFiltrado = diaSemanaFiltrado === d.dataStr;

                  return (
                    <G key={d.dataStr}>
                      <Rect
                        x={x}
                        y={y}
                        width={larguraBarraSemanal}
                        height={alturaBarra}
                        rx={4}
                        fill={
                          isFiltrado
                            ? '#FFFFFF'
                            : d.isHoje
                            ? 'url(#gradBarraSemanalHoje)'
                            : d.faturamento > 0
                            ? 'url(#gradBarraSemanal)'
                            : theme.superficie2
                        }
                      />
                    </G>
                  );
                })}
              </Svg>

              {/* Botões dos 7 Dias da Semana */}
              <View style={styles.semanalRotulosLinha}>
                {diasSemanaAtual.map((d) => {
                  const isFiltrado = diaSemanaFiltrado === d.dataStr;
                  return (
                    <TouchableOpacity
                      key={d.dataStr}
                      style={[
                        styles.semanalRotuloItem,
                        { width: slotSemanal },
                        isFiltrado && [styles.semanalRotuloItemAtivo, { backgroundColor: theme.ouro }],
                        d.isHoje && !isFiltrado && [styles.semanalRotuloItemHoje, { borderColor: theme.bordaOuro, backgroundColor: theme.ouroTranslucido }],
                      ]}
                      onPress={() => setDiaSemanaFiltrado(diaSemanaFiltrado === d.dataStr ? null : d.dataStr)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.semanalRotuloSigla,
                          { color: theme.textoSecundario },
                          d.isHoje && { color: theme.ouroTexto, fontFamily: FontFamily.bold },
                          isFiltrado && { color: '#09090B', fontFamily: FontFamily.bold },
                        ]}
                      >
                        {d.sigla}
                      </Text>
                      <Text
                        style={[
                          styles.semanalRotuloDia,
                          { color: theme.textoPrimario },
                          d.isHoje && { color: theme.ouroTexto, fontFamily: FontFamily.bold },
                          isFiltrado && { color: '#09090B', fontFamily: FontFamily.bold },
                        ]}
                      >
                        {d.diaNumero}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Aviso de Filtro Ativo */}
            {diaSemanaFiltrado && (
              <View style={[styles.bannerFiltroDia, { backgroundColor: theme.superficie2, borderColor: theme.bordaOuro }]}>
                <Text style={[styles.bannerFiltroDiaTexto, { color: theme.textoPrimario }]} numberOfLines={1}>
                  Filtro: {formatarDataCurta(diaSemanaFiltrado)}
                </Text>
                <TouchableOpacity onPress={() => setDiaSemanaFiltrado(null)} activeOpacity={0.7} style={styles.btnLimparFiltro}>
                  <Text style={[styles.bannerFiltroDiaLimpar, { color: theme.ouroTexto }]}>Ver Todos</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Banner de Gerenciamento / Liberação Rápida da Próxima Semana */}
          <View style={[styles.cardAberturaRapida, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            {agendaProxima?.status === 'programada' ? (
              <View style={styles.linhaAberturaProgramada}>
                <View style={{ flex: 1, marginRight: Spacing.xs }}>
                  <Text style={[styles.aberturaRapidaTitulo, { color: theme.textoPrimario }]} numberOfLines={1}>Próxima Semana Programada</Text>
                  <Text style={[styles.aberturaRapidaSub, { color: theme.textoSecundario }]} numberOfLines={1}>Abertura agendada para segunda</Text>
                </View>
                <TouchableOpacity
                  style={[styles.botaoLiberarAgora, { backgroundColor: theme.ouro }]}
                  onPress={handleLiberarAgendaAgora}
                  disabled={liberando}
                  activeOpacity={0.8}
                >
                  {liberando ? (
                    <ActivityIndicator size="small" color="#09090B" />
                  ) : (
                    <>
                      <Zap size={13} color="#09090B" />
                      <Text style={styles.botaoLiberarAgoraTexto}>Liberar Agora</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : agendaProxima?.status === 'aberta' ? (
              <View style={styles.linhaAberturaAberta}>
                <View style={[styles.badgeAberta, { backgroundColor: theme.verdeClaro }]}>
                  <Zap size={13} color={theme.verde} />
                  <Text style={[styles.badgeAbertaTexto, { color: theme.verde }]} numberOfLines={1}>
                    AGENDA ABERTA 🟢
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.btnEditarAgenda, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                  onPress={() => router.push('/(app)/(barbeiro)/preparar-agenda')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.btnEditarAgendaTexto, { color: theme.textoPrimario }]}>Ajustar Vagas</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.btnCriarAgenda, { backgroundColor: theme.ouro }]}
                onPress={() => router.push('/(app)/(barbeiro)/preparar-agenda')}
                activeOpacity={0.8}
              >
                <CalendarPlus size={16} color="#09090B" />
                <Text style={styles.btnCriarAgendaTexto}>Preparar Agenda da Próxima Semana</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de Atendimentos Agrupados por Dia */}
          {carregandoSemana && agendamentosSemana.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.ouro} />
            </View>
          ) : porDia.length === 0 ? (
            <View style={[styles.vazio, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
              <Calendar size={36} color={theme.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: theme.textoPrimario }]}>
                {diaSemanaFiltrado ? 'Sem agendamentos neste dia' : 'Sem agendamentos nesta semana'}
              </Text>
              <Text style={[styles.vazioTexto, { color: theme.textoSecundario }]}>
                {diaSemanaFiltrado
                  ? 'Toque em "Ver Todos" para ver todos os cortes da semana.'
                  : 'Assim que os clientes agendarem, eles aparecerão aqui organizados por dia.'}
              </Text>
            </View>
          ) : (
            porDia.map(([chave, itens]) => {
              const faturamentoDia = itens.reduce((acc, a) => acc + Number(a.servico.preco), 0);
              return (
                <View key={chave} style={styles.grupodia}>
                  {/* Cabeçalho do dia */}
                  <View style={styles.diaCabecalho}>
                    <Text style={[styles.diaNome, { color: theme.textoPrimario }]}>{formatarDataCurta(chave)}</Text>
                    <View style={styles.diaBadges}>
                      <Text style={[styles.diaFaturamento, { color: theme.ouroTexto }]}>
                        {faturamentoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: theme.ouroTranslucido }]}>
                        <Text style={[styles.badgeTexto, { color: theme.ouroTexto }]}>{itens.length} {itens.length === 1 ? 'corte' : 'cortes'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Cards do dia */}
                  {itens.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.cardItem, { backgroundColor: theme.superficie, borderColor: theme.borda, borderWidth: 1 }]}
                      activeOpacity={0.75}
                      onPress={() => setAgendamentoSelecionado(item)}
                    >
                      <View style={styles.cardHorario}>
                        <Text style={[styles.cardHora, { color: theme.ouroTexto }]}>{formatarHora(item.data_hora)}</Text>
                        <Text style={[styles.cardDuracao, { color: theme.textoSecundario }]}>{item.servico.duracao_minutos}min</Text>
                      </View>

                      <View style={[styles.divisorVertical, { backgroundColor: theme.borda }]} />

                      <View style={styles.cardInfo}>
                        <Text style={[styles.clienteNome, { color: theme.textoPrimario }]} numberOfLines={1}>
                          {item.cliente.nome_completo || 'Cliente'}
                        </Text>
                        <Text style={[styles.servicoNome, { color: theme.textoSecundario }]} numberOfLines={1}>
                          {item.servico.nome}
                        </Text>
                      </View>

                      <View style={styles.cardFim}>
                        <Text style={[styles.preco, { color: theme.ouroTexto }]}>
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
      ) : (
        /* ─── CONTEÚDO DA ABA 2: EVOLUÇÃO DO MÊS ─── */
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={mensal.carregando}
              onRefresh={mensal.recarregar}
              tintColor={theme.ouro}
              colors={[theme.ouro]}
            />
          }
        >
          {/* Hero Card de Fechamento do Mês */}
          <View style={[styles.heroCardMes, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={styles.heroMesTopo}>
              <View style={[styles.heroMesBadge, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Sparkles size={11} color={theme.ouroTexto} />
                <Text style={[styles.heroMesBadgeTexto, { color: theme.ouroTexto }]}>
                  {mensal.isMesAtual ? 'FECHAMENTO PARCIAL DO MÊS' : 'FECHAMENTO TOTAL DO MÊS'}
                </Text>
              </View>

              <Text
                style={[styles.heroMesValorPrincipal, { color: theme.textoPrimario }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {mensal.faturamentoTotalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
              <Text style={[styles.heroMesSub, { color: theme.textoSecundario }]}>Faturamento Acumulado</Text>
            </View>

            {/* 3 Métricas em Linha */}
            <View style={[styles.heroMesMetricasLinha, { borderTopColor: theme.borda, backgroundColor: theme.superficie2 }]}>
              <View style={styles.heroMesMetricaItem}>
                <Text style={[styles.heroMesMetricaRotulo, { color: theme.textoSecundario }]}>Cortes</Text>
                <Text style={[styles.heroMesMetricaValor, { color: theme.textoPrimario }]}>
                  {mensal.totalCortesMes}
                </Text>
                <Text style={[styles.heroMesMetricaSub, { color: theme.textoSecundario }]}>atendimentos</Text>
              </View>

              <View style={[styles.heroMesDivisor, { backgroundColor: theme.borda }]} />

              <View style={styles.heroMesMetricaItem}>
                <Text style={[styles.heroMesMetricaRotulo, { color: theme.textoSecundario }]}>Média Diária</Text>
                <Text style={[styles.heroMesMetricaValor, { color: theme.ouroTexto }]}>
                  {mensal.mediaPorDiaTrabalhado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
                <Text style={[styles.heroMesMetricaSub, { color: theme.textoSecundario }]}>por dia ativo</Text>
              </View>

              <View style={[styles.heroMesDivisor, { backgroundColor: theme.borda }]} />

              <View style={styles.heroMesMetricaItem}>
                <Text style={[styles.heroMesMetricaRotulo, { color: theme.textoSecundario }]}>Projeção</Text>
                <Text style={[styles.heroMesMetricaValor, { color: theme.verde }]}>
                  {mensal.projecaoFechamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
                <Text style={[styles.heroMesMetricaSub, { color: theme.textoSecundario }]}>estimativa</Text>
              </View>
            </View>
          </View>

          {/* ─── Card de Evolução com Toggle Mês / Semana ─── */}
          <View style={[styles.cardGrafico, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={styles.graficoHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.graficoTitulo, { color: theme.textoPrimario }]}>Evolução Dia a Dia</Text>
                <Text style={[styles.graficoSub, { color: theme.textoSecundario }]}>
                  {modoGraficoEvolucao === 'mes'
                    ? `${mensal.mesNome} de ${mensal.ano}`
                    : semanaEvolucaoAtual?.label || 'Semana'}
                </Text>
              </View>

              {/* Toggle de Visualização: [ Mês ] e [ Semana ] */}
              <View style={[styles.toggleModoContainer, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <TouchableOpacity
                  style={[
                    styles.toggleModoBtn,
                    modoGraficoEvolucao === 'mes' && [styles.toggleModoBtnAtivo, { backgroundColor: theme.ouro }],
                  ]}
                  onPress={() => setModoGraficoEvolucao('mes')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleModoTexto,
                      { color: theme.textoSecundario },
                      modoGraficoEvolucao === 'mes' && styles.toggleModoTextoAtivo,
                    ]}
                  >
                    Mês
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleModoBtn,
                    modoGraficoEvolucao === 'semana' && [styles.toggleModoBtnAtivo, { backgroundColor: theme.ouro }],
                  ]}
                  onPress={() => setModoGraficoEvolucao('semana')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleModoTexto,
                      { color: theme.textoSecundario },
                      modoGraficoEvolucao === 'semana' && styles.toggleModoTextoAtivo,
                    ]}
                  >
                    Semana
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quando no Modo Semana: Exibe o Seletor de Semanas do Mês */}
            {modoGraficoEvolucao === 'semana' && (
              <View style={[styles.seletorSemanaMesTrilho, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <TouchableOpacity
                  style={styles.btnNavSemanaMes}
                  onPress={() => setSemanaGraficoIdx((prev) => Math.max(0, prev - 1))}
                  disabled={semanaGraficoIdx === 0}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={16} color={semanaGraficoIdx === 0 ? theme.textoDesabilitado : theme.textoPrimario} />
                </TouchableOpacity>

                <View style={styles.semanaMesInfoCentro}>
                  <Text style={[styles.semanaMesTitulo, { color: theme.textoPrimario }]}>
                    Semana {semanaEvolucaoAtual?.numero || 1}
                  </Text>
                  <Text style={[styles.semanaMesPeriodo, { color: theme.textoSecundario }]}>
                    {semanaEvolucaoAtual?.dataInicio} a {semanaEvolucaoAtual?.dataFim}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.btnNavSemanaMes}
                  onPress={() => setSemanaGraficoIdx((prev) => Math.min(mensal.semanas.length - 1, prev + 1))}
                  disabled={semanaGraficoIdx >= mensal.semanas.length - 1}
                  activeOpacity={0.7}
                >
                  <ChevronRight
                    size={16}
                    color={semanaGraficoIdx >= mensal.semanas.length - 1 ? theme.textoDesabilitado : theme.textoPrimario}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* SVG do Gráfico (Mensal ou Semanal) */}
            {modoGraficoEvolucao === 'mes' ? (
              /* Visualização Mensal (31 Dias) */
              <View style={styles.svgContainer}>
                <Svg width={LARGURA_GRAFICO} height={ALTURA_GRAFICO_MENSAL + 20}>
                  <Defs>
                    <LinearGradient id="gradBarraOuro" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={theme.ouroClaro} />
                      <Stop offset="100%" stopColor={theme.ouro} />
                    </LinearGradient>
                    <LinearGradient id="gradBarraHoje" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={theme.ouroVibrante} />
                      <Stop offset="100%" stopColor={theme.ouro} />
                    </LinearGradient>
                  </Defs>

                  {/* Linha de base */}
                  <Line x1="0" y1={ALTURA_GRAFICO_MENSAL} x2={LARGURA_GRAFICO} y2={ALTURA_GRAFICO_MENSAL} stroke={theme.borda} strokeWidth="1" />

                  {/* 31 Barras */}
                  {mensal.dias.map((d, index) => {
                    const alturaBarra = d.faturamento > 0
                      ? Math.max(8, (d.faturamento / mensal.maxFaturamentoDiario) * (ALTURA_GRAFICO_MENSAL - 12))
                      : 3;
                    const x = index * (larguraBarraMes + 2);
                    const y = ALTURA_GRAFICO_MENSAL - alturaBarra;
                    const isSelecionado = diaSelecionado?.dia === d.dia;

                    return (
                      <G key={d.dia}>
                        <Rect
                          x={x}
                          y={y}
                          width={larguraBarraMes}
                          height={alturaBarra}
                          rx={2.5}
                          fill={
                            isSelecionado
                              ? '#FFFFFF'
                              : d.isHoje
                              ? 'url(#gradBarraHoje)'
                              : d.faturamento > 0
                              ? 'url(#gradBarraOuro)'
                              : d.isFuturo
                              ? theme.superficie2
                              : theme.borda
                          }
                        />
                      </G>
                    );
                  })}

                  {/* Eixo X com números dos dias principais */}
                  {[1, 5, 10, 15, 20, 25, mensal.dias.length].map((numDia) => {
                    const idx = numDia - 1;
                    if (idx >= mensal.dias.length) return null;
                    const posX = idx * (larguraBarraMes + 2) + larguraBarraMes / 2;
                    return (
                      <SvgText
                        key={numDia}
                        x={posX}
                        y={ALTURA_GRAFICO_MENSAL + 14}
                        fill={theme.textoSecundario}
                        fontSize="9.5"
                        fontFamily={FontFamily.medium}
                        textAnchor="middle"
                      >
                        {numDia}
                      </SvgText>
                    );
                  })}
                </Svg>

                {/* Camada de Toque Transparente */}
                <View style={styles.camadaToque}>
                  {mensal.dias.map((d) => (
                    <TouchableOpacity
                      key={d.dia}
                      style={styles.btnToqueDia}
                      onPress={() => setDiaSelecionado(diaSelecionado?.dia === d.dia ? null : d)}
                      activeOpacity={0.6}
                    />
                  ))}
                </View>
              </View>
            ) : (
              /* Visualização Semanal (7 Dias da Semana Selecionada) */
              <View style={styles.svgContainer}>
                <Svg width={LARGURA_GRAFICO} height={ALTURA_GRAFICO_SEMANAL}>
                  <Defs>
                    <LinearGradient id="gradBarraEvolSemana" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={theme.ouroClaro} />
                      <Stop offset="100%" stopColor={theme.ouro} />
                    </LinearGradient>
                  </Defs>

                  {/* Linha de base */}
                  <Line x1="0" y1={ALTURA_GRAFICO_SEMANAL - 2} x2={LARGURA_GRAFICO} y2={ALTURA_GRAFICO_SEMANAL - 2} stroke={theme.borda} strokeWidth="1" />

                  {semanaEvolucaoAtual?.dias.map((d, index) => {
                    const alturaBarra = d.faturamento > 0
                      ? Math.max(14, (d.faturamento / maxFatSemanaEvolucao) * (ALTURA_GRAFICO_SEMANAL - 20))
                      : 3;
                    const x = index * slotSemanaEvolucao + (slotSemanaEvolucao - larguraBarraSemanal) / 2;
                    const y = ALTURA_GRAFICO_SEMANAL - alturaBarra - 2;
                    const isSelecionado = diaSelecionado?.dia === d.dia;

                    return (
                      <G key={d.dia}>
                        <Rect
                          x={x}
                          y={y}
                          width={larguraBarraSemanal}
                          height={alturaBarra}
                          rx={4}
                          fill={
                            isSelecionado
                              ? '#FFFFFF'
                              : d.isHoje
                              ? theme.ouroVibrante
                              : d.faturamento > 0
                              ? 'url(#gradBarraEvolSemana)'
                              : theme.superficie2
                          }
                        />
                      </G>
                    );
                  })}
                </Svg>

                {/* Botões dos Dias da Semana */}
                <View style={styles.semanalRotulosLinha}>
                  {semanaEvolucaoAtual?.dias.map((d) => {
                    const isSelecionado = diaSelecionado?.dia === d.dia;
                    return (
                      <TouchableOpacity
                        key={d.dia}
                        style={[
                          styles.semanalRotuloItem,
                          { width: slotSemanaEvolucao },
                          isSelecionado && [styles.semanalRotuloItemAtivo, { backgroundColor: theme.ouro }],
                          d.isHoje && !isSelecionado && [styles.semanalRotuloItemHoje, { borderColor: theme.bordaOuro, backgroundColor: theme.ouroTranslucido }],
                        ]}
                        onPress={() => setDiaSelecionado(diaSelecionado?.dia === d.dia ? null : d)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.semanalRotuloSigla,
                            { color: theme.textoSecundario },
                            d.isHoje && { color: theme.ouroTexto, fontFamily: FontFamily.bold },
                            isSelecionado && { color: '#09090B', fontFamily: FontFamily.bold },
                          ]}
                        >
                          {d.diaSemana}
                        </Text>
                        <Text
                          style={[
                            styles.semanalRotuloDia,
                            { color: theme.textoPrimario },
                            d.isHoje && { color: theme.ouroTexto, fontFamily: FontFamily.bold },
                            isSelecionado && { color: '#09090B', fontFamily: FontFamily.bold },
                          ]}
                        >
                          {d.dia}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Card de Detalhe do Dia Tocado */}
            {diaSelecionado && (
              <View style={[styles.cardDiaDetalhe, { backgroundColor: theme.superficie2, borderColor: theme.bordaOuro }]}>
                <View style={styles.cardDiaDetalheHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardDiaDetalheData, { color: theme.textoPrimario }]}>
                      Dia {diaSelecionado.dia} de {mensal.mesNome} ({diaSelecionado.diaSemana})
                      {diaSelecionado.isHoje ? ' • Hoje' : ''}
                    </Text>
                    <Text style={[styles.cardDiaDetalheSub, { color: theme.textoSecundario }]}>
                      {diaSelecionado.totalCortes} {diaSelecionado.totalCortes === 1 ? 'corte realizado' : 'cortes realizados'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[styles.cardDiaDetalheValor, { color: theme.ouroTexto }]}>
                      {diaSelecionado.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Text>
                    <TouchableOpacity onPress={() => setDiaSelecionado(null)}>
                      <Text style={[styles.btnFecharDetalheDia, { color: theme.textoSecundario }]}>Fechar ✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {diaSelecionado.agendamentos.length > 0 && (
                  <View style={styles.cardDiaListaAgendamentos}>
                    {diaSelecionado.agendamentos.map((ag) => (
                      <View key={ag.id} style={[styles.cardDiaAgendamentoLinha, { borderTopColor: theme.borda }]}>
                        <Text style={[styles.cardDiaHora, { color: theme.ouroTexto }]}>{ag.hora}</Text>
                        <Text style={[styles.cardDiaCli, { color: theme.textoPrimario }]} numberOfLines={1}>{ag.clienteNome}</Text>
                        <Text style={[styles.cardDiaServ, { color: theme.textoSecundario }]} numberOfLines={1}>{ag.servicoNome}</Text>
                        <Text style={[styles.cardDiaPreco, { color: theme.textoPrimario }]}>
                          {ag.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ─── Detalhamento Semana a Semana ─── */}
          <View style={styles.secaoSemanasContainer}>
            <Text style={[styles.secaoSemanasTitulo, { color: theme.textoPrimario }]}>Fechamento por Semana</Text>
            <Text style={[styles.secaoSemanasSub, { color: theme.textoSecundario }]}>
              Ganhos consolidados de cada período do mês
            </Text>

            <View style={styles.listaSemanas}>
              {mensal.semanas.map((sem) => {
                const expandida = !!semanasExpandidas[sem.numero];

                return (
                  <View
                    key={sem.numero}
                    style={[
                      styles.cardSemanaItem,
                      { backgroundColor: theme.superficie, borderColor: theme.borda },
                      sem.isAtual && [styles.cardSemanaAtual, { borderColor: theme.ouro }],
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.cardSemanaHeader}
                      onPress={() => toggleSemana(sem.numero)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardSemanaInfoEsquerda}>
                        <View
                          style={[
                            styles.semanaNumeroBadge,
                            {
                              backgroundColor: sem.isAtual ? theme.ouro : theme.superficie2,
                              borderColor: theme.borda,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.semanaNumeroTexto,
                              { color: sem.isAtual ? '#09090B' : theme.ouroTexto },
                            ]}
                          >
                            S{sem.numero}
                          </Text>
                        </View>

                        <View style={{ gap: 2, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.cardSemanaTitulo, { color: theme.textoPrimario }]}>
                              Semana {sem.numero}
                            </Text>
                            {sem.isAtual && (
                              <View style={[styles.badgeEmAndamento, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                                <Text style={[styles.badgeEmAndamentoTexto, { color: theme.ouroTexto }]}>EM ANDAMENTO</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.cardSemanaDatas, { color: theme.textoSecundario }]}>
                            {sem.dataInicio} a {sem.dataFim} • {sem.totalCortes} {sem.totalCortes === 1 ? 'corte' : 'cortes'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardSemanaInfoDireita}>
                        <Text style={[styles.cardSemanaValor, { color: theme.ouroTexto }]}>
                          {sem.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                        {expandida ? (
                          <ChevronUp size={16} color={theme.textoSecundario} />
                        ) : (
                          <ChevronDown size={16} color={theme.textoSecundario} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Detalhamento expandido da semana */}
                    {expandida && (
                      <View style={[styles.semanaCorpoExpandido, { borderTopColor: theme.borda }]}>
                        {sem.dias.map((d) => (
                          <View key={d.dia} style={styles.semanaDiaLinha}>
                            <View style={styles.semanaDiaRotulo}>
                              <Text style={[styles.semanaDiaNumero, { color: d.isHoje ? theme.ouroTexto : theme.textoPrimario }]}>
                                Dia {d.dia} ({d.diaSemana})
                              </Text>
                              {d.isHoje && <Text style={[styles.semanaDiaTagHoje, { color: theme.ouroTexto }]}>• Hoje</Text>}
                            </View>
                            <View style={styles.semanaDiaValores}>
                              <Text style={[styles.semanaDiaCortes, { color: theme.textoSecundario }]}>
                                {d.totalCortes > 0 ? `${d.totalCortes} cortes` : 'Sem cortes'}
                              </Text>
                              <Text style={[styles.semanaDiaFaturamento, { color: d.faturamento > 0 ? theme.ouroTexto : theme.textoDesabilitado }]}>
                                {d.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal de Detalhes do Agendamento */}
      <Modal
        visible={agendamentoSelecionado !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAgendamentoSelecionado(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAgendamentoSelecionado(null)}>
          <Pressable style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            {agendamentoSelecionado && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ gap: 2 }}>
                    <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Detalhes do Agendamento</Text>
                    <Text style={[styles.modalSubtitulo, { color: theme.textoSecundario }]}>
                      {formatarDataCurta(agendamentoSelecionado.data_hora)} às {formatarHora(agendamentoSelecionado.data_hora)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAgendamentoSelecionado(null)}
                    style={styles.modalBtnFechar}
                  >
                    <X size={20} color={theme.textoSecundario} />
                  </TouchableOpacity>
                </View>

                {/* Card do Cliente */}
                <View style={[styles.modalCardCliente, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <View style={[styles.avatar, { backgroundColor: theme.ouroTranslucido }]}>
                    <User size={20} color={theme.ouroTexto} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.modalClienteNome, { color: theme.textoPrimario }]}>
                      {agendamentoSelecionado.cliente.nome_completo || 'Cliente'}
                    </Text>
                    <Text style={[styles.modalClienteTelefone, { color: theme.textoSecundario }]}>
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

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.fundo,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
    },
    headerInfo: {
      flex: 1,
    },
    titulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
    },
    subtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      marginTop: 2,
    },
    metricasTopo: {
      alignItems: 'flex-end',
      gap: 2,
    },
    metricasTopoAgendamentos: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
    },
    metricasTopoValor: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    navegadorTopoCompacto: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 4,
      paddingVertical: 3,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    btnNavTopo: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navegadorTopoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 11,
      paddingHorizontal: 4,
    },

    /* ─── SEGMENTED CONTROL PRINCIPAL ─── */
    segmentosContainer: {
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.xs,
    },
    segmentosTrilho: {
      flexDirection: 'row',
      borderRadius: Radii.md,
      padding: 3,
      borderWidth: 1,
    },
    segmentoBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 7,
      borderRadius: Radii.sm,
    },
    segmentoBtnAtivo: {},
    segmentoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
    },
    segmentoTextoAtivo: {
      color: '#09090B',
      fontFamily: FontFamily.bold,
    },

    scroll: {
      padding: Spacing.telaH,
      gap: Spacing.md,
      paddingBottom: Spacing.giant,
    },

    /* ─── CARD DO GRÁFICO SEMANAL (7 DIAS) ─── */
    cardGraficoSemanal: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    graficoSemanalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    graficoSemanalTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    graficoSemanalSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    pillBadgeSemana: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    pillBadgeSemanaTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 9.5,
      letterSpacing: 0.5,
    },
    svgSemanalWrapper: {
      alignItems: 'center',
      marginTop: 2,
    },
    semanalRotulosLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    semanalRotuloItem: {
      alignItems: 'center',
      paddingVertical: 4,
      borderRadius: Radii.sm,
    },
    semanalRotuloItemAtivo: {},
    semanalRotuloItemHoje: {
      borderWidth: 1,
    },
    semanalRotuloSigla: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
    },
    semanalRotuloDia: {
      fontFamily: FontFamily.semiBold,
      fontSize: 12,
      marginTop: -1,
    },
    bannerFiltroDia: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      borderRadius: Radii.sm,
      borderWidth: 1,
      marginTop: 4,
    },
    bannerFiltroDiaTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
      flex: 1,
      marginRight: 6,
    },
    btnLimparFiltro: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    bannerFiltroDiaLimpar: {
      fontFamily: FontFamily.bold,
      fontSize: 11.5,
      textDecorationLine: 'underline',
    },

    /* ─── HERO CARD DO MÊS ─── */
    heroCardMes: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...Shadows.card,
    },
    heroMesTopo: {
      padding: Spacing.md,
      alignItems: 'center',
      gap: 3,
    },
    heroMesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radii.full,
      borderWidth: 1,
      marginBottom: 2,
    },
    heroMesBadgeTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 9.5,
      letterSpacing: 0.5,
    },
    heroMesValorPrincipal: {
      fontFamily: FontFamily.bold,
      fontSize: 28,
    },
    heroMesSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    heroMesMetricasLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingVertical: Spacing.sm,
    },
    heroMesMetricaItem: {
      flex: 1,
      alignItems: 'center',
      gap: 1,
    },
    heroMesDivisor: {
      width: 1,
      height: 32,
    },
    heroMesMetricaRotulo: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    heroMesMetricaValor: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
    },
    heroMesMetricaSub: {
      fontFamily: FontFamily.regular,
      fontSize: 9.5,
    },

    /* ─── CARD DO GRÁFICO DE EVOLUÇÃO ─── */
    cardGrafico: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    graficoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    graficoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    graficoSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },

    /* ─── TOGGLE MÊS / SEMANA NO CARD DE EVOLUÇÃO ─── */
    toggleModoContainer: {
      flexDirection: 'row',
      borderRadius: Radii.sm,
      padding: 2,
      borderWidth: 1,
    },
    toggleModoBtn: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radii.xs,
    },
    toggleModoBtnAtivo: {},
    toggleModoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
    },
    toggleModoTextoAtivo: {
      color: '#09090B',
      fontFamily: FontFamily.bold,
    },

    /* ─── SELETOR DE SEMANAS DO MÊS ─── */
    seletorSemanaMesTrilho: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xs,
      paddingVertical: 4,
      borderRadius: Radii.md,
      borderWidth: 1,
      marginTop: 2,
    },
    btnNavSemanaMes: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    semanaMesInfoCentro: {
      alignItems: 'center',
      gap: 1,
    },
    semanaMesTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
    semanaMesPeriodo: {
      fontFamily: FontFamily.regular,
      fontSize: 10.5,
    },

    svgContainer: {
      alignItems: 'center',
      position: 'relative',
      marginVertical: 4,
    },
    camadaToque: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 20,
      flexDirection: 'row',
    },
    btnToqueDia: {
      flex: 1,
      height: '100%',
    },
    cardDiaDetalhe: {
      borderRadius: Radii.md,
      padding: Spacing.sm,
      borderWidth: 1,
      gap: Spacing.xs,
      marginTop: 2,
    },
    cardDiaDetalheHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    cardDiaDetalheData: {
      fontFamily: FontFamily.bold,
      fontSize: 12.5,
    },
    cardDiaDetalheSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    cardDiaDetalheValor: {
      fontFamily: FontFamily.bold,
      fontSize: 15,
    },
    btnFecharDetalheDia: {
      fontFamily: FontFamily.medium,
      fontSize: 10.5,
    },
    cardDiaListaAgendamentos: {
      gap: 4,
      marginTop: 2,
    },
    cardDiaAgendamentoLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 4,
      gap: 6,
    },
    cardDiaHora: {
      fontFamily: FontFamily.bold,
      fontSize: 11,
      width: 40,
    },
    cardDiaCli: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11.5,
      flex: 1,
    },
    cardDiaServ: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      flex: 1,
    },
    cardDiaPreco: {
      fontFamily: FontFamily.bold,
      fontSize: 11.5,
    },

    /* ─── SEÇÃO SEMANAS ─── */
    secaoSemanasContainer: {
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    secaoSemanasTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    secaoSemanasSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    listaSemanas: {
      gap: Spacing.xs,
      marginTop: 4,
    },
    cardSemanaItem: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardSemanaAtual: {
      borderWidth: 1.5,
    },
    cardSemanaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
    },
    cardSemanaInfoEsquerda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    semanaNumeroBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    semanaNumeroTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
    cardSemanaTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },
    badgeEmAndamento: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    badgeEmAndamentoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 8.5,
      letterSpacing: 0.5,
    },
    cardSemanaDatas: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    cardSemanaInfoDireita: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardSemanaValor: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    semanaCorpoExpandido: {
      borderTopWidth: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: 6,
    },
    semanaDiaLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 2,
    },
    semanaDiaRotulo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    semanaDiaNumero: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
    },
    semanaDiaTagHoje: {
      fontFamily: FontFamily.bold,
      fontSize: 10.5,
    },
    semanaDiaValores: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    semanaDiaCortes: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    semanaDiaFaturamento: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
      minWidth: 70,
      textAlign: 'right',
    },

    /* ─── ESTILOS DA AGENDA SEMANAL ─── */
    cardAberturaRapida: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
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
    },
    aberturaRapidaSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
    },
    botaoLiberarAgora: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radii.md,
    },
    botaoLiberarAgoraTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
      color: '#09090B',
    },
    linhaAberturaAberta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.xs,
    },
    badgeAberta: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: Radii.sm,
      marginRight: Spacing.xs,
    },
    badgeAbertaTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
      flex: 1,
    },
    btnEditarAgenda: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radii.sm,
      borderWidth: 1,
      flexShrink: 0,
    },
    btnEditarAgendaTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11,
    },
    btnCriarAgenda: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: Radii.md,
    },
    btnCriarAgendaTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: '#09090B',
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
    },
    vazioTitulo: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyLg,
      textAlign: 'center',
      marginTop: 4,
    },
    vazioTexto: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      textAlign: 'center',
    },
    grupodia: {
      gap: Spacing.xs,
    },
    diaCabecalho: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    diaNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    diaBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    diaFaturamento: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.full,
    },
    badgeTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
    },
    cardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: Radii.lg,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    cardHorario: {
      alignItems: 'center',
      minWidth: 44,
      gap: 2,
    },
    cardHora: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    cardDuracao: {
      fontFamily: FontFamily.regular,
      fontSize: 10,
    },
    divisorVertical: {
      width: 1,
      height: '100%',
      alignSelf: 'stretch',
    },
    cardInfo: {
      flex: 1,
      gap: 2,
    },
    clienteNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyMd,
    },
    servicoNome: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
    },
    cardFim: {
      alignItems: 'flex-end',
    },
    preco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },

    /* ─── MODAL ─── */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalConteudo: {
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.giant,
      borderWidth: 1,
      gap: Spacing.md,
    },
    modalTraco: {
      width: 36,
      height: 4,
      borderRadius: 2,
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
    },
    modalSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      marginTop: 2,
    },
    modalBtnFechar: {
      padding: 6,
    },
    modalCardCliente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radii.md,
      borderWidth: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalClienteNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    modalClienteTelefone: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
    },
    modalCardServico: {
      gap: Spacing.xs,
    },
    modalLinhaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    modalServicoNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    modalLinhaValores: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalDuracao: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    modalPreco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyLg,
      color: theme.ouroTexto,
    },
    modalBotoesAcao: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    modalBtnAcao: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: Radii.md,
    },
    btnWhatsApp: {
      backgroundColor: '#25D366',
    },
    btnLigar: {
      backgroundColor: '#3B82F6',
    },
    modalBtnAcaoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: '#FFFFFF',
    },
  });
