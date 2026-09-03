import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, Save, Sparkles, Check, Zap, Calendar, CheckSquare, Square } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows, type ThemePalette } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAgendaSemanal } from '@/hooks/useAgendaSemanal';
import { useBarbearia } from '@/contexts/BarbeariaContext';

// Grade completa de 18 horários distribuídos em 3 turnos de 6 colunas:
// Linha 1 (Manhã): 06:00 às 11:00 (6 vagas)
// Linha 2 (Tarde): 12:00 às 17:00 (6 vagas)
// Linha 3 (Noite): 18:00 às 23:00 (6 vagas)
export const HORARIOS_MANHA = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
export const HORARIOS_TARDE = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
export const HORARIOS_NOITE = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
export const HORARIOS_GRADE_18 = [...HORARIOS_MANHA, ...HORARIOS_TARDE, ...HORARIOS_NOITE];

// Compatibilidade legada
export const HORARIOS_GRADE_15 = HORARIOS_GRADE_18;
export const HORARIOS_PADRAO_10 = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
export const HORARIOS_PADRAO_15 = HORARIOS_GRADE_18;

function obterHorariosBaseBarbearia(horarioConfig: any): string[] {
  if (!horarioConfig) {
    // Padrão: Manhã (08h-11h) + Tarde (12h-17h) = 10 vagas
    return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  }
  const turnos: string[] = horarioConfig.turnos_padrao || ['manha', 'tarde'];
  let slots: string[] = [];
  if (turnos.includes('manha')) slots.push(...HORARIOS_MANHA);
  if (turnos.includes('tarde')) slots.push(...HORARIOS_TARDE);
  if (turnos.includes('noite')) slots.push(...HORARIOS_NOITE);

  const inicio = horarioConfig.inicio || '08:00';
  const fim = horarioConfig.fim || '20:00';
  slots = slots.filter((h) => h >= inicio && h <= fim);

  if (horarioConfig.tem_intervalo && horarioConfig.intervalo_inicio && horarioConfig.intervalo_fim) {
    slots = slots.filter((h) => h < horarioConfig.intervalo_inicio || h >= horarioConfig.intervalo_fim);
  }

  return slots.length > 0 ? slots : ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
}

const NOMES_DIAS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

function obterSemana(offsetSemanas = 0) {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = Dom, 1 = Seg, ...
  const diffSeg = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(hoje);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(hoje.getDate() + diffSeg + offsetSemanas * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + index);
    return data;
  });
}

function dataLocal(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export default function PrepararAgenda() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuth();
  const { barbearia } = useBarbearia();
  const { carregarSemanaParaBarbeiro } = useAgendaSemanal(barbearia?.id);

  const isModoSemanal = barbearia?.modo_agenda === 'drops';

  // 0 = Esta Semana, 1 = Próxima Semana, 2 = Mês Inteiro (4 semanas)
  const [semanaOffset, setSemanaOffset] = useState<0 | 1 | 2>(0);
  const isModoMes = !isModoSemanal && semanaOffset === 2;

  // Semanas carregadas (1 semana nos modos 0 e 1, ou 4 semanas no modo 2)
  const semanas = useMemo(() => {
    if (isModoSemanal) {
      return [obterSemana(0)];
    }
    if (isModoMes) {
      return [obterSemana(0), obterSemana(1), obterSemana(2), obterSemana(3)];
    }
    return [obterSemana(semanaOffset)];
  }, [isModoMes, isModoSemanal, semanaOffset]);

  // Lista plana de todas as datas atualmente visíveis
  const todasDatas = useMemo(() => semanas.flat(), [semanas]);

  // Estado de dias ativos (mapeado por string ISO "YYYY-MM-DD")
  const [diasAtivosMap, setDiasAtivosMap] = useState<Record<string, boolean>>({});
  // Estado dos horários granulares (mapeado por string ISO "YYYY-MM-DD")
  const [horariosMap, setHorariosMap] = useState<Record<string, string[]>>({});
  // Estado do preset de dias ativo para feedback visual
  const [presetDiasAtivo, setPresetDiasAtivo] = useState<
    'seg_sex' | 'seg_sab' | 'ter_dom' | 'todos' | 'nenhum' | 'personalizado'
  >('todos');

  const [abertura, setAbertura] = useState('19:30');
  const [abrirImediatamente, setAbrirImediatamente] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Carrega a configuração existente ao trocar de escopo
  useEffect(() => {
    let montado = true;
    setCarregandoDados(true);

    async function carregarConfiguracao() {
      try {
        const novosAtivos: Record<string, boolean> = {};
        const novosHorarios: Record<string, string[]> = {};
        const configHorario =
          barbearia?.horario_funcionamento_padrao || (barbearia?.regras_fidelidade as any)?.horario_funcionamento_padrao;
        const horariosPadrao = obterHorariosBaseBarbearia(configHorario);

        // Inicializa todas as datas como ativas com os horários base da barbearia
        for (const data of todasDatas) {
          const strData = dataLocal(data);
          novosAtivos[strData] = true;
          novosHorarios[strData] = horariosPadrao;
        }

        // Busca se há slots já salvos no banco para essas datas
        if (session?.user?.id && barbearia?.id) {
          const inicioGeral = dataLocal(todasDatas[0]);
          const fimGeral = dataLocal(todasDatas[todasDatas.length - 1]);

          const { data: slotsBanco } = await supabase
            .from('slots_agenda')
            .select('data_hora, ativo')
            .eq('barbeiro_id', session.user.id)
            .eq('barbearia_id', barbearia.id)
            .gte('data_hora', `${inicioGeral}T00:00:00Z`)
            .lte('data_hora', `${fimGeral}T23:59:59Z`);

          if (slotsBanco && slotsBanco.length > 0) {
            const agrupadoPorDia: Record<string, string[]> = {};
            for (const slot of slotsBanco) {
              if (!slot.ativo) continue;
              const d = new Date(slot.data_hora);
              const strData = dataLocal(d);
              const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
              if (!agrupadoPorDia[strData]) agrupadoPorDia[strData] = [];
              if (!agrupadoPorDia[strData].includes(hora)) {
                agrupadoPorDia[strData].push(hora);
              }
            }

            for (const data of todasDatas) {
              const strData = dataLocal(data);
              if (agrupadoPorDia[strData] && agrupadoPorDia[strData].length > 0) {
                novosAtivos[strData] = true;
                novosHorarios[strData] = agrupadoPorDia[strData].sort();
              }
            }
          }
        }

        if (montado) {
          setDiasAtivosMap(novosAtivos);
          setHorariosMap(novosHorarios);
        }
      } catch (err) {
        console.warn('Erro ao carregar dias da agenda:', err);
      } finally {
        if (montado) setCarregandoDados(false);
      }
    }

    carregarConfiguracao();

    return () => {
      montado = false;
    };
  }, [barbearia?.horario_funcionamento_padrao, barbearia?.id, session?.user?.id, todasDatas]);

  // Contagem total de vagas ativas
  const totalVagas = useMemo(() => {
    let count = 0;
    for (const data of todasDatas) {
      const strData = dataLocal(data);
      if (diasAtivosMap[strData]) {
        count += (horariosMap[strData] || []).length;
      }
    }
    return count;
  }, [diasAtivosMap, horariosMap, todasDatas]);

  interface SugestaoReplicacao {
    strDataOrigem: string;
    diaSemanaNome: string;
    diaSemanaIdx: number; // 0 = Seg ... 6 = Dom
    horarios: string[];
  }

  const [sugestaoReplicacao, setSugestaoReplicacao] = useState<SugestaoReplicacao | null>(null);

  function replicarParaOutrosDiasSemana(origem: SugestaoReplicacao) {
    const novosHorarios = { ...horariosMap };
    const novosAtivos = { ...diasAtivosMap };

    for (const data of todasDatas) {
      const strData = dataLocal(data);
      if (novosAtivos[strData]) {
        novosHorarios[strData] = [...origem.horarios];
      }
    }

    setHorariosMap(novosHorarios);
    setSugestaoReplicacao(null);
    Alert.alert('Personalização Replicada! 💈', `A grade de ${origem.horarios.length} horários foi aplicada a todos os dias ativos.`);
  }

  function replicarParaMesmoDiaNoMes(origem: SugestaoReplicacao) {
    const novosHorarios = { ...horariosMap };
    const novosAtivos = { ...diasAtivosMap };

    for (const data of todasDatas) {
      const diaSemanaIdx = (data.getDay() + 6) % 7; // 0 = Seg, ..., 6 = Dom
      if (diaSemanaIdx === origem.diaSemanaIdx) {
        const strData = dataLocal(data);
        novosAtivos[strData] = origem.horarios.length > 0;
        novosHorarios[strData] = [...origem.horarios];
      }
    }

    setDiasAtivosMap(novosAtivos);
    setHorariosMap(novosHorarios);
    setSugestaoReplicacao(null);
    Alert.alert('Personalização Replicada no Mês! 📅', `A grade foi aplicada a todas as ${origem.diaSemanaNome}s do mês.`);
  }

  function handleToggleDia(strData: string, valor: boolean) {
    setPresetDiasAtivo('personalizado');
    setDiasAtivosMap((prev) => ({ ...prev, [strData]: valor }));
    if (valor && (!horariosMap[strData] || horariosMap[strData].length === 0)) {
      const configHorario =
        barbearia?.horario_funcionamento_padrao || (barbearia?.regras_fidelidade as any)?.horario_funcionamento_padrao;
      const base = obterHorariosBaseBarbearia(configHorario);
      setHorariosMap((prev) => ({ ...prev, [strData]: base }));
    }
  }

  function handleToggleHorario(strData: string, hora: string, diaSemanaIdx: number, diaNome: string) {
    const listaAtual = horariosMap[strData] || [];
    let novaLista: string[];
    if (listaAtual.includes(hora)) {
      novaLista = listaAtual.filter((h) => h !== hora);
    } else {
      novaLista = [...listaAtual, hora].sort();
    }

    setHorariosMap((prev) => ({ ...prev, [strData]: novaLista }));
    setDiasAtivosMap((prev) => ({ ...prev, [strData]: novaLista.length > 0 }));
    setSugestaoReplicacao({
      strDataOrigem: strData,
      diaSemanaNome: diaNome,
      diaSemanaIdx,
      horarios: novaLista,
    });
  }

  // Alterna um turno inteiro para um dia específico (Manhã, Tarde ou Noite)
  function handleToggleTurnoDia(
    strData: string,
    turno: 'manha' | 'tarde' | 'noite',
    diaSemanaIdx: number,
    diaNome: string
  ) {
    const listaTurno =
      turno === 'manha' ? HORARIOS_MANHA : turno === 'tarde' ? HORARIOS_TARDE : HORARIOS_NOITE;
    const horasAtuais = horariosMap[strData] || [];
    const temEsseTurno = listaTurno.some((h) => horasAtuais.includes(h));

    let novaLista: string[];
    if (temEsseTurno) {
      // Oculta o turno removendo seus horários
      novaLista = horasAtuais.filter((h) => !listaTurno.includes(h));
    } else {
      // Exibe o turno adicionando todos os seus 6 horários
      novaLista = Array.from(new Set([...horasAtuais, ...listaTurno])).sort();
    }

    setHorariosMap((prev) => ({ ...prev, [strData]: novaLista }));
    setDiasAtivosMap((prev) => ({ ...prev, [strData]: novaLista.length > 0 }));
    setSugestaoReplicacao({
      strDataOrigem: strData,
      diaSemanaNome: diaNome,
      diaSemanaIdx,
      horarios: novaLista,
    });
  }

  function handleLimparDia(strData: string, diaSemanaIdx: number, diaNome: string) {
    setHorariosMap((prev) => ({ ...prev, [strData]: [] }));
    setDiasAtivosMap((prev) => ({ ...prev, [strData]: false }));
  }

  // ─── PRESETS RÁPIDOS DE DIAS ───
  function aplicarPreset(tipo: 'seg_sex' | 'seg_sab' | 'ter_dom' | 'todos' | 'nenhum') {
    setPresetDiasAtivo(tipo);
    const novosAtivos: Record<string, boolean> = { ...diasAtivosMap };
    const novosHorarios: Record<string, string[]> = { ...horariosMap };
    const configHorario =
      barbearia?.horario_funcionamento_padrao || (barbearia?.regras_fidelidade as any)?.horario_funcionamento_padrao;
    const horariosBase = obterHorariosBaseBarbearia(configHorario);

    for (const data of todasDatas) {
      const strData = dataLocal(data);
      const diaSemana = data.getDay(); // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb

      let ativo = false;
      if (tipo === 'todos') ativo = true;
      else if (tipo === 'seg_sex') ativo = diaSemana >= 1 && diaSemana <= 5; // Seg a Sex
      else if (tipo === 'seg_sab') ativo = diaSemana >= 1 && diaSemana <= 6; // Seg a Sáb
      else if (tipo === 'ter_dom') ativo = diaSemana !== 1; // Ter a Dom
      else if (tipo === 'nenhum') ativo = false;

      novosAtivos[strData] = ativo;
      if (ativo && (!novosHorarios[strData] || novosHorarios[strData].length === 0)) {
        novosHorarios[strData] = horariosBase;
      }
    }

    setDiasAtivosMap(novosAtivos);
    setHorariosMap(novosHorarios);
  }

  // ─── ALTERNA TURNO GLOBAL EM TODOS OS DIAS ATIVOS (MANHÃ, TARDE, NOITE) ───
  function handleToggleTurnoGlobal(turno: 'manha' | 'tarde' | 'noite') {
    const listaTurno =
      turno === 'manha' ? HORARIOS_MANHA : turno === 'tarde' ? HORARIOS_TARDE : HORARIOS_NOITE;
    const novosHorarios: Record<string, string[]> = { ...horariosMap };

    const diasAtivosLista = todasDatas.filter((d) => diasAtivosMap[dataLocal(d)]);
    const todosTemEsseTurno =
      diasAtivosLista.length > 0 &&
      diasAtivosLista.every((d) => {
        const horas = horariosMap[dataLocal(d)] || [];
        return listaTurno.some((h) => horas.includes(h));
      });

    for (const data of todasDatas) {
      const strData = dataLocal(data);
      if (diasAtivosMap[strData]) {
        const horasAtuais = horariosMap[strData] || [];
        if (todosTemEsseTurno) {
          // Desmarca esse turno em todos os dias ativos
          novosHorarios[strData] = horasAtuais.filter((h) => !listaTurno.includes(h));
        } else {
          // Adiciona os 6 horários do turno em todos os dias ativos
          novosHorarios[strData] = Array.from(new Set([...horasAtuais, ...listaTurno])).sort();
        }
      }
    }
    setHorariosMap(novosHorarios);
  }

  // ─── SALVAR AGENDA (SEMANAL OU MÊS INTEIRO) ───
  async function salvar(forcarImediato = false) {
    if (!session?.user?.id) {
      Alert.alert('Erro', 'Sessão não identificada. Faça login novamente.');
      return;
    }
    if (!barbearia?.id) {
      Alert.alert('Erro', 'Selecione uma barbearia ativa antes de salvar a agenda.');
      return;
    }
    setSalvando(true);

    const abrirAgora = forcarImediato;

    try {
      // Constrói payload para cada semana
      const semanasPayload = semanas.map((semanaDatas) => {
        const inicioSemana = dataLocal(semanaDatas[0]);
        const fimSemana = dataLocal(semanaDatas[semanaDatas.length - 1]);

        const segundaAnterior = new Date(semanaDatas[0]);
        const aberturaProgramada = abrirAgora
          ? new Date().toISOString()
          : new Date(`${dataLocal(segundaAnterior)}T${abertura}:00`).toISOString();

        const diasPayload = semanaDatas.map((data) => {
          const strData = dataLocal(data);
          return {
            data: strData,
            ativo: diasAtivosMap[strData] && (horariosMap[strData] || []).length > 0,
          };
        });

        const slotsPayload = semanaDatas.flatMap((data) => {
          const strData = dataLocal(data);
          if (!diasAtivosMap[strData]) return [];
          const horasEscolhidas = horariosMap[strData] || [];
          return horasEscolhidas.map((hora) => ({
            data: strData,
            hora,
          }));
        });

        return {
          data_inicio: inicioSemana,
          data_fim: fimSemana,
          status: abrirAgora ? 'aberta' : 'programada',
          data_abertura_programada: aberturaProgramada,
          dias: diasPayload,
          slots: slotsPayload,
        };
      });

      // 1. Tenta salvar em lote via RPC
      const { error: erroBatch } = await supabase.rpc('salvar_agenda_multiplas_semanas_rpc', {
        p_barbearia_id: barbearia.id,
        p_barbeiro_id: session.user.id,
        p_semanas: semanasPayload,
      });

      if (erroBatch) {
        console.warn('RPC salvar_agenda_multiplas_semanas_rpc falhou, executando gravação semanal sequencial:', erroBatch.message);

        // Fallback: salva semana por semana via RPC salvar_agenda_semanal_rpc
        for (const semanaItem of semanasPayload) {
          const { error: erroSemana } = await supabase.rpc('salvar_agenda_semanal_rpc', {
            p_barbearia_id: barbearia.id,
            p_barbeiro_id: session.user.id,
            p_data_inicio: semanaItem.data_inicio,
            p_data_fim: semanaItem.data_fim,
            p_status: semanaItem.status,
            p_data_abertura_programada: semanaItem.data_abertura_programada,
            p_dias: semanaItem.dias,
            p_slots: semanaItem.slots,
          });

          if (erroSemana) {
            throw new Error(`Falha ao salvar semana de ${semanaItem.data_inicio}: ${erroSemana.message}`);
          }
        }
      }

      if (abrirAgora) {
        try {
          await supabase.rpc('notificar_todos_clientes', {
            p_titulo: isModoMes
              ? 'Agenda do Mês Inteiro Liberada! 💈'
              : semanaOffset === 0
              ? 'Horários Atualizados na Barbearia! 💈'
              : 'Agenda da Próxima Semana Aberta! 💈',
            p_mensagem: isModoMes
              ? 'Os horários para os próximos 30 dias estão disponíveis no aplicativo! Garanta seu atendimento antecipado.'
              : 'Novos horários foram liberados para agendamento! Escolha o melhor dia para seu corte.',
            p_tipo: 'abertura_agenda',
            p_dados: { modo: isModoMes ? 'mes_inteiro' : 'semanal', barbearia_id: barbearia.id },
          });
        } catch {
          // Push notification não bloqueia o salvamento
        }
      }

      Alert.alert(
        abrirAgora
          ? isModoMes
            ? 'Mês Inteiro Liberado com Sucesso! 🚀'
            : 'Agenda Liberada para os Clientes! 🚀'
          : 'Agenda Programada com Sucesso! 💈',
        abrirAgora
          ? `${totalVagas} vagas foram abertas no aplicativo para ${isModoMes ? 'os próximos 30 dias (Mês Inteiro)' : semanaOffset === 0 ? 'Esta Semana' : 'Próxima Semana'}. Os clientes já podem agendar!`
          : `A agenda foi programada com ${totalVagas} vagas no total e abrirá na segunda-feira pontualmente às ${abertura}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      Alert.alert('Erro ao salvar agenda', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botaoVoltar}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.textoPrimario} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Preparar Agenda</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Seletor de Escopo: Apenas exibido no modo Livre */}
      {!isModoSemanal && (
        <View style={[styles.semanaTabContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
          <TouchableOpacity
            style={[
              styles.semanaTab,
              styles.semanaTabEsta,
              semanaOffset === 0 && { backgroundColor: theme.ouro },
            ]}
            onPress={() => setSemanaOffset(0)}
            activeOpacity={0.8}
          >
            <Calendar size={12} color={semanaOffset === 0 ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
            <Text
              numberOfLines={1}
              style={[
                styles.semanaTabTexto,
                { color: theme.textoSecundario },
                semanaOffset === 0 && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}
            >
              Esta Semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.semanaTab,
              styles.semanaTabProxima,
              semanaOffset === 1 && { backgroundColor: theme.ouro },
            ]}
            onPress={() => setSemanaOffset(1)}
            activeOpacity={0.8}
          >
            <Calendar size={12} color={semanaOffset === 1 ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
            <Text
              numberOfLines={1}
              style={[
                styles.semanaTabTexto,
                { color: theme.textoSecundario },
                semanaOffset === 1 && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}
            >
              Próxima
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.semanaTab,
              styles.semanaTabMes,
              semanaOffset === 2 && { backgroundColor: theme.ouro },
            ]}
            onPress={() => setSemanaOffset(2)}
            activeOpacity={0.8}
          >
            <Sparkles size={12} color={semanaOffset === 2 ? theme.textoEscuroSobreOuro : theme.ouroTexto} />
            <Text
              numberOfLines={1}
              style={[
                styles.semanaTabTexto,
                { color: theme.textoSecundario },
                semanaOffset === 2 && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}
            >
              Mês Inteiro (30d)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {carregandoDados ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.ouro} />
          <Text style={[styles.loadingTexto, { color: theme.textoSecundario }]}>Carregando configuração da agenda...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Resumo */}
          <View style={[styles.resumoCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={[styles.resumoIconeWrapper, { backgroundColor: theme.ouroTranslucido }]}>
              <Sparkles size={20} color={theme.ouroTexto} />
            </View>
            <View style={styles.resumoTexto}>
              <Text style={[styles.resumoTitulo, { color: theme.textoPrimario }]}>
                {isModoSemanal
                  ? 'Esta Semana (Modo Semanal)'
                  : isModoMes
                  ? 'Mês Inteiro (Modo Livre)'
                  : semanaOffset === 0
                  ? 'Esta Semana'
                  : 'Próxima Semana'}{' '}
                ({totalVagas} vagas ativas)
              </Text>
              <Text style={[styles.resumoDescricao, { color: theme.textoSecundario }]}>
                {isModoSemanal
                  ? 'Configure os dias e horários da semana para a abertura programada aos clientes.'
                  : isModoMes
                  ? 'Libere os próximos 30 dias de uma vez só e desmarque facilmente os dias de folga.'
                  : 'Todos os 7 dias da semana podem ser ativados livremente.'}
              </Text>
            </View>
          </View>

          {/* Barra de Presets Rápidos de Dias */}
          <View style={styles.presetsContainer}>
            <Text style={[styles.presetsTitulo, { color: theme.ouroTexto }]}>⚡ PRÉ-CONFIGURAÇÕES DE DIAS</Text>
            <View style={styles.presetsLinhaRow}>
              {[
                { id: 'seg_sex', label: 'Seg - Sex' },
                { id: 'seg_sab', label: 'Seg - Sáb' },
                { id: 'ter_dom', label: 'Ter - Dom' },
                { id: 'todos', label: 'Todos' },
                { id: 'nenhum', label: 'Limpar' },
              ].map((p) => {
                const selecionado = presetDiasAtivo === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.presetChip,
                      { backgroundColor: theme.superficie2, borderColor: theme.borda },
                      selecionado && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                    ]}
                    onPress={() => aplicarPreset(p.id as any)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetChipTexto,
                        { color: theme.textoSecundario },
                        selecionado && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Atalhos Globais de Turnos: Manhã, Tarde e Noite */}
          <View style={styles.presetsVagasGlobalContainer}>
            <Text style={[styles.presetsTitulo, { color: theme.textoSecundario }]}>⚡ APLICAR EM TODOS OS DIAS ATIVOS</Text>
            <View style={styles.presetsVagasGlobalLinha}>
              {[
                { id: 'manha', label: '☀️ Manhã (06h-11h)' },
                { id: 'tarde', label: '🌤️ Tarde (12h-17h)' },
                { id: 'noite', label: '🌙 Noite (18h-23h)' },
              ].map((t) => {
                const listaTurno =
                  t.id === 'manha' ? HORARIOS_MANHA : t.id === 'tarde' ? HORARIOS_TARDE : HORARIOS_NOITE;
                const diasAtivosLista = todasDatas.filter((d) => diasAtivosMap[dataLocal(d)]);
                const ativoGlobal =
                  diasAtivosLista.length > 0 &&
                  diasAtivosLista.every((d) => {
                    const horas = horariosMap[dataLocal(d)] || [];
                    return listaTurno.some((h) => horas.includes(h));
                  });

                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.presetVagaChip,
                      { backgroundColor: theme.superficie2, borderColor: theme.borda },
                      ativoGlobal && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                    ]}
                    onPress={() => handleToggleTurnoGlobal(t.id as any)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetVagaChipTexto,
                        { color: theme.textoSecundario },
                        ativoGlobal && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CARD DE SUGESTÃO DE REPLICAÇÃO CONTEXTUAL */}
          {sugestaoReplicacao && (
            <View style={[styles.cardReplicacao, { backgroundColor: theme.superficie, borderColor: theme.ouro }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Sparkles size={16} color={theme.ouroTexto} />
                  <Text style={[styles.cardReplicacaoTitulo, { color: theme.textoPrimario }]}>
                    Replicar horários de {sugestaoReplicacao.diaSemanaNome}?
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSugestaoReplicacao(null)} style={{ padding: 4 }}>
                  <Text style={{ color: theme.textoSecundario, fontSize: 13, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardReplicacaoSub, { color: theme.textoSecundario }]}>
                Você personalizou {sugestaoReplicacao.horarios.length} vaga(s). Deseja aplicar essa mesma configuração aos outros dias?
              </Text>

              <View style={styles.cardReplicacaoBotoes}>
                <TouchableOpacity
                  style={[styles.botaoReplicarAcao, { backgroundColor: theme.ouro }]}
                  onPress={() => replicarParaOutrosDiasSemana(sugestaoReplicacao)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.botaoReplicarTexto, { color: theme.textoEscuroSobreOuro }]}>
                    📅 Aplicar aos outros dias ativos
                  </Text>
                </TouchableOpacity>

                {isModoMes && (
                  <TouchableOpacity
                    style={[styles.botaoReplicarAcao, { backgroundColor: theme.superficie2, borderColor: theme.borda, borderWidth: 1 }]}
                    onPress={() => replicarParaMesmoDiaNoMes(sugestaoReplicacao)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.botaoReplicarTexto, { color: theme.textoPrimario }]}>
                      🗓️ Replicar nas {sugestaoReplicacao.diaSemanaNome}s do Mês
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Lista de Semanas & Dias */}
          {semanas.map((semanaDatas, semIdx) => {
            return (
              <View key={`semana-${semIdx}`} style={styles.blocoSemana}>
                {isModoMes && (
                  <View style={[styles.semanaTituloContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
                    <Text style={[styles.semanaTituloTexto, { color: theme.ouroTexto }]}>
                      SEMANA {semIdx + 1} ({semanaDatas[0].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} a {semanaDatas[6].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                    </Text>
                  </View>
                )}

                <View style={styles.diasLista}>
                  {semanaDatas.map((data) => {
                    const strData = dataLocal(data);
                    const diaAberto = !!diasAtivosMap[strData];
                    const horasAtivas = horariosMap[strData] || [];
                    const qtdVagasDia = diaAberto ? horasAtivas.length : 0;
                    const diaSemanaIdx = (data.getDay() + 6) % 7; // 0 = Seg, ..., 6 = Dom
                    const nomeDiaAtual = NOMES_DIAS[diaSemanaIdx];

                    const temManha = horasAtivas.some((h) => HORARIOS_MANHA.includes(h));
                    const temTarde = horasAtivas.some((h) => HORARIOS_TARDE.includes(h));
                    const temNoite = horasAtivas.some((h) => HORARIOS_NOITE.includes(h));

                    return (
                      <View key={strData} style={[styles.diaContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
                        <View style={styles.diaCabecalho}>
                          <View style={styles.diaTexto}>
                            <Text style={[styles.diaNome, { color: theme.textoPrimario }]}>
                              {nomeDiaAtual}
                            </Text>
                            <Text style={[styles.diaData, { color: theme.textoSecundario }]}>
                              {data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              {' · '}
                              <Text style={{ color: qtdVagasDia > 0 ? theme.verde : theme.textoSecundario, fontFamily: qtdVagasDia > 0 ? FontFamily.semiBold : FontFamily.regular }}>
                                {qtdVagasDia > 0 ? `${qtdVagasDia} vaga(s) ativa(s)` : 'Dia fechado / folga'}
                              </Text>
                            </Text>
                          </View>

                          <Switch
                            value={diaAberto}
                            onValueChange={(valor) => handleToggleDia(strData, valor)}
                            trackColor={{ false: isEscuro ? '#27272A' : '#E4E4E7', true: theme.ouro }}
                            thumbColor={diaAberto ? (isEscuro ? '#09090B' : '#FFFFFF') : (isEscuro ? '#71717A' : '#A1A1AA')}
                          />
                        </View>

                        {/* Turnos e Horários de 6 Colunas */}
                        {diaAberto && (
                          <View style={styles.horariosWrapper}>
                            {/* Botões de Seleção de Turnos do Dia */}
                            <View style={styles.diaAtalhosLinha}>
                              <TouchableOpacity
                                style={[
                                  styles.diaAtalhoChip,
                                  { backgroundColor: theme.superficie2, borderColor: theme.borda },
                                  temManha && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                                ]}
                                onPress={() => handleToggleTurnoDia(strData, 'manha', diaSemanaIdx, nomeDiaAtual)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.diaAtalhoTexto,
                                    { color: theme.textoSecundario },
                                    temManha && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                                  ]}
                                >
                                  ☀️ Manhã
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.diaAtalhoChip,
                                  { backgroundColor: theme.superficie2, borderColor: theme.borda },
                                  temTarde && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                                ]}
                                onPress={() => handleToggleTurnoDia(strData, 'tarde', diaSemanaIdx, nomeDiaAtual)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.diaAtalhoTexto,
                                    { color: theme.textoSecundario },
                                    temTarde && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                                  ]}
                                >
                                  🌤️ Tarde
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.diaAtalhoChip,
                                  { backgroundColor: theme.superficie2, borderColor: theme.borda },
                                  temNoite && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                                ]}
                                onPress={() => handleToggleTurnoDia(strData, 'noite', diaSemanaIdx, nomeDiaAtual)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.diaAtalhoTexto,
                                    { color: theme.textoSecundario },
                                    temNoite && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                                  ]}
                                >
                                  🌙 Noite
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.diaAtalhoChip, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                                onPress={() => handleLimparDia(strData, diaSemanaIdx, nomeDiaAtual)}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.diaAtalhoTexto, { color: theme.textoSecundario }]}>Limpar</Text>
                              </TouchableOpacity>
                            </View>

                            {/* 1. Turno da Manhã (06:00 às 11:00) */}
                            {temManha && (
                              <View style={styles.turnoBloco}>
                                <Text style={[styles.turnoTitulo, { color: theme.ouroTexto }]}>☀️ MANHÃ (06h - 11h)</Text>
                                <View style={styles.turnoLinhaSlots}>
                                  {HORARIOS_MANHA.map((hora) => {
                                    const ativo = horasAtivas.includes(hora);
                                    return (
                                      <TouchableOpacity
                                        key={hora}
                                        style={[
                                          styles.chipHorario6,
                                          { backgroundColor: theme.superficie2, borderColor: theme.borda },
                                          ativo && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                                        ]}
                                        onPress={() => handleToggleHorario(strData, hora, diaSemanaIdx, nomeDiaAtual)}
                                        activeOpacity={0.7}
                                      >
                                        <Text
                                          style={[
                                            styles.chipHorarioTexto6,
                                            { color: theme.textoSecundario },
                                            ativo && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                                          ]}
                                        >
                                          {hora}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )}

                            {/* 2. Turno da Tarde (12:00 às 17:00) */}
                            {temTarde && (
                              <View style={styles.turnoBloco}>
                                <Text style={[styles.turnoTitulo, { color: theme.ouroTexto }]}>🌤️ TARDE (12h - 17h)</Text>
                                <View style={styles.turnoLinhaSlots}>
                                  {HORARIOS_TARDE.map((hora) => {
                                    const ativo = horasAtivas.includes(hora);
                                    return (
                                      <TouchableOpacity
                                        key={hora}
                                        style={[
                                          styles.chipHorario6,
                                          { backgroundColor: theme.superficie2, borderColor: theme.borda },
                                          ativo && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                                        ]}
                                        onPress={() => handleToggleHorario(strData, hora, diaSemanaIdx, nomeDiaAtual)}
                                        activeOpacity={0.7}
                                      >
                                        <Text
                                          style={[
                                            styles.chipHorarioTexto6,
                                            { color: theme.textoSecundario },
                                            ativo && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                                          ]}
                                        >
                                          {hora}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )}

                            {/* 3. Turno da Noite (18:00 às 23:00) */}
                            {temNoite && (
                              <View style={styles.turnoBloco}>
                                <Text style={[styles.turnoTitulo, { color: theme.ouroTexto }]}>🌙 NOITE (18h - 23h)</Text>
                                <View style={styles.turnoLinhaSlots}>
                                  {HORARIOS_NOITE.map((hora) => {
                                    const ativo = horasAtivas.includes(hora);
                                    return (
                                      <TouchableOpacity
                                        key={hora}
                                        style={[
                                          styles.chipHorario6,
                                          { backgroundColor: theme.superficie2, borderColor: theme.borda },
                                          ativo && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                                        ]}
                                        onPress={() => handleToggleHorario(strData, hora, diaSemanaIdx, nomeDiaAtual)}
                                        activeOpacity={0.7}
                                      >
                                        <Text
                                          style={[
                                            styles.chipHorarioTexto6,
                                            { color: theme.textoSecundario },
                                            ativo && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                                          ]}
                                        >
                                          {hora}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )}

                            {!temManha && !temTarde && !temNoite && (
                              <Text style={[styles.nenhumTurnoTexto, { color: theme.textoSecundario }]}>
                                Nenhum turno ativo para este dia. Toque em Manhã, Tarde ou Noite para abrir horários.
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Horário de Abertura Programada: Exibido no modo Semanal */}
          {isModoSemanal && (
            <>
              <Text style={[styles.secaoTitulo, { color: theme.textoSecundario }]}>HORÁRIO DE ABERTURA PROGRAMADA</Text>
              <View style={styles.horariosContainer}>
                {['18:00', '19:00', '19:30', '20:00', '21:00'].map((hora) => (
                  <TouchableOpacity
                    key={hora}
                    onPress={() => setAbertura(hora)}
                    style={[
                      styles.horaBotao,
                      { backgroundColor: theme.superficie, borderColor: theme.borda },
                      abertura === hora && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.horaTexto,
                      { color: theme.textoSecundario },
                      abertura === hora && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                    ]}>
                      {hora}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.infoBox, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Clock size={16} color={theme.ouroTexto} />
                <Text style={[styles.infoTexto, { color: theme.ouroTexto }]}>
                  A notificação de abertura será enviada aos clientes na segunda-feira pontualmente às {abertura}.
                </Text>
              </View>
            </>
          )}

          {/* Botão Principal: Programar e Ativar Agenda */}
          <Botao
            label={
              salvando
                ? 'Salvando vagas...'
                : isModoSemanal
                ? 'Programar e Ativar Agenda'
                : 'Salvar e Ativar Agenda'
            }
            iconeEsquerda={<Calendar size={18} color={theme.textoEscuroSobreOuro} />}
            onPress={() => salvar(false)}
            desabilitado={salvando || totalVagas === 0}
            estiloContainer={styles.botaoSalvar}
          />

          {/* Botão Secundário Discreto: Liberar agora */}
          <TouchableOpacity
            style={styles.botaoLiberarDiscreto}
            onPress={() => salvar(true)}
            disabled={salvando || totalVagas === 0}
            activeOpacity={0.7}
          >
            <Zap size={15} color={theme.verde} />
            <Text style={[styles.botaoLiberarDiscretoTexto, { color: theme.verde }]}>
              Liberar agora (abrir vagas imediatamente)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.fundo },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
    },
    semanaTabContainer: {
      flexDirection: 'row',
      marginHorizontal: Spacing.telaH,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      padding: 4,
      borderRadius: Radii.lg,
      borderWidth: 1,
      gap: 4,
    },
    semanaTab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: Radii.md,
    },
    semanaTabEsta: {
      flex: 1.05,
    },
    semanaTabProxima: {
      flex: 0.8,
    },
    semanaTabMes: {
      flex: 1.25,
    },
    semanaTabTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
      textAlign: 'center',
    },
    botaoVoltar: {
      padding: 4,
    },
    titulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
      color: theme.textoPrimario,
    },
    placeholder: {
      width: 32,
    },
    scroll: {
      padding: Spacing.telaH,
      gap: Spacing.md,
      paddingBottom: Spacing.giant,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      paddingTop: 80,
    },
    loadingTexto: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    resumoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
      ...Shadows.card,
    },
    resumoIconeWrapper: {
      width: 36,
      height: 36,
      borderRadius: Radii.sm,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resumoTexto: {
      flex: 1,
      gap: 2,
    },
    resumoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    resumoDescricao: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      lineHeight: 16,
    },
    presetsContainer: {
      gap: Spacing.xs,
    },
    presetsTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      letterSpacing: 0.5,
    },
    presetsLinhaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingVertical: 2,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 7,
      paddingHorizontal: 4,
      borderRadius: Radii.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetChipTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11,
      textAlign: 'center',
    },
    presetsVagasGlobalContainer: {
      gap: Spacing.xs,
    },
    presetsVagasGlobalLinha: {
      flexDirection: 'row',
      gap: 6,
    },
    presetVagaChip: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: Radii.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetVagaChipTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11,
      textAlign: 'center',
    },
    secaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 11.5,
      color: theme.ouroTexto,
      letterSpacing: 1.1,
      marginTop: Spacing.xs,
      marginBottom: 6,
    },
    blocoSemana: {
      gap: Spacing.xs,
    },
    semanaTituloContainer: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: Radii.md,
      borderWidth: 1,
      marginBottom: 4,
    },
    semanaTituloTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
      letterSpacing: 0.8,
      textAlign: 'center',
    },
    diasLista: {
      gap: Spacing.sm,
    },
    diaContainer: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    diaCabecalho: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    diaTexto: {
      gap: 2,
    },
    diaNome: {
      fontFamily: FontFamily.bold,
      fontSize: 15,
      color: theme.textoPrimario,
    },
    diaData: {
      fontFamily: FontFamily.regular,
      fontSize: 12,
      color: theme.textoSecundario,
    },
    horariosWrapper: {
      gap: 10,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.borda,
    },
    diaAtalhosLinha: {
      flexDirection: 'row',
      gap: 6,
    },
    diaAtalhoChip: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderRadius: Radii.sm,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    diaAtalhoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 10.5,
      textAlign: 'center',
    },
    turnoBloco: {
      gap: 4,
    },
    turnoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 10.5,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    turnoLinhaSlots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
    },
    chipHorario6: {
      flex: 1,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radii.sm,
      borderWidth: 1,
    },
    chipHorarioTexto6: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11,
      textAlign: 'center',
    },
    nenhumTurnoTexto: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      textAlign: 'center',
      paddingVertical: 6,
      lineHeight: 16,
    },
    horariosContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    horaBotao: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: Radii.sm,
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    horaTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: theme.ouroTranslucido,
      borderRadius: Radii.sm,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    infoTexto: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.ouroTexto,
      lineHeight: 16,
    },
    botaoSalvar: {
      backgroundColor: theme.ouro,
      marginTop: Spacing.xs,
    },
    botaoLiberarDiscreto: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginTop: 2,
    },
    botaoLiberarDiscretoTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 13,
      textAlign: 'center',
    },
    cardReplicacao: {
      borderRadius: Radii.lg,
      borderWidth: 1.5,
      padding: Spacing.md,
      gap: 8,
      ...Shadows.card,
    },
    cardReplicacaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 13.5,
    },
    cardReplicacaoSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      lineHeight: 16,
    },
    cardReplicacaoBotoes: {
      gap: 6,
      marginTop: 4,
    },
    botaoReplicarAcao: {
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botaoReplicarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
  });
