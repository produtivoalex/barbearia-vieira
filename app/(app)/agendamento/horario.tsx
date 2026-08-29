import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ChevronLeft,
  User,
  Clock,
  Sparkles,
  Sun,
  Sunset,
  Check,
  CalendarX,
  Calendar,
  ArrowRight,
} from 'lucide-react-native';
import { IlustracaoServico } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAgendamento } from '@/hooks/useAgendamento';
import { useAgendaSemanal } from '@/hooks/useAgendaSemanal';
import { supabase } from '@/lib/supabase';

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const NOMES_DIAS_EXTENSO = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_EXTENSO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function toIsoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function diasJanelaContinua(qtdDias = 14): { data: Date; isoDate: string; ativo: boolean }[] {
  const lista: { data: Date; isoDate: string; ativo: boolean }[] = [];
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  for (let i = 0; i < qtdDias; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    lista.push({
      data: d,
      isoDate: toIsoDate(d),
      ativo: true,
    });
  }
  return lista;
}

interface SlotSelecionado {
  data: Date;
  hora: string;
}

export default function TelaHorario() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { barbearia } = useBarbearia();
  const params = useLocalSearchParams<{
    servicoId?: string;
    servicoNome?: string;
    servicoPreco?: string;
    servicoDuracao?: string;
  }>();

  const { barbeiros, carregandoBarbeiros, buscarHorariosOcupados } = useAgendamento(barbearia?.id);
  const { agenda } = useAgendaSemanal(barbearia?.id);
  const [barbeiroSelecionadoId, setBarbeiroSelecionadoId] = useState<string | null>(null);

  useEffect(() => {
    if (barbeiros.length > 0 && !barbeiroSelecionadoId) {
      setBarbeiroSelecionadoId(barbeiros[0].id);
    }
  }, [barbeiros, barbeiroSelecionadoId]);

  const hoje = useMemo(() => new Date(), []);

  // Determina os dias exibidos
  const diasSemana = useMemo(() => {
    if (barbearia?.modo_agenda === 'drops' && agenda?.dias && agenda.dias.length > 0) {
      const ordenados = [...agenda.dias].sort((a, b) => a.data.localeCompare(b.data));
      return ordenados.map((d) => {
        const [ano, mes, diaNum] = d.data.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, diaNum, 12, 0, 0);
        return {
          data: dataObj,
          isoDate: d.data,
          ativo: d.ativo,
        };
      });
    }

    if (agenda?.dias && agenda.dias.length > 0 && barbearia?.modo_agenda !== 'continua') {
      const ordenados = [...agenda.dias].sort((a, b) => a.data.localeCompare(b.data));
      return ordenados.map((d) => {
        const [ano, mes, diaNum] = d.data.split('-').map(Number);
        const dataObj = new Date(ano, mes - 1, diaNum, 12, 0, 0);
        return {
          data: dataObj,
          isoDate: d.data,
          ativo: d.ativo,
        };
      });
    }

    return diasJanelaContinua(barbearia?.dias_janela_agendamento || 14);
  }, [agenda, barbearia]);

  // Primeiro dia válido selecionado por padrão
  const primeiroDiaValido = useMemo(() => {
    const hojeIso = toIsoDate(hoje);
    return diasSemana.find((d) => d.ativo && d.isoDate >= hojeIso) || diasSemana[0];
  }, [diasSemana, hoje]);

  const [diaAtivoIso, setDiaAtivoIso] = useState<string>(primeiroDiaValido?.isoDate || '');
  const [usuarioSelecionouDiaManual, setUsuarioSelecionouDiaManual] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState<SlotSelecionado | null>(null);
  const [ocupadosPorDia, setOcupadosPorDia] = useState<Record<string, string[]>>({});
  const [slotsPorDia, setSlotsPorDia] = useState<Record<string, string[]>>({});
  const [slotIdsPorDia, setSlotIdsPorDia] = useState<Record<string, Record<string, string>>>({});
  const [erroSlots, setErroSlots] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!diaAtivoIso && primeiroDiaValido?.isoDate) {
      setDiaAtivoIso(primeiroDiaValido.isoDate);
    }
  }, [primeiroDiaValido, diaAtivoIso]);

  const carregarOcupacaoESlots = useCallback(async () => {
    if (!barbeiroSelecionadoId) {
      if (!carregandoBarbeiros) setCarregando(false);
      return;
    }
    setCarregando(true);

    try {
      // 1. Busca slots configurados no banco de dados
      if (!barbearia?.id) throw new Error('Nenhuma barbearia selecionada.');
      const { data: slotsBanco, error: erroConsultaSlots } = await supabase.rpc('buscar_slots_disponiveis', {
        p_barbearia_id: barbearia.id,
        p_barbeiro_id: barbeiroSelecionadoId,
      });
      if (erroConsultaSlots) throw erroConsultaSlots;
      setErroSlots(null);

      const mapaSlots: Record<string, string[]> = {};
      const mapaIds: Record<string, Record<string, string>> = {};
      if (slotsBanco && slotsBanco.length > 0) {
        for (const s of slotsBanco) {
          const d = new Date(s.data_hora);
          const iso = toIsoDate(d);
          const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          if (!mapaSlots[iso]) mapaSlots[iso] = [];
          if (!mapaIds[iso]) mapaIds[iso] = {};
          if (!mapaSlots[iso].includes(hora)) mapaSlots[iso].push(hora);
          mapaIds[iso][hora] = s.id;
        }
      }
      setSlotsPorDia(mapaSlots);
      setSlotIdsPorDia(mapaIds);

      // 2. Busca agendamentos já ocupados para cada dia
      const resultados = await Promise.all(
        diasSemana.map(async (item) => {
          const ocupados = await buscarHorariosOcupados(item.isoDate, barbeiroSelecionadoId);
          return { isoDate: item.isoDate, ocupados };
        })
      );

      const mapaOcupados: Record<string, string[]> = {};
      for (const r of resultados) {
        mapaOcupados[r.isoDate] = r.ocupados;
      }
      setOcupadosPorDia(mapaOcupados);
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : 'Não foi possível carregar os horários.';
      setErroSlots(mensagem);
      console.warn('Erro ao carregar ocupação:', mensagem);
    } finally {
      setCarregando(false);
    }
  }, [barbearia?.id, buscarHorariosOcupados, carregandoBarbeiros, diasSemana, barbeiroSelecionadoId]);

  useEffect(() => {
    carregarOcupacaoESlots();
  }, [carregarOcupacaoESlots]);

  useFocusEffect(
    useCallback(() => {
      carregarOcupacaoESlots();
    }, [carregarOcupacaoESlots])
  );

  const diaAtivoObj = useMemo(() => {
    return diasSemana.find((d) => d.isoDate === diaAtivoIso) || diasSemana[0];
  }, [diasSemana, diaAtivoIso]);

  const getEstadoSlot = useCallback((dia: Date, hora: string): 'disponivel' | 'indisponivel' | 'selecionado' => {
    const isoDate = toIsoDate(dia);

    const isAtivo =
      slotSelecionado &&
      toIsoDate(slotSelecionado.data) === isoDate &&
      slotSelecionado.hora === hora;
    if (isAtivo) return 'selecionado';

    const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const hojeZero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    if (inicioDia < hojeZero) {
      return 'indisponivel';
    }

    if (ocupadosPorDia[isoDate]?.includes(hora)) return 'indisponivel';

    if (toIsoDate(dia) === toIsoDate(hoje)) {
      const [h, m] = hora.split(':').map(Number);
      const agora = new Date();
      if (h < agora.getHours() || (h === agora.getHours() && m <= agora.getMinutes())) {
        return 'indisponivel';
      }
    }

    return 'disponivel';
  }, [hoje, ocupadosPorDia, slotSelecionado]);

  // Contagem de vagas livres por dia
  const livresPorDia = useMemo(() => {
    const mapa: Record<string, number> = {};
    const hojeIso = toIsoDate(hoje);

    for (const item of diasSemana) {
      if (!item.ativo || item.isoDate < hojeIso) {
        mapa[item.isoDate] = 0;
        continue;
      }
      const slots = slotsPorDia[item.isoDate] || [];
      let count = 0;
      for (const hora of slots) {
        if (getEstadoSlot(item.data, hora) !== 'indisponivel') {
          count++;
        }
      }
      mapa[item.isoDate] = count;
    }
    return mapa;
  }, [diasSemana, getEstadoSlot, hoje, slotsPorDia]);

  const proximoDiaComVagas = useMemo(() => {
    const hojeIso = toIsoDate(hoje);
    return diasSemana.find(
      (d) => d.ativo && d.isoDate >= hojeIso && (livresPorDia[d.isoDate] ?? 0) > 0
    );
  }, [diasSemana, hoje, livresPorDia]);

  // Se o usuário ainda não escolheu um dia manualmente e o dia atual tem 0 vagas livres,
  // navega automaticamente para o primeiro dia que realmente possui vagas disponíveis.
  useEffect(() => {
    if (carregando || usuarioSelecionouDiaManual) return;
    const hojeIso = toIsoDate(hoje);
    const vagasDiaAtual = livresPorDia[diaAtivoIso] ?? 0;

    if (vagasDiaAtual === 0) {
      const diaComVagas = diasSemana.find(
        (d) => d.ativo && d.isoDate >= hojeIso && (livresPorDia[d.isoDate] ?? 0) > 0
      );
      if (diaComVagas && diaComVagas.isoDate !== diaAtivoIso) {
        setDiaAtivoIso(diaComVagas.isoDate);
      }
    }
  }, [carregando, diaAtivoIso, diasSemana, hoje, livresPorDia, usuarioSelecionouDiaManual]);

  // Horários do dia ativo particionados em Manhã e Tarde
  const { slotsManha, slotsTarde, totalLivresDiaAtivo } = useMemo(() => {
    if (!diaAtivoObj) return { slotsManha: [], slotsTarde: [], totalLivresDiaAtivo: 0 };
    const todosSlots = slotsPorDia[diaAtivoObj.isoDate] || [];

    const manha: string[] = [];
    const tarde: string[] = [];
    let livres = 0;

    todosSlots.forEach((hora) => {
      const [h] = hora.split(':').map(Number);
      if (h < 12) manha.push(hora);
      else tarde.push(hora);

      if (getEstadoSlot(diaAtivoObj.data, hora) !== 'indisponivel') {
        livres++;
      }
    });

    return { slotsManha: manha, slotsTarde: tarde, totalLivresDiaAtivo: livres };
  }, [diaAtivoObj, slotsPorDia, getEstadoSlot]);

  function handleContinuar() {
    if (!slotSelecionado) return;

    const barbeiroObj = barbeiros.find((b) => b.id === barbeiroSelecionadoId);
    const { data, hora } = slotSelecionado;
    const [h, m] = hora.split(':').map(Number);
    const dataHoraObj = new Date(data.getFullYear(), data.getMonth(), data.getDate(), h, m, 0);

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const dataFormatadaExibicao = `${dia}/${mes}/${ano} às ${hora}`;

    router.push({
      pathname: '/(app)/agendamento/confirmacao',
      params: {
        servicoId: params.servicoId || '',
        servicoNome: params.servicoNome || 'Serviço',
        servicoPreco: params.servicoPreco || '0',
        servicoDuracao: params.servicoDuracao || '30',
        barbeiroId: barbeiroSelecionadoId || '',
        barbeiroNome: barbeiroObj?.nome_completo || (barbearia?.nome ? `Barbeiro ${barbearia.nome}` : 'Barbeiro Profissional'),
        barbeariaId: barbearia?.id || '',
        slotId: (diaAtivoObj && slotIdsPorDia[diaAtivoObj.isoDate]?.[hora]) || '',
        dataHoraIso: dataHoraObj.toISOString(),
        dataExibicao: dataFormatadaExibicao,
      },
    });
  }

  const precoFormatado = params.servicoPreco
    ? Number(params.servicoPreco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '';

  const isDiaPassado = diaAtivoObj && diaAtivoObj.isoDate < toIsoDate(hoje);
  const isDiaFechado = diaAtivoObj && !diaAtivoObj.ativo;
  const isFechado = isDiaFechado;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header Minimalista Apple */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.btnVoltar, { backgroundColor: theme.superficie, borderColor: theme.borda }]} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.textoPrimario} />
        </TouchableOpacity>
        <View style={styles.headerCentro}>
          <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Data & Horário</Text>
          <Text style={[styles.subtituloPasso, { color: theme.ouroTexto }]}>Etapa 2 de 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner Elegante do Serviço */}
        {params.servicoNome && (
          <View style={[styles.servicoBar, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <IlustracaoServico
              id={params.servicoId}
              nome={params.servicoNome}
              tamanho={38}
            />
            <View style={styles.servicoBarInfo}>
              <Text style={[styles.servicoBarNome, { color: theme.textoPrimario }]} numberOfLines={1}>
                {params.servicoNome}
              </Text>
              <Text style={[styles.servicoBarDetalhes, { color: theme.textoSecundario }]}>
                {params.servicoDuracao || '30'} min de atendimento
              </Text>
            </View>
            <Text style={[styles.servicoBarPreco, { color: theme.ouroTexto }]}>{precoFormatado}</Text>
          </View>
        )}

        {/* Seletor de Barbeiro / Profissional */}
        {barbeiros.length > 1 && (
          <View style={styles.secaoProfissionais}>
            <Text style={[styles.secaoTitulo, { color: theme.textoSecundario }]}>Profissional</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listaProfissionais}
            >
              {barbeiros.map((b) => {
                const ativo = b.id === barbeiroSelecionadoId;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.chipProfissional,
                      { backgroundColor: theme.superficie, borderColor: theme.borda },
                      ativo && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                    ]}
                    onPress={() => {
                      setBarbeiroSelecionadoId(b.id);
                      setSlotSelecionado(null);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.avatarProfissional, { backgroundColor: theme.ouroTranslucido }, ativo && { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                      <User size={13} color={ativo ? theme.textoEscuroSobreOuro : theme.ouroTexto} />
                    </View>
                    <Text style={[
                      styles.nomeProfissional,
                      { color: theme.textoSecundario },
                      ativo && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                    ]}>
                      {b.nome_completo || 'Barbeiro'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─── Apple Date Strip: Seletor Horizontal de Datas ─── */}
        <View style={styles.secaoDatas}>
          <View style={styles.datasHeaderLinha}>
            <Text style={[styles.secaoTitulo, { color: theme.textoSecundario }]}>Selecione o Dia</Text>
            {carregando && <ActivityIndicator size="small" color={theme.ouro} />}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datasScroll}
          >
            {diasSemana.map((item) => {
              const data = item.data;
              const iso = item.isoDate;
              const isAtivo = iso === diaAtivoIso;
              const isHoje = iso === toIsoDate(hoje);
              const isPassado = iso < toIsoDate(hoje);
              const isFechado = !item.ativo;
              const vagasNoDia = livresPorDia[iso] ?? 0;
              const temVagas = vagasNoDia > 0;

              // Nome curto do dia
              const diaNome = isHoje ? 'Hoje' : DIAS_CURTOS[data.getDay()];
              const diaNum = String(data.getDate()).padStart(2, '0');
              const mesNome = MESES_CURTOS[data.getMonth()];

              return (
                <TouchableOpacity
                  key={iso}
                  style={[
                    styles.datePill,
                    { backgroundColor: theme.superficie, borderColor: theme.borda },
                    isAtivo && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                    (isFechado || isPassado) && { backgroundColor: theme.superficie2, opacity: 0.45 },
                  ]}
                  onPress={() => {
                    setUsuarioSelecionouDiaManual(true);
                    setDiaAtivoIso(iso);
                    setSlotSelecionado(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.datePillSemana,
                    { color: theme.textoSecundario },
                    isAtivo && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                  ]}>
                    {diaNome.toUpperCase()}
                  </Text>
                  <Text style={[
                    styles.datePillNumero,
                    { color: theme.textoPrimario },
                    isAtivo && { color: theme.textoEscuroSobreOuro },
                  ]}>
                    {diaNum}
                  </Text>
                  <Text style={[
                    styles.datePillMes,
                    { color: theme.textoSecundario },
                    isAtivo && { color: theme.textoEscuroSobreOuro },
                  ]}>
                    {mesNome}
                  </Text>

                  {/* Indicador de Status */}
                  <View style={styles.datePillPontoWrapper}>
                    {isFechado ? (
                      <View style={[styles.datePillDot, { backgroundColor: theme.textoDesabilitado }]} />
                    ) : isPassado ? (
                      <View style={[styles.datePillDot, { backgroundColor: theme.borda }]} />
                    ) : isAtivo ? (
                      <View style={[styles.datePillDot, { backgroundColor: theme.textoEscuroSobreOuro }]} />
                    ) : temVagas ? (
                      <View style={[styles.datePillDot, { backgroundColor: theme.verde }]} />
                    ) : (
                      <View style={[styles.datePillDot, { backgroundColor: 'rgba(255, 149, 0, 0.7)' }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Painel do Dia Ativo: Horários de Manhã e Tarde ─── */}
        <View style={[styles.painelDiaContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
          {/* Título do Dia Selecionado */}
          <View style={styles.painelDiaHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.painelDiaNome, { color: theme.textoPrimario }]}>
                {diaAtivoObj
                  ? `${NOMES_DIAS_EXTENSO[diaAtivoObj.data.getDay()]}, ${diaAtivoObj.data.getDate()} de ${MESES_EXTENSO[diaAtivoObj.data.getMonth()]}`
                  : 'Selecione uma data'}
              </Text>
              <Text style={[styles.painelDiaSub, { color: theme.textoSecundario }]}>
                {isFechado
                  ? 'Estabelecimento fechado neste dia'
                  : isDiaPassado
                  ? 'Horários encerrados para esta data'
                  : totalLivresDiaAtivo === 0
                  ? ((slotsPorDia[diaAtivoObj?.isoDate || ''] || []).length === 0
                      ? 'Nenhum horário liberado nesta data'
                      : diaAtivoObj?.isoDate === toIsoDate(hoje)
                      ? 'Atendimentos de hoje já encerrados'
                      : 'Todos os horários estão ocupados')
                  : `${totalLivresDiaAtivo} horário(s) disponível(is)`}
              </Text>
            </View>

            {!isFechado && !isDiaPassado && totalLivresDiaAtivo > 0 && (
              <View style={[styles.badgeVagasDisponiveis, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Sparkles size={11} color={theme.ouroTexto} />
                <Text style={[styles.badgeVagasTexto, { color: theme.ouroTexto }]}>{totalLivresDiaAtivo} livres</Text>
              </View>
            )}
          </View>

          {/* Se o dia estiver fechado ou no passado */}
          {isFechado || isDiaPassado ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
              <CalendarX size={36} color={theme.textoDesabilitado} />
              <Text style={[styles.emptyTitulo, { color: theme.textoPrimario }]}>
                {isFechado ? 'Barbearia Fechada' : 'Data Não Disponível'}
              </Text>
              <Text style={[styles.emptyTexto, { color: theme.textoSecundario }]}>
                {isFechado
                  ? 'O estabelecimento não realiza atendimentos nesta data. Por favor, selecione outro dia no calendário acima.'
                  : 'Esta data já passou. Escolha o dia de hoje ou uma data futura para agendar.'}
              </Text>
            </View>
          ) : erroSlots ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
              <CalendarX size={36} color={theme.textoDesabilitado} />
              <Text style={[styles.emptyTitulo, { color: theme.textoPrimario }]}>Não foi possível carregar as vagas</Text>
              <Text style={[styles.emptyTexto, { color: theme.textoSecundario }]}>{erroSlots}</Text>
            </View>
          ) : totalLivresDiaAtivo === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
              <Clock size={36} color={theme.ouroTexto} />
              <Text style={[styles.emptyTitulo, { color: theme.textoPrimario }]}>
                {(slotsPorDia[diaAtivoObj?.isoDate || ''] || []).length === 0
                  ? 'Sem Horários Disponíveis'
                  : diaAtivoObj?.isoDate === toIsoDate(hoje)
                  ? 'Horários de Hoje Encerrados'
                  : 'Vagas Esgotadas para este Dia'}
              </Text>
              <Text style={[styles.emptyTexto, { color: theme.textoSecundario }]}>
                {(slotsPorDia[diaAtivoObj?.isoDate || ''] || []).length === 0
                  ? 'O profissional ainda não disponibilizou horários para esta data. Selecione outro dia no topo para agendar.'
                  : diaAtivoObj?.isoDate === toIsoDate(hoje)
                  ? 'Os horários de atendimento para o dia de hoje já foram encerrados. Selecione amanhã ou outra data acima para agendar seu corte.'
                  : 'Todos os horários deste dia já foram reservados. Toque em outro dia no topo para encontrar vagas livres.'}
              </Text>

              {proximoDiaComVagas && proximoDiaComVagas.isoDate !== diaAtivoObj?.isoDate && (
                <TouchableOpacity
                  style={[styles.btnVerProximoDia, { backgroundColor: theme.ouro }]}
                  onPress={() => {
                    setDiaAtivoIso(proximoDiaComVagas.isoDate);
                    setUsuarioSelecionouDiaManual(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Calendar size={15} color={theme.textoEscuroSobreOuro} />
                  <Text style={[styles.btnVerProximoDiaTexto, { color: theme.textoEscuroSobreOuro }]}>
                    Ver Vagas de {DIAS_CURTOS[proximoDiaComVagas.data.getDay()]}, {proximoDiaComVagas.data.getDate()} de {MESES_CURTOS[proximoDiaComVagas.data.getMonth()]} ({livresPorDia[proximoDiaComVagas.isoDate]} livres)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.horariosBloco}>
              {/* TURNO DA MANHÃ */}
              {slotsManha.length > 0 && (
                <View style={styles.turnoSecao}>
                  <View style={styles.turnoHeader}>
                    <Sun size={15} color={theme.ouroTexto} />
                    <Text style={[styles.turnoTitulo, { color: theme.textoPrimario }]}>Manhã</Text>
                    <Text style={[styles.turnoPeriodo, { color: theme.textoSecundario }]}>08:00 às 12:00</Text>
                  </View>

                  <View style={styles.slotsGrid}>
                    {slotsManha.map((hora) => {
                      if (!diaAtivoObj) return null;
                      const estado = getEstadoSlot(diaAtivoObj.data, hora);
                      const isSelected = estado === 'selecionado';
                      const isIndisponivel = estado === 'indisponivel';

                      return (
                        <TouchableOpacity
                          key={hora}
                          style={[
                            styles.timePill,
                            { backgroundColor: theme.superficie, borderColor: theme.borda },
                            isSelected && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                            isIndisponivel && { backgroundColor: theme.superficie2, borderColor: theme.borda, opacity: 0.38 },
                          ]}
                          disabled={isIndisponivel}
                          onPress={() => setSlotSelecionado({ data: diaAtivoObj.data, hora })}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.timePillTexto,
                              { color: theme.textoPrimario },
                              isSelected && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                              isIndisponivel && { color: theme.textoDesabilitado, textDecorationLine: 'line-through' },
                            ]}
                          >
                            {hora}
                          </Text>
                          {isSelected ? (
                            <Check size={13} color={theme.textoEscuroSobreOuro} strokeWidth={3} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* TURNO DA TARDE */}
              {slotsTarde.length > 0 && (
                <View style={styles.turnoSecao}>
                  <View style={styles.turnoHeader}>
                    <Sunset size={15} color={theme.ouroTexto} />
                    <Text style={[styles.turnoTitulo, { color: theme.textoPrimario }]}>Tarde</Text>
                    <Text style={[styles.turnoPeriodo, { color: theme.textoSecundario }]}>14:00 às 18:00</Text>
                  </View>

                  <View style={styles.slotsGrid}>
                    {slotsTarde.map((hora) => {
                      if (!diaAtivoObj) return null;
                      const estado = getEstadoSlot(diaAtivoObj.data, hora);
                      const isSelected = estado === 'selecionado';
                      const isIndisponivel = estado === 'indisponivel';

                      return (
                        <TouchableOpacity
                          key={hora}
                          style={[
                            styles.timePill,
                            { backgroundColor: theme.superficie, borderColor: theme.borda },
                            isSelected && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                            isIndisponivel && { backgroundColor: theme.superficie2, borderColor: theme.borda, opacity: 0.38 },
                          ]}
                          disabled={isIndisponivel}
                          onPress={() => setSlotSelecionado({ data: diaAtivoObj.data, hora })}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.timePillTexto,
                              { color: theme.textoPrimario },
                              isSelected && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                              isIndisponivel && { color: theme.textoDesabilitado, textDecorationLine: 'line-through' },
                            ]}
                          >
                            {hora}
                          </Text>
                          {isSelected ? (
                            <Check size={13} color={theme.textoEscuroSobreOuro} strokeWidth={3} />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── Floating Apple Glass Bottom Bar ─── */}
      <View style={styles.floatingBar}>
        <View style={styles.resumoContainer}>
          <Text style={[styles.resumoLabel, { color: theme.textoSecundario }]}>Horário Escolhido</Text>
          <Text style={[styles.resumoValor, { color: theme.textoPrimario }]} numberOfLines={1}>
            {slotSelecionado
              ? `${DIAS_CURTOS[slotSelecionado.data.getDay()]}, ${slotSelecionado.data.getDate()} ${MESES_CURTOS[slotSelecionado.data.getMonth()]} às ${slotSelecionado.hora}`
              : 'Selecione um horário'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.btnContinuarApple,
            { backgroundColor: theme.ouro },
            !slotSelecionado && { backgroundColor: theme.superficie2, borderColor: theme.borda },
          ]}
          disabled={!slotSelecionado}
          onPress={handleContinuar}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.btnContinuarTexto,
              { color: theme.textoEscuroSobreOuro },
              !slotSelecionado && { color: theme.textoDesabilitado },
            ]}
          >
            Continuar
          </Text>
          <ArrowRight size={16} color={slotSelecionado ? theme.textoEscuroSobreOuro : theme.textoDesabilitado} />
        </TouchableOpacity>
      </View>
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
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
    },
    btnVoltar: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radii.full,
      backgroundColor: theme.superficie,
    },
    headerCentro: {
      alignItems: 'center',
    },
    titulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyLg,
      color: theme.textoPrimario,
    },
    subtituloPasso: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
      color: theme.ouroTexto,
      marginTop: 1,
    },
    scroll: {
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.md,
      paddingBottom: 110,
      gap: Spacing.md,
    },

    /* Banner Compacto do Serviço */
    servicoBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.sm + 2,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    servicoBarInfo: {
      flex: 1,
      gap: 1,
    },
    servicoBarNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    servicoBarDetalhes: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      color: theme.textoSecundario,
    },
    servicoBarPreco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.ouroTexto,
    },

    /* Seção de Profissionais */
    secaoProfissionais: {
      gap: Spacing.xs,
    },
    secaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 11.5,
      color: theme.textoSecundario,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    listaProfissionais: {
      gap: Spacing.xs,
      paddingVertical: 2,
    },
    chipProfissional: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: Radii.full,
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    chipProfissionalAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
    },
    avatarProfissional: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarProfissionalAtivo: {
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    nomeProfissional: {
      fontFamily: FontFamily.medium,
      fontSize: 12.5,
      color: theme.textoSecundario,
    },
    nomeProfissionalAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoEscuroSobreOuro,
    },

    /* Seção de Datas (Apple Date Strip) */
    secaoDatas: {
      gap: Spacing.xs,
    },
    datasHeaderLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    datasScroll: {
      gap: 8,
      paddingVertical: 4,
    },
    datePill: {
      width: 66,
      height: 86,
      borderRadius: Radii.lg,
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingVertical: 6,
    },
    datePillAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
      ...Shadows.card,
    },
    datePillInativo: {
      opacity: 0.4,
      backgroundColor: theme.superficie2,
      borderColor: theme.borda,
    },
    datePillSemana: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
      color: theme.textoSecundario,
      letterSpacing: 0.5,
    },
    datePillSemanaAtivo: {
      color: theme.textoEscuroSobreOuro,
    },
    datePillNumero: {
      fontFamily: FontFamily.bold,
      fontSize: 20,
      color: theme.textoPrimario,
    },
    datePillNumeroAtivo: {
      color: theme.textoEscuroSobreOuro,
    },
    datePillMes: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: theme.textoSecundario,
      textTransform: 'uppercase',
    },
    datePillMesAtivo: {
      color: theme.textoEscuroSobreOuro,
      fontFamily: FontFamily.bold,
    },
    datePillPontoWrapper: {
      marginTop: 2,
    },
    datePillDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },

    /* Painel do Dia Ativo */
    painelDiaContainer: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.xl,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: Spacing.md,
      marginTop: 4,
      ...Shadows.card,
    },
    painelDiaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
    },
    painelDiaNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    painelDiaSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      color: theme.textoSecundario,
      marginTop: 2,
    },
    badgeVagasDisponiveis: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    badgeVagasTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10.5,
      color: theme.ouroTexto,
    },

    /* Empty State para dias fechados/passados/lotados */
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.md,
      gap: Spacing.xs,
    },
    emptyTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
      marginTop: 4,
    },
    emptyTexto: {
      fontFamily: FontFamily.regular,
      fontSize: 12,
      color: theme.textoSecundario,
      textAlign: 'center',
      lineHeight: 18,
    },

    /* Grid de Horários e Turnos */
    horariosBloco: {
      gap: Spacing.md,
    },
    turnoSecao: {
      gap: Spacing.xs,
    },
    turnoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    turnoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 12.5,
      color: theme.textoPrimario,
    },
    turnoPeriodo: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
    },
    slotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    timePill: {
      flexBasis: '31%',
      flexGrow: 1,
      height: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    timePillSelecionado: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
      ...Shadows.card,
    },
    timePillIndisponivel: {
      backgroundColor: theme.superficie2,
      borderColor: theme.borda,
      opacity: 0.35,
    },
    timePillTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
      color: theme.textoPrimario,
      letterSpacing: 0.5,
    },
    timePillTextoSelecionado: {
      color: theme.textoEscuroSobreOuro,
    },
    timePillTextoIndisponivel: {
      color: theme.textoDesabilitado,
      textDecorationLine: 'line-through',
    },

    /* Floating Apple Bottom Bar */
    floatingBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.superficie,
      borderTopWidth: 1,
      borderTopColor: theme.borda,
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      ...Shadows.cardElevado,
    },
    resumoContainer: {
      flex: 1,
      gap: 1,
    },
    resumoLabel: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
    },
    resumoValor: {
      fontFamily: FontFamily.bold,
      fontSize: 12.5,
      color: theme.ouroTexto,
    },
    btnContinuarApple: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.ouro,
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: Radii.lg,
      minWidth: 130,
    },
    btnContinuarDesabilitado: {
      backgroundColor: theme.superficie2,
      borderColor: theme.borda,
      borderWidth: 1,
    },
    btnContinuarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13.5,
      color: theme.textoEscuroSobreOuro,
    },
    btnContinuarTextoDesabilitado: {
      color: theme.textoDesabilitado,
    },
    btnVerProximoDia: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: Radii.md,
      marginTop: Spacing.sm,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    btnVerProximoDiaTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: theme.textoPrimario,
    },
  });
