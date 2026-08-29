import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  BellRing,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Scissors,
  CheckCircle2,
} from 'lucide-react-native';
import { Botao, IlustracaoServico } from '@/components';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows, type ThemePalette } from '@/theme';
import { useServicos, type Servico } from '@/hooks/useServicos';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

const DIAS_CONFIG = [
  { id: 2, nomeCurto: 'Ter', nomeCompleto: 'Terça-feira' },
  { id: 3, nomeCurto: 'Qua', nomeCompleto: 'Quarta-feira' },
  { id: 4, nomeCurto: 'Qui', nomeCompleto: 'Quinta-feira' },
  { id: 5, nomeCurto: 'Sex', nomeCompleto: 'Sexta-feira' },
  { id: 6, nomeCurto: 'Sáb', nomeCompleto: 'Sábado' },
  { id: 0, nomeCurto: 'Dom', nomeCompleto: 'Domingo' },
];

const HORARIOS_CONFIG = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function TelaListaEspera() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuth();
  const { barbearia } = useBarbearia();
  const { todosServicos, carregando: carregandoServicos } = useServicos('todos', barbearia?.id);

  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([2, 3, 4, 5, 6, 0]);
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>(HORARIOS_CONFIG);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!servicoSelecionado && todosServicos.length > 0) {
      setServicoSelecionado(todosServicos[0]);
    }
  }, [todosServicos, servicoSelecionado]);

  function alternarDia(diaId: number) {
    if (diasSelecionados.includes(diaId)) {
      if (diasSelecionados.length === 1) {
        Alert.alert('Atenção', 'Selecione pelo menos um dia de preferência.');
        return;
      }
      setDiasSelecionados(diasSelecionados.filter((id) => id !== diaId));
    } else {
      setDiasSelecionados([...diasSelecionados, diaId]);
    }
  }

  function alternarHorario(hora: string) {
    if (horariosSelecionados.includes(hora)) {
      if (horariosSelecionados.length === 1) {
        Alert.alert('Atenção', 'Selecione pelo menos um horário.');
        return;
      }
      setHorariosSelecionados(horariosSelecionados.filter((h) => h !== hora));
    } else {
      setHorariosSelecionados([...horariosSelecionados, hora]);
    }
  }

  function selecionarTodosDias() {
    setDiasSelecionados([2, 3, 4, 5, 6, 0]);
  }

  function selecionarFimDeSemana() {
    setDiasSelecionados([6, 0]);
  }

  function selecionarDiasUteis() {
    setDiasSelecionados([2, 3, 4, 5]);
  }

  function selecionarTodosHorarios() {
    setHorariosSelecionados(HORARIOS_CONFIG);
  }

  async function handleEntrarNaFila() {
    if (!session?.user?.id) {
      Alert.alert('Login necessário', 'Você precisa estar logado para entrar na lista de espera.');
      return;
    }

    if (!servicoSelecionado) {
      Alert.alert('Selecione um serviço', 'Por favor, escolha qual serviço você deseja realizar.');
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.from('fila_espera').insert({
        cliente_id: session.user.id,
        servico_id: servicoSelecionado.id,
        barbearia_id: barbearia?.id ?? null,
        dias_preferidos: diasSelecionados,
        horarios_preferidos: horariosSelecionados,
      });

      if (error) {
        Alert.alert('Erro', error.message);
      } else {
        Alert.alert(
          'Você está na Lista de Espera! 💈',
          `Assim que surgir uma vaga para ${servicoSelecionado.nome} nos dias e horários escolhidos, você receberá uma notificação prioritária no seu celular.`,
          [{ text: 'Entendido', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Erro ao salvar', err.message || 'Tente novamente mais tarde.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVoltar} activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.textoPrimario} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Lista de Espera</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Informativo Principal */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconeBadge}>
            <BellRing size={24} color={theme.ouro} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitulo}>Avise-me se abrir uma vaga</Text>
            <Text style={styles.heroSubtitulo}>
              Não encontrou o horário desejado? Escolha seus dias e períodos livres. Se alguém cancelar ou surgir um encaixe, você será avisado instantaneamente!
            </Text>
          </View>
        </View>

        {/* 1. Escolha do Serviço */}
        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoNumero}>1</Text>
            <Text style={styles.secaoTitulo}>Qual serviço você deseja?</Text>
          </View>

          {carregandoServicos ? (
            <ActivityIndicator size="small" color={theme.ouro} style={{ marginVertical: 12 }} />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {/* Carrossel Horizontal */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.servicosHorizontalScroll}
              >
                {todosServicos.map((item) => {
                  const selecionado = servicoSelecionado?.id === item.id;
                  const precoFmt = Number(item.preco).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  });
                  const ehCombo = item.categoria === 'combos' || item.nome.toLowerCase().includes('combo');

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.cardServicoMini, selecionado && styles.cardServicoMiniAtivo]}
                      onPress={() => setServicoSelecionado(item)}
                      activeOpacity={0.75}
                    >
                      <IlustracaoServico id={item.id} nome={item.nome} tamanho={42} />
                      <View style={styles.cardServicoMiniCabecalho}>
                        <Text
                          style={[styles.cardServicoNome, selecionado && styles.cardServicoNomeAtivo]}
                          numberOfLines={2}
                        >
                          {item.nome}
                        </Text>
                        {ehCombo && (
                          <View style={styles.badgeVipMini}>
                            <Sparkles size={8} color={theme.ouro} />
                            <Text style={styles.badgeVipMiniTexto}>VIP</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardServicoPreco}>{precoFmt}</Text>
                      {selecionado && (
                        <View style={styles.checkFlutuante}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Card de Prévia / Resumo do Serviço Selecionado */}
              {servicoSelecionado && (
                <View style={styles.cardPrevia}>
                  <View style={styles.cardPreviaCabecalho}>
                    <Sparkles size={13} color={theme.ouro} />
                    <Text style={styles.cardPreviaRotulo}>Serviço Selecionado</Text>
                  </View>

                  <View style={styles.cardPreviaCorpo}>
                    <IlustracaoServico
                      id={servicoSelecionado.id}
                      nome={servicoSelecionado.nome}
                      categoria={servicoSelecionado.categoria}
                      tamanho={48}
                    />

                    <View style={styles.cardPreviaInfo}>
                      <View style={styles.cardPreviaTituloLinha}>
                        <Text style={styles.cardPreviaNome}>{servicoSelecionado.nome}</Text>
                        {(servicoSelecionado.categoria === 'combos' ||
                          servicoSelecionado.nome.toLowerCase().includes('combo')) && (
                          <View style={styles.badgeVip}>
                            <Sparkles size={9} color={theme.ouro} />
                            <Text style={styles.badgeVipTexto}>VIP</Text>
                          </View>
                        )}
                      </View>

                      {/* Se for combo com múltiplos itens, exibe as tags */}
                      {servicoSelecionado.descricao && servicoSelecionado.descricao.includes('+') ? (
                        <View style={styles.comboTagsContainer}>
                          {servicoSelecionado.descricao
                            .split('+')
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((tag, idx) => (
                              <View key={idx} style={styles.comboTagPill}>
                                <Text style={styles.comboTagTexto}>✓ {tag}</Text>
                              </View>
                            ))}
                        </View>
                      ) : servicoSelecionado.descricao ? (
                        <Text style={styles.cardPreviaDescricao}>{servicoSelecionado.descricao}</Text>
                      ) : null}
                    </View>

                    <View style={styles.cardPreviaPrecoContainer}>
                      <Text style={styles.cardPreviaPreco}>
                        {Number(servicoSelecionado.preco).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 2. Dias de Preferência */}
        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoNumero}>2</Text>
            <Text style={styles.secaoTitulo}>Quais dias você pode comparecer?</Text>
          </View>

          {/* Atalhos rápidos */}
          <View style={styles.atalhosRow}>
            <TouchableOpacity
              style={[
                styles.btnAtalho,
                diasSelecionados.length === 6 && styles.btnAtalhoAtivo,
              ]}
              onPress={selecionarTodosDias}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnAtalhoTexto, diasSelecionados.length === 6 && styles.btnAtalhoTextoAtivo]}>
                Todos os dias
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnAtalho,
                diasSelecionados.length === 4 && !diasSelecionados.includes(6) && !diasSelecionados.includes(0) && styles.btnAtalhoAtivo,
              ]}
              onPress={selecionarDiasUteis}
              activeOpacity={0.7}
            >
              <Text style={styles.btnAtalhoTexto}>Ter a Sex</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnAtalho,
                diasSelecionados.length === 2 && diasSelecionados.includes(6) && diasSelecionados.includes(0) && styles.btnAtalhoAtivo,
              ]}
              onPress={selecionarFimDeSemana}
              activeOpacity={0.7}
            >
              <Text style={styles.btnAtalhoTexto}>Fim de semana</Text>
            </TouchableOpacity>
          </View>

          {/* Grade de Dias */}
          <View style={styles.diasGrid}>
            {DIAS_CONFIG.map((dia) => {
              const ativo = diasSelecionados.includes(dia.id);
              return (
                <TouchableOpacity
                  key={dia.id}
                  style={[styles.diaCard, ativo && styles.diaCardAtivo]}
                  onPress={() => alternarDia(dia.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.diaCheck, ativo && styles.diaCheckAtivo]}>
                    {ativo && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.diaTexto, ativo && styles.diaTextoAtivo]}>
                    {dia.nomeCurto}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Horários da Manhã */}
        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoNumero}>3</Text>
            <Text style={styles.secaoTitulo}>Quais horários da manhã você prefere?</Text>
          </View>

          <View style={styles.atalhosRow}>
            <TouchableOpacity
              style={[
                styles.btnAtalho,
                horariosSelecionados.length === 4 && styles.btnAtalhoAtivo,
              ]}
              onPress={selecionarTodosHorarios}
              activeOpacity={0.7}
            >
              <Clock size={12} color={theme.ouro} />
              <Text style={[styles.btnAtalhoTexto, horariosSelecionados.length === 4 && styles.btnAtalhoTextoAtivo]}>
                Qualquer horário da manhã (08h às 12h)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.horariosGrid}>
            {HORARIOS_CONFIG.map((hora) => {
              const ativo = horariosSelecionados.includes(hora);
              return (
                <TouchableOpacity
                  key={hora}
                  style={[styles.horarioCard, ativo && styles.horarioCardAtivo]}
                  onPress={() => alternarHorario(hora)}
                  activeOpacity={0.7}
                >
                  <Clock size={14} color={ativo ? theme.ouro : theme.textoSecundario} />
                  <Text style={[styles.horarioTexto, ativo && styles.horarioTextoAtivo]}>
                    {hora}
                  </Text>
                  {ativo && (
                    <View style={styles.horarioCheckMini}>
                      <Check size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card Como Funciona */}
        <View style={styles.infoCard}>
          <CheckCircle2 size={18} color={theme.verde} />
          <Text style={styles.infoTexto}>
            A entrada na fila é 100% gratuita. Você só paga pelo corte no momento do atendimento.
          </Text>
        </View>

        {/* Botão de Ação */}
        <Botao
          label={salvando ? 'Salvando...' : 'Entrar na Lista de Espera 💈'}
          onPress={handleEntrarNaFila}
          desabilitado={salvando || !servicoSelecionado}
          estiloContainer={styles.btnSalvar}
        />
      </ScrollView>
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
    headerTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
      color: theme.textoPrimario,
    },
    scroll: {
      padding: Spacing.telaH,
      paddingBottom: Spacing.giant,
      gap: Spacing.lg,
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
      ...Shadows.card,
    },
    heroIconeBadge: {
      width: 44,
      height: 44,
      borderRadius: Radii.md,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    heroInfo: {
      flex: 1,
      gap: 3,
    },
    heroTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyLg,
      color: theme.textoPrimario,
    },
    heroSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
      lineHeight: 18,
    },
    secao: {
      gap: Spacing.sm,
    },
    secaoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    secaoNumero: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.ouro,
      color: theme.textoEscuroSobreOuro,
      fontFamily: FontFamily.bold,
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 22,
    },
    secaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    servicosHorizontalScroll: {
      gap: Spacing.xs,
      paddingVertical: 4,
    },
    cardServicoMini: {
      width: 132,
      minHeight: 122,
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      padding: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      borderWidth: 1,
      borderColor: theme.borda,
      position: 'relative',
    },
    cardServicoMiniAtivo: {
      borderColor: theme.ouro,
      backgroundColor: theme.superficie2,
    },
    cardServicoMiniCabecalho: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      width: '100%',
    },
    cardServicoNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11,
      color: theme.textoPrimario,
      textAlign: 'center',
      lineHeight: 14,
    },
    cardServicoNomeAtivo: {
      color: theme.ouroTexto,
      fontFamily: FontFamily.bold,
    },
    cardServicoPreco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.ouroTexto,
    },
    badgeVipMini: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    badgeVipMiniTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 7,
      color: theme.ouroTexto,
    },
    badgeVip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    badgeVipTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 8,
      color: theme.ouroTexto,
    },
    checkFlutuante: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.ouro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardPrevia: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
      gap: Spacing.xs,
      ...Shadows.card,
    },
    cardPreviaCabecalho: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    cardPreviaRotulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: theme.ouroTexto,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    cardPreviaCorpo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    cardPreviaInfo: {
      flex: 1,
      gap: 3,
    },
    cardPreviaTituloLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    cardPreviaNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    cardPreviaDescricao: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      lineHeight: 16,
    },
    comboTagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginVertical: 2,
    },
    comboTagPill: {
      backgroundColor: theme.superficie2,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    comboTagTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 10,
      color: theme.ouroTexto,
    },
    cardPreviaPrecoContainer: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    cardPreviaPreco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
      color: theme.ouroTexto,
    },
    atalhosRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    btnAtalho: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: Radii.full,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    btnAtalhoAtivo: {
      backgroundColor: theme.ouroTranslucido,
      borderColor: theme.ouro,
    },
    btnAtalhoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
    },
    btnAtalhoTextoAtivo: {
      color: theme.ouroTexto,
      fontFamily: FontFamily.bold,
    },
    diasGrid: {
      flexDirection: 'row',
      gap: Spacing.xs,
      justifyContent: 'space-between',
    },
    diaCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: 6,
    },
    diaCardAtivo: {
      backgroundColor: theme.superficie2,
      borderColor: theme.ouro,
    },
    diaCheck: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.superficie2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    diaCheckAtivo: {
      backgroundColor: theme.ouro,
    },
    diaTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    diaTextoAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoPrimario,
    },
    horariosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    horarioCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
      minWidth: '48%',
      flex: 1,
    },
    horarioCardAtivo: {
      backgroundColor: theme.superficie2,
      borderColor: theme.ouro,
    },
    horarioTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyMd,
      color: theme.textoSecundario,
    },
    horarioTextoAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoPrimario,
    },
    horarioCheckMini: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.ouro,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.verdeClaro,
      borderRadius: Radii.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.verde,
    },
    infoTexto: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
      lineHeight: 18,
    },
    btnSalvar: {
      width: '100%',
      marginTop: Spacing.xs,
    },
  });
