import React, { useEffect, useState } from 'react';
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
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { useServicos, type Servico } from '@/hooks/useServicos';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useBarbearia } from '@/contexts/BarbeariaContext';

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
          <ChevronLeft size={24} color={Colors.textoPrimario} />
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
            <BellRing size={24} color={Colors.ouro} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitulo}>Avise-me se abrir uma vaga</Text>
            <Text style={styles.heroSubtitulo}>
              Não encontrou o horário desejado? Escolha seus dias e períodos livres. Se alguém cancelar ou surgir um encaixe, você será avisado instantaneamente!
            </Text>
          </View>
        </View>

        {/* 1. Escolha do Serviço (Opção C: Carrossel Horizontal + Card de Prévia Detalhado) */}
        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoNumero}>1</Text>
            <Text style={styles.secaoTitulo}>Qual serviço você deseja?</Text>
          </View>

          {carregandoServicos ? (
            <ActivityIndicator size="small" color={Colors.ouro} style={{ marginVertical: 12 }} />
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
                            <Sparkles size={8} color={Colors.ouro} />
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

              {/* Card de Prévia / Resumo do Serviço Selecionado (Opção C) */}
              {servicoSelecionado && (
                <View style={styles.cardPrevia}>
                  <View style={styles.cardPreviaCabecalho}>
                    <Sparkles size={13} color={Colors.ouro} />
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
                            <Sparkles size={9} color={Colors.ouro} />
                            <Text style={styles.badgeVipTexto}>VIP</Text>
                          </View>
                        )}
                      </View>

                      {/* Se for combo com múltiplos itens, exibe as tags sem cortes */}
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
              <Clock size={12} color={Colors.ouro} />
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
                  <Clock size={14} color={ativo ? Colors.ouro : Colors.textoSecundario} />
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
          <CheckCircle2 size={18} color={Colors.verde} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  btnVoltar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
  },
  headerTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
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
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.35)',
    ...Shadows.card,
  },
  heroIconeBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
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
    color: '#FFFFFF',
  },
  heroSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoDesabilitado,
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
    backgroundColor: Colors.ouro,
    color: Colors.textoEscuroSobreOuro,
    fontFamily: FontFamily.bold,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 22,
  },
  secaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  servicosHorizontalScroll: {
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  cardServicoMini: {
    width: 132,
    minHeight: 122,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borda,
    position: 'relative',
  },
  cardServicoMiniAtivo: {
    borderColor: Colors.ouro,
    backgroundColor: Colors.superficie2,
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
    color: Colors.textoPrimario,
    textAlign: 'center',
    lineHeight: 14,
  },
  cardServicoNomeAtivo: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
  },
  cardServicoPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  badgeVipMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.ouro,
  },
  badgeVipMiniTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 7,
    color: Colors.ouro,
  },
  badgeVip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.ouro,
  },
  badgeVipTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: Colors.ouro,
  },
  checkFlutuante: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPrevia: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
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
    color: Colors.ouro,
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
    color: '#FFFFFF',
  },
  cardPreviaDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    lineHeight: 16,
  },
  comboTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 2,
  },
  comboTagPill: {
    backgroundColor: 'rgba(203, 161, 74, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.25)',
  },
  comboTagTexto: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.ouroClaro,
  },
  cardPreviaPrecoContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cardPreviaPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.ouro,
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
    backgroundColor: Colors.superficie2,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  btnAtalhoAtivo: {
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    borderColor: Colors.ouro,
  },
  btnAtalhoTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  btnAtalhoTextoAtivo: {
    color: Colors.ouro,
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
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    gap: 6,
  },
  diaCardAtivo: {
    backgroundColor: Colors.superficie2,
    borderColor: Colors.ouro,
  },
  diaCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaCheckAtivo: {
    backgroundColor: Colors.ouro,
  },
  diaTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  diaTextoAtivo: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
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
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    minWidth: '48%',
    flex: 1,
  },
  horarioCardAtivo: {
    backgroundColor: Colors.superficie2,
    borderColor: Colors.ouro,
  },
  horarioTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  horarioTextoAtivo: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  horarioCheckMini: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(61, 191, 106, 0.1)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(61, 191, 106, 0.25)',
  },
  infoTexto: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    lineHeight: 18,
  },
  btnSalvar: {
    width: '100%',
    marginTop: Spacing.xs,
  },
});
