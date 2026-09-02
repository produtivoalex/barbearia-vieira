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
import { useMembrosBarbearia, type PapelMembro, type MembroBarbearia } from '@/hooks/useMembrosBarbearia';
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

const PAPEL_ROTULOS: Record<PapelMembro, { rotulo: string; cor: string; desc: string }> = {
  proprietario: { rotulo: 'Proprietário', cor: Colors.ouro, desc: 'Acesso total, gestão comercial e membros' },
  gestor: { rotulo: 'Gestor', cor: '#4EA8DE', desc: 'Gerenciamento de agenda, dados e equipe' },
  barbeiro: { rotulo: 'Barbeiro', cor: Colors.verde, desc: 'Atendimentos, agenda própria e clientes' },
  atendente: { rotulo: 'Atendente', cor: '#B5838D', desc: 'Agendamentos e recepção' },
};

type AbaAjustes = 'equipe' | 'regras';

export default function TelaOpcoesAvancadas() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;
  const { barbearia, selecionarBarbearia } = useBarbearia();

  // Membros
  const {
    membros,
    carregando: carregandoMembros,
    adicionarMembro,
    alterarPapel,
    alternarStatus,
    removerMembro,
  } = useMembrosBarbearia(barbearia?.id);

  // Aba ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaAjustes>('equipe');

  // Estados de Membros & Modal
  const [modalNovoMembro, setModalNovoMembro] = useState(false);
  const [modalEditarMembro, setModalEditarMembro] = useState<MembroBarbearia | null>(null);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<UsuarioBusca[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioBusca | null>(null);
  const [papelNovoMembro, setPapelNovoMembro] = useState<PapelMembro>('barbeiro');
  const [salvandoMembro, setSalvandoMembro] = useState(false);

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

  const [disparandoPush, setDisparandoPush] = useState(false);
  const [salvandoRegras, setSalvandoRegras] = useState(false);

  // Bloqueios
  const [bloqueados, setBloqueados] = useState<BloqueioCliente[]>([]);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [bloqueioNome, setBloqueioNome] = useState('');
  const [bloqueioEmail, setBloqueioEmail] = useState('');
  const [bloqueioTelefone, setBloqueioTelefone] = useState('');
  const [bloqueioMotivo, setBloqueioMotivo] = useState('');
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
    if (barbearia.comissao_padrao !== undefined) setComissaoPadrao(String(barbearia.comissao_padrao));

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

  // ─── AÇÕES DE MEMBROS ───
  async function buscarUsuariosParaMembro(termo: string) {
    setBuscaUsuario(termo);
    const termoLimpo = termo.trim().toLowerCase();
    if (!termoLimpo || termoLimpo.length < 2) {
      setUsuariosEncontrados([]);
      return;
    }

    setBuscandoUsuarios(true);
    try {
      const { data } = await supabase
        .from('perfis')
        .select('id, nome_completo, email, telefone, role')
        .or(`nome_completo.ilike.%${termoLimpo}%,email.ilike.%${termoLimpo}%`)
        .limit(10);

      const membrosIds = new Set(membros.map((m) => m.usuario_id));
      const filtrados = (data ?? []).filter((u) => !membrosIds.has(u.id));
      setUsuariosEncontrados(filtrados as UsuarioBusca[]);
    } catch {
      setUsuariosEncontrados([]);
    } finally {
      setBuscandoUsuarios(false);
    }
  }

  async function handleConfirmarNovoMembro() {
    if (!usuarioSelecionado) {
      Alert.alert('Selecione um usuário', 'Escolha um perfil para vincular à barbearia.');
      return;
    }

    setSalvandoMembro(true);
    try {
      await adicionarMembro(usuarioSelecionado.id, papelNovoMembro);
      setModalNovoMembro(false);
      setUsuarioSelecionado(null);
      setBuscaUsuario('');
      setUsuariosEncontrados([]);
      Alert.alert('Membro Adicionado! 👥', `${usuarioSelecionado.nome_completo || 'O usuário'} agora faz parte da equipe.`);
    } catch (err: any) {
      Alert.alert('Erro ao adicionar membro', err.message || 'Tente novamente.');
    } finally {
      setSalvandoMembro(false);
    }
  }

  async function handleAlterarPapelMembro(novoPapel: PapelMembro) {
    if (!modalEditarMembro) return;
    try {
      await alterarPapel(modalEditarMembro.id, novoPapel);
      setModalEditarMembro(null);
      Alert.alert('Papel Atualizado', `O papel foi alterado para ${PAPEL_ROTULOS[novoPapel].rotulo}.`);
    } catch (err: any) {
      Alert.alert('Ação bloqueada ⚠️', err.message);
    }
  }

  async function handleAlternarStatusMembro(membro: MembroBarbearia) {
    const novoStatus = !membro.ativo;
    const acaoTexto = novoStatus ? 'reativar' : 'desativar';

    Alert.alert(
      `${novoStatus ? 'Reativar' : 'Desativar'} Membro`,
      `Deseja ${acaoTexto} o acesso de ${membro.perfil?.nome_completo || 'deste profissional'} neste estabelecimento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: novoStatus ? 'Reativar' : 'Desativar',
          style: novoStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await alternarStatus(membro.id, novoStatus);
              Alert.alert('Sucesso', `Membro ${novoStatus ? 'reativado' : 'desativado'} com sucesso.`);
            } catch (err: any) {
              Alert.alert('Ação bloqueada ⚠️', err.message);
            }
          },
        },
      ]
    );
  }

  async function handleRemoverMembro(membro: MembroBarbearia) {
    Alert.alert(
      'Remover Vínculo',
      `Tem certeza que deseja remover ${membro.perfil?.nome_completo || 'este membro'} permanentemente da barbearia?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerMembro(membro.id);
              setModalEditarMembro(null);
              Alert.alert('Vínculo Removido', 'O profissional foi desvinculado com sucesso.');
            } catch (err: any) {
              Alert.alert('Ação bloqueada ⚠️', err.message);
            }
          },
        },
      ]
    );
  }

  // ─── AÇÕES DE REGRAS ───
  async function salvarRegras() {
    if (!barbearia) return;
    setSalvandoRegras(true);

    const comissaoNum = Number(comissaoPadrao.replace(',', '.')) || 50;
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
    if (!bloqueioNome.trim() && !bloqueioEmail.trim() && !bloqueioTelefone.trim()) {
      Alert.alert('Atenção', 'Informe ao menos o nome, e-mail ou telefone para bloquear.');
      return;
    }

    setSalvandoBloqueio(true);
    try {
      const { error } = await supabase.from('bloqueios_clientes').insert({
        barbeiro_id: barbeiroId,
        email: bloqueioEmail.trim() || null,
        telefone: bloqueioTelefone.trim() || null,
        motivo: bloqueioMotivo.trim() || 'No-show / Falta recorrente',
      });

      if (error) throw error;

      setModalBloqueioAberto(false);
      setBloqueioNome('');
      setBloqueioEmail('');
      setBloqueioTelefone('');
      setBloqueioMotivo('');
      carregarBloqueios();
      Alert.alert('Bloqueio Realizado', 'O cliente não poderá mais marcar horários diretamente.');
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
          <Text style={[styles.headerTitulo, { color: theme.textoPrimario }]}>Ajustes & Equipe</Text>
          <Text style={[styles.headerSubtitulo, { color: theme.textoSecundario }]} numberOfLines={1}>
            {barbearia.nome}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Segmented Controller (2 Abas Claras) */}
      <View style={[styles.segmentosWrapper, { backgroundColor: theme.superficie, borderBottomColor: theme.borda }]}>
        <View style={styles.segmentosContainer}>
          <TouchableOpacity
            style={[
              styles.segmento,
              { backgroundColor: theme.superficie2, borderColor: theme.borda },
              abaAtiva === 'equipe' && { backgroundColor: theme.ouro, borderColor: theme.ouro },
            ]}
            onPress={() => setAbaAtiva('equipe')}
            activeOpacity={0.8}
          >
            <Users size={16} color={abaAtiva === 'equipe' ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
            <Text
              style={[
                styles.segmentoTexto,
                { color: theme.textoSecundario },
                abaAtiva === 'equipe' && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}
            >
              Equipe ({membros.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmento,
              { backgroundColor: theme.superficie2, borderColor: theme.borda },
              abaAtiva === 'regras' && { backgroundColor: theme.ouro, borderColor: theme.ouro },
            ]}
            onPress={() => setAbaAtiva('regras')}
            activeOpacity={0.8}
          >
            <Sliders size={16} color={abaAtiva === 'regras' ? theme.textoEscuroSobreOuro : theme.textoSecundario} />
            <Text
              style={[
                styles.segmentoTexto,
                { color: theme.textoSecundario },
                abaAtiva === 'regras' && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}
            >
              Regras & Operação
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* ─── ABA 1: GESTÃO DE EQUIPE ─── */}
        {abaAtiva === 'equipe' && (
          <View style={styles.secao}>
            <View style={styles.equipeTopo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ajuda}>
                  Gerencie os profissionais e colaboradores vinculados ao estabelecimento e seus papéis de acesso.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.botaoAdicionarMembro}
                onPress={() => {
                  setUsuarioSelecionado(null);
                  setBuscaUsuario('');
                  setUsuariosEncontrados([]);
                  setPapelNovoMembro('barbeiro');
                  setModalNovoMembro(true);
                }}
                activeOpacity={0.8}
              >
                <UserPlus size={16} color={Colors.fundo} />
                <Text style={styles.botaoAdicionarMembroTexto}>Novo Membro</Text>
              </TouchableOpacity>
            </View>

            {carregandoMembros ? (
              <ActivityIndicator color={Colors.ouro} style={{ marginTop: 24 }} />
            ) : membros.length === 0 ? (
              <View style={styles.membrosVazio}>
                <Users size={36} color={Colors.textoDesabilitado} />
                <Text style={styles.membrosVazioTitulo}>Nenhum membro cadastrado</Text>
                <Text style={styles.membrosVazioSub}>Vincule barbeiros ou atendentes para gerenciar a agenda.</Text>
              </View>
            ) : (
              <View style={styles.membrosLista}>
                {membros.map((membro) => {
                  const papelInfo = PAPEL_ROTULOS[membro.papel] || PAPEL_ROTULOS.barbeiro;
                  return (
                    <View key={membro.id} style={[styles.membroCard, !membro.ativo && styles.membroCardInativo]}>
                      <View style={styles.membroAvatar}>
                        <Text style={styles.membroAvatarTexto}>
                          {(membro.perfil?.nome_completo || 'M').slice(0, 1).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.membroInfo}>
                        <View style={styles.membroNomeLinha}>
                          <Text style={[styles.membroNome, !membro.ativo && styles.membroNomeInativo]}>
                            {membro.perfil?.nome_completo || 'Profissional'}
                          </Text>
                          <View style={[styles.badgePapel, { borderColor: papelInfo.cor }]}>
                            <Text style={[styles.badgePapelTexto, { color: papelInfo.cor }]}>{papelInfo.rotulo}</Text>
                          </View>
                        </View>

                        <Text style={styles.membroContato}>
                          {membro.perfil?.email || membro.perfil?.telefone || 'Sem contato cadastrado'}
                        </Text>

                        <View style={styles.membroStatusLinha}>
                          <View
                            style={[
                              styles.statusPonto,
                              { backgroundColor: membro.ativo ? Colors.verde : Colors.textoDesabilitado },
                            ]}
                          />
                          <Text style={styles.membroStatusTexto}>
                            {membro.ativo ? 'Vínculo Ativo' : 'Vínculo Desativado'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.membroAcoes}>
                        <TouchableOpacity
                          style={styles.membroAcaoBotao}
                          onPress={() => setModalEditarMembro(membro)}
                          activeOpacity={0.7}
                        >
                          <Shield size={16} color={Colors.ouro} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.membroAcaoBotao}
                          onPress={() => handleAlternarStatusMembro(membro)}
                          activeOpacity={0.7}
                        >
                          {membro.ativo ? (
                            <UserX size={16} color={Colors.vermelho} />
                          ) : (
                            <UserCheck size={16} color={Colors.verde} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ─── ABA 2: REGRAS & OPERAÇÃO ─── */}
        {abaAtiva === 'regras' && (
          <View style={styles.secao}>
            <Text style={styles.ajuda}>
              Configure o modelo de funcionamento da agenda, comissões de faturamento, mimos e regras de atendimento.
            </Text>

            {/* 1. Modo de Agendamento */}
            <View style={styles.blocoRegra}>
              <Text style={styles.blocoRegraTitulo}>Modo de Agendamento</Text>
              <Text style={styles.blocoRegraDesc}>Escolha como seus clientes marcam horário no seu espaço.</Text>

              <TouchableOpacity
                style={[styles.opcaoModoCard, modoAgenda === 'continua' && styles.opcaoModoCardAtivo]}
                onPress={() => setModoAgenda('continua')}
                activeOpacity={0.8}
              >
                <View style={styles.opcaoModoHeader}>
                  <Text style={[styles.opcaoModoTitulo, modoAgenda === 'continua' && styles.opcaoModoTituloAtivo]}>
                    📅 Agenda Aberta Contínua (Recomendado)
                  </Text>
                  {modoAgenda === 'continua' && <CheckCircle size={18} color={Colors.ouro} />}
                </View>
                <Text style={styles.opcaoModoSub}>
                  Seus clientes podem agendar para qualquer dia disponível dentro da sua janela de dias livres.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.opcaoModoCard, modoAgenda === 'drops' && styles.opcaoModoCardAtivo]}
                onPress={() => setModoAgenda('drops')}
                activeOpacity={0.8}
              >
                <View style={styles.opcaoModoHeader}>
                  <Text style={[styles.opcaoModoTitulo, modoAgenda === 'drops' && styles.opcaoModoTituloAtivo]}>
                    🚀 Abertura Semanal Programada (Drops)
                  </Text>
                  {modoAgenda === 'drops' && <CheckCircle size={18} color={Colors.ouro} />}
                </View>
                <Text style={styles.opcaoModoSub}>
                  A agenda abre em data/hora marcada com contagem regressiva e lista de espera quando lotada.
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Duração dos Horários: Fixo 1h vs Tempo de Serviço */}
            <View style={styles.blocoRegra}>
              <Text style={styles.blocoRegraTitulo}>Duração dos Atendimentos na Grade</Text>
              <Text style={styles.blocoRegraDesc}>Defina se os horários são fixos de 1h ou dinâmicos pelo tempo real dos serviços.</Text>

              <TouchableOpacity
                style={[styles.opcaoModoCard, modoDuracao === 'fixo_1h' && styles.opcaoModoCardAtivo]}
                onPress={() => setModoDuracao('fixo_1h')}
                activeOpacity={0.8}
              >
                <View style={styles.opcaoModoHeader}>
                  <Text style={[styles.opcaoModoTitulo, modoDuracao === 'fixo_1h' && styles.opcaoModoTituloAtivo]}>
                    ⏱️ Tempo Fixo de 1h (Slots Padrão)
                  </Text>
                  {modoDuracao === 'fixo_1h' && <CheckCircle size={18} color={Colors.ouro} />}
                </View>
                <Text style={styles.opcaoModoSub}>
                  Cada vaga ocupa um bloco fixo de 1 hora (ex: 07:00, 08:00, 09:00), ideal para atendimentos tradicionais de 1 cliente por hora.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.opcaoModoCard, modoDuracao === 'tempo_servico' && styles.opcaoModoCardAtivo]}
                onPress={() => setModoDuracao('tempo_servico')}
                activeOpacity={0.8}
              >
                <View style={styles.opcaoModoHeader}>
                  <Text style={[styles.opcaoModoTitulo, modoDuracao === 'tempo_servico' && styles.opcaoModoTituloAtivo]}>
                    ⚡ Tempo Real do Serviço (Duração Dinâmica)
                  </Text>
                  {modoDuracao === 'tempo_servico' && <CheckCircle size={18} color={Colors.ouro} />}
                </View>
                <Text style={styles.opcaoModoSub}>
                  Aproveitamento total sem desperdício de horários! Cortes de 30 min ocupam 30 min, permitindo até 2 clientes por hora ou combos otimizados.
                </Text>
              </TouchableOpacity>

              {modoDuracao === 'tempo_servico' && (
                <View style={{ marginTop: 10, gap: 12 }}>
                  {/* Granularidade / Step */}
                  <View>
                    <Text style={[styles.blocoRegraTitulo, { fontSize: 12.5 }]}>Granularidade de Início</Text>
                    <View style={[styles.janelaDiasRow, { marginTop: 6 }]}>
                      <TouchableOpacity
                        style={[styles.chipJanela, stepAgendamento === 30 && styles.chipJanelaAtivo]}
                        onPress={() => setStepAgendamento(30)}
                      >
                        <Text style={[styles.chipJanelaTexto, stepAgendamento === 30 && styles.chipJanelaTextoAtivo]}>
                          A cada 30 min
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.chipJanela, stepAgendamento === 15 && styles.chipJanelaAtivo]}
                        onPress={() => setStepAgendamento(15)}
                      >
                        <Text style={[styles.chipJanelaTexto, stepAgendamento === 15 && styles.chipJanelaTextoAtivo]}>
                          A cada 15 min
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Intervalo de Descanso */}
                  <View>
                    <Text style={[styles.blocoRegraTitulo, { fontSize: 12.5 }]}>Pausa de Limpeza / Descanso entre Cortes</Text>
                    <View style={[styles.janelaDiasRow, { marginTop: 6 }]}>
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
                </View>
              )}
            </View>

            {/* Janela de Dias (se Contínua) */}
            {modoAgenda === 'continua' && (
              <View style={styles.blocoRegra}>
                <Text style={styles.blocoRegraTitulo}>Janela de Antecedência</Text>
                <Text style={styles.blocoRegraDesc}>Quantos dias à frente o cliente pode marcar horário?</Text>
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
                    label="Meta de Cortes para Recompensa"
                    value={metaCortesFidelidade}
                    onChangeText={setMetaCortesFidelidade}
                    placeholder="Ex: 10"
                    keyboardType="numeric"
                  />
                  <CampoAjuste
                    label="Recompensa do Cliente"
                    value={recompensaFidelidade}
                    onChangeText={setRecompensaFidelidade}
                    placeholder="Ex: Corte ou Barba Grátis"
                  />
                </View>
              )}
            </View>

            {/* 5. Mimos VIP para Clientes Ausentes (+40 dias) */}
            <View style={styles.blocoRegra}>
              <View style={styles.fidelidadeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blocoRegraTitulo}>Mimo VIP para Clientes Ausentes (+40d)</Text>
                  <Text style={styles.blocoRegraDesc}>
                    Envie presentes exclusivos por notificação in-app antes do contato via WhatsApp.
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

                  {/* Botão de Disparo em Massa */}
                  <TouchableOpacity
                    style={styles.botaoDisparoPush}
                    onPress={handleDispararPushMimo}
                    disabled={disparandoPush}
                    activeOpacity={0.8}
                  >
                    <Bell size={16} color={Colors.fundo} />
                    <Text style={styles.botaoDisparoPushTexto}>
                      {disparandoPush ? 'Disparando...' : 'Disparar Notificações In-App (+40d)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 6. Clientes Bloqueados (No-Show Protection) */}
            <View style={styles.blocoRegra}>
              <View style={styles.fidelidadeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.blocoRegraTitulo}>Proteção & Clientes Bloqueados ({bloqueados.length})</Text>
                  <Text style={styles.blocoRegraDesc}>Gerencie restrições para clientes faltosos (no-show).</Text>
                </View>
                <TouchableOpacity
                  style={styles.botaoAddBloqueio}
                  onPress={() => setModalBloqueioAberto(true)}
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
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bloqueadoTexto}>
                          {b.email || b.telefone || 'Cliente bloqueado'}
                        </Text>
                        <Text style={styles.bloqueadoMotivo}>{b.motivo || 'Sem motivo informado'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removerBloqueio(b.id)}>
                        <X size={16} color={Colors.textoDesabilitado} />
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
        )}
      </ScrollView>

      {/* ─── MODAL: ADICIONAR NOVO MEMBRO ─── */}
      <Modal visible={modalNovoMembro} transparent animationType="fade" onRequestClose={() => setModalNovoMembro(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Vincular Novo Membro</Text>
              <TouchableOpacity onPress={() => setModalNovoMembro(false)}>
                <X size={20} color={Colors.textoSecundario} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Busque um usuário cadastrado no aplicativo por nome ou e-mail para adicionar à equipe.
            </Text>

            {/* Campo de Busca */}
            <View style={styles.buscaLinha}>
              <Search size={18} color={Colors.textoSecundario} />
              <TextInput
                style={styles.buscaInput}
                placeholder="Buscar por nome ou e-mail..."
                placeholderTextColor={Colors.textoDesabilitado}
                value={buscaUsuario}
                onChangeText={buscarUsuariosParaMembro}
              />
              {buscandoUsuarios && <ActivityIndicator size="small" color={Colors.ouro} />}
            </View>

            {/* Lista de Resultados */}
            {usuariosEncontrados.length > 0 && !usuarioSelecionado && (
              <ScrollView style={styles.buscaResultados} nestedScrollEnabled>
                {usuariosEncontrados.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.buscaItem}
                    onPress={() => {
                      setUsuarioSelecionado(u);
                      setUsuariosEncontrados([]);
                    }}
                  >
                    <View style={styles.buscaItemAvatar}>
                      <Text style={styles.buscaItemAvatarTexto}>{(u.nome_completo || 'U').slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.buscaItemNome}>{u.nome_completo || 'Sem nome'}</Text>
                      <Text style={styles.buscaItemEmail}>{u.email || u.telefone || 'Sem contato'}</Text>
                    </View>
                    <ChevronRight size={16} color={Colors.ouro} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Usuário Selecionado */}
            {usuarioSelecionado && (
              <View style={styles.usuarioCardSelecionado}>
                <View style={styles.buscaItemAvatar}>
                  <Text style={styles.buscaItemAvatarTexto}>
                    {(usuarioSelecionado.nome_completo || 'U').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.usuarioCardNome}>{usuarioSelecionado.nome_completo}</Text>
                  <Text style={styles.usuarioCardEmail}>{usuarioSelecionado.email || usuarioSelecionado.telefone}</Text>
                </View>
                <TouchableOpacity onPress={() => setUsuarioSelecionado(null)}>
                  <X size={18} color={Colors.vermelho} />
                </TouchableOpacity>
              </View>
            )}

            {/* Seleção do Papel */}
            <Text style={[styles.campoLabel, { marginTop: 14 }]}>Papel no Estabelecimento:</Text>
            <View style={styles.papeisOpcoes}>
              {(['barbeiro', 'gestor', 'atendente', 'proprietario'] as PapelMembro[]).map((papel) => {
                const info = PAPEL_ROTULOS[papel];
                const selecionado = papelNovoMembro === papel;
                return (
                  <TouchableOpacity
                    key={papel}
                    style={[styles.papelChip, selecionado && { borderColor: info.cor, backgroundColor: theme.superficie2 }]}
                    onPress={() => setPapelNovoMembro(papel)}
                  >
                    <View style={[styles.papelPonto, { backgroundColor: info.cor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.papelChipTexto, selecionado && { color: info.cor, fontFamily: FontFamily.bold }]}>
                        {info.rotulo}
                      </Text>
                      <Text style={styles.papelChipDesc}>{info.desc}</Text>
                    </View>
                    {selecionado && <Check size={16} color={info.cor} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.botaoConfirmarModal}
              onPress={handleConfirmarNovoMembro}
              disabled={salvandoMembro || !usuarioSelecionado}
            >
              {salvandoMembro ? (
                <ActivityIndicator color={theme.textoEscuroSobreOuro} size="small" />
              ) : (
                <Text style={styles.botaoConfirmarModalTexto}>Confirmar Vínculo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: EDITAR PAPEL DO MEMBRO ─── */}
      <Modal visible={modalEditarMembro !== null} transparent animationType="fade" onRequestClose={() => setModalEditarMembro(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Alterar Papel de Acesso</Text>
              <TouchableOpacity onPress={() => setModalEditarMembro(null)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Membro:{' '}
              <Text style={{ color: theme.ouroTexto, fontFamily: FontFamily.bold }}>
                {modalEditarMembro?.perfil?.nome_completo || 'Profissional'}
              </Text>
            </Text>

            <View style={styles.papeisOpcoes}>
              {(['proprietario', 'gestor', 'barbeiro', 'atendente'] as PapelMembro[]).map((papel) => {
                const info = PAPEL_ROTULOS[papel];
                const selecionado = modalEditarMembro?.papel === papel;
                return (
                  <TouchableOpacity
                    key={papel}
                    style={[styles.papelChip, selecionado && { borderColor: info.cor, backgroundColor: theme.superficie2 }]}
                    onPress={() => handleAlterarPapelMembro(papel)}
                  >
                    <View style={[styles.papelPonto, { backgroundColor: info.cor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.papelChipTexto, selecionado && { color: info.cor, fontFamily: FontFamily.bold }]}>
                        {info.rotulo}
                      </Text>
                      <Text style={styles.papelChipDesc}>{info.desc}</Text>
                    </View>
                    {selecionado && <Check size={16} color={info.cor} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {modalEditarMembro && (
              <TouchableOpacity
                style={styles.botaoExcluirMembroModal}
                onPress={() => handleRemoverMembro(modalEditarMembro)}
              >
                <Trash2 size={16} color={Colors.vermelho} />
                <Text style={styles.botaoExcluirMembroModalTexto}>Remover Vínculo Permanentemente</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL: NOVO BLOQUEIO DE CLIENTE ─── */}
      <Modal visible={modalBloqueioAberto} transparent animationType="fade" onRequestClose={() => setModalBloqueioAberto(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Bloquear Cliente</Text>
              <TouchableOpacity onPress={() => setModalBloqueioAberto(false)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Impeça que clientes com histórico de no-show marquem novos horários sem liberação prévia.
            </Text>

            <CampoAjuste
              label="E-mail do Cliente"
              value={bloqueioEmail}
              onChangeText={setBloqueioEmail}
              placeholder="cliente@email.com"
              keyboardType="email-address"
            />

            <CampoAjuste
              label="Telefone / WhatsApp"
              value={bloqueioTelefone}
              onChangeText={setBloqueioTelefone}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />

            <CampoAjuste
              label="Motivo do Bloqueio"
              value={bloqueioMotivo}
              onChangeText={setBloqueioMotivo}
              placeholder="Ex: Faltou 2 vezes sem avisar"
            />

            <TouchableOpacity
              style={[styles.botaoConfirmarModal, { backgroundColor: Colors.vermelho }]}
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
    bloqueadoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    bloqueadoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12.5,
      color: theme.textoPrimario,
    },
    bloqueadoMotivo: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
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
