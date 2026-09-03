import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  Sliders,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Search,
  Check,
  X,
  Trash2,
  CheckCircle,
  Bell,
  Ban,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Plus,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { Botao } from '@/components';

interface UsuarioBusca {
  id: string;
  nome_completo: string | null;
  email: string | null;
  telefone: string | null;
  role: string;
}

interface BloqueioCliente {
  id: string;
  cliente_id: string | null;
  email: string | null;
  telefone: string | null;
  motivo: string | null;
  criado_em: string;
}

export default function TelaOpcoesAvancadas() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;
  const { barbearia, selecionarBarbearia } = useBarbearia();

  // Estados de Regras e Comissões
  const [modoAgenda, setModoAgenda] = useState<'continua' | 'drops'>(
    (barbearia?.modo_agenda as 'continua' | 'drops') || 'continua'
  );
  const [modoDuracao, setModoDuracao] = useState<'fixo_1h' | 'tempo_servico'>(
    (barbearia?.modo_duracao as 'fixo_1h' | 'tempo_servico') || 'fixo_1h'
  );
  const [stepAgendamento, setStepAgendamento] = useState<number>(
    barbearia?.step_agendamento_min || 30
  );
  const [intervaloDescanso, setIntervaloDescanso] = useState<number>(
    barbearia?.intervalo_descanso_min || 0
  );
  const [diasJanela, setDiasJanela] = useState<number>(
    barbearia?.dias_janela_agendamento || 14
  );
  const [comissaoPadrao, setComissaoPadrao] = useState<string>(
    barbearia?.comissao_padrao !== undefined ? String(barbearia.comissao_padrao) : '50'
  );

  // Fidelidade
  const [fidelidadeAtiva, setFidelidadeAtiva] = useState<boolean>(
    barbearia?.regras_fidelidade?.ativo ?? false
  );
  const [metaCortesFidelidade, setMetaCortesFidelidade] = useState<string>(
    barbearia?.regras_fidelidade?.meta_cortes ? String(barbearia.regras_fidelidade.meta_cortes) : '10'
  );
  const [recompensaFidelidade, setRecompensaFidelidade] = useState<string>(
    barbearia?.regras_fidelidade?.recompensa || 'Corte ou Barba Grátis'
  );

  // Mimos
  const [mimoAtivo, setMimoAtivo] = useState<boolean>(barbearia?.mimo_ativo?.ativo ?? true);
  const [mimoTipo, setMimoTipo] = useState<'upgrade' | 'desconto' | 'brinde'>(
    barbearia?.mimo_ativo?.tipo || 'upgrade'
  );
  const [mimoTitulo, setMimoTitulo] = useState<string>(
    barbearia?.mimo_ativo?.titulo || 'Corte Ganha Sobrancelha Grátis 🎁'
  );
  const [mimoDescricao, setMimoDescricao] = useState<string>(
    barbearia?.mimo_ativo?.descricao || 'Agende seu corte e ganhe o design de sobrancelha como cortesia da barbearia!'
  );
  const [mimoValidade, setMimoValidade] = useState<string>(
    barbearia?.mimo_ativo?.validade_dias ? String(barbearia.mimo_ativo.validade_dias) : '7'
  );

  // Horários de Funcionamento Padrão da Barbearia
  const [horarioInicio, setHorarioInicio] = useState<string>(
    barbearia?.horario_funcionamento_padrao?.inicio || '08:00'
  );
  const [horarioFim, setHorarioFim] = useState<string>(
    barbearia?.horario_funcionamento_padrao?.fim || '20:00'
  );
  const [temIntervalo, setTemIntervalo] = useState<boolean>(
    barbearia?.horario_funcionamento_padrao?.tem_intervalo ?? false
  );
  const [intervaloInicio, setIntervaloInicio] = useState<string>(
    barbearia?.horario_funcionamento_padrao?.intervalo_inicio || '12:00'
  );
  const [intervaloFim, setIntervaloFim] = useState<string>(
    barbearia?.horario_funcionamento_padrao?.intervalo_fim || '13:00'
  );
  const [turnosPadrao, setTurnosPadrao] = useState<Array<'manha' | 'tarde' | 'noite'>>(
    barbearia?.horario_funcionamento_padrao?.turnos_padrao || ['manha', 'tarde', 'noite']
  );
  const [diasPadrao, setDiasPadrao] = useState<'seg_sex' | 'seg_sab' | 'ter_dom' | 'todos'>(
    barbearia?.horario_funcionamento_padrao?.dias_padrao || 'seg_sab'
  );

  const [disparandoPush, setDisparandoPush] = useState(false);
  const [salvandoRegras, setSalvandoRegras] = useState(false);

  // Bloqueios
  const [bloqueados, setBloqueados] = useState<BloqueioCliente[]>([]);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [buscaBloqueio, setBuscaBloqueio] = useState('');
  const [usuariosParaBloqueio, setUsuariosParaBloqueio] = useState<UsuarioBusca[]>([]);
  const [buscandoBloqueio, setBuscandoBloqueio] = useState(false);
  const [clienteSelecionadoParaBloqueio, setClienteSelecionadoParaBloqueio] = useState<UsuarioBusca | null>(null);
  const [bloqueioNome, setBloqueioNome] = useState('');
  const [bloqueioEmail, setBloqueioEmail] = useState('');
  const [bloqueioTelefone, setBloqueioTelefone] = useState('');
  const [bloqueioMotivo, setBloqueioMotivo] = useState('🚫 Falta recorrente (No-show)');
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);

  // Sincroniza dados da barbearia
  useEffect(() => {
    if (!barbearia) return;
    if (barbearia.modo_agenda) setModoAgenda(barbearia.modo_agenda);
    const modoDuracaoDetectado =
      barbearia.modo_duracao || (barbearia.regras_fidelidade as any)?.modo_duracao || 'fixo_1h';
    const stepDetectado =
      barbearia.step_agendamento_min || (barbearia.regras_fidelidade as any)?.step_agendamento_min || 30;
    const intervaloDetectado =
      barbearia.intervalo_descanso_min !== undefined
        ? barbearia.intervalo_descanso_min
        : ((barbearia.regras_fidelidade as any)?.intervalo_descanso_min ?? 0);

    setModoDuracao(modoDuracaoDetectado);
    setStepAgendamento(stepDetectado);
    setIntervaloDescanso(intervaloDetectado);

    if (barbearia.dias_janela_agendamento) setDiasJanela(barbearia.dias_janela_agendamento);

    if (barbearia.regras_fidelidade) {
      setFidelidadeAtiva(barbearia.regras_fidelidade.ativo);
      setMetaCortesFidelidade(String(barbearia.regras_fidelidade.meta_cortes));
      setRecompensaFidelidade(barbearia.regras_fidelidade.recompensa);
    }
    if (barbearia.mimo_ativo) {
      setMimoAtivo(barbearia.mimo_ativo.ativo);
      setMimoTipo(barbearia.mimo_ativo.tipo);
      setMimoTitulo(barbearia.mimo_ativo.titulo);
      setMimoDescricao(barbearia.mimo_ativo.descricao);
      setMimoValidade(String(barbearia.mimo_ativo.validade_dias));
    }
    if (barbearia.horario_funcionamento_padrao) {
      setHorarioInicio(barbearia.horario_funcionamento_padrao.inicio || '08:00');
      setHorarioFim(barbearia.horario_funcionamento_padrao.fim || '20:00');
      setTemIntervalo(barbearia.horario_funcionamento_padrao.tem_intervalo ?? false);
      setIntervaloInicio(barbearia.horario_funcionamento_padrao.intervalo_inicio || '12:00');
      setIntervaloFim(barbearia.horario_funcionamento_padrao.intervalo_fim || '13:00');
      setTurnosPadrao(barbearia.horario_funcionamento_padrao.turnos_padrao || ['manha', 'tarde', 'noite']);
      setDiasPadrao(barbearia.horario_funcionamento_padrao.dias_padrao || 'seg_sab');
    }
  }, [barbearia]);

  // Carrega bloqueios de clientes
  const carregarBloqueios = useCallback(async () => {
    if (!barbeiroId) return;
    try {
      const { data } = await supabase
        .from('bloqueios_clientes')
        .select('*')
        .eq('barbeiro_id', barbeiroId)
        .order('criado_em', { ascending: false });
      if (data) setBloqueados(data as BloqueioCliente[]);
    } catch {
      // silencioso
    }
  }, [barbeiroId]);

  useEffect(() => {
    carregarBloqueios();
  }, [carregarBloqueios]);

  async function buscarUsuariosParaBloqueio(termo: string) {
    setBuscaBloqueio(termo);
    const termoLimpo = termo.trim().toLowerCase();
    if (!termoLimpo || termoLimpo.length < 2) {
      setUsuariosParaBloqueio([]);
      return;
    }
    setBuscandoBloqueio(true);
    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_completo, email, telefone, role')
        .or(`nome_completo.ilike.%${termoLimpo}%,email.ilike.%${termoLimpo}%,telefone.ilike.%${termoLimpo}%`)
        .limit(10);
      if (error) throw error;
      setUsuariosParaBloqueio(data || []);
    } catch {
      setUsuariosParaBloqueio([]);
    } finally {
      setBuscandoBloqueio(false);
    }
  }

  // ─── AÇÕES DE REGRAS ───
  async function salvarRegras() {
    if (!barbearia) return;
    setSalvandoRegras(true);

    const comissaoNum = barbearia.comissao_padrao !== undefined ? barbearia.comissao_padrao : 50;
    const metaCortesNum = Number(metaCortesFidelidade) || 10;
    const validadeNum = Number(mimoValidade) || 7;

    const fidelidadePayload: any = {
      ativo: fidelidadeAtiva,
      meta_cortes: metaCortesNum,
      recompensa: recompensaFidelidade.trim() || 'Corte Grátis',
      modo_duracao: modoDuracao,
      step_agendamento_min: stepAgendamento,
      intervalo_descanso_min: intervaloDescanso,
    };

    const dadosAtualizacao: any = {
      modo_agenda: modoAgenda,
      dias_janela_agendamento: diasJanela,
      comissao_padrao: comissaoNum,
      regras_fidelidade: fidelidadePayload,
      mimo_ativo: {
        ativo: mimoAtivo,
        tipo: mimoTipo,
        titulo: mimoTitulo.trim() || 'Mimo Especial',
        descricao: mimoDescricao.trim() || 'Resgate seu mimo no próximo agendamento.',
        validade_dias: validadeNum,
      },
    };

    try {
      const { error } = await supabase
        .from('barbearias')
        .update({
          ...dadosAtualizacao,
          atualizado_em: new Date().toISOString(),
        } as any)
        .eq('id', barbearia.id);
      if (error) throw error;
    } catch (error) {
      setSalvandoRegras(false);
      Alert.alert('Erro ao salvar regras', error instanceof Error ? error.message : 'Tente novamente.');
      return;
    }

    await selecionarBarbearia({
      ...barbearia,
      ...dadosAtualizacao,
      modo_duracao: modoDuracao,
      step_agendamento_min: stepAgendamento,
      intervalo_descanso_min: intervaloDescanso,
    });

    setSalvandoRegras(false);
    Alert.alert('Regras Atualizadas! 💈', 'O modo de funcionamento, comissões e mimos foram salvos com sucesso.');
  }

  async function handleDispararPushMimo() {
    if (!barbearia?.id) return;
    setDisparandoPush(true);
    try {
      const { data, error } = await supabase.rpc('disparar_mimos_reativacao', {
        p_barbearia_id: barbearia.id,
      });
      if (error) throw error;
      Alert.alert('Notificações Enviadas! 🔔', `${data ?? 0} cliente(s) recebeu(ram) o mimo por notificação in-app.`);
    } catch (error) {
      Alert.alert('Erro ao disparar mimo', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setDisparandoPush(false);
    }
  }

  // ─── AÇÕES DE BLOQUEIO ───
  async function salvarNovoBloqueio() {
    if (!barbeiroId) return;
    const emailFinal = clienteSelecionadoParaBloqueio?.email || bloqueioEmail.trim() || null;
    const telefoneFinal = clienteSelecionadoParaBloqueio?.telefone || bloqueioTelefone.trim() || null;
    const nomeFinal = clienteSelecionadoParaBloqueio?.nome_completo || bloqueioNome.trim() || null;

    if (!nomeFinal && !emailFinal && !telefoneFinal) {
      Alert.alert('Atenção', 'Pesquise e selecione um cliente ou informe telefone/e-mail para bloquear.');
      return;
    }

    setSalvandoBloqueio(true);
    try {
      const { error } = await supabase.from('bloqueios_clientes').insert({
        barbeiro_id: barbeiroId,
        barbearia_id: barbearia?.id || null,
        cliente_id: clienteSelecionadoParaBloqueio?.id || null,
        email: emailFinal,
        telefone: telefoneFinal,
        motivo: bloqueioMotivo.trim() || 'Falta recorrente ou conduta inadequada',
      });

      if (error) throw error;

      setModalBloqueioAberto(false);
      setClienteSelecionadoParaBloqueio(null);
      setBuscaBloqueio('');
      setUsuariosParaBloqueio([]);
      setBloqueioNome('');
      setBloqueioEmail('');
      setBloqueioTelefone('');
      setBloqueioMotivo('🚫 Falta recorrente (No-show)');
      carregarBloqueios();
      Alert.alert('Cliente Bloqueado 🚫', `${nomeFinal || 'O cliente'} foi bloqueado e não poderá agendar horários.`);
    } catch (err: any) {
      Alert.alert('Erro ao bloquear', err.message || 'Tente novamente.');
    } finally {
      setSalvandoBloqueio(false);
    }
  }

  async function removerBloqueio(id: string) {
    Alert.alert('Desbloquear Cliente', 'Deseja liberar este cliente para novos agendamentos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desbloquear',
        onPress: async () => {
          try {
            await supabase.from('bloqueios_clientes').delete().eq('id', id);
            carregarBloqueios();
            Alert.alert('Cliente Desbloqueado', 'O cliente já pode agendar normalmente.');
          } catch {
            Alert.alert('Erro ao desbloquear');
          }
        },
      },
    ]);
  }

  if (!barbearia) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]}>
        <View style={styles.vazioContainer}>
          <Text style={[styles.vazioTexto, { color: theme.textoSecundario }]}>Selecione uma barbearia ativa primeiro no menu.</Text>
          <TouchableOpacity style={[styles.voltarBotao, { backgroundColor: theme.ouro }]} onPress={() => router.back()}>
            <Text style={[styles.voltarBotaoTexto, { color: theme.textoEscuroSobreOuro }]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header Superior */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBotao}>
          <ArrowLeft color={theme.textoPrimario} size={22} />
        </TouchableOpacity>
        <View style={styles.headerCentro}>
          <Text style={[styles.headerTitulo, { color: theme.textoPrimario }]}>Ajustes</Text>
          <Text style={[styles.headerSubtitulo, { color: theme.textoSecundario }]} numberOfLines={1}>
            {barbearia.nome}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.secao}>
          <Text style={styles.ajuda}>
            Configure o modelo de funcionamento da agenda, comissões de faturamento, mimos e regras de atendimento.
          </Text>

          {/* 1. Modo de Agendamento */}
          <View style={styles.blocoRegra}>
            <Text style={styles.blocoRegraTitulo}>Modo de Agendamento</Text>
            <Text style={styles.blocoRegraDesc}>Escolha como seus clientes marcam horário no seu espaço.</Text>

              <View style={styles.segmentosControle}>
                <TouchableOpacity
                  style={[styles.segmentoControleItem, modoAgenda === 'continua' && styles.segmentoControleItemAtivo]}
                  onPress={() => setModoAgenda('continua')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentoControleTexto, modoAgenda === 'continua' && styles.segmentoControleTextoAtivo]}>
                    📅 Livre
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentoControleItem, modoAgenda === 'drops' && styles.segmentoControleItemAtivo]}
                  onPress={() => setModoAgenda('drops')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentoControleTexto, modoAgenda === 'drops' && styles.segmentoControleTextoAtivo]}>
                    🚀 Semanal
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.opcaoModoSubExplicativo}>
                {modoAgenda === 'continua'
                  ? '• Livre: Agenda contínua sempre aberta para qualquer dia disponível dentro da janela.'
                  : '• Semanal: A agenda abre em dia/hora marcada na semana com contagem regressiva e fila de espera.'}
              </Text>

              {modoAgenda === 'continua' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.blocoRegraTitulo, { fontSize: 12.5 }]}>Janela de Antecedência:</Text>
                  <View style={styles.janelaDiasRow}>
                    {[7, 14, 21, 30].map((dias) => (
                      <TouchableOpacity
                        key={dias}
                        style={[styles.chipJanela, diasJanela === dias && styles.chipJanelaAtivo]}
                        onPress={() => setDiasJanela(dias)}
                      >
                        <Text style={[styles.chipJanelaTexto, diasJanela === dias && styles.chipJanelaTextoAtivo]}>
                          {dias} dias
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* 2. Duração dos Horários na Grade */}
            <View style={styles.blocoRegra}>
              <Text style={styles.blocoRegraTitulo}>Duração dos Atendimentos na Grade</Text>
              <Text style={styles.blocoRegraDesc}>Otimização de tempo entre clientes para maximizar seu faturamento.</Text>

              <View style={styles.segmentosControle}>
                <TouchableOpacity
                  style={[styles.segmentoControleItem, modoDuracao === 'tempo_servico' && styles.segmentoControleItemAtivo]}
                  onPress={() => setModoDuracao('tempo_servico')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentoControleTexto, modoDuracao === 'tempo_servico' && styles.segmentoControleTextoAtivo]}>
                    ⚡ Dinâmico
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentoControleItem, modoDuracao === 'fixo_1h' && styles.segmentoControleItemAtivo]}
                  onPress={() => setModoDuracao('fixo_1h')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentoControleTexto, modoDuracao === 'fixo_1h' && styles.segmentoControleTextoAtivo]}>
                    ⏱️ Fixo 1h
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.opcaoModoSubExplicativo}>
                {modoDuracao === 'tempo_servico'
                  ? '⚡ Dinâmico: O app calcula a duração real de cada serviço (ex: 30m, 45m, 1h) e distribui os horários automaticamente sem você precisar calcular.'
                  : '⏱️ Fixo 1h: Cada agendamento ocupa um bloco fixo de 1 hora inteira (ex: 08:00, 09:00, 10:00).'}
              </Text>

              {modoDuracao === 'tempo_servico' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.blocoRegraTitulo, { fontSize: 12.5 }]}>Pausa entre Atendimentos:</Text>
                  <View style={styles.janelaDiasRow}>
                    {[0, 5, 10, 15].map((min) => (
                      <TouchableOpacity
                        key={min}
                        style={[styles.chipJanela, intervaloDescanso === min && styles.chipJanelaAtivo]}
                        onPress={() => setIntervaloDescanso(min)}
                      >
                        <Text style={[styles.chipJanelaTexto, intervaloDescanso === min && styles.chipJanelaTextoAtivo]}>
                          {min === 0 ? 'Sem pausa' : `+${min} min`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* 3. Comissão Padrão da Equipe */}
            <View style={styles.blocoRegra}>
              <Text style={styles.blocoRegraTitulo}>Comissão Padrão da Equipe (%)</Text>
              <Text style={styles.blocoRegraDesc}>Percentual padrão pago aos barbeiros nos relatórios de fechamento de caixa.</Text>
              <View style={styles.inputComissaoWrapper}>
                <TextInput
                  style={styles.inputComissao}
                  value={comissaoPadrao}
                  onChangeText={setComissaoPadrao}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor={Colors.textoDesabilitado}
                />
                <Text style={styles.inputComissaoSufixo}>% de comissão</Text>
              </View>
            </View>

            {/* 4. Programa de Fidelidade */}
            <View style={styles.blocoRegra}>
              <View style={styles.fidelidadeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blocoRegraTitulo}>Programa de Fidelidade Digital</Text>
                  <Text style={styles.blocoRegraDesc}>Incentive seus clientes a voltarem com frequência.</Text>
                </View>
                <Switch
                  value={fidelidadeAtiva}
                  onValueChange={setFidelidadeAtiva}
                  trackColor={{ false: theme.borda, true: theme.ouro }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {fidelidadeAtiva && (
                <View style={styles.fidelidadeCampos}>
                  <CampoAjuste
                    label="Meta de Atendimentos para Recompensa"
                    value={metaCortesFidelidade}
                    onChangeText={setMetaCortesFidelidade}
                    placeholder="Ex: 10"
                    keyboardType="numeric"
                  />
                  <CampoAjuste
                    label="Recompensa do Cliente (Mesmo Serviço Adquirido)"
                    value={recompensaFidelidade}
                    onChangeText={setRecompensaFidelidade}
                    placeholder="Ex: 1 Corte Grátis (serviço padrão fidelizado)"
                  />
                </View>
              )}
            </View>

            {/* 5. Mimo VIP para Clientes Ausentes (+40 dias) */}
            <View style={styles.blocoRegra}>
              <View style={styles.fidelidadeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blocoRegraTitulo}>Mimo VIP para Clientes Ausentes (+40d)</Text>
                  <Text style={styles.blocoRegraDesc}>
                    Envie presentes exclusivos para reativar clientes sem precisar ligar.
                  </Text>
                </View>
                <Switch
                  value={mimoAtivo}
                  onValueChange={setMimoAtivo}
                  trackColor={{ false: theme.borda, true: theme.ouro }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {mimoAtivo && (
                <View style={styles.fidelidadeCampos}>
                  <View style={[styles.badgeAutomacaoMimo, { backgroundColor: 'rgba(203, 161, 74, 0.1)', borderColor: theme.bordaOuro }]}>
                    <Sparkles size={14} color={theme.ouroTexto} />
                    <Text style={[styles.badgeAutomacaoMimoTexto, { color: theme.ouroTexto }]}>
                      Automação Ativa: Clientes ausentes veem o mimo automaticamente na Home do app.
                    </Text>
                  </View>

                  {/* Tipo de Mimo */}
                  <Text style={styles.mimoTipoLabel}>Tipo de Mimo:</Text>
                  <View style={styles.janelaDiasRow}>
                    <TouchableOpacity
                      style={[styles.chipJanela, { paddingHorizontal: 4 }, mimoTipo === 'upgrade' && styles.chipJanelaAtivo]}
                      onPress={() => {
                        setMimoTipo('upgrade');
                        setMimoTitulo('Corte Ganha Sobrancelha Grátis 🎁');
                        setMimoDescricao('Agende seu corte e ganhe o design de sobrancelha como cortesia da barbearia.');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.chipJanelaTexto, mimoTipo === 'upgrade' && styles.chipJanelaTextoAtivo]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        🎁 Upgrade
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.chipJanela, { paddingHorizontal: 4 }, mimoTipo === 'desconto' && styles.chipJanelaAtivo]}
                      onPress={() => {
                        setMimoTipo('desconto');
                        setMimoTitulo('Voucher 15% OFF no Próximo Corte 🏷️');
                        setMimoDescricao('Liberamos 15% de desconto exclusivo para você dar um tapa no visual esta semana.');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.chipJanelaTexto, mimoTipo === 'desconto' && styles.chipJanelaTextoAtivo]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        🏷️ Desconto
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.chipJanela, { paddingHorizontal: 4 }, mimoTipo === 'brinde' && styles.chipJanelaAtivo]}
                      onPress={() => {
                        setMimoTipo('brinde');
                        setMimoTitulo('Brinde Exclusivo no Atendimento 🧴');
                        setMimoDescricao('Venha cortar esta semana e retire um brinde exclusivo direto na bancada.');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.chipJanelaTexto, mimoTipo === 'brinde' && styles.chipJanelaTextoAtivo]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        🧴 Brinde
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <CampoAjuste
                    label="Título da Oferta / Presente"
                    value={mimoTitulo}
                    onChangeText={setMimoTitulo}
                    placeholder="Ex: Corte Ganha Sobrancelha Grátis 🎁"
                  />
                  <CampoAjuste
                    label="Mensagem Explicativa"
                    value={mimoDescricao}
                    onChangeText={setMimoDescricao}
                    multiline
                    placeholder="Descreva o benefício e como o cliente resgata..."
                  />
                </View>
              )}
            </View>

            {/* 6. Bloquear clientes */}
            <View style={styles.blocoRegra}>
              <View style={styles.fidelidadeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blocoRegraTitulo}>Bloquear clientes ({bloqueados.length})</Text>
                  <Text style={styles.blocoRegraDesc}>Para clientes faltosos, desrespeitosos ou devedores</Text>
                </View>
                <TouchableOpacity
                  style={styles.botaoAddBloqueio}
                  onPress={() => {
                    setClienteSelecionadoParaBloqueio(null);
                    setBuscaBloqueio('');
                    setUsuariosParaBloqueio([]);
                    setBloqueioNome('');
                    setBloqueioEmail('');
                    setBloqueioTelefone('');
                    setBloqueioMotivo('🚫 Falta recorrente (No-show)');
                    setModalBloqueioAberto(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ban size={14} color={Colors.vermelho} />
                  <Text style={styles.botaoAddBloqueioTexto}>Bloquear</Text>
                </TouchableOpacity>
              </View>

              {bloqueados.length > 0 && (
                <View style={styles.bloqueadosLista}>
                  {bloqueados.map((b) => (
                    <View key={b.id} style={styles.bloqueadoCard}>
                      <View style={styles.bloqueadoInfo}>
                        <Text style={styles.bloqueadoIdentificador}>
                          {b.email || b.telefone || 'Cliente Restrito'}
                        </Text>
                        <Text style={styles.bloqueadoMotivo}>{b.motivo || 'Restrição aplicada'}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.botaoDesbloquear}
                        onPress={() => removerBloqueio(b.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.botaoDesbloquearTexto}>Desbloquear</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* BOTÃO SALVAR REGRAS */}
            <Botao
              label={salvandoRegras ? 'Salvando regras...' : 'Salvar Regras & Ajustes'}
              onPress={salvarRegras}
              desabilitado={salvandoRegras}
              estiloContainer={{ marginTop: Spacing.sm }}
            />
          </View>
        </ScrollView>

      {/* ─── MODAL: BLOQUEAR CLIENTES COM BUSCA DE QUALQUER USUÁRIO ─── */}
      <Modal visible={modalBloqueioAberto} transparent animationType="fade" onRequestClose={() => setModalBloqueioAberto(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Bloquear clientes</Text>
              <TouchableOpacity onPress={() => setModalBloqueioAberto(false)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Para clientes faltosos, desrespeitosos ou devedores. Pesquise qualquer usuário cadastrado no app:
            </Text>

            {/* Barra de Pesquisa de Usuários */}
            <View style={[styles.buscaLinha, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
              <Search size={16} color={theme.textoSecundario} />
              <TextInput
                style={[styles.buscaInput, { color: theme.textoPrimario }]}
                placeholder="Pesquisar por nome, telefone ou e-mail..."
                placeholderTextColor={theme.textoDesabilitado}
                value={buscaBloqueio}
                onChangeText={buscarUsuariosParaBloqueio}
                autoCapitalize="none"
              />
              {buscandoBloqueio && <ActivityIndicator size="small" color={theme.ouro} />}
            </View>

            {/* Resultados da Busca */}
            {usuariosParaBloqueio.length > 0 && !clienteSelecionadoParaBloqueio && (
              <ScrollView style={styles.buscaResultados} keyboardShouldPersistTaps="handled">
                {usuariosParaBloqueio.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.buscaItem, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                    onPress={() => {
                      setClienteSelecionadoParaBloqueio(u);
                      setBloqueioNome(u.nome_completo || '');
                      setBloqueioEmail(u.email || '');
                      setBloqueioTelefone(u.telefone || '');
                      setUsuariosParaBloqueio([]);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.buscaItemAvatar}>
                      <Text style={styles.buscaItemAvatarTexto}>
                        {(u.nome_completo || 'U').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.buscaItemNome, { color: theme.textoPrimario }]}>
                        {u.nome_completo || 'Cliente'}
                      </Text>
                      <Text style={[styles.buscaItemEmail, { color: theme.textoSecundario }]}>
                        {u.telefone || u.email || 'Sem contato'}
                      </Text>
                    </View>
                    <UserX size={16} color={Colors.vermelho} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Cliente Selecionado */}
            {clienteSelecionadoParaBloqueio && (
              <View style={[styles.usuarioCardSelecionado, { backgroundColor: 'rgba(255, 69, 58, 0.12)', borderColor: 'rgba(255, 69, 58, 0.3)' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.usuarioCardNome, { color: Colors.vermelho }]}>
                    {clienteSelecionadoParaBloqueio.nome_completo || 'Cliente'}
                  </Text>
                  <Text style={[styles.usuarioCardEmail, { color: theme.textoSecundario }]}>
                    {clienteSelecionadoParaBloqueio.telefone || clienteSelecionadoParaBloqueio.email}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setClienteSelecionadoParaBloqueio(null)}>
                  <X size={18} color={Colors.vermelho} />
                </TouchableOpacity>
              </View>
            )}

            {/* Chips de Motivo */}
            <Text style={[styles.campoLabel, { color: theme.textoPrimario, marginTop: 4 }]}>Motivo do Bloqueio:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {[
                '🚫 Falta recorrente (No-show)',
                '⚠️ Desrespeitoso / Conduta',
                '💳 Devedor / Pendência',
                '❌ Outro motivo',
              ].map((m) => {
                const selecionado = bloqueioMotivo === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.chipJanela,
                      { paddingHorizontal: 8, paddingVertical: 6, flexGrow: 0 },
                      selecionado && { backgroundColor: Colors.vermelho, borderColor: Colors.vermelho },
                    ]}
                    onPress={() => setBloqueioMotivo(m)}
                  >
                    <Text style={[styles.chipJanelaTexto, selecionado && { color: '#FFFFFF', fontFamily: FontFamily.bold }]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <CampoAjuste
              label="Detalhe ou Observação Adicional"
              value={bloqueioMotivo}
              onChangeText={setBloqueioMotivo}
              placeholder="Ex: Faltou 2 vezes sem avisar ou pendência financeira..."
            />

            <TouchableOpacity
              style={[styles.botaoConfirmarModal, { backgroundColor: Colors.vermelho, marginTop: 12 }]}
              onPress={salvarNovoBloqueio}
              disabled={salvandoBloqueio}
            >
              {salvandoBloqueio ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.botaoConfirmarModalTexto, { color: '#FFFFFF' }]}>Confirmar Bloqueio</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CampoAjuste({
  label,
  multiline,
  ...props
}: {
  label: string;
  multiline?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: any;
}) {
  const { theme } = useTheme();
  return (
    <View style={stylesBase.campoGrupo}>
      <Text style={[stylesBase.campoLabel, { color: theme.textoSecundario }]}>{label}</Text>
      <TextInput
        style={[
          stylesBase.campoInput,
          {
            backgroundColor: theme.superficie2,
            borderColor: theme.borda,
            color: theme.textoPrimario,
          },
          multiline && stylesBase.campoInputMultiline,
        ]}
        placeholderTextColor={theme.textoDesabilitado}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
    </View>
  );
}

const stylesBase = StyleSheet.create({
  campoGrupo: {
    gap: 4,
    marginTop: 6,
  },
  campoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  campoInput: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  campoInputMultiline: {
    minHeight: 70,
    paddingTop: 10,
  },
});

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    vazioContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    vazioTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 14,
      textAlign: 'center',
    },
    voltarBotao: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: 10,
      borderRadius: Radii.md,
    },
    voltarBotaoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
    },
    headerBotao: {
      padding: 6,
    },
    headerCentro: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 16,
    },
    headerSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: 12,
    },
    segmentosWrapper: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
    },
    segmentosContainer: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    segmento: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: Radii.md,
      borderWidth: 1,
    },
    segmentoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 13,
    },
    scroll: {
      padding: Spacing.md,
      paddingBottom: 40,
    },
    secao: {
      gap: Spacing.md,
    },
    ajuda: {
      fontFamily: FontFamily.regular,
      fontSize: 12.5,
      color: theme.textoSecundario,
      lineHeight: 18,
    },
    equipeTopo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    botaoAdicionarMembro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.ouro,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: Radii.md,
    },
    botaoAdicionarMembroTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: theme.textoEscuroSobreOuro,
    },
    membrosVazio: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    membrosVazioTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 15,
      color: theme.textoPrimario,
    },
    membrosVazioSub: {
      fontFamily: FontFamily.regular,
      fontSize: 12.5,
      color: theme.textoSecundario,
      textAlign: 'center',
    },
    membrosLista: {
      gap: Spacing.sm,
    },
    membroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    membroCardInativo: {
      opacity: 0.6,
    },
    membroAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    membroAvatarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 18,
      color: theme.ouroTexto,
    },
    membroInfo: {
      flex: 1,
      gap: 2,
    },
    membroNomeLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    membroNome: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
      color: theme.textoPrimario,
    },
    membroNomeInativo: {
      textDecorationLine: 'line-through',
    },
    badgePapel: {
      borderWidth: 1,
      borderRadius: Radii.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgePapelTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
    },
    membroContato: {
      fontFamily: FontFamily.regular,
      fontSize: 12,
      color: theme.textoSecundario,
    },
    membroStatusLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    statusPonto: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    membroStatusTexto: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
    },
    membroAcoes: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    membroAcaoBotao: {
      padding: 8,
      borderRadius: Radii.md,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    blocoRegra: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      gap: Spacing.xs,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    blocoRegraTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 15,
      color: theme.textoPrimario,
    },
    blocoRegraDesc: {
      fontFamily: FontFamily.regular,
      fontSize: 12,
      color: theme.textoSecundario,
      marginBottom: 4,
      lineHeight: 16,
    },
    opcaoModoCard: {
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: 4,
      marginTop: 6,
    },
    opcaoModoCardAtivo: {
      borderColor: theme.ouro,
      backgroundColor: theme.ouroTranslucido,
    },
    opcaoModoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    opcaoModoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 13.5,
      color: theme.textoPrimario,
    },
    opcaoModoTituloAtivo: {
      color: theme.ouroTexto,
    },
    opcaoModoSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      color: theme.textoSecundario,
      lineHeight: 15,
    },
    janelaDiasRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: 6,
    },
    chipJanela: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: Radii.md,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipJanelaAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
    },
    chipJanelaTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
      color: theme.textoSecundario,
    },
    chipJanelaTextoAtivo: {
      color: theme.textoEscuroSobreOuro,
      fontFamily: FontFamily.bold,
    },
    inputComissaoWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
      paddingHorizontal: Spacing.md,
      height: 48,
      marginTop: 4,
      gap: Spacing.xs,
    },
    inputComissao: {
      flex: 1,
      color: theme.textoPrimario,
      fontFamily: FontFamily.bold,
      fontSize: 16,
      height: '100%',
    },
    inputComissaoSufixo: {
      fontFamily: FontFamily.medium,
      fontSize: 13,
      color: theme.ouroTexto,
    },
    fidelidadeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    fidelidadeCampos: {
      gap: Spacing.xs,
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.borda,
    },
    mimoTipoLabel: {
      fontFamily: FontFamily.bold,
      fontSize: 12.5,
      color: theme.ouroTexto,
      marginTop: 4,
    },
    botaoDisparoPush: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.ouro,
      borderRadius: Radii.md,
      paddingVertical: 12,
      marginTop: Spacing.xs,
    },
    botaoDisparoPushTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: theme.textoEscuroSobreOuro,
    },
    botaoAddBloqueio: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    botaoAddBloqueioTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
      color: Colors.vermelho,
    },
    bloqueadosLista: {
      gap: 6,
      marginTop: 6,
    },
    segmentosControle: {
      flexDirection: 'row',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.borda,
      marginTop: 6,
    },
    segmentoControleItem: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radii.sm,
    },
    segmentoControleItemAtivo: {
      backgroundColor: theme.ouro,
    },
    segmentoControleTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12.5,
      color: theme.textoSecundario,
    },
    segmentoControleTextoAtivo: {
      color: theme.textoEscuroSobreOuro,
      fontFamily: FontFamily.bold,
    },
    opcaoModoSubExplicativo: {
      fontFamily: FontFamily.regular,
      fontSize: 11.5,
      color: theme.textoSecundario,
      marginTop: 6,
      lineHeight: 16,
    },
    badgeAutomacaoMimo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 10,
      borderRadius: Radii.md,
      borderWidth: 1,
      marginTop: 4,
    },
    badgeAutomacaoMimoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
      flex: 1,
      lineHeight: 16,
    },
    bloqueadoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    bloqueadoInfo: {
      flex: 1,
      gap: 2,
    },
    bloqueadoIdentificador: {
      fontFamily: FontFamily.bold,
      fontSize: 12.5,
      color: theme.textoPrimario,
    },
    bloqueadoMotivo: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
    },
    botaoDesbloquear: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    botaoDesbloquearTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 11.5,
      color: Colors.vermelho,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      padding: Spacing.md,
    },
    modalConteudo: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.borda,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    modalTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 16,
      color: theme.textoPrimario,
    },
    modalSub: {
      fontFamily: FontFamily.regular,
      fontSize: 12.5,
      color: theme.textoSecundario,
      marginBottom: Spacing.sm,
    },
    buscaLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
      paddingHorizontal: Spacing.sm,
      gap: Spacing.xs,
      height: 44,
      marginBottom: Spacing.sm,
    },
    buscaInput: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: 13,
      color: theme.textoPrimario,
      height: '100%',
    },
    buscaResultados: {
      maxHeight: 180,
      marginBottom: Spacing.sm,
    },
    buscaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.sm,
      gap: Spacing.sm,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    buscaItemAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buscaItemAvatarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: theme.ouroTexto,
    },
    buscaItemNome: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: theme.textoPrimario,
    },
    buscaItemEmail: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
    },
    usuarioCardSelecionado: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.ouroTranslucido,
      borderRadius: Radii.md,
      padding: Spacing.sm,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
      marginBottom: Spacing.sm,
    },
    usuarioCardNome: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: theme.ouroTexto,
    },
    usuarioCardEmail: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
    },
    campoLabel: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
      color: theme.textoPrimario,
      marginBottom: 4,
    },
    papeisOpcoes: {
      gap: 6,
      marginVertical: Spacing.xs,
    },
    papelChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.sm,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    papelPonto: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    papelChipTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 13,
      color: theme.textoPrimario,
    },
    papelChipDesc: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
    },
    chipTurno: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: Radii.md,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipTurnoAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
    },
    chipTurnoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
      color: theme.textoSecundario,
    },
    chipTurnoTextoAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoEscuroSobreOuro,
    },
    chipHora: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: Radii.md,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipHoraAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
    },
    chipHoraTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
      color: theme.textoSecundario,
    },
    chipHoraTextoAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoEscuroSobreOuro,
    },
    chipPausa: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: Radii.md,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipPausaAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
    },
    chipPausaTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11.5,
      color: theme.textoSecundario,
    },
    chipPausaTextoAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoEscuroSobreOuro,
    },
    resumoPausaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      borderRadius: Radii.md,
      padding: Spacing.sm,
      borderWidth: 1,
      marginTop: 2,
    },
    resumoPausaTexto: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: 12,
      lineHeight: 16,
    },
    diasPadraoLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginTop: 2,
    },
    chipDiaPadrao: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 2,
      borderRadius: Radii.md,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipDiaPadraoAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
    },
    chipDiaPadraoTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11,
      color: theme.textoSecundario,
      textAlign: 'center',
    },
    chipDiaPadraoTextoAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoEscuroSobreOuro,
    },
    motivosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginVertical: Spacing.xs,
    },
    chipMotivo: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radii.md,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    chipMotivoAtivo: {
      backgroundColor: 'rgba(255, 69, 58, 0.15)',
      borderColor: Colors.vermelho,
    },
    chipMotivoTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 12,
      color: theme.textoSecundario,
    },
    chipMotivoTextoAtivo: {
      fontFamily: FontFamily.bold,
      color: Colors.vermelho,
    },
    botaoConfirmarModal: {
      backgroundColor: theme.ouro,
      borderRadius: Radii.md,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    botaoConfirmarModalTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
      color: theme.textoEscuroSobreOuro,
    },
    botaoExcluirMembroModal: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: Spacing.md,
      paddingVertical: 10,
    },
    botaoExcluirMembroModalTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      color: Colors.vermelho,
    },
  });
}
