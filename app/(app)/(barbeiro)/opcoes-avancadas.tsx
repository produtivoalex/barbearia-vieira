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
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CalendarPlus,
  Ban,
  UserPlus,
  Clock,
  Plus,
  Check,
  X,
  User,
  Phone,
  Mail,
  Users,
  MessageSquare,
  Send,
  UserCheck,
  UserX,
  Search,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useServicos } from '@/hooks/useServicos';
import { usePainelBarbeiro } from '@/hooks/usePainelBarbeiro';
import { useBarbearia } from '@/contexts/BarbeariaContext';

interface BloqueioCliente {
  id: string;
  cliente_id: string | null;
  email: string | null;
  telefone: string | null;
  motivo: string | null;
  criado_em: string;
}

interface FuncionarioEquipe {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cargo: string;
  ativo: boolean;
}

interface ItemFila {
  id: string;
  cliente_id: string;
  cliente: {
    id: string;
    nome_completo: string | null;
    telefone: string | null;
    email?: string | null;
  };
}

interface ClientePerfil {
  id: string;
  nome_completo: string | null;
  email: string | null;
  telefone: string | null;
}

interface AgendamentoItemSimples {
  id: string;
  cliente_id: string;
  data_hora: string;
  status: string;
  cliente: {
    id: string;
    nome_completo: string | null;
    telefone: string | null;
  };
  servico: {
    id: string;
    nome: string;
  };
}

type GrupoMensagem = 'hoje' | 'semana' | 'fila' | 'todos';

const HORARIOS_ENCAIXE = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const HORARIOS_TARDE = ['14:00', '15:00', '16:00', '17:00'];

export default function TelaOpcoesAvancadas() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;
  const { barbearia } = useBarbearia();
  const { servicos } = useServicos('todos', barbearia?.id);
  const { agendamentosHoje, clientes, alternarTardeFechada, criarReservaManual } = usePainelBarbeiro(barbearia?.id);

  // Estados gerais
  const [carregando, setCarregando] = useState(true);
  const [bloqueados, setBloqueados] = useState<BloqueioCliente[]>([]);
  const [equipe, setEquipe] = useState<FuncionarioEquipe[]>([]);
  const [clientesFila, setClientesFila] = useState<ItemFila[]>([]);
  const [todosClientesApp, setTodosClientesApp] = useState<ClientePerfil[]>([]);
  const [agendamentosSemana, setAgendamentosSemana] = useState<AgendamentoItemSimples[]>([]);

  // Modais
  const [modalEncaixeAberto, setModalEncaixeAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [modalFuncionarioAberto, setModalFuncionarioAberto] = useState(false);
  const [modalVagasTardeAberto, setModalVagasTardeAberto] = useState(false);
  const [modalMensagemGrupoAberto, setModalMensagemGrupoAberto] = useState(false);

  // Formulário Encaixe
  const [encaixeHora, setEncaixeHora] = useState('08:00');
  const [encaixeClienteId, setEncaixeClienteId] = useState<string | null>(null);
  const [encaixeNomeManual, setEncaixeNomeManual] = useState('');
  const [encaixeTelefoneManual, setEncaixeTelefoneManual] = useState('');
  const [encaixeEmailManual, setEncaixeEmailManual] = useState('');
  const [encaixeServicoId, setEncaixeServicoId] = useState<string>('');
  const [buscaClienteEncaixe, setBuscaClienteEncaixe] = useState('');
  const [salvandoEncaixe, setSalvandoEncaixe] = useState(false);

  // Formulário Bloqueio
  const [bloqueioClienteId, setBloqueioClienteId] = useState<string | null>(null);
  const [bloqueioNome, setBloqueioNome] = useState('');
  const [bloqueioEmail, setBloqueioEmail] = useState('');
  const [bloqueioTelefone, setBloqueioTelefone] = useState('');
  const [bloqueioMotivo, setBloqueioMotivo] = useState('');
  const [buscaClienteBloqueio, setBuscaClienteBloqueio] = useState('');
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);

  // Formulário Funcionário
  const [funcNome, setFuncNome] = useState('');
  const [funcEmail, setFuncEmail] = useState('');
  const [funcTelefone, setFuncTelefone] = useState('');
  const [funcCargo, setFuncCargo] = useState('Barbeiro');
  const [salvandoFunc, setSalvandoFunc] = useState(false);

  // Vagas Tarde
  const [tardeHorarios, setTardeHorarios] = useState<string[]>(HORARIOS_TARDE);
  const [salvandoVagasTarde, setSalvandoVagasTarde] = useState(false);

  // Mensagem em Grupo
  const [grupoDestino, setGrupoDestino] = useState<GrupoMensagem>('hoje');
  const [destinatariosSelecionados, setDestinatariosSelecionados] = useState<string[]>([]);
  const [msgTitulo, setMsgTitulo] = useState('');
  const [msgTexto, setMsgTexto] = useState('');
  const [enviandoMsg, setEnviandoMsg] = useState(false);

  const carregarDadosAvancados = useCallback(async () => {
    if (!barbeiroId) return;
    setCarregando(true);

    try {
      // 1. Carrega clientes bloqueados
      const { data: dataBloqueios } = await supabase
        .from('bloqueios_clientes')
        .select('*')
        .eq('barbeiro_id', barbeiroId)
        .order('criado_em', { ascending: false });

      // 2. Carrega equipe de funcionários
      const { data: dataEquipe } = await supabase
        .from('equipe_barbearia')
        .select('*')
        .eq('barbeiro_id', barbeiroId)
        .order('criado_em', { ascending: false });

      // 3. Carrega clientes na fila de espera
      const { data: dataFila } = await supabase
        .from('fila_espera')
        .select(`
          id, cliente_id,
          cliente:cliente_id ( id, nome_completo, telefone, email )
        `)
        .eq('status', 'aguardando');

      // 4. Carrega todos os perfis de clientes cadastrados no app (com email e telefone)
      const { data: dataPerfis } = await supabase
        .from('perfis')
        .select('id, nome_completo, email, telefone')
        .eq('role', 'cliente')
        .order('nome_completo', { ascending: true });

      // 5. Carrega agendamentos da semana (próximos 7 dias)
      const hoje = new Date();
      const fimSemana = new Date();
      fimSemana.setDate(hoje.getDate() + 7);
      const { data: dataSemana } = await supabase
        .from('agendamentos')
        .select(`
          id, cliente_id, data_hora, status,
          cliente:cliente_id ( id, nome_completo, telefone ),
          servico:servico_id ( id, nome )
        `)
        .gte('data_hora', hoje.toISOString().slice(0, 10) + 'T00:00:00Z')
        .lte('data_hora', fimSemana.toISOString().slice(0, 10) + 'T23:59:59Z')
        .neq('status', 'cancelado')
        .order('data_hora', { ascending: true });

      setBloqueados(dataBloqueios || []);
      setEquipe(dataEquipe || []);
      setClientesFila((dataFila ?? []) as unknown as ItemFila[]);
      setTodosClientesApp((dataPerfis ?? []) as unknown as ClientePerfil[]);
      setAgendamentosSemana((dataSemana ?? []) as unknown as AgendamentoItemSimples[]);
    } catch {
      // fallback
    } finally {
      setCarregando(false);
    }
  }, [barbeiroId]);

  useEffect(() => {
    carregarDadosAvancados();
  }, [carregarDadosAvancados]);

  // Serviço selecionado no Encaixe (para a colinha de combo)
  const servicoSelecionadoEncaixe = useMemo(() => {
    return servicos.find((s) => s.id === encaixeServicoId) || servicos[0];
  }, [servicos, encaixeServicoId]);

  // Filtro de busca de clientes cadastrados no app para o ENCAIXE (Nome, E-mail ou Telefone)
  const clientesFiltradosEncaixe = useMemo(() => {
    const termo = buscaClienteEncaixe.trim().toLowerCase();
    if (!termo) return [];
    return todosClientesApp.filter((c) => {
      const nome = (c.nome_completo || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const tel = (c.telefone || '').replace(/\D/g, '');
      const termoNum = termo.replace(/\D/g, '');
      return (
        nome.includes(termo) ||
        email.includes(termo) ||
        (termoNum && tel.includes(termoNum))
      );
    });
  }, [todosClientesApp, buscaClienteEncaixe]);

  function selecionarClienteParaEncaixe(c: ClientePerfil) {
    setEncaixeClienteId(c.id);
    setEncaixeNomeManual(c.nome_completo || 'Cliente do App');
    setEncaixeTelefoneManual(c.telefone || '');
    setEncaixeEmailManual(c.email || '');
    setBuscaClienteEncaixe('');
  }

  function limparSelecaoClienteEncaixe() {
    setEncaixeClienteId(null);
    setEncaixeNomeManual('');
    setEncaixeTelefoneManual('');
    setEncaixeEmailManual('');
    setBuscaClienteEncaixe('');
  }

  // Filtro de busca de clientes para BLOQUEIO (Nome, E-mail ou Telefone)
  const clientesFiltradosBloqueio = useMemo(() => {
    const termo = buscaClienteBloqueio.trim().toLowerCase();
    if (!termo) return [];
    return todosClientesApp.filter((c) => {
      const nome = (c.nome_completo || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const tel = (c.telefone || '').replace(/\D/g, '');
      const termoNum = termo.replace(/\D/g, '');
      return (
        nome.includes(termo) ||
        email.includes(termo) ||
        (termoNum && tel.includes(termoNum))
      );
    });
  }, [todosClientesApp, buscaClienteBloqueio]);

  function selecionarClienteParaBloqueio(c: ClientePerfil) {
    setBloqueioClienteId(c.id);
    setBloqueioNome(c.nome_completo || 'Cliente');
    setBloqueioEmail(c.email || '');
    setBloqueioTelefone(c.telefone || '');
    setBuscaClienteBloqueio('');
  }

  function limparSelecaoClienteBloqueio() {
    setBloqueioClienteId(null);
    setBloqueioNome('');
    setBloqueioEmail('');
    setBloqueioTelefone('');
    setBuscaClienteBloqueio('');
  }

  // ─── MENSAGEM EM GRUPO (HOJE / SEMANA / FILA / TODOS) ───
  function abrirModalMensagemGrupo() {
    setMsgTitulo('');
    setMsgTexto('');
    setGrupoDestino('hoje');

    const idsHoje = Array.from(
      new Set(
        agendamentosHoje
          .filter((a) => a.status !== 'cancelado' && a.cliente.id)
          .map((a) => a.cliente.id)
      )
    );
    setDestinatariosSelecionados(idsHoje);
    setModalMensagemGrupoAberto(true);
  }

  function handleMudarGrupoDestino(novoGrupo: GrupoMensagem) {
    setGrupoDestino(novoGrupo);
    if (novoGrupo === 'hoje') {
      const idsHoje = Array.from(
        new Set(
          agendamentosHoje
            .filter((a) => a.status !== 'cancelado' && a.cliente.id)
            .map((a) => a.cliente.id)
        )
      );
      setDestinatariosSelecionados(idsHoje);
    } else if (novoGrupo === 'semana') {
      const idsSemana = Array.from(
        new Set(
          agendamentosSemana
            .filter((a) => a.status !== 'cancelado' && a.cliente?.id)
            .map((a) => a.cliente.id)
        )
      );
      setDestinatariosSelecionados(idsSemana);
    } else if (novoGrupo === 'fila') {
      const idsFila = Array.from(
        new Set(clientesFila.filter((f) => f.cliente_id).map((f) => f.cliente_id))
      );
      setDestinatariosSelecionados(idsFila);
    } else if (novoGrupo === 'todos') {
      const idsTodos = todosClientesApp.map((c) => c.id);
      setDestinatariosSelecionados(idsTodos);
    }
  }

  function toggleDestinatario(clienteId: string) {
    setDestinatariosSelecionados((prev) =>
      prev.includes(clienteId) ? prev.filter((id) => id !== clienteId) : [...prev, clienteId]
    );
  }

  async function handleDispararMensagemGrupo() {
    if (!msgTitulo.trim() || !msgTexto.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha o título e a mensagem do aviso.');
      return;
    }

    if (destinatariosSelecionados.length === 0) {
      Alert.alert('Sem destinatários', 'Selecione pelo menos um cliente para receber a mensagem.');
      return;
    }

    setEnviandoMsg(true);
    try {
      const registros = destinatariosSelecionados.map((clienteId) => ({
        usuario_id: clienteId,
        titulo: msgTitulo.trim(),
        mensagem: msgTexto.trim(),
        tipo: 'aviso_barbeiro',
        dados: { enviado_em: new Date().toISOString() },
      }));

      const { error } = await supabase.from('notifications').insert(registros);
      if (error) throw error;

      setModalMensagemGrupoAberto(false);
      Alert.alert(
        'Mensagem Enviada! 📢',
        `A notificação foi entregue para os ${destinatariosSelecionados.length} cliente(s) selecionados.`
      );
    } catch (err: any) {
      Alert.alert('Erro ao enviar mensagem', err.message || 'Tente novamente.');
    } finally {
      setEnviandoMsg(false);
    }
  }

  // ─── AÇÕES DE ENCAIXE ───
  async function handleSalvarEncaixe() {
    const servicoEscolhido = servicos.find((s) => s.id === encaixeServicoId) || servicos[0];
    if (!servicoEscolhido) {
      Alert.alert('Selecione um serviço', 'Escolha o serviço do agendamento.');
      return;
    }

    setSalvandoEncaixe(true);
    try {
      const hojeStr = new Date().toISOString().slice(0, 10);
      const dataHoraIso = new Date(`${hojeStr}T${encaixeHora}:00`).toISOString();

      await criarReservaManual({
        clienteId: encaixeClienteId || undefined,
        nomeCliente: encaixeNomeManual.trim() || undefined,
        telefone: encaixeTelefoneManual.trim() || undefined,
        servicoId: servicoEscolhido.id,
        dataHora: dataHoraIso,
      });

      setModalEncaixeAberto(false);
      limparSelecaoClienteEncaixe();
      Alert.alert('Reserva Confirmada! ✂️', `Encaixe marcado com sucesso para hoje às ${encaixeHora}.`);
    } catch (err: any) {
      Alert.alert('Erro ao criar reserva', err.message || 'Tente novamente.');
    } finally {
      setSalvandoEncaixe(false);
    }
  }

  // ─── AÇÕES DE BLOQUEIO (LISTA NEGRA) ───
  async function handleSalvarBloqueio() {
    if (!bloqueioEmail.trim() && !bloqueioTelefone.trim() && !bloqueioClienteId) {
      Alert.alert('Atenção', 'Selecione um cliente ou informe um e-mail ou telefone para bloquear.');
      return;
    }

    setSalvandoBloqueio(true);
    try {
      const { error } = await supabase.from('bloqueios_clientes').insert({
        barbeiro_id: barbeiroId,
        cliente_id: bloqueioClienteId || null,
        email: bloqueioEmail.trim().toLowerCase() || null,
        telefone: bloqueioTelefone.replace(/\D/g, '') || null,
        motivo: bloqueioMotivo.trim() || 'Bloqueio de acesso pelo barbeiro',
      });

      if (error) throw error;

      await carregarDadosAvancados();
      setModalBloqueioAberto(false);
      limparSelecaoClienteBloqueio();
      setBloqueioMotivo('');
      Alert.alert('Cliente Bloqueado 🚫', 'O cliente selecionado foi adicionado à lista negra e receberá tela de manutenção.');
    } catch (err: any) {
      Alert.alert('Erro ao bloquear', err.message || 'Não foi possível bloquear o cliente.');
    } finally {
      setSalvandoBloqueio(false);
    }
  }

  async function handleDesbloquear(bloqueioId: string) {
    Alert.alert('Desbloquear Cliente', 'Deseja remover o bloqueio e restaurar o acesso deste cliente ao aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, Desbloquear',
        onPress: async () => {
          try {
            const { error } = await supabase.from('bloqueios_clientes').delete().eq('id', bloqueioId);
            if (error) throw error;
            setBloqueados((prev) => prev.filter((b) => b.id !== bloqueioId));
            Alert.alert('Desbloqueado 🔓', 'O acesso do cliente foi liberado com sucesso.');
          } catch (err: any) {
            Alert.alert('Erro ao desbloquear', err.message || 'Tente novamente.');
          }
        },
      },
    ]);
  }

  // ─── AÇÕES DE EQUIPE ───
  async function handleSalvarFuncionario() {
    if (!funcNome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do funcionário.');
      return;
    }

    setSalvandoFunc(true);
    try {
      const { error } = await supabase.from('equipe_barbearia').insert({
        barbeiro_id: barbeiroId,
        nome: funcNome.trim(),
        email: funcEmail.trim().toLowerCase() || null,
        telefone: funcTelefone.trim() || null,
        cargo: funcCargo.trim() || 'Barbeiro',
        ativo: true,
      });

      if (error) throw error;

      await carregarDadosAvancados();
      setModalFuncionarioAberto(false);
      setFuncNome('');
      setFuncEmail('');
      setFuncTelefone('');
      Alert.alert('Funcionário Adicionado! 💈', `O novo profissional foi registrado na equipe da ${barbearia?.nome || 'sua barbearia'}.`);
    } catch (err: any) {
      Alert.alert('Erro ao adicionar funcionário', err.message || 'Tente novamente.');
    } finally {
      setSalvandoFunc(false);
    }
  }

  // ─── AÇÕES DE VAGAS DA TARDE (COM AVISO DE TARDE FECHADA POR JUSTIÇA) ───
  async function handleLiberarVagasTarde() {
    if (tardeHorarios.length === 0) {
      Alert.alert('Selecione horários', 'Marque pelo menos um horário da tarde.');
      return;
    }
    if (!barbeiroId) {
      Alert.alert('Erro', 'Barbeiro não autenticado.');
      return;
    }
    if (!barbearia?.id) {
      Alert.alert('Erro', 'Nenhuma barbearia ativa selecionada.');
      return;
    }

    setSalvandoVagasTarde(true);
    try {
      const hoje = new Date();
      const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

      // 1. Tenta a RPC atômica
      const { error: erroRpc } = await supabase.rpc('liberar_vagas_tarde_rpc', {
        p_barbearia_id: barbearia.id,
        p_barbeiro_id: barbeiroId,
        p_data: hojeStr,
        p_horarios: tardeHorarios,
      });

      if (erroRpc) {
        console.warn('RPC liberar_vagas_tarde_rpc falhou, executando gravação padrão:', erroRpc.message);

        // Fallback
        const diaSemana = hoje.getDay();
        const diffSeg = diaSemana === 0 ? -6 : 1 - diaSemana;
        const segunda = new Date(hoje);
        segunda.setDate(hoje.getDate() + diffSeg);
        const domingo = new Date(segunda);
        domingo.setDate(segunda.getDate() + 6);

        const inicioSemana = `${segunda.getFullYear()}-${String(segunda.getMonth() + 1).padStart(2, '0')}-${String(segunda.getDate()).padStart(2, '0')}`;
        const fimSemana = `${domingo.getFullYear()}-${String(domingo.getMonth() + 1).padStart(2, '0')}-${String(domingo.getDate()).padStart(2, '0')}`;

        const { data: agenda, error: erroAgenda } = await supabase
          .from('agendas_semanais')
          .upsert(
            {
              barbearia_id: barbearia.id,
              barbeiro_id: barbeiroId,
              data_inicio: inicioSemana,
              data_fim: fimSemana,
              status: 'aberta',
              notificar_abertura: true,
            },
            { onConflict: 'barbearia_id,barbeiro_id,data_inicio' }
          )
          .select('id')
          .single();

        if (erroAgenda || !agenda) {
          throw new Error(erroAgenda?.message || 'Erro ao obter agenda semanal.');
        }

        let { data: diaExistente } = await supabase
          .from('dias_agenda')
          .select('id')
          .eq('agenda_semana_id', agenda.id)
          .eq('data', hojeStr)
          .maybeSingle();

        let diaId = diaExistente?.id;
        if (!diaId) {
          const { data: novoDia, error: erroDia } = await supabase
            .from('dias_agenda')
            .insert({
              agenda_semana_id: agenda.id,
              barbearia_id: barbearia.id,
              data: hojeStr,
              ativo: true,
            })
            .select('id')
            .single();
          if (erroDia || !novoDia) {
            throw new Error(erroDia?.message || 'Erro ao registrar dia na agenda.');
          }
          diaId = novoDia.id;
        } else {
          await supabase
            .from('dias_agenda')
            .update({ ativo: true, barbearia_id: barbearia.id })
            .eq('id', diaId);
        }

        const slotsTarde = tardeHorarios.map((hora) => ({
          barbearia_id: barbearia.id,
          dia_agenda_id: diaId,
          barbeiro_id: barbeiroId,
          data_hora: new Date(`${hojeStr}T${hora}:00`).toISOString(),
          ativo: true,
        }));

        const { error: erroSlots } = await supabase
          .from('slots_agenda')
          .upsert(slotsTarde, { onConflict: 'barbearia_id,barbeiro_id,data_hora' });

        if (erroSlots) {
          throw new Error(erroSlots.message);
        }
      }

      // REGRA DE JUSTIÇA: Marca a tarde como FECHADA para ordem de chegada
      await alternarTardeFechada(true);

      // Dispara aviso para TODOS os clientes informando que hoje à tarde não haverá ordem de chegada
      await supabase.rpc('notificar_todos_clientes', {
        p_titulo: 'Aviso: Turno da Tarde Exclusivo por Agendamento 💈',
        p_mensagem: 'Informamos que hoje à tarde não haverá atendimento por ordem de chegada. O atendimento será exclusivo para agendamentos liberados no aplicativo.',
        p_tipo: 'aviso_funcionamento',
        p_dados: { data: hojeStr, horarios: tardeHorarios },
      });

      setModalVagasTardeAberto(false);
      Alert.alert(
        'Vagas da Tarde Liberadas! 🚀',
        `${tardeHorarios.length} horários foram abertos no app. O aviso de fechamento da ordem de chegada foi ativado automaticamente para evitar filas e garantir justiça!`
      );
    } catch (err: any) {
      Alert.alert('Erro ao liberar vagas', err.message || 'Tente novamente.');
    } finally {
      setSalvandoVagasTarde(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.botaoVoltar} activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.textoPrimario} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Opções Avançadas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── CARD 1: MENSAGEM EM GRUPO ─── */}
        <View style={[styles.secaoCard, { backgroundColor: theme.superficie, borderColor: theme.borda, borderWidth: 1 }]}>
          <View style={styles.secaoHeaderLinha}>
            <View style={[styles.secaoIconeBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <MessageSquare size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.secaoCardTitulo, { color: theme.textoPrimario }]}>Mensagem em Grupo</Text>
              <Text style={[styles.secaoCardSubtitulo, { color: theme.textoSecundario }]}>
                Envie notificações diretas para grupos: hoje, semana, fila de espera ou todos os clientes, com opção de desmarcar pessoas específicas.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.botaoAcaoPrincipal, { backgroundColor: '#3B82F6' }]}
            onPress={abrirModalMensagemGrupo}
            activeOpacity={0.8}
          >
            <Send size={16} color="#FFFFFF" />
            <Text style={[styles.botaoAcaoPrincipalTexto, { color: '#FFFFFF' }]}>Disparar Mensagem em Grupo</Text>
          </TouchableOpacity>
        </View>

        {/* ─── CARD 2: RESERVA & ENCAIXE MANUAL ─── */}
        <View style={[styles.secaoCard, { backgroundColor: theme.superficie, borderColor: theme.borda, borderWidth: 1 }]}>
          <View style={styles.secaoHeaderLinha}>
            <View style={[styles.secaoIconeBadge, { backgroundColor: theme.ouroTranslucido }]}>
              <CalendarPlus size={20} color={theme.ouroTexto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.secaoCardTitulo, { color: theme.textoPrimario }]}>Reserva / Encaixe de Clientes</Text>
              <Text style={[styles.secaoCardSubtitulo, { color: theme.textoSecundario }]}>
                Pesquise clientes cadastrados por nome, e-mail ou telefone, ou preencha manualmente com colinha discreta dos combos.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.botaoAcaoPrincipal, { backgroundColor: theme.ouro }]}
            onPress={() => {
              setEncaixeServicoId(servicos[0]?.id || '');
              setModalEncaixeAberto(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={16} color={theme.textoEscuroSobreOuro} />
            <Text style={[styles.botaoAcaoPrincipalTexto, { color: theme.textoEscuroSobreOuro }]}>Fazer Reserva / Encaixe de Cliente</Text>
          </TouchableOpacity>
        </View>

        {/* ─── CARD 3: LISTA NEGRA (BLOQUEIO) ─── */}
        <View style={[styles.secaoCard, { backgroundColor: theme.superficie, borderColor: theme.borda, borderWidth: 1 }]}>
          <View style={styles.secaoHeaderLinha}>
            <View style={[styles.secaoIconeBadge, styles.iconeBadgeVermelho]}>
              <Ban size={20} color={Colors.erro} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.secaoCardTitulo}>Lista Negra & Bloqueio</Text>
              <Text style={styles.secaoCardSubtitulo}>
                Bloqueie o acesso de clientes ao app pesquisando por nome, e-mail ou telefone. Eles verão a tela de manutenção.
              </Text>
            </View>
          </View>

          {bloqueados.length > 0 ? (
            <View style={styles.listaBloqueados}>
              {bloqueados.map((b) => (
                <View key={b.id} style={styles.itemBloqueado}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.itemBloqueadoIdent}>
                      {b.email || b.telefone || 'Cliente Bloqueado'}
                    </Text>
                    <Text style={styles.itemBloqueadoMotivo} numberOfLines={1}>
                      {b.motivo || 'Bloqueado pelo barbeiro'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.botaoDesbloquear}
                    onPress={() => handleDesbloquear(b.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.botaoDesbloquearTexto}>Desbloquear</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.textoVazioSecao}>Nenhum cliente bloqueado no momento.</Text>
          )}

          <TouchableOpacity
            style={[styles.botaoAcaoSecundario, { borderColor: 'rgba(229, 57, 53, 0.4)' }]}
            onPress={() => {
              limparSelecaoClienteBloqueio();
              setModalBloqueioAberto(true);
            }}
            activeOpacity={0.8}
          >
            <Ban size={16} color={Colors.erro} />
            <Text style={[styles.botaoAcaoSecundarioTexto, { color: Colors.erro }]}>
              Bloquear Novo Cliente
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── CARD 4: ADICIONAR FUNCIONÁRIO ─── */}
        <View style={styles.secaoCard}>
          <View style={styles.secaoHeaderLinha}>
            <View style={styles.secaoIconeBadge}>
              <Users size={20} color={Colors.ouro} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.secaoCardTitulo}>Equipe da Barbearia</Text>
              <Text style={styles.secaoCardSubtitulo}>
                Cadastre outros barbeiros ou funcionários para a {barbearia?.nome || 'sua barbearia'}.
              </Text>
            </View>
          </View>

          {equipe.length > 0 ? (
            <View style={styles.listaBloqueados}>
              {equipe.map((f) => (
                <View key={f.id} style={styles.itemBloqueado}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.itemBloqueadoIdent}>{f.nome}</Text>
                    <Text style={styles.itemBloqueadoMotivo}>
                      {f.cargo} · {f.telefone || f.email || 'Sem contato'}
                    </Text>
                  </View>
                  <View style={styles.badgeAtivo}>
                    <Text style={styles.badgeAtivoTexto}>{f.ativo ? 'Ativo' : 'Inativo'}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.textoVazioSecao}>Apenas você está cadastrado na equipe.</Text>
          )}

          <TouchableOpacity
            style={styles.botaoAcaoPrincipal}
            onPress={() => setModalFuncionarioAberto(true)}
            activeOpacity={0.8}
          >
            <UserPlus size={16} color="#FFFFFF" />
            <Text style={styles.botaoAcaoPrincipalTexto}>+ Adicionar Novo Funcionário</Text>
          </TouchableOpacity>
        </View>

        {/* ─── CARD 5: AGENDAMENTO À TARDE (DIMINUIR FILA DE ESPERA) ─── */}
        <View style={styles.secaoCard}>
          <View style={styles.secaoHeaderLinha}>
            <View style={styles.secaoIconeBadge}>
              <Clock size={20} color={Colors.ouro} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.secaoCardTitulo}>Agendamentos à Tarde</Text>
              <Text style={styles.secaoCardSubtitulo}>
                Abra vagas agendáveis na tarde para diminuir a lista de espera. Avisa automaticamente que a ordem de chegada estará suspensa para garantir justiça.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.botaoAcaoPrincipal}
            onPress={() => setModalVagasTardeAberto(true)}
            activeOpacity={0.8}
          >
            <Clock size={16} color="#FFFFFF" />
            <Text style={styles.botaoAcaoPrincipalTexto}>Liberar Vagas da Tarde Hoje</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── MODAL: MENSAGEM EM GRUPO (HOJE / SEMANA / FILA / TODOS) ─── */}
      <Modal visible={modalMensagemGrupoAberto} transparent animationType="fade" onRequestClose={() => setModalMensagemGrupoAberto(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalMensagemGrupoAberto(false)}>
          <Pressable style={styles.modalConteudoGrande} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={20} color="#3B82F6" />
                <Text style={styles.modalTitulo}>Mensagem em Grupo</Text>
              </View>
              <TouchableOpacity onPress={() => setModalMensagemGrupoAberto(false)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Seleção do Grupo de Destinatários */}
              <Text style={styles.labelCampo}>SELECIONE O GRUPO DE CLIENTES</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, grupoDestino === 'hoje' && styles.chipAtivoAzul]}
                  onPress={() => handleMudarGrupoDestino('hoje')}
                >
                  <Text style={[styles.chipTexto, grupoDestino === 'hoje' && styles.chipTextoAtivo]}>
                    📅 Hoje
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, grupoDestino === 'semana' && styles.chipAtivoAzul]}
                  onPress={() => handleMudarGrupoDestino('semana')}
                >
                  <Text style={[styles.chipTexto, grupoDestino === 'semana' && styles.chipTextoAtivo]}>
                    🗓️ Semana
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, grupoDestino === 'fila' && styles.chipAtivoAzul]}
                  onPress={() => handleMudarGrupoDestino('fila')}
                >
                  <Text style={[styles.chipTexto, grupoDestino === 'fila' && styles.chipTextoAtivo]}>
                    ⏳ Fila de Espera
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, grupoDestino === 'todos' && styles.chipAtivoAzul]}
                  onPress={() => handleMudarGrupoDestino('todos')}
                >
                  <Text style={[styles.chipTexto, grupoDestino === 'todos' && styles.chipTextoAtivo]}>
                    👥 Todos os Clientes
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Lista de Destinatários com Checkbox para Desmarcar Específicos */}
              <Text style={[styles.labelCampo, { marginTop: 12 }]}>
                DESTINATÁRIOS ({destinatariosSelecionados.length} selecionados)
              </Text>
              <Text style={styles.instrucaoTexto}>
                Toque no cliente para desmarcar caso NÃO deseje enviar para ele:
              </Text>

              <View style={styles.listaDestinatarios}>
                {grupoDestino === 'hoje' ? (
                  agendamentosHoje.filter((a) => a.status !== 'cancelado' && a.cliente.id).length === 0 ? (
                    <Text style={styles.textoVazioSecao}>Nenhum agendamento ativo hoje.</Text>
                  ) : (
                    agendamentosHoje
                      .filter((a) => a.status !== 'cancelado' && a.cliente.id)
                      .map((a) => {
                        const selecionado = destinatariosSelecionados.includes(a.cliente.id);
                        return (
                          <TouchableOpacity
                            key={a.id}
                            style={[styles.itemDestinatario, !selecionado && styles.itemDestinatarioDesmarcado]}
                            onPress={() => toggleDestinatario(a.cliente.id)}
                            activeOpacity={0.7}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.destinatarioNome, !selecionado && styles.destinatarioNomeDesmarcado]}>
                                {a.cliente.nome_completo || 'Cliente'}
                              </Text>
                              <Text style={styles.destinatarioSub}>
                                Hoje às {new Date(a.data_hora).getHours().toString().padStart(2, '0')}:{new Date(a.data_hora).getMinutes().toString().padStart(2, '0')} · {a.servico.nome}
                              </Text>
                            </View>
                            {selecionado ? <UserCheck size={18} color="#3B82F6" /> : <UserX size={18} color="#636366" />}
                          </TouchableOpacity>
                        );
                      })
                  )
                ) : grupoDestino === 'semana' ? (
                  agendamentosSemana.filter((a) => a.cliente?.id).length === 0 ? (
                    <Text style={styles.textoVazioSecao}>Nenhum agendamento para os próximos dias.</Text>
                  ) : (
                    agendamentosSemana
                      .filter((a) => a.cliente?.id)
                      .map((a) => {
                        const selecionado = destinatariosSelecionados.includes(a.cliente.id);
                        const dataFmt = new Date(a.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const horaFmt = new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <TouchableOpacity
                            key={a.id}
                            style={[styles.itemDestinatario, !selecionado && styles.itemDestinatarioDesmarcado]}
                            onPress={() => toggleDestinatario(a.cliente.id)}
                            activeOpacity={0.7}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.destinatarioNome, !selecionado && styles.destinatarioNomeDesmarcado]}>
                                {a.cliente.nome_completo || 'Cliente'}
                              </Text>
                              <Text style={styles.destinatarioSub}>
                                {dataFmt} às {horaFmt} · {a.servico.nome}
                              </Text>
                            </View>
                            {selecionado ? <UserCheck size={18} color="#3B82F6" /> : <UserX size={18} color="#636366" />}
                          </TouchableOpacity>
                        );
                      })
                  )
                ) : grupoDestino === 'fila' ? (
                  clientesFila.length === 0 ? (
                    <Text style={styles.textoVazioSecao}>Ninguém na fila de espera no momento.</Text>
                  ) : (
                    clientesFila.map((f) => {
                      const selecionado = destinatariosSelecionados.includes(f.cliente_id);
                      return (
                        <TouchableOpacity
                          key={f.id}
                          style={[styles.itemDestinatario, !selecionado && styles.itemDestinatarioDesmarcado]}
                          onPress={() => toggleDestinatario(f.cliente_id)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.destinatarioNome, !selecionado && styles.destinatarioNomeDesmarcado]}>
                              {f.cliente?.nome_completo || 'Cliente na Fila'}
                            </Text>
                            <Text style={styles.destinatarioSub}>{f.cliente?.telefone || 'Fila de espera ativa'}</Text>
                          </View>
                          {selecionado ? <UserCheck size={18} color="#3B82F6" /> : <UserX size={18} color="#636366" />}
                        </TouchableOpacity>
                      );
                    })
                  )
                ) : (
                  todosClientesApp.length === 0 ? (
                    <Text style={styles.textoVazioSecao}>Nenhum cliente cadastrado no app.</Text>
                  ) : (
                    todosClientesApp.map((c) => {
                      const selecionado = destinatariosSelecionados.includes(c.id);
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.itemDestinatario, !selecionado && styles.itemDestinatarioDesmarcado]}
                          onPress={() => toggleDestinatario(c.id)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.destinatarioNome, !selecionado && styles.destinatarioNomeDesmarcado]}>
                              {c.nome_completo || 'Cliente'}
                            </Text>
                            <Text style={styles.destinatarioSub}>{c.telefone || c.email || 'Cliente do app'}</Text>
                          </View>
                          {selecionado ? <UserCheck size={18} color="#3B82F6" /> : <UserX size={18} color="#636366" />}
                        </TouchableOpacity>
                      );
                    })
                  )
                )}
              </View>

              {/* Campos da Mensagem */}
              <Text style={[styles.labelCampo, { marginTop: 12 }]}>TÍTULO DO AVISO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Aviso sobre o atendimento"
                placeholderTextColor="#636366"
                value={msgTitulo}
                onChangeText={setMsgTitulo}
              />

              <Text style={styles.labelCampo}>MENSAGEM / COMUNICADO</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                multiline
                placeholder="Digite a mensagem que todos os selecionados receberão em formato de notificação..."
                placeholderTextColor="#636366"
                value={msgTexto}
                onChangeText={setMsgTexto}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.botaoConfirmar, { backgroundColor: '#3B82F6' }]}
              onPress={handleDispararMensagemGrupo}
              disabled={enviandoMsg}
            >
              {enviandoMsg ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botaoConfirmarTexto}>
                  Enviar para {destinatariosSelecionados.length} Cliente(s)
                </Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── MODAL: ENCAIXE COM PESQUISA DE CLIENTES (NOME, EMAIL, TEL) & COLINHA DE COMBOS ─── */}
      <Modal visible={modalEncaixeAberto} transparent animationType="fade" onRequestClose={() => setModalEncaixeAberto(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalEncaixeAberto(false)}>
          <Pressable style={styles.modalConteudoGrande} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarPlus size={20} color={Colors.ouro} />
                <Text style={styles.modalTitulo}>Nova Reserva / Encaixe</Text>
              </View>
              <TouchableOpacity onPress={() => setModalEncaixeAberto(false)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Horário */}
              <Text style={styles.labelCampo}>HORÁRIO DO ENCAIXE</Text>
              <View style={styles.chipsRow}>
                {HORARIOS_ENCAIXE.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.chip, encaixeHora === h && styles.chipAtivo]}
                    onPress={() => setEncaixeHora(h)}
                  >
                    <Text style={[styles.chipTexto, encaixeHora === h && styles.chipTextoAtivo]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Serviço com Colinha de Combos */}
              <Text style={styles.labelCampo}>SERVIÇO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {servicos.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chipServico, encaixeServicoId === s.id && styles.chipServicoAtivo]}
                      onPress={() => setEncaixeServicoId(s.id)}
                    >
                      <Text style={[styles.chipServicoNome, encaixeServicoId === s.id && styles.chipServicoNomeAtivo]}>
                        {s.nome}
                      </Text>
                      <Text style={[styles.chipServicoPreco, encaixeServicoId === s.id && styles.chipServicoPrecoAtivo]}>
                        {Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Colinha Discreta e Resumida do Combo Selecionado */}
              {servicoSelecionadoEncaixe && servicoSelecionadoEncaixe.descricao && (
                <View style={styles.colinhaComboWrapper}>
                  <View style={styles.colinhaIconeBadge}>
                    <Sparkles size={13} color={Colors.ouro} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.colinhaTitulo}>
                      {servicoSelecionadoEncaixe.nome}
                    </Text>
                    <Text style={styles.colinhaDescricao}>
                      {servicoSelecionadoEncaixe.descricao}
                    </Text>
                  </View>
                </View>
              )}

              {/* Busca de Clientes do App (Nome, E-mail ou Telefone) */}
              <Text style={[styles.labelCampo, { marginTop: 12 }]}>
                PESQUISAR CLIENTE (NOME, E-MAIL OU TELEFONE)
              </Text>
              
              {encaixeClienteId ? (
                <View style={styles.cardClienteSelecionado}>
                  <View style={styles.avatarClienteSelecionado}>
                    <User size={18} color={Colors.ouro} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.nomeClienteSelecionado}>{encaixeNomeManual}</Text>
                    <Text style={styles.telClienteSelecionado}>
                      {encaixeTelefoneManual || encaixeEmailManual || 'Cliente cadastrado no app'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={limparSelecaoClienteEncaixe} style={styles.btnRemoverCliente}>
                    <X size={16} color={Colors.erro} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.buscaInputWrapper}>
                    <Search size={16} color="#8E8E93" />
                    <TextInput
                      style={styles.buscaInput}
                      placeholder="Digite nome, email ou telefone..."
                      placeholderTextColor="#636366"
                      value={buscaClienteEncaixe}
                      onChangeText={setBuscaClienteEncaixe}
                    />
                    {buscaClienteEncaixe.length > 0 && (
                      <TouchableOpacity onPress={() => setBuscaClienteEncaixe('')}>
                        <X size={16} color="#8E8E93" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Resultados da busca */}
                  {clientesFiltradosEncaixe.length > 0 && (
                    <View style={styles.resultadosBusca}>
                      {clientesFiltradosEncaixe.slice(0, 5).map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.itemResultadoBusca}
                          onPress={() => selecionarClienteParaEncaixe(c)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultadoNome}>{c.nome_completo || 'Cliente'}</Text>
                            <Text style={styles.resultadoTel}>
                              {c.telefone || c.email || 'Cliente do app'}
                            </Text>
                          </View>
                          <View style={styles.badgeSelecionar}>
                            <Text style={styles.badgeSelecionarTexto}>Selecionar</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Digitação Manual / Avulsa */}
                  <Text style={[styles.labelCampo, { marginTop: 10 }]}>OU PREENCHER DADOS MANUALMENTE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome do cliente (ex: João Silva)"
                    placeholderTextColor="#636366"
                    value={encaixeNomeManual}
                    onChangeText={setEncaixeNomeManual}
                  />

                  <TextInput
                    style={[styles.input, { marginTop: 6 }]}
                    placeholder="Telefone / WhatsApp (ex: 86 99999-9999)"
                    placeholderTextColor="#636366"
                    keyboardType="phone-pad"
                    value={encaixeTelefoneManual}
                    onChangeText={setEncaixeTelefoneManual}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.botaoConfirmar} onPress={handleSalvarEncaixe} disabled={salvandoEncaixe}>
              {salvandoEncaixe ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoConfirmarTexto}>Confirmar Reserva / Encaixe</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── MODAL: BLOQUEIO (LISTA NEGRA) COM PESQUISA DE CLIENTES ─── */}
      <Modal visible={modalBloqueioAberto} transparent animationType="fade" onRequestClose={() => setModalBloqueioAberto(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalBloqueioAberto(false)}>
          <Pressable style={styles.modalConteudoGrande} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Bloquear Acesso (Lista Negra)</Text>
              <TouchableOpacity onPress={() => setModalBloqueioAberto(false)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {/* Pesquisa de Clientes Cadastrados */}
              <Text style={styles.labelCampo}>PESQUISAR CLIENTE CADASTRADO NO APP</Text>
              
              {bloqueioClienteId ? (
                <View style={[styles.cardClienteSelecionado, { borderColor: Colors.erro }]}>
                  <View style={[styles.avatarClienteSelecionado, { backgroundColor: 'rgba(229, 57, 53, 0.15)' }]}>
                    <Ban size={18} color={Colors.erro} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={styles.nomeClienteSelecionado}>{bloqueioNome}</Text>
                    <Text style={[styles.telClienteSelecionado, { color: Colors.erro }]}>
                      {bloqueioTelefone || bloqueioEmail || 'Cliente selecionado'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={limparSelecaoClienteBloqueio} style={styles.btnRemoverCliente}>
                    <X size={16} color={Colors.erro} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.buscaInputWrapper}>
                    <Search size={16} color="#8E8E93" />
                    <TextInput
                      style={styles.buscaInput}
                      placeholder="Buscar por nome, email ou telefone..."
                      placeholderTextColor="#636366"
                      value={buscaClienteBloqueio}
                      onChangeText={setBuscaClienteBloqueio}
                    />
                    {buscaClienteBloqueio.length > 0 && (
                      <TouchableOpacity onPress={() => setBuscaClienteBloqueio('')}>
                        <X size={16} color="#8E8E93" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Resultados da busca de bloqueio */}
                  {clientesFiltradosBloqueio.length > 0 && (
                    <View style={styles.resultadosBusca}>
                      {clientesFiltradosBloqueio.slice(0, 5).map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.itemResultadoBusca}
                          onPress={() => selecionarClienteParaBloqueio(c)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultadoNome}>{c.nome_completo || 'Cliente'}</Text>
                            <Text style={styles.resultadoTel}>
                              {c.telefone || c.email || 'Cliente do app'}
                            </Text>
                          </View>
                          <View style={[styles.badgeSelecionar, { backgroundColor: 'rgba(229, 57, 53, 0.15)', borderColor: 'rgba(229, 57, 53, 0.3)' }]}>
                            <Text style={[styles.badgeSelecionarTexto, { color: Colors.erro }]}>Bloquear</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={[styles.labelCampo, { marginTop: 10 }]}>OU DIGITE E-MAIL / TELEFONE MANUALMENTE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="cliente@email.com"
                    placeholderTextColor="#636366"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={bloqueioEmail}
                    onChangeText={setBloqueioEmail}
                  />

                  <TextInput
                    style={[styles.input, { marginTop: 6 }]}
                    placeholder="(86) 99999-9999"
                    placeholderTextColor="#636366"
                    keyboardType="phone-pad"
                    value={bloqueioTelefone}
                    onChangeText={setBloqueioTelefone}
                  />
                </>
              )}

              <Text style={[styles.labelCampo, { marginTop: 10 }]}>MOTIVO DO BLOQUEIO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Faltas repetidas sem aviso prévio"
                placeholderTextColor="#636366"
                value={bloqueioMotivo}
                onChangeText={setBloqueioMotivo}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.botaoConfirmar, { backgroundColor: Colors.erro }]}
              onPress={handleSalvarBloqueio}
              disabled={salvandoBloqueio}
            >
              {salvandoBloqueio ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoConfirmarTexto}>Bloquear Cliente</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── MODAL: ADICIONAR FUNCIONÁRIO ─── */}
      <Modal visible={modalFuncionarioAberto} transparent animationType="fade" onRequestClose={() => setModalFuncionarioAberto(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalFuncionarioAberto(false)}>
          <Pressable style={styles.modalConteudoGrande} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Adicionar Funcionário</Text>
              <TouchableOpacity onPress={() => setModalFuncionarioAberto(false)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.labelCampo}>NOME COMPLETO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Carlos Vieira"
                placeholderTextColor="#636366"
                value={funcNome}
                onChangeText={setFuncNome}
              />

              <Text style={styles.labelCampo}>E-MAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="carlos@barbearia.com"
                placeholderTextColor="#636366"
                keyboardType="email-address"
                autoCapitalize="none"
                value={funcEmail}
                onChangeText={setFuncEmail}
              />

              <Text style={styles.labelCampo}>TELEFONE</Text>
              <TextInput
                style={styles.input}
                placeholder="(86) 99999-9999"
                placeholderTextColor="#636366"
                keyboardType="phone-pad"
                value={funcTelefone}
                onChangeText={setFuncTelefone}
              />

              <Text style={styles.labelCampo}>CARGO</Text>
              <View style={styles.chipsRow}>
                {['Barbeiro', 'Barbeiro Júnior', 'Atendente'].map((cargo) => (
                  <TouchableOpacity
                    key={cargo}
                    style={[styles.chip, funcCargo === cargo && styles.chipAtivo]}
                    onPress={() => setFuncCargo(cargo)}
                  >
                    <Text style={[styles.chipTexto, funcCargo === cargo && styles.chipTextoAtivo]}>{cargo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.botaoConfirmar} onPress={handleSalvarFuncionario} disabled={salvandoFunc}>
              {salvandoFunc ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.botaoConfirmarTexto}>Cadastrar Funcionário</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── MODAL: VAGAS DA TARDE (COM REGRA DE JUSTIÇA) ─── */}
      <Modal visible={modalVagasTardeAberto} transparent animationType="fade" onRequestClose={() => setModalVagasTardeAberto(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVagasTardeAberto(false)}>
          <Pressable style={styles.modalConteudoGrande} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Liberar Vagas da Tarde</Text>
              <TouchableOpacity onPress={() => setModalVagasTardeAberto(false)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescricaoTexto}>
              Marque os horários que deseja abrir para hoje à tarde. Ao liberar, o app automaticamente avisará a todos que a ordem de chegada estará fechada, garantindo justiça com os clientes.
            </Text>

            <View style={styles.chipsRow}>
              {HORARIOS_TARDE.map((hora) => {
                const ativo = tardeHorarios.includes(hora);
                return (
                  <TouchableOpacity
                    key={hora}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => {
                      if (ativo) {
                        setTardeHorarios((prev) => prev.filter((h) => h !== hora));
                      } else {
                        setTardeHorarios((prev) => [...prev, hora].sort());
                      }
                    }}
                  >
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{hora}</Text>
                    {ativo && <Check size={14} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.botaoConfirmar}
              onPress={handleLiberarVagasTarde}
              disabled={salvandoVagasTarde}
            >
              {salvandoVagasTarde ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botaoConfirmarTexto}>Liberar Vagas e Ativar Aviso da Tarde</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    botaoVoltar: { padding: 4 },
    titulo: { fontFamily: FontFamily.bold, fontSize: FontSize.headingSm, color: theme.textoPrimario },
    placeholder: { width: 32 },
    scroll: {
      padding: Spacing.telaH,
      gap: Spacing.md,
      paddingBottom: Spacing.giant,
    },
    secaoCard: {
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    secaoHeaderLinha: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    secaoIconeBadge: {
      width: 36,
      height: 36,
      borderRadius: Radii.sm,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconeBadgeVermelho: {
      backgroundColor: theme.erroClaro,
    },
    secaoCardTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
    },
    secaoCardSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      lineHeight: 16,
      marginTop: 2,
    },
    botaoAcaoPrincipal: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.vermelho,
      paddingVertical: 12,
      borderRadius: Radii.md,
      marginTop: 4,
    },
    botaoAcaoPrincipalTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: '#FFFFFF',
    },
    botaoAcaoSecundario: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.erroClaro,
      paddingVertical: 12,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.erro,
      marginTop: 4,
    },
    botaoAcaoSecundarioTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.erro,
    },
    listaBloqueados: {
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.xs,
      gap: 4,
    },
    itemBloqueado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
    },
    itemBloqueadoIdent: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
    },
    itemBloqueadoMotivo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
    },
    botaoDesbloquear: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radii.sm,
      backgroundColor: theme.verdeClaro,
      borderWidth: 1,
      borderColor: theme.verde,
    },
    botaoDesbloquearTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: theme.verde,
    },
    badgeAtivo: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: Radii.sm,
      backgroundColor: theme.ouroTranslucido,
    },
    badgeAtivoTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.labelXs,
      color: theme.ouroTexto,
    },
    textoVazioSecao: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoDesabilitado,
      fontStyle: 'italic',
      paddingVertical: 2,
    },
    listaDestinatarios: {
      backgroundColor: theme.superficie2,
      borderRadius: Radii.md,
      padding: Spacing.xs,
      gap: 4,
      maxHeight: 160,
    },
    itemDestinatario: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
    },
    itemDestinatarioDesmarcado: {
      opacity: 0.45,
    },
    destinatarioNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
    },
    destinatarioNomeDesmarcado: {
      color: theme.textoSecundario,
      textDecorationLine: 'line-through',
    },
    destinatarioSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
    },
    instrucaoTexto: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      marginBottom: 4,
    },

    /* Modais */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'flex-end',
    },
    modalConteudoGrande: {
      backgroundColor: theme.superficie,
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.giant,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: Spacing.xs,
      maxHeight: '90%',
    },
    modalTraco: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.bordaDestaque,
      alignSelf: 'center',
      marginBottom: Spacing.xs,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    modalTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
      color: theme.textoPrimario,
    },
    modalBtnFechar: { padding: 4 },
    modalDescricaoTexto: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
      lineHeight: 18,
      marginBottom: Spacing.xs,
    },
    labelCampo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
      letterSpacing: 0.5,
      marginTop: Spacing.sm,
      marginBottom: 4,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radii.sm,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    chipAtivo: {
      backgroundColor: theme.vermelho,
      borderColor: theme.vermelho,
    },
    chipAtivoAzul: {
      backgroundColor: '#2563EB',
      borderColor: '#3B82F6',
    },
    chipAtivoVermelho: {
      backgroundColor: theme.erro,
      borderColor: theme.erro,
    },
    chipTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    chipTextoAtivo: {
      color: '#FFFFFF',
      fontFamily: FontFamily.bold,
    },
    chipServico: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: Radii.sm,
      backgroundColor: theme.superficie2,
      borderWidth: 1,
      borderColor: theme.borda,
      gap: 2,
    },
    chipServicoAtivo: {
      backgroundColor: theme.ouroTranslucido,
      borderColor: theme.ouro,
    },
    chipServicoNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
    },
    chipServicoNomeAtivo: {
      color: theme.ouroTexto,
    },
    chipServicoPreco: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
    },
    chipServicoPrecoAtivo: {
      color: theme.ouroTexto,
    },

    /* Colinha de Combo */
    colinhaComboWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.ouroTranslucido,
      borderRadius: Radii.sm,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
      marginVertical: 4,
    },
    colinhaIconeBadge: {
      marginTop: 2,
    },
    colinhaTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: theme.ouroTexto,
      letterSpacing: 0.3,
    },
    colinhaDescricao: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
      lineHeight: 16,
    },

    input: {
      backgroundColor: theme.superficie2,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: theme.borda,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      color: theme.textoPrimario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
    },
    buscaInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.superficie2,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: theme.borda,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
    },
    buscaInput: {
      flex: 1,
      color: theme.textoPrimario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      padding: 0,
    },
    resultadosBusca: {
      backgroundColor: theme.superficie2,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: theme.borda,
      marginTop: 4,
      overflow: 'hidden',
    },
    itemResultadoBusca: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
    },
    resultadoNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
    },
    resultadoTel: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.textoSecundario,
    },
    badgeSelecionar: {
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    badgeSelecionarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: theme.ouroTexto,
    },
    cardClienteSelecionado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.superficie2,
      borderRadius: Radii.sm,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.ouro,
    },
    avatarClienteSelecionado: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nomeClienteSelecionado: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
    },
    telClienteSelecionado: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      color: theme.ouroTexto,
    },
    btnRemoverCliente: {
      padding: 6,
    },
    botaoConfirmar: {
      backgroundColor: theme.verde,
      paddingVertical: 14,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.md,
    },
    botaoConfirmarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: theme.textoEscuroSobreOuro,
    },
  });
