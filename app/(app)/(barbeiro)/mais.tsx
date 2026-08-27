import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarPlus,
  Scissors,
  Sliders,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  Sparkles,
  X,
  Edit3,
  Zap,
  Check,
  Store,
  Building2,
  Plus,
  Camera,
  Trash2,
  Tag,
  Clock,
  Palette,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LogoBarbearia } from '@/components';
import {
  IlustracaoServico,
  BIBLIOTECA_SERVICOS,
  type TipoServicoId,
} from '@/components/IlustracaoServico';
import { uploadImagemTenant, removerMidiaStorage } from '@/lib/storage';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { useAuth } from '@/hooks/useAuth';
import { useServicos, type Servico, type CategoriaServico, CATEGORIAS_CONFIG } from '@/hooks/useServicos';
import { supabase } from '@/lib/supabase';
import { useBarbearia } from '@/contexts/BarbeariaContext';

type TipoModal = 'servicos' | 'privacidade' | 'sair' | null;

export default function TelaBarbeiroMais() {
  const router = useRouter();
  const { perfil, carregandoPerfil } = usePerfil();
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;
  const { barbearia } = useBarbearia();
  const { servicos, recarregar: recarregarServicos } = useServicos('todos', barbearia?.id);

  const [modalAtivo, setModalAtivo] = useState<TipoModal>(null);

  // Estados de Criação / Edição Completa de Serviço
  const [modalEditorServico, setModalEditorServico] = useState(false);
  const [servicoEmEdicao, setServicoEmEdicao] = useState<Servico | null>(null);
  const [nomeForm, setNomeForm] = useState('');
  const [precoForm, setPrecoForm] = useState('');
  const [duracaoForm, setDuracaoForm] = useState('30');
  const [descricaoForm, setDescricaoForm] = useState('');
  const [categoriaForm, setCategoriaForm] = useState<CategoriaServico>('cortes');
  const [iconeForm, setIconeForm] = useState<TipoServicoId | null>('corte_degrade');
  const [imagemUrlForm, setImagemUrlForm] = useState<string | null>(null);
  const [corMolduraForm, setCorMolduraForm] = useState<string>('');
  const [enviandoFotoServico, setEnviandoFotoServico] = useState(false);
  const [salvandoServico, setSalvandoServico] = useState(false);

  // Estados de Reajuste Individual
  const [servicoParaReajuste, setServicoParaReajuste] = useState<Servico | null>(null);
  const [novoPrecoIndividual, setNovoPrecoIndividual] = useState('');
  const [dataVigenciaIndividual, setDataVigenciaIndividual] = useState('');
  const [justificativaIndividual, setJustificativaIndividual] = useState('');
  const [salvandoIndividual, setSalvandoIndividual] = useState(false);

  // Estados de Reajuste em Lote
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [dataVigenciaLote, setDataVigenciaLote] = useState('');
  const [justificativaLote, setJustificativaLote] = useState('');
  const [precosLote, setPrecosLote] = useState<Record<string, string>>({});
  const [salvandoLote, setSalvandoLote] = useState(false);

  function dataHojeFormatada() {
    const hoje = new Date();
    return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
  }

  function abrirNovoServico() {
    setServicoEmEdicao(null);
    setNomeForm('');
    setPrecoForm('');
    setDuracaoForm('30');
    setDescricaoForm('');
    setCategoriaForm('cortes');
    setIconeForm('corte_degrade');
    setImagemUrlForm(null);
    setCorMolduraForm(barbearia?.tema?.frameColor || barbearia?.tema?.primary || '#CBA14A');
    setModalEditorServico(true);
  }

  function abrirEditarServicoCompleto(s: Servico) {
    setServicoEmEdicao(s);
    setNomeForm(s.nome);
    setPrecoForm(String(s.preco));
    setDuracaoForm(String(s.duracao_minutos || 30));
    setDescricaoForm(s.descricao || '');
    setCategoriaForm(s.categoria || 'cortes');
    setIconeForm((s.icone as TipoServicoId) || null);
    setImagemUrlForm(s.imagem_url || null);
    setCorMolduraForm(s.cor_moldura || barbearia?.tema?.frameColor || barbearia?.tema?.primary || '#CBA14A');
    setModalEditorServico(true);
  }

  async function escolherFotoCustomizadaServico() {
    if (!barbearia) return;
    setEnviandoFotoServico(true);
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (resultado.canceled || !resultado.assets?.[0]) return;
      const asset = resultado.assets[0];
      const { publicUrl } = await uploadImagemTenant(barbearia.id, 'fotos', asset.uri, asset.mimeType);
      setImagemUrlForm(publicUrl);
      setIconeForm(null);
    } catch (err: any) {
      Alert.alert('Erro ao enviar foto', err.message || 'Tente novamente.');
    } finally {
      setEnviandoFotoServico(false);
    }
  }

  async function handleSalvarServicoCompleto() {
    if (!barbearia) {
      Alert.alert('Barbearia não selecionada', 'Selecione uma barbearia antes de criar serviços.');
      return;
    }
    const nomeLimpo = nomeForm.trim();
    if (!nomeLimpo) {
      Alert.alert('Nome obrigatório', 'Informe o nome do serviço.');
      return;
    }
    const precoNum = parseFloat(precoForm.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      Alert.alert('Preço inválido', 'Informe um valor válido em reais.');
      return;
    }
    const duracaoNum = parseInt(duracaoForm, 10) || 30;

    setSalvandoServico(true);
    try {
      const payload = {
        barbearia_id: barbearia.id,
        nome: nomeLimpo,
        preco: precoNum,
        duracao_minutos: duracaoNum,
        descricao: descricaoForm.trim() || null,
        categoria: categoriaForm,
        icone: iconeForm,
        imagem_url: imagemUrlForm,
        cor_moldura: corMolduraForm.trim() || null,
        ativo: true,
      };

      if (servicoEmEdicao?.id) {
        const { error } = await supabase
          .from('servicos')
          .update(payload)
          .eq('id', servicoEmEdicao.id);
        if (error) throw error;
        Alert.alert('Serviço Atualizado! ✂️', `As alterações em "${nomeLimpo}" foram salvas.`);
      } else {
        const { error } = await supabase.from('servicos').insert(payload);
        if (error) throw error;
        Alert.alert('Novo Serviço Cadastrado! 💈', `O serviço "${nomeLimpo}" já está disponível para agendamentos.`);
      }

      await recarregarServicos();
      setModalEditorServico(false);
    } catch (err: any) {
      Alert.alert('Erro ao salvar serviço', err.message || 'Tente novamente.');
    } finally {
      setSalvandoServico(false);
    }
  }

  function abrirReajusteIndividual(servico: Servico) {
    setServicoParaReajuste(servico);
    setNovoPrecoIndividual(String(servico.preco));
    setDataVigenciaIndividual(dataHojeFormatada());
    setJustificativaIndividual('');
  }

  function abrirReajusteLote() {
    setDataVigenciaLote(dataHojeFormatada());
    setJustificativaLote('');
    const mapaInicial: Record<string, string> = {};
    servicos.forEach((s) => {
      mapaInicial[s.id] = String(s.preco);
    });
    setPrecosLote(mapaInicial);
    setModalLoteAberto(true);
  }

  async function handleSalvarReajusteIndividual() {
    if (!servicoParaReajuste || !barbeiroId) return;
    const valorNum = parseFloat(novoPrecoIndividual.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Valor inválido', 'Informe um preço válido para o serviço.');
      return;
    }

    setSalvandoIndividual(true);
    try {
      // 1. Atualiza na tabela servicos
      const { error: erroUpdate } = await supabase
        .from('servicos')
        .update({ preco: valorNum })
        .eq('id', servicoParaReajuste.id);

      if (erroUpdate) throw erroUpdate;

      const hojeIso = new Date().toISOString().slice(0, 10);
      const alteracao = {
        servico_id: servicoParaReajuste.id,
        nome: servicoParaReajuste.nome,
        preco_anterior: servicoParaReajuste.preco,
        novo_preco: valorNum,
      };

      // 2. Registra o reajuste no histórico
      await supabase.from('reajustes_precos').insert({
        barbeiro_id: barbeiroId,
        tipo: 'individual',
        data_vigencia: hojeIso,
        justificativa: justificativaIndividual.trim() || null,
        itens_alterados: [alteracao],
      });

      // 3. Notifica todos os clientes
      const precoFormatado = valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      await supabase.rpc('notificar_todos_clientes', {
        p_titulo: `Reajuste de Preço: ${servicoParaReajuste.nome}`,
        p_mensagem: `O serviço ${servicoParaReajuste.nome} passará a valer ${precoFormatado} a partir de ${dataVigenciaIndividual}.`,
        p_tipo: 'reajuste_preco',
        p_dados: {
          dataVigencia: dataVigenciaIndividual,
          justificativa: justificativaIndividual.trim() || null,
          itens: [alteracao],
        },
      });

      await recarregarServicos();
      setServicoParaReajuste(null);
      Alert.alert('Reajuste Aplicado! ✂️', `O valor do serviço ${servicoParaReajuste.nome} foi atualizado e todos os clientes foram notificados.`);
    } catch (err: any) {
      Alert.alert('Erro ao salvar reajuste', err.message || 'Tente novamente.');
    } finally {
      setSalvandoIndividual(false);
    }
  }

  async function handleSalvarReajusteLote() {
    if (!barbeiroId) return;
    setSalvandoLote(true);

    try {
      const alteracoes: { servico_id: string; nome: string; preco_anterior: number; novo_preco: number }[] = [];

      for (const s of servicos) {
        const novoStr = precosLote[s.id];
        if (novoStr) {
          const valorNum = parseFloat(novoStr.replace(',', '.'));
          if (!isNaN(valorNum) && valorNum > 0 && valorNum !== Number(s.preco)) {
            // Atualiza serviço
            await supabase.from('servicos').update({ preco: valorNum }).eq('id', s.id);
            alteracoes.push({
              servico_id: s.id,
              nome: s.nome,
              preco_anterior: Number(s.preco),
              novo_preco: valorNum,
            });
          }
        }
      }

      if (alteracoes.length === 0) {
        Alert.alert('Nenhuma alteração', 'Nenhum preço foi modificado.');
        setSalvandoLote(false);
        return;
      }

      const hojeIso = new Date().toISOString().slice(0, 10);

      // Registra reajuste em lote
      await supabase.from('reajustes_precos').insert({
        barbeiro_id: barbeiroId,
        tipo: 'lote',
        data_vigencia: hojeIso,
        justificativa: justificativaLote.trim() || null,
        itens_alterados: alteracoes,
      });

      // Dispara UMA ÚNICA notificação consolidada com CTA sem citar a palavra justificativa no resumo
      await supabase.rpc('notificar_todos_clientes', {
        p_titulo: 'Aviso de Reajuste de Preços ✂️',
        p_mensagem: `Informamos que haverá reajuste de valores em nossos serviços a partir de ${dataVigenciaLote}. Toque em Saiba mais para ver os detalhes.`,
        p_tipo: 'reajuste_preco',
        p_dados: {
          dataVigencia: dataVigenciaLote,
          justificativa: justificativaLote.trim() || null,
          itens: alteracoes,
        },
      });

      await recarregarServicos();
      setModalLoteAberto(false);
      Alert.alert('Reajuste em Lote Concluído! ✂️', `${alteracoes.length} serviços foram atualizados e o comunicado foi enviado aos clientes.`);
    } catch (err: any) {
      Alert.alert('Erro ao processar reajuste em lote', err.message || 'Tente novamente.');
    } finally {
      setSalvandoLote(false);
    }
  }

  async function handleConfirmarSair() {
    setModalAtivo(null);
    await supabase.auth.signOut();
  }

  const nomeExibicao = carregandoPerfil
    ? 'Carregando...'
    : perfil?.nome_completo || 'Barbeiro Vieira';
  const emailExibicao = session?.user?.email || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Mais Opções</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Card do Perfil do Barbeiro */}
        <View style={styles.perfilCard}>
          <View style={styles.avatarWrapper}>
            <LogoBarbearia tamanho={64} tipo="avatar" variante="compacto" uri={barbearia?.logo_url} />
          </View>

          <View style={styles.perfilInfo}>
            <Text style={styles.perfilNome}>{nomeExibicao}</Text>
            <Text style={styles.perfilContato}>{emailExibicao}</Text>
            <View style={styles.badgeBarbeiro}>
              <Sparkles size={11} color={Colors.ouro} />
              <Text style={styles.badgeBarbeiroTexto}>{barbearia?.nome || 'Na Régua'}</Text>
            </View>
          </View>
        </View>

        {/* Seção 1: Gestão da Barbearia */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>GESTÃO DA BARBEARIA</Text>
          <View style={styles.cardGrupo}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/(barbeiro)/preparar-agenda')}
            >
              <View style={[styles.itemIconeContainer, styles.iconeOuro]}>
                <CalendarPlus size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Preparar próxima agenda</Text>
                <Text style={styles.itemSubtitulo}>Definir dias disponíveis e hora de abertura</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/(app)/barbearias', params: { modo: 'painel' } })}
            >
              <View style={[styles.itemIconeContainer, styles.iconeOuro]}>
                <Store size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Trocar barbearia ativa</Text>
                <Text style={styles.itemSubtitulo}>{barbearia?.nome || 'Selecionar estabelecimento'}</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/(barbeiro)/gestao-barbearia')}
            >
              <View style={[styles.itemIconeContainer, styles.iconeOuro]}>
                <Edit3 size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Gestão da Barbearia</Text>
                <Text style={styles.itemSubtitulo}>Dados comerciais, mídias, equipe e vitrine</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/(barbeiro)/cadastrar-barbearia')}
            >
              <View style={[styles.itemIconeContainer, styles.iconeOuro]}>
                <Building2 size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Cadastrar Nova Barbearia</Text>
                <Text style={styles.itemSubtitulo}>Criar e gerenciar um novo estabelecimento</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('servicos')}
            >
              <View style={styles.itemIconeContainer}>
                <Scissors size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Tabela de Serviços & Preços</Text>
                <Text style={styles.itemSubtitulo}>Consulte valores e faça reajustes com aviso aos clientes</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            {/* BOTÃO OPÇÕES AVANÇADAS (Substituiu Horários de Atendimento) */}
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/(barbeiro)/opcoes-avancadas')}
            >
              <View style={[styles.itemIconeContainer, styles.iconeOuro]}>
                <Sliders size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Opções Avançadas</Text>
                <Text style={styles.itemSubtitulo}>Lista negra, encaixes manuais, equipe e vagas da tarde</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 2: Informações do Sistema */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>INFORMAÇÕES</Text>
          <View style={styles.cardGrupo}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('privacidade')}
            >
              <View style={styles.itemIconeContainer}>
                <ShieldCheck size={18} color={Colors.textoSecundario} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Segurança & Banco de Dados</Text>
                <Text style={styles.itemSubtitulo}>Políticas RLS e proteção de dados</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <View style={styles.itemLinha}>
              <View style={styles.itemIconeContainer}>
                <Info size={18} color={Colors.textoSecundario} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Versão do aplicativo</Text>
                <Text style={styles.itemSubtitulo}>Na Régua v1.0.0 (Painel Barbeiro)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botão Sair */}
        <TouchableOpacity
          style={styles.botaoSair}
          onPress={() => setModalAtivo('sair')}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={Colors.erro} />
          <Text style={styles.botaoSairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Modal da Tabela de Serviços & Reajustes ─── */}
      <Modal
        visible={modalAtivo === 'servicos'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalAtivo(null)}>
          <Pressable style={styles.modalConteudo} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTituloLinha}>
                <View style={styles.modalIconeBadge}>
                  <Scissors size={20} color={Colors.ouro} />
                </View>
                <Text style={styles.modalTitulo}>Tabela de Serviços & Preços</Text>
              </View>

              <TouchableOpacity onPress={() => setModalAtivo(null)} style={styles.modalBtnFechar}>
                <X size={20} color={Colors.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={styles.servicosAcoesTopo}>
              <TouchableOpacity
                style={styles.botaoNovoServico}
                onPress={abrirNovoServico}
                activeOpacity={0.8}
              >
                <Plus size={16} color={Colors.fundo} />
                <Text style={styles.botaoNovoServicoTexto}>Novo Serviço</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoReajusteLote}
                onPress={abrirReajusteLote}
                activeOpacity={0.8}
              >
                <Zap size={14} color="#FFFFFF" />
                <Text style={styles.botaoReajusteLoteTexto}>Reajuste em Lote</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.dicaToqueTexto}>
              Toque no botão de edição para fotos e moldura, ou no preço para reajustar valores.
            </Text>

            <ScrollView style={styles.servicosLista} showsVerticalScrollIndicator={false}>
              {servicos.map((s) => (
                <View key={s.id} style={styles.servicoItem}>
                  {/* Ilustração com Moldura */}
                  <IlustracaoServico
                    id={s.id}
                    nome={s.nome}
                    categoria={s.categoria}
                    imagemUrl={s.imagem_url}
                    tipoPredefinido={s.icone as any}
                    corMoldura={s.cor_moldura || barbearia?.tema?.frameColor || barbearia?.tema?.primary || Colors.ouro}
                    tamanho={48}
                  />

                  <View style={styles.servicoInfo}>
                    <Text style={styles.servicoNome}>{s.nome}</Text>
                    <Text style={styles.servicoDescricao} numberOfLines={1}>{s.descricao}</Text>
                    <Text style={styles.servicoDuracao}>{s.duracao_minutos} min</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => abrirReajusteIndividual(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.servicoPreco}>
                        {Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.btnEditarServicoIcone}
                        onPress={() => abrirEditarServicoCompleto(s)}
                        activeOpacity={0.7}
                      >
                        <Palette size={13} color={Colors.ouro} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.badgeEditarPreco}
                        onPress={() => abrirReajusteIndividual(s)}
                        activeOpacity={0.7}
                      >
                        <Edit3 size={11} color={Colors.ouro} />
                        <Text style={styles.badgeEditarPrecoTexto}>Preço</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Modal Completo: Editor de Serviço (Fotos, Molduras, Dados) ─── */}
      <Modal
        visible={modalEditorServico}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEditorServico(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalEditorServico(false)}>
          <Pressable style={styles.modalConteudoGrande} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>
                {servicoEmEdicao ? 'Editar Serviço & Moldura' : 'Cadastrar Novo Serviço'}
              </Text>
              <TouchableOpacity onPress={() => setModalEditorServico(false)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Nome */}
              <Text style={styles.labelCampo}>NOME DO SERVIÇO *</Text>
              <TextInput
                style={styles.inputModal}
                placeholder="Ex: Corte Degradê / Fade"
                placeholderTextColor={Colors.textoDesabilitado}
                value={nomeForm}
                onChangeText={setNomeForm}
              />

              {/* Preço e Duração */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelCampo}>PREÇO (R$) *</Text>
                  <TextInput
                    style={styles.inputModal}
                    placeholder="35,00"
                    placeholderTextColor={Colors.textoDesabilitado}
                    keyboardType="numeric"
                    value={precoForm}
                    onChangeText={setPrecoForm}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.labelCampo}>DURAÇÃO (MIN) *</Text>
                  <TextInput
                    style={styles.inputModal}
                    placeholder="30"
                    placeholderTextColor={Colors.textoDesabilitado}
                    keyboardType="numeric"
                    value={duracaoForm}
                    onChangeText={setDuracaoForm}
                  />
                </View>
              </View>

              {/* Descrição */}
              <Text style={[styles.labelCampo, { marginTop: 10 }]}>DESCRIÇÃO DETALHADA</Text>
              <TextInput
                style={[styles.inputModal, { minHeight: 65, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="Detalhes do serviço, produtos usados..."
                placeholderTextColor={Colors.textoDesabilitado}
                multiline
                value={descricaoForm}
                onChangeText={setDescricaoForm}
              />

              {/* BIBLIOTECA DE IMAGENS SUGERIDAS (9 RENDERS 3D) */}
              <Text style={[styles.labelCampo, { marginTop: 14 }]}>IMAGEM DO SERVIÇO (SUGESTÕES DA BIBLIOTECA)</Text>
              <Text style={styles.subLabelCampo}>
                Escolha uma das ilustrações profissionais ou envie sua própria foto abaixo.
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bibliotecaScroll}>
                {BIBLIOTECA_SERVICOS.map((item) => {
                  const selecionado = !imagemUrlForm && (iconeForm === item.id || (!iconeForm && servicoEmEdicao?.nome?.toLowerCase().includes(item.categoria)));
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.cardSugestaoImg, selecionado && styles.cardSugestaoImgAtivo]}
                      onPress={() => {
                        setIconeForm(item.id);
                        setImagemUrlForm(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <IlustracaoServico tipoPredefinido={item.id} corMoldura={corMolduraForm || Colors.ouro} tamanho={46} />
                      <Text style={[styles.sugestaoLabel, selecionado && styles.sugestaoLabelAtivo]} numberOfLines={1}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* OU Enviar Foto Própria */}
              <TouchableOpacity
                style={styles.btnFotoPropria}
                onPress={escolherFotoCustomizadaServico}
                disabled={enviandoFotoServico}
                activeOpacity={0.8}
              >
                {enviandoFotoServico ? (
                  <ActivityIndicator size="small" color={Colors.ouro} />
                ) : (
                  <>
                    <Camera size={16} color={Colors.ouro} />
                    <Text style={styles.btnFotoPropriaTexto}>
                      {imagemUrlForm ? 'Alterar Foto Própria da Galeria' : 'Escolher Foto Própria da Galeria'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* COR DA MOLDURA EXTERNA DO SERVIÇO */}
              <Text style={[styles.labelCampo, { marginTop: 14 }]}>COR DA MOLDURA EXTERNA DESTE SERVIÇO</Text>
              <Text style={styles.subLabelCampo}>
                A moldura envolve a foto garantindo a identidade visual da barbearia.
              </Text>

              <View style={styles.amostrasMolduraServico}>
                {['#CBA14A', '#E63946', '#2A9D8F', '#3182CE', '#8338EC', '#E76F51', '#E0E1DD'].map((hex) => (
                  <TouchableOpacity
                    key={`moldura-form-${hex}`}
                    style={[styles.amostraCirculo, { backgroundColor: hex }, corMolduraForm === hex && styles.amostraCirculoAtivo]}
                    onPress={() => setCorMolduraForm(hex)}
                  />
                ))}
              </View>

              {/* PRÉVIA AO VIVO DESTE SERVIÇO */}
              <View style={styles.previewContainerServico}>
                <Text style={styles.previewTitulo}>Prévia da Foto com Moldura:</Text>
                <View style={styles.previewItemLinha}>
                  <IlustracaoServico
                    imagemUrl={imagemUrlForm}
                    tipoPredefinido={iconeForm}
                    nome={nomeForm}
                    categoria={categoriaForm}
                    corMoldura={corMolduraForm || Colors.ouro}
                    tamanho={58}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewNomeServico}>{nomeForm || 'Nome do Serviço'}</Text>
                    <Text style={styles.previewPrecoServico}>
                      {precoForm ? `R$ ${precoForm}` : 'R$ 0,00'} • {duracaoForm || '30'} min
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botão Salvar */}
              <TouchableOpacity
                style={styles.botaoConfirmarModal}
                onPress={handleSalvarServicoCompleto}
                disabled={salvandoServico}
                activeOpacity={0.8}
              >
                {salvandoServico ? (
                  <ActivityIndicator color={Colors.fundo} size="small" />
                ) : (
                  <Text style={styles.botaoConfirmarModalTexto}>
                    {servicoEmEdicao ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Modal de Reajuste Individual ─── */}
      <Modal
        visible={servicoParaReajuste !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setServicoParaReajuste(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setServicoParaReajuste(null)}>
          <Pressable style={styles.modalConteudoGrande} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Reajustar Preço do Serviço</Text>
              <TouchableOpacity onPress={() => setServicoParaReajuste(null)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {servicoParaReajuste && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View style={styles.cardInfoServico}>
                  <Text style={styles.cardInfoServicoNome}>{servicoParaReajuste.nome}</Text>
                  <Text style={styles.cardInfoServicoPreco}>
                    Preço atual: R$ {Number(servicoParaReajuste.preco).toFixed(2)}
                  </Text>
                </View>

                <Text style={styles.labelCampo}>NOVO VALOR (R$)</Text>
                <TextInput
                  style={styles.inputModal}
                  keyboardType="numeric"
                  placeholder="Ex: 25.00"
                  placeholderTextColor="#636366"
                  value={novoPrecoIndividual}
                  onChangeText={setNovoPrecoIndividual}
                />

                <Text style={styles.labelCampo}>QUANDO ENTRARÁ EM VIGOR?</Text>
                <TextInput
                  style={styles.inputModal}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#636366"
                  value={dataVigenciaIndividual}
                  onChangeText={setDataVigenciaIndividual}
                />

                <Text style={styles.labelCampo}>JUSTIFICATIVA / MENSAGEM AOS CLIENTES (OPCIONAL)</Text>
                <TextInput
                  style={[styles.inputModal, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="Ex: Reajuste anual para melhoria de insumos e atendimento."
                  placeholderTextColor="#636366"
                  value={justificativaIndividual}
                  onChangeText={setJustificativaIndividual}
                />

                <TouchableOpacity
                  style={styles.botaoConfirmarReajuste}
                  onPress={handleSalvarReajusteIndividual}
                  disabled={salvandoIndividual}
                  activeOpacity={0.8}
                >
                  {salvandoIndividual ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.botaoConfirmarReajusteTexto}>
                      Aplicar Reajuste & Notificar Clientes
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Modal de Reajuste em Lote ─── */}
      <Modal
        visible={modalLoteAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalLoteAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setModalLoteAberto(false)}
          />
          <View style={styles.modalConteudoGrande}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Reajuste Geral de Todos os Serviços</Text>
              <TouchableOpacity onPress={() => setModalLoteAberto(false)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.labelCampo}>DATA DE VIGÊNCIA</Text>
            <TextInput
              style={styles.inputModal}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#636366"
              value={dataVigenciaLote}
              onChangeText={setDataVigenciaLote}
            />

            <Text style={styles.labelCampo}>JUSTIFICATIVA / COMUNICADO (OPCIONAL)</Text>
            <TextInput
              style={[styles.inputModal, { height: 68, textAlignVertical: 'top', paddingTop: 8 }]}
              multiline
              placeholder="Ex: Mensagem visível aos clientes no Saiba Mais"
              placeholderTextColor="#636366"
              value={justificativaLote}
              onChangeText={setJustificativaLote}
            />

            <Text style={[styles.labelCampo, { marginTop: 6 }]}>
              VALORES POR SERVIÇO ({servicos.length} SERVIÇOS)
            </Text>

            {/* ROLAGEM DEDICADA APENAS NA LISTA DE SERVIÇOS */}
            <ScrollView
              style={styles.servicosLoteLista}
              contentContainerStyle={{ paddingVertical: 4 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {servicos.map((s) => (
                <View key={s.id} style={styles.linhaLoteServico}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linhaLoteNome}>{s.nome}</Text>
                    <Text style={styles.linhaLoteAtual}>Atual: R$ {Number(s.preco).toFixed(2)}</Text>
                  </View>
                  <TextInput
                    style={styles.inputLote}
                    keyboardType="numeric"
                    value={precosLote[s.id] || ''}
                    onChangeText={(val) => setPrecosLote((prev) => ({ ...prev, [s.id]: val }))}
                  />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.botaoConfirmarReajuste}
              onPress={handleSalvarReajusteLote}
              disabled={salvandoLote}
              activeOpacity={0.8}
            >
              {salvandoLote ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botaoConfirmarReajusteTexto}>
                  Salvar Reajuste Geral & Notificar Clientes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Modal Privacidade ─── */}
      <Modal
        visible={modalAtivo === 'privacidade'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalAtivo(null)}>
          <Pressable style={styles.modalConteudo} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Segurança & Privacidade</Text>
              <TouchableOpacity onPress={() => setModalAtivo(null)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalCorpo}>
              <View style={styles.modalItemCard}>
                <Text style={styles.modalItemRotulo}>Segurança do Painel</Text>
                <Text style={styles.modalItemDescricao}>
                  Acesso protegido pelo papel 'barbeiro' no banco de dados Supabase e autenticado via sessão criptografada.
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Modal Sair ─── */}
      <Modal
        visible={modalAtivo === 'sair'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalAtivo(null)}>
          <Pressable style={styles.modalConteudo} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Encerrar Sessão</Text>
              <TouchableOpacity onPress={() => setModalAtivo(null)} style={styles.modalBtnFechar}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalCorpo}>
              <Text style={styles.modalTextoConfirmacao}>
                Deseja desconectar sua conta de barbeiro deste dispositivo?
              </Text>
              <View style={styles.modalAcoesRow}>
                <TouchableOpacity
                  style={styles.modalBotaoCancelar}
                  onPress={() => setModalAtivo(null)}
                >
                  <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBotaoSair}
                  onPress={handleConfirmarSair}
                >
                  <Text style={styles.modalBotaoSairTexto}>Sair da conta</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F22',
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: '#FFFFFF',
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.lg,
    paddingBottom: Spacing.giant,
  },
  perfilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#161618',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#262629',
    ...Shadows.card,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfilInfo: {
    flex: 1,
    gap: 3,
  },
  perfilNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: '#FFFFFF',
  },
  perfilContato: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
  },
  badgeBarbeiro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
  },
  badgeBarbeiroTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.ouro,
  },
  secao: {
    gap: Spacing.xs,
  },
  secaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
    letterSpacing: 1,
    marginLeft: 4,
  },
  cardGrupo: {
    backgroundColor: '#161618',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#262629',
    overflow: 'hidden',
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  itemIconeContainer: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: '#222226',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeOuro: {
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
  },
  itemTextoContainer: {
    flex: 1,
    gap: 2,
  },
  itemTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  itemSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  divisorItem: {
    height: 1,
    backgroundColor: '#262629',
    marginLeft: 56,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.25)',
  },
  botaoSairTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.erro,
  },

  /* Modais */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.giant,
    borderWidth: 1,
    borderColor: '#2E2E33',
    gap: Spacing.sm,
    maxHeight: '85%',
  },
  modalConteudoGrande: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#2E2E33',
    gap: Spacing.sm,
    maxHeight: '92%',
  },
  modalTraco: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalIconeBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: '#FFFFFF',
  },
  modalBtnFechar: { padding: 4 },
  botaoReajusteLote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.vermelho,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  botaoReajusteLoteTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  dicaToqueTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  servicosLista: { maxHeight: 340 },
  servicoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#262629',
    gap: Spacing.sm,
  },
  servicoInfo: { flex: 1, gap: 2 },
  servicoNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  servicoDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  servicoDuracao: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
  },
  servicoPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.ouro,
  },
  badgeEditarPreco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  badgeEditarPrecoTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.ouro,
  },
  cardInfoServico: {
    backgroundColor: '#222226',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: 2,
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  cardInfoServicoNome: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  cardInfoServicoPreco: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
  labelCampo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  inputModal: {
    backgroundColor: '#222226',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#2E2E33',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
  },
  botaoConfirmarReajuste: {
    backgroundColor: Colors.verde,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  botaoConfirmarReajusteTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  servicosLoteLista: {
    height: 200,
    borderWidth: 1,
    borderColor: '#262629',
    borderRadius: Radii.sm,
    backgroundColor: '#1E1E22',
    paddingHorizontal: Spacing.sm,
  },
  linhaLoteServico: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#262629',
    gap: Spacing.sm,
  },
  linhaLoteNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  linhaLoteAtual: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: '#8E8E93',
  },
  inputLote: {
    width: 80,
    backgroundColor: '#222226',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#3F3F46',
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    textAlign: 'center',
    paddingVertical: 4,
  },
  modalCorpo: { gap: Spacing.sm },
  modalItemCard: {
    backgroundColor: '#222226',
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: '#2E2E33',
  },
  modalItemRotulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
  },
  modalItemDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#A1A1AA',
    lineHeight: 18,
  },
  modalTextoConfirmacao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  modalAcoesRow: { flexDirection: 'row', gap: Spacing.sm },
  modalBotaoCancelar: {
    flex: 1,
    backgroundColor: '#27272A',
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBotaoCancelarTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  modalBotaoSair: {
    flex: 1,
    backgroundColor: Colors.vermelho,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBotaoSairTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },

  // Estilos do Editor de Serviços, Imagens e Molduras
  servicosAcoesTopo: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  botaoNovoServico: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.ouro,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  botaoNovoServicoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.fundo,
  },
  btnEditarServicoIcone: {
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  subLabelCampo: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
  },
  bibliotecaScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  cardSugestaoImg: {
    width: 76,
    alignItems: 'center',
    padding: 6,
    borderRadius: Radii.md,
    backgroundColor: '#1C1C20',
    borderWidth: 1,
    borderColor: '#2E2E34',
    gap: 4,
  },
  cardSugestaoImgAtivo: {
    borderColor: Colors.ouro,
    backgroundColor: 'rgba(203, 161, 74, 0.12)',
  },
  sugestaoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  sugestaoLabelAtivo: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
  },

  btnFotoPropria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.ouro,
    borderRadius: Radii.md,
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: '#1C1C20',
  },
  btnFotoPropriaTexto: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
  },

  amostrasMolduraServico: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  amostraCirculo: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  amostraCirculoAtivo: {
    borderWidth: 2.5,
    borderColor: Colors.branco,
    transform: [{ scale: 1.15 }],
  },

  previewContainerServico: {
    backgroundColor: '#1C1C20',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#2E2E34',
    padding: Spacing.sm,
    marginTop: 12,
    gap: 6,
  },
  previewTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.ouro,
  },
  previewItemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewNomeServico: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: '#FFFFFF',
  },
  previewPrecoServico: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
    marginTop: 2,
  },

  botaoConfirmarModal: {
    backgroundColor: Colors.ouro,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  botaoConfirmarModalTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.fundo,
  },
});
