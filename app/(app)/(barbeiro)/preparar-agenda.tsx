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
import { ChevronLeft, Clock, Save, Sparkles, Check, Zap } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAgendaSemanal } from '@/hooks/useAgendaSemanal';
import { useBarbearia } from '@/contexts/BarbeariaContext';

const HORARIOS_DISPONIVEIS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const NOMES_DIAS = [
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

function proximaSemana() {
  const hoje = new Date();
  const distancia = hoje.getDay() === 0 ? 1 : 8 - hoje.getDay();
  const segunda = new Date(hoje);
  segunda.setHours(0, 0, 0, 0);
  segunda.setDate(hoje.getDate() + distancia);
  return Array.from({ length: 6 }, (_, index) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + index + 1);
    return data;
  });
}

function dataLocal(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export default function PrepararAgenda() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const { session } = useAuth();
  const { barbearia } = useBarbearia();
  const { carregarProximaParaBarbeiro } = useAgendaSemanal(barbearia?.id);
  const datas = useMemo(proximaSemana, []);

  // Estado dos dias (aberto / fechado)
  const [diasAtivos, setDiasAtivos] = useState<boolean[]>(Array(6).fill(true));
  // Estado dos horários granulares de cada dia (array de 6 listas de strings)
  const [horariosPorDia, setHorariosPorDia] = useState<string[][]>(
    Array(6).fill(HORARIOS_DISPONIVEIS)
  );

  const [abertura, setAbertura] = useState('19:30');
  const [abrirImediatamente, setAbrirImediatamente] = useState(true); // Padrão aberto imediatamente para facilidade de testes
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let montado = true;
    carregarProximaParaBarbeiro()
      .then(async (existente) => {
        if (!montado || !existente) return;
        const novosAtivos = datas.map((data) =>
          existente.dias.some((dia) => dia.data === dataLocal(data) && dia.ativo)
        );
        setDiasAtivos(novosAtivos);

        if (existente.status === 'aberta') {
          setAbrirImediatamente(true);
        }

        if (existente.data_abertura_programada) {
          const d = new Date(existente.data_abertura_programada);
          setAbertura(
            `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
          );
        }

        // Busca os slots já criados para refletir a seleção granular
        if (session?.user?.id && existente.id) {
          const { data: slotsExistentes } = await supabase
            .from('slots_agenda')
            .select('data_hora, ativo')
            .eq('barbeiro_id', session.user.id)
            .eq('ativo', true);

          if (slotsExistentes && slotsExistentes.length > 0) {
            const novosHorariosPorDia = datas.map((data) => {
              const strData = dataLocal(data);
              const horasAtivas = slotsExistentes
                .filter((s) => s.data_hora.startsWith(strData))
                .map((s) => {
                  const d = new Date(s.data_hora);
                  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                });
              return horasAtivas.length > 0 ? horasAtivas : HORARIOS_DISPONIVEIS;
            });
            setHorariosPorDia(novosHorariosPorDia);
          }
        }
      })
      .finally(() => {
        if (montado) setCarregandoDados(false);
      });

    return () => {
      montado = false;
    };
  }, [carregarProximaParaBarbeiro, datas, session?.user?.id]);

  // Contagem total de vagas selecionadas
  const totalVagas = useMemo(() => {
    return diasAtivos.reduce((total, ativo, index) => {
      if (!ativo) return total;
      return total + (horariosPorDia[index]?.length || 0);
    }, 0);
  }, [diasAtivos, horariosPorDia]);

  function handleToggleDia(index: number, valor: boolean) {
    setDiasAtivos((prev) => prev.map((item, i) => (i === index ? valor : item)));
    if (valor) {
      setHorariosPorDia((prev) =>
        prev.map((lista, i) => (i === index && lista.length === 0 ? HORARIOS_DISPONIVEIS : lista))
      );
    }
  }

  function handleToggleHorario(diaIndex: number, hora: string) {
    setHorariosPorDia((prev) => {
      const listaAtual = prev[diaIndex] || [];
      let novaLista: string[];
      if (listaAtual.includes(hora)) {
        novaLista = listaAtual.filter((h) => h !== hora);
      } else {
        novaLista = [...listaAtual, hora].sort();
      }

      if (novaLista.length === 0) {
        setDiasAtivos((dias) => dias.map((d, i) => (i === diaIndex ? false : d)));
      } else {
        setDiasAtivos((dias) => dias.map((d, i) => (i === diaIndex ? true : d)));
      }

      return prev.map((lista, i) => (i === diaIndex ? novaLista : lista));
    });
  }

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
      const inicioData = new Date(datas[0]);
      inicioData.setDate(inicioData.getDate() - 1); // Segunda-feira
      const inicio = dataLocal(inicioData);
      const fim = dataLocal(datas[datas.length - 1]); // Domingo

      const segundaAnterior = new Date(datas[0]);
      segundaAnterior.setDate(datas[0].getDate() - 1);
      const aberturaProgramada = abrirImediatamente
        ? new Date().toISOString()
        : new Date(`${dataLocal(segundaAnterior)}T${abertura}:00`).toISOString();

      // 1. Cria ou atualiza a agenda da semana
      const { data: agenda, error } = await supabase
        .from('agendas_semanais')
        .upsert(
          {
            barbearia_id: barbearia.id,
            barbeiro_id: session.user.id,
            data_inicio: inicio,
            data_fim: fim,
            status: abrirImediatamente ? 'aberta' : 'programada',
            data_abertura_programada: aberturaProgramada,
            notificar_abertura: true,
          },
          { onConflict: 'barbearia_id,barbeiro_id,data_inicio' }
        )
        .select('id')
        .single();

      if (error || !agenda) {
        throw new Error(error?.message || 'Erro ao criar agenda semanal.');
      }

      // 2. Remove dias antigos da agenda para recriação limpa
      await supabase.from('dias_agenda').delete().eq('agenda_semana_id', agenda.id);

      // 3. Insere os 6 dias da semana
      const dias = datas.map((data, index) => ({
        agenda_semana_id: agenda.id,
        data: dataLocal(data),
        ativo: diasAtivos[index] && (horariosPorDia[index]?.length || 0) > 0,
      }));

      const { data: diasCriados, error: erroDias } = await supabase
        .from('dias_agenda')
        .insert(dias)
        .select('id, data, ativo');

      if (erroDias || !diasCriados) {
        throw new Error(erroDias?.message || 'Erro ao salvar os dias da semana.');
      }

      // 4. Cria os slots da manhã apenas para os horários específicos que foram ativados
      const slots = diasCriados.flatMap((dia, diaIndex) => {
        if (!dia.ativo) return [];
        const horasEscolhidas = horariosPorDia[diaIndex] || [];
        return horasEscolhidas.map((hora) => ({
          barbearia_id: barbearia.id,
          dia_agenda_id: dia.id,
          barbeiro_id: session.user.id,
          data_hora: new Date(`${dia.data}T${hora}:00`).toISOString(),
          ativo: true,
        }));
      });

      const { error: erroSlots } = await supabase
        .from('slots_agenda')
        .upsert(slots, { onConflict: 'barbearia_id,barbeiro_id,data_hora' });

      if (erroSlots) {
        throw new Error(erroSlots.message);
      }

      if (abrirImediatamente) {
        await supabase.rpc('notificar_todos_clientes', {
          p_titulo: 'Agenda Semanal Aberta! 💈',
          p_mensagem: 'A agenda para a próxima semana está aberta! Garanta já seu horário no aplicativo.',
          p_tipo: 'abertura_agenda',
          p_dados: { data_inicio: inicio, data_fim: fim },
        });
      }

      Alert.alert(
        abrirImediatamente ? 'Agenda Liberada para os Clientes! 🚀' : 'Agenda Programada com Sucesso! 💈',
        abrirImediatamente
          ? `A agenda está ABERTA com ${totalVagas} vagas no total. Os clientes já podem escolher serviços e agendar no aplicativo.`
          : `A próxima semana está pronta com ${totalVagas} vagas no total e abrirá na segunda-feira às ${abertura}.`,
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

      {carregandoDados ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.ouro} />
          <Text style={[styles.loadingTexto, { color: theme.textoSecundario }]}>Carregando configuração da semana...</Text>
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
              <Text style={[styles.resumoTitulo, { color: theme.textoPrimario }]}>Próxima Semana ({totalVagas} vagas no total)</Text>
              <Text style={[styles.resumoDescricao, { color: theme.textoSecundario }]}>
                Você pode abrir/fechar o dia inteiro ou liberar apenas horários específicos pela manhã.
              </Text>
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
                  ? 'A agenda ficará ABERTA agora para qualquer cliente agendar.'
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

          {/* Seleção de Dias & Horários Granulares */}
          <Text style={[styles.secaoTitulo, { color: theme.textoSecundario }]}>DIAS & HORÁRIOS DE ATENDIMENTO</Text>
          <View style={styles.diasLista}>
            {datas.map((data, index) => {
              const diaAberto = diasAtivos[index];
              const horasAtivas = horariosPorDia[index] || [];
              const qtdVagasDia = diaAberto ? horasAtivas.length : 0;

              return (
                <View key={data.toISOString()} style={[styles.diaContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
                  <View style={styles.diaCabecalho}>
                    <View style={styles.diaTexto}>
                      <Text style={[styles.diaNome, { color: theme.textoPrimario }]}>{NOMES_DIAS[index]}</Text>
                      <Text style={[styles.diaData, { color: theme.textoSecundario }]}>
                        {data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        {' · '}
                        <Text style={{ color: qtdVagasDia > 0 ? theme.verde : theme.textoDesabilitado }}>
                          {qtdVagasDia > 0 ? `${qtdVagasDia} vaga(s) ativa(s)` : 'Dia fechado'}
                        </Text>
                      </Text>
                    </View>

                    <Switch
                      value={diaAberto}
                      onValueChange={(valor) => handleToggleDia(index, valor)}
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
                            onPress={() => handleToggleHorario(index, hora)}
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

          {/* Horário de Abertura na Segunda-feira (se não estiver aberta imediatamente) */}
          {!abrirImediatamente && (
            <>
              <Text style={[styles.secaoTitulo, { color: theme.textoSecundario }]}>HORÁRIO DE ABERTURA NA SEGUNDA</Text>
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
                ? 'Salvando agenda...'
                : abrirImediatamente
                ? 'Liberar Agenda Imediatamente'
                : 'Programar e Ativar Agenda'
            }
            iconeEsquerda={<Save size={18} color="#FFFFFF" />}
            onPress={salvar}
            desabilitado={salvando || totalVagas === 0}
            estiloContainer={abrirImediatamente ? { ...styles.botaoSalvar, backgroundColor: Colors.verde } : styles.botaoSalvar}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  botaoVoltar: {
    padding: 4,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
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
    color: Colors.textoSecundario,
  },
  resumoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    ...Shadows.card,
  },
  resumoIconeWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
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
    color: Colors.textoPrimario,
  },
  resumoDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    lineHeight: 16,
  },
  boxAberturaImediata: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: Spacing.sm,
  },
  boxAberturaImediataAtiva: {
    borderColor: 'rgba(61, 191, 106, 0.4)',
    backgroundColor: 'rgba(61, 191, 106, 0.08)',
  },
  boxAberturaImediataTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
  },
  boxAberturaImediataSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    lineHeight: 16,
  },
  secaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  diasLista: {
    gap: Spacing.sm,
  },
  diaContainer: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
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
    color: Colors.textoPrimario,
  },
  diaData: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  horariosGranularesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borda,
  },
  chipHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.superficie2,
    borderWidth: 1,
    borderColor: Colors.bordaDestaque,
  },
  chipHorarioAtivo: {
    backgroundColor: Colors.vermelho,
    borderColor: Colors.vermelho,
  },
  chipHorarioTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  chipHorarioTextoAtivo: {
    fontFamily: FontFamily.bold,
    color: Colors.textoPrimario,
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
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  horaBotaoAtivo: {
    backgroundColor: Colors.vermelho,
    borderColor: Colors.vermelho,
  },
  horaTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  horaTextoAtivo: {
    fontFamily: FontFamily.bold,
    color: Colors.textoPrimario,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(203, 161, 74, 0.1)',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.25)',
  },
  infoTexto: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
    lineHeight: 16,
  },
  botaoSalvar: {
    backgroundColor: Colors.vermelho,
    marginTop: Spacing.xs,
  },
});
