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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  User,
  Clock,
  Sparkles,
  Sun,
  Sunset,
  Check,
  CalendarX,
  ArrowRight,
} from 'lucide-react-native';
import { IlustracaoServico } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
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
    const isSegunda = d.getDay() === 1;
    lista.push({
      data: d,
      isoDate: toIsoDate(d),
      ativo: !isSegunda,
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

  const diaAtivoObj = useMemo(() => {
    return diasSemana.find((d) => d.isoDate === diaAtivoIso) || diasSemana[0];
  }, [diasSemana, diaAtivoIso]);

  function getEstadoSlot(dia: Date, hora: string): 'disponivel' | 'indisponivel' | 'selecionado' {
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
  }

  // Horários do dia ativo particionados em Manhã e Tarde
  const { slotsManha, slotsTarde, totalLivresDiaAtivo } = useMemo(() => {
    if (!diaAtivoObj) return { slotsManha: [], slotsTarde: [], totalLivresDiaAtivo: 0 };
    // NÃ£o exibir horÃ¡rios fictÃ­cios: somente slots existentes no banco
    // possuem ID e podem ser confirmados pela RPC tenant-aware.
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
  }, [diaAtivoObj, slotsPorDia, ocupadosPorDia, slotSelecionado, hoje]);

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
                    setDiaAtivoIso(iso);
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
                    ) : (
                      <View style={[styles.datePillDot, { backgroundColor: theme.verde }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Painel do Dia Ativo: Horários de Manhã e Tarde ─── */}
        <View style={styles.painelDiaContainer}>
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
                  ? 'Todos os horários estão ocupados'
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
              <Text style={[styles.emptyTitulo, { color: theme.textoPrimario }]}>Vagas Esgotadas para este Dia</Text>
              <Text style={[styles.emptyTexto, { color: theme.textoSecundario }]}>
                Todos os horários já foram reservados. Toque em outro dia no topo para encontrar vagas livres.
              </Text>
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
      <View style={[styles.floatingBar, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F6F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.superficie,
  },
  btnVoltar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
  },
  headerCentro: {
    alignItems: 'center',
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  subtituloPasso: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Colors.ouro,
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
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  servicoBarInfo: {
    flex: 1,
    gap: 1,
  },
  servicoBarNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  servicoBarDetalhes: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: Colors.textoSecundario,
  },
  servicoBarPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.ouro,
  },

  /* Seção de Profissionais */
  secaoProfissionais: {
    gap: Spacing.xs,
  },
  secaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: Colors.textoSecundario,
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
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  chipProfissionalAtivo: {
    backgroundColor: Colors.ouro,
    borderColor: Colors.ouro,
  },
  avatarProfissional: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(203, 161, 74, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarProfissionalAtivo: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  nomeProfissional: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#D4D4D8',
  },
  nomeProfissionalAtivo: {
    fontFamily: FontFamily.bold,
    color: '#0A0A0B',
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
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  datePillAtivo: {
    backgroundColor: Colors.ouro,
    borderColor: Colors.ouro,
    ...Shadows.card,
  },
  datePillInativo: {
    opacity: 0.4,
    backgroundColor: Colors.superficie,
    borderColor: Colors.superficie,
  },
  datePillSemana: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.textoSecundario,
    letterSpacing: 0.5,
  },
  datePillSemanaAtivo: {
    color: '#0A0A0B',
  },
  datePillNumero: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: Colors.textoPrimario,
  },
  datePillNumeroAtivo: {
    color: '#0A0A0B',
  },
  datePillMes: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.textoSecundario,
    textTransform: 'uppercase',
  },
  datePillMesAtivo: {
    color: Colors.superficie,
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
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
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
    borderBottomColor: Colors.borda,
  },
  painelDiaNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  painelDiaSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  badgeVagasDisponiveis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(203, 161, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.25)',
  },
  badgeVagasTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: Colors.ouro,
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
    color: Colors.textoPrimario,
    marginTop: 4,
  },
  emptyTexto: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.textoSecundario,
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
    color: '#D4D4D8',
  },
  turnoPeriodo: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#71717A',
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
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.bordaDestaque,
  },
  timePillSelecionado: {
    backgroundColor: Colors.ouro,
    borderColor: Colors.ouro,
    ...Shadows.card,
  },
  timePillIndisponivel: {
    backgroundColor: Colors.superficie,
    borderColor: Colors.superficie,
    opacity: 0.35,
  },
  timePillTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: Colors.textoPrimario,
    letterSpacing: 0.5,
  },
  timePillTextoSelecionado: {
    color: '#0A0A0B',
  },
  timePillTextoIndisponivel: {
    color: '#52525B',
    textDecorationLine: 'line-through',
  },

  /* Floating Apple Bottom Bar */
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(18, 18, 22, 0.96)',
    borderTopWidth: 1,
    borderTopColor: Colors.borda,
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
    color: Colors.textoSecundario,
  },
  resumoValor: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: Colors.ouro,
  },
  btnContinuarApple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.ouro,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: Radii.lg,
    minWidth: 130,
  },
  btnContinuarDesabilitado: {
    backgroundColor: Colors.superficie2,
    borderColor: Colors.bordaDestaque,
    borderWidth: 1,
  },
  btnContinuarTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: '#0A0A0B',
  },
  btnContinuarTextoDesabilitado: {
    color: Colors.textoDesabilitado,
  },
});
