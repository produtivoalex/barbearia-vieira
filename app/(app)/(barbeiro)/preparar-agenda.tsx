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

const HORARIOS_DISPONIVEIS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
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

  // 0 = Esta Semana, 1 = Próxima Semana, 2 = Mês Inteiro (4 semanas)
  const [semanaOffset, setSemanaOffset] = useState<0 | 1 | 2>(0);
  const isModoMes = semanaOffset === 2;

  // Semanas carregadas (1 semana nos modos 0 e 1, ou 4 semanas no modo 2)
  const semanas = useMemo(() => {
    if (isModoMes) {
      return [obterSemana(0), obterSemana(1), obterSemana(2), obterSemana(3)];
    }
    return [obterSemana(semanaOffset)];
  }, [isModoMes, semanaOffset]);

  // Lista plana de todas as datas atualmente visíveis
  const todasDatas = useMemo(() => semanas.flat(), [semanas]);

  // Estado de dias ativos (mapeado por string ISO "YYYY-MM-DD")
  const [diasAtivosMap, setDiasAtivosMap] = useState<Record<string, boolean>>({});
  // Estado dos horários granulares (mapeado por string ISO "YYYY-MM-DD")
  const [horariosMap, setHorariosMap] = useState<Record<string, string[]>>({});

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

        // Inicializa todas as datas como ativas com os horários padrão
        for (const data of todasDatas) {
          const strData = dataLocal(data);
          novosAtivos[strData] = true;
          novosHorarios[strData] = HORARIOS_DISPONIVEIS;
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
  }, [barbearia?.id, session?.user?.id, todasDatas]);

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

  function handleToggleDia(strData: string, valor: boolean) {
    setDiasAtivosMap((prev) => ({ ...prev, [strData]: valor }));
    if (valor && (!horariosMap[strData] || horariosMap[strData].length === 0)) {
      setHorariosMap((prev) => ({ ...prev, [strData]: HORARIOS_DISPONIVEIS }));
    }
  }

  function handleToggleHorario(strData: string, hora: string) {
    const listaAtual = horariosMap[strData] || [];
    let novaLista: string[];
    if (listaAtual.includes(hora)) {
      novaLista = listaAtual.filter((h) => h !== hora);
    } else {
      novaLista = [...listaAtual, hora].sort();
    }

    setHorariosMap((prev) => ({ ...prev, [strData]: novaLista }));
    setDiasAtivosMap((prev) => ({ ...prev, [strData]: novaLista.length > 0 }));
  }

  // ─── PRESETS RÁPIDOS ───
  function aplicarPreset(tipo: 'seg_sab' | 'ter_sab' | 'todos' | 'nenhum') {
    const novosAtivos: Record<string, boolean> = { ...diasAtivosMap };
    const novosHorarios: Record<string, string[]> = { ...horariosMap };

    for (const data of todasDatas) {
      const strData = dataLocal(data);
      const diaSemana = data.getDay(); // 0 = Dom, 1 = Seg, 2 = Ter, ...

      let ativo = false;
      if (tipo === 'todos') ativo = true;
      else if (tipo === 'seg_sab') ativo = diaSemana >= 1 && diaSemana <= 6; // Seg a Sáb
      else if (tipo === 'ter_sab') ativo = diaSemana >= 2 && diaSemana <= 6; // Ter a Sáb
      else if (tipo === 'nenhum') ativo = false;

      novosAtivos[strData] = ativo;
      if (ativo && (!novosHorarios[strData] || novosHorarios[strData].length === 0)) {
        novosHorarios[strData] = HORARIOS_DISPONIVEIS;
      }
    }

    setDiasAtivosMap(novosAtivos);
    setHorariosMap(novosHorarios);
  }

  // ─── SALVAR AGENDA (SEMANAL OU MÊS INTEIRO) ───
  async function salvar() {
    if (!session?.user?.id) {
      Alert.alert('Erro', 'Sessão não identificada. Faça login novamente.');
      return;
    }
    if (!barbearia?.id) {
      Alert.alert('Erro', 'Selecione uma barbearia ativa antes de salvar a agenda.');
      return;
    }
    setSalvando(true);

    try {
      // Constrói payload para cada semana
      const semanasPayload = semanas.map((semanaDatas) => {
        const inicioSemana = dataLocal(semanaDatas[0]);
        const fimSemana = dataLocal(semanaDatas[semanaDatas.length - 1]);

        const segundaAnterior = new Date(semanaDatas[0]);
        const aberturaProgramada = abrirImediatamente
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
          status: abrirImediatamente ? 'aberta' : 'programada',
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

      if (abrirImediatamente) {
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
        abrirImediatamente
          ? isModoMes
            ? 'Mês Inteiro Liberado com Sucesso! 🚀'
            : 'Agenda Liberada para os Clientes! 🚀'
          : 'Agenda Programada com Sucesso! 💈',
        abrirImediatamente
          ? `${totalVagas} vagas foram abertas no aplicativo para ${isModoMes ? 'os próximos 30 dias (Mês Inteiro)' : semanaOffset === 0 ? 'Esta Semana' : 'Próxima Semana'}. Os clientes já podem agendar!`
          : `A agenda foi programada com ${totalVagas} vagas no total e abrirá na segunda-feira às ${abertura}.`,
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

      {/* Seletor de Escopo: Esta Semana vs Próxima Semana vs Mês Inteiro */}
      <View style={[styles.semanaTabContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
        <TouchableOpacity
          style={[
            styles.semanaTab,
            semanaOffset === 0 && { backgroundColor: theme.ouro },
          ]}
          onPress={() => setSemanaOffset(0)}
          activeOpacity={0.8}
        >
          <Calendar size={13} color={semanaOffset === 0 ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
          <Text
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
            semanaOffset === 1 && { backgroundColor: theme.ouro },
          ]}
          onPress={() => setSemanaOffset(1)}
          activeOpacity={0.8}
        >
          <Calendar size={13} color={semanaOffset === 1 ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
          <Text
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
            semanaOffset === 2 && { backgroundColor: theme.ouro },
          ]}
          onPress={() => setSemanaOffset(2)}
          activeOpacity={0.8}
        >
          <Sparkles size={13} color={semanaOffset === 2 ? theme.textoEscuroSobreOuro : theme.ouroTexto} />
          <Text
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
                {isModoMes ? 'Mês Inteiro (Agenda Contínua)' : semanaOffset === 0 ? 'Esta Semana' : 'Próxima Semana'} ({totalVagas} vagas ativas)
              </Text>
              <Text style={[styles.resumoDescricao, { color: theme.textoSecundario }]}>
                {isModoMes
                  ? 'Libere os próximos 30 dias de uma vez só e desmarque facilmente os dias de folga.'
                  : 'Todos os 7 dias da semana (incluindo Segundas) podem ser ativados livremente.'}
              </Text>
            </View>
          </View>

          {/* Barra de Presets Rápidos */}
          <View style={styles.presetsContainer}>
            <Text style={[styles.presetsTitulo, { color: theme.textoSecundario }]}>⚡ PRÉ-CONFIGURAÇÕES RÁPIDAS</Text>
            <View style={styles.presetsLinha}>
              <TouchableOpacity
                style={[styles.presetChip, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={() => aplicarPreset('seg_sab')}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipTexto, { color: theme.textoPrimario }]}>Seg a Sáb</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetChip, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={() => aplicarPreset('ter_sab')}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipTexto, { color: theme.textoPrimario }]}>Ter a Sáb</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetChip, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={() => aplicarPreset('todos')}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipTexto, { color: theme.ouroTexto }]}>Todos (7 Dias)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetChip, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={() => aplicarPreset('nenhum')}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipTexto, { color: theme.textoDesabilitado }]}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BOX DE LIBERAÇÃO IMEDIATA */}
          <View style={[
            styles.boxAberturaImediata,
            { backgroundColor: theme.superficie, borderColor: theme.borda },
            abrirImediatamente && { borderColor: theme.verde, backgroundColor: isEscuro ? 'rgba(34, 197, 94, 0.08)' : '#F0FDF4' },
          ]}>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Zap size={16} color={abrirImediatamente ? theme.verde : theme.ouroTexto} />
                <Text style={[styles.boxAberturaImediataTitulo, { color: theme.textoPrimario }]}>
                  Liberar Imediatamente (Aberta Agora)
                </Text>
              </View>
              <Text style={[styles.boxAberturaImediataSub, { color: theme.textoSecundario }]}>
                {abrirImediatamente
                  ? 'Os horários ficarão ABERTOS agora para qualquer cliente agendar no aplicativo.'
                  : `A agenda ficará programada para abrir na segunda-feira às ${abertura}.`}
              </Text>
            </View>
            <Switch
              value={abrirImediatamente}
              onValueChange={setAbrirImediatamente}
              trackColor={{ false: theme.superficie2, true: theme.verde }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Lista de Semanas & Dias */}
          {semanas.map((semanaDatas, semIdx) => {
            const inicioSem = dataLocal(semanaDatas[0]);
            const fimSem = dataLocal(semanaDatas[semanaDatas.length - 1]);

            return (
              <View key={`semana-${semIdx}`} style={styles.blocoSemana}>
                {isModoMes && (
                  <View style={styles.semanaTituloContainer}>
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

                    return (
                      <View key={strData} style={[styles.diaContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
                        <View style={styles.diaCabecalho}>
                          <View style={styles.diaTexto}>
                            <Text style={[styles.diaNome, { color: theme.textoPrimario }]}>
                              {NOMES_DIAS[diaSemanaIdx]}
                            </Text>
                            <Text style={[styles.diaData, { color: theme.textoSecundario }]}>
                              {data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              {' · '}
                              <Text style={{ color: qtdVagasDia > 0 ? theme.verde : theme.textoDesabilitado }}>
                                {qtdVagasDia > 0 ? `${qtdVagasDia} vaga(s) ativa(s)` : 'Dia fechado / folga'}
                              </Text>
                            </Text>
                          </View>

                          <Switch
                            value={diaAberto}
                            onValueChange={(valor) => handleToggleDia(strData, valor)}
                            trackColor={{ false: theme.superficie2, true: theme.ouro }}
                            thumbColor="#FFFFFF"
                          />
                        </View>

                        {/* Grade de Horários Granulares do Dia */}
                        {diaAberto && (
                          <View style={styles.horariosGranularesGrid}>
                            {HORARIOS_DISPONIVEIS.map((hora) => {
                              const ativo = horasAtivas.includes(hora);
                              return (
                                <TouchableOpacity
                                  key={hora}
                                  style={[
                                    styles.chipHorario,
                                    { backgroundColor: theme.superficie2, borderColor: theme.borda },
                                    ativo && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                                  ]}
                                  onPress={() => handleToggleHorario(strData, hora)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[
                                    styles.chipHorarioTexto,
                                    { color: theme.textoSecundario },
                                    ativo && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                                  ]}>
                                    {hora}
                                  </Text>
                                  {ativo && <Check size={12} color={theme.textoEscuroSobreOuro} />}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Horário de Abertura Programada */}
          {!abrirImediatamente && (
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

          {/* Botão de Salvar */}
          <Botao
            label={
              salvando
                ? 'Salvando vagas...'
                : abrirImediatamente
                ? isModoMes
                  ? 'Liberar Mês Inteiro (30 Dias)'
                  : 'Liberar Agenda Imediatamente'
                : 'Programar e Ativar Agenda'
            }
            iconeEsquerda={<Save size={18} color="#FFFFFF" />}
            onPress={salvar}
            desabilitado={salvando || totalVagas === 0}
            estiloContainer={abrirImediatamente ? { ...styles.botaoSalvar, backgroundColor: theme.verde } : styles.botaoSalvar}
          />
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
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: Radii.md,
    },
    semanaTabTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
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
    presetsLinha: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    presetChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: Radii.md,
      borderWidth: 1,
    },
    presetChipTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 12,
    },
    boxAberturaImediata: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: Spacing.sm,
    },
    boxAberturaImediataTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
    },
    boxAberturaImediataSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      lineHeight: 16,
    },
    secaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      letterSpacing: 0.5,
      marginTop: Spacing.xs,
    },
    blocoSemana: {
      gap: Spacing.xs,
    },
    semanaTituloContainer: {
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    semanaTituloTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
      letterSpacing: 0.5,
    },
    diasLista: {
      gap: Spacing.sm,
    },
    diaContainer: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: Spacing.sm,
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
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    diaData: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
    },
    horariosGranularesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.borda,
    },
    chipHorario: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radii.sm,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    chipHorarioTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
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
      backgroundColor: theme.vermelho,
      marginTop: Spacing.xs,
    },
  });
