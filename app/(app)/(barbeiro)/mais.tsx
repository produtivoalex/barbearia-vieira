import React, { useState, useMemo, useEffect } from 'react';
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
  Share,
  Platform,
  Keyboard,
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
  Moon,
  Sun,
  Smartphone,
  Eye,
  Share2,
  Copy,
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
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { useAuth } from '@/hooks/useAuth';
import { useServicos, type Servico, type CategoriaServico, CATEGORIAS_CONFIG } from '@/hooks/useServicos';
import { supabase } from '@/lib/supabase';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

type TipoModal = 'servicos' | 'privacidade' | 'aparencia' | 'sair' | null;

export default function TelaBarbeiroMais() {
  const router = useRouter();
  const { perfil, carregandoPerfil } = usePerfil();
  const { session } = useAuth();
  const barbeiroId = session?.user?.id;
  const { barbearia, selecionarBarbearia } = useBarbearia();
  const { theme, isEscuro, modoTema, setModoTema } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { servicos, recarregar: recarregarServicos } = useServicos('todos', barbearia?.id);
  const [enviandoLogoHero, setEnviandoLogoHero] = useState(false);

  // Controle de Teclado e Edição Dinâmica
  const [alturaTeclado, setAlturaTeclado] = useState(0);
  const [servicoEditandoLoteId, setServicoEditandoLoteId] = useState<string | null>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setAlturaTeclado(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setAlturaTeclado(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

      await supabase.from('reajustes_precos').insert({
        barbeiro_id: barbeiroId,
        tipo: 'individual',
        data_vigencia: hojeIso,
        justificativa: justificativaIndividual.trim() || null,
        itens_alterados: [alteracao],
      });

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

      await supabase.from('reajustes_precos').insert({
        barbeiro_id: barbeiroId,
        tipo: 'lote',
        data_vigencia: hojeIso,
        justificativa: justificativaLote.trim() || null,
        itens_alterados: alteracoes,
      });

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

  async function handleAlterarLogoDireto() {
    if (!barbearia) return;
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (resultado.canceled || !resultado.assets?.length) return;
      const asset = resultado.assets[0];

      setEnviandoLogoHero(true);
      const { publicUrl } = await uploadImagemTenant(barbearia.id, 'logo', asset.uri, asset.mimeType);

      await supabase
        .from('barbearias')
        .update({ logo_url: publicUrl, atualizado_em: new Date().toISOString() })
        .eq('id', barbearia.id);

      await selecionarBarbearia({ ...barbearia, logo_url: publicUrl });
      Alert.alert('Logo Atualizada! ✨', 'A logo da sua barbearia foi alterada com sucesso.');
    } catch (err: any) {
      Alert.alert('Erro ao enviar logo', err?.message || 'Tente novamente.');
    } finally {
      setEnviandoLogoHero(false);
    }
  }

  function handleCompartilharLink() {
    const slug = barbearia?.slug || barbearia?.id || 'barbearia';
    const nome = barbearia?.nome || 'nossa barbearia';
    const link = `https://naregua.app/${slug}`;
    Share.share({
      message: `💈 Agende seu corte na ${nome} pelo app Na Régua:\n${link}`,
      url: link,
    }).catch(() => {});
  }

  function handleVerComoCliente() {
    const slugOuId = barbearia?.slug || barbearia?.id;
    if (slugOuId) {
      router.push(`/(app)/barbearias/${slugOuId}`);
    } else {
      router.push('/(app)/barbearias');
    }
  }

  const nomeExibicao = carregandoPerfil
    ? 'Carregando...'
    : perfil?.nome_completo || 'Barbeiro Profissional';
  const emailExibicao = session?.user?.email || '';
  const slugBarbearia = barbearia?.slug || 'vieira';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* ─── Header Apple Style ─── */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Meu Negócio</Text>
        <View style={[styles.badgeTopoPro, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
          <Sparkles size={11} color={theme.ouroTexto} />
          <Text style={[styles.badgeTopoProTexto, { color: theme.ouroTexto }]}>PAINEL PRO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── HERO CARD DO ESTABELECIMENTO (Orgulho & Ação Rápida) ─── */}
        <View style={[styles.heroBarbeariaCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
          <View style={styles.heroTopo}>
            <TouchableOpacity
              style={styles.heroLogoWrapper}
              onPress={handleAlterarLogoDireto}
              activeOpacity={0.75}
            >
              {enviandoLogoHero ? (
                <View style={[styles.heroLogoLoading, { backgroundColor: theme.superficie2 }]}>
                  <ActivityIndicator size="small" color={theme.ouro} />
                </View>
              ) : (
                <>
                  <LogoBarbearia
                    tamanho={60}
                    tipo="avatar"
                    variante="compacto"
                    uri={barbearia?.logo_url}
                    slug={barbearia?.slug}
                  />
                  <View style={[styles.badgeCameraHero, { backgroundColor: theme.ouro, borderColor: theme.superficie }]}>
                    <Camera size={10} color={theme.textoEscuroSobreOuro} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={[styles.heroNomeBarbearia, { color: theme.textoPrimario }]} numberOfLines={1}>
                {barbearia?.nome || 'Minha Barbearia'}
              </Text>
              <Text style={[styles.heroDono, { color: theme.textoSecundario }]} numberOfLines={1}>
                {nomeExibicao} • {emailExibicao}
              </Text>
              <View style={styles.heroLinkLinha}>
                <Text style={[styles.heroLinkTexto, { color: theme.ouroTexto }]} numberOfLines={1}>
                  naregua.app/{slugBarbearia}
                </Text>
              </View>
            </View>
          </View>

          {/* Botões de Ação Rápida no Hero Card */}
          <View style={[styles.heroAcoesLinha, { borderTopColor: theme.borda, backgroundColor: theme.superficie2 }]}>
            <TouchableOpacity
              style={styles.heroBtnAcao}
              onPress={handleVerComoCliente}
              activeOpacity={0.75}
            >
              <Eye size={15} color={theme.textoPrimario} />
              <Text style={[styles.heroBtnAcaoTexto, { color: theme.textoPrimario }]}>Ver como Cliente</Text>
            </TouchableOpacity>

            <View style={[styles.heroDivisorVertical, { backgroundColor: theme.borda }]} />

            <TouchableOpacity
              style={styles.heroBtnAcao}
              onPress={handleCompartilharLink}
              activeOpacity={0.75}
            >
              <Share2 size={15} color={theme.ouroTexto} />
              <Text style={[styles.heroBtnAcaoTexto, { color: theme.ouroTexto }]}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── GRID 2x2: GERENCIAR (Apple Control Center Style) ─── */}
        <View style={styles.secao}>
          <Text style={[styles.secaoRotulo, { color: theme.textoSecundario }]}>GERENCIAR</Text>

          <View style={styles.gridContainer}>
            {/* Card 1: Serviços & Preços */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
              onPress={() => setModalAtivo('servicos')}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconeBox, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Scissors size={20} color={theme.ouroTexto} />
              </View>
              <Text style={[styles.gridCardTitulo, { color: theme.textoPrimario }]}>Serviços & Preços</Text>
              <Text style={[styles.gridCardSub, { color: theme.textoSecundario }]}>
                {servicos.length} {servicos.length === 1 ? 'serviço ativo' : 'serviços ativos'}
              </Text>
              <View style={styles.gridCardSeta}>
                <ChevronRight size={14} color={theme.textoDesabilitado} />
              </View>
            </TouchableOpacity>

            {/* Card 2: Agenda & Vagas */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
              onPress={() => router.push('/(app)/(barbeiro)/preparar-agenda')}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconeBox, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <CalendarPlus size={20} color={theme.ouroTexto} />
              </View>
              <Text style={[styles.gridCardTitulo, { color: theme.textoPrimario }]}>Agenda & Vagas</Text>
              <Text style={[styles.gridCardSub, { color: theme.textoSecundario }]}>
                Próxima semana
              </Text>
              <View style={styles.gridCardSeta}>
                <ChevronRight size={14} color={theme.textoDesabilitado} />
              </View>
            </TouchableOpacity>

            {/* Card 3: Espaço & Identidade */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
              onPress={() => router.push('/(app)/(barbeiro)/gestao-barbearia')}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconeBox, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Edit3 size={20} color={theme.ouroTexto} />
              </View>
              <Text style={[styles.gridCardTitulo, { color: theme.textoPrimario }]}>Espaço & Fotos</Text>
              <Text style={[styles.gridCardSub, { color: theme.textoSecundario }]}>
                Logo, fotos e dados
              </Text>
              <View style={styles.gridCardSeta}>
                <ChevronRight size={14} color={theme.textoDesabilitado} />
              </View>
            </TouchableOpacity>

            {/* Card 4: Ajustes & Controles */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
              onPress={() => router.push('/(app)/(barbeiro)/opcoes-avancadas')}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconeBox, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Sliders size={20} color={theme.ouroTexto} />
              </View>
              <Text style={[styles.gridCardTitulo, { color: theme.textoPrimario }]}>Ajustes & Equipe</Text>
              <Text style={[styles.gridCardSub, { color: theme.textoSecundario }]}>
                Regras e horários
              </Text>
              <View style={styles.gridCardSeta}>
                <ChevronRight size={14} color={theme.textoDesabilitado} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── CARD AGRUPADO: SISTEMA & PREFERÊNCIAS (iOS Settings Style) ─── */}
        <View style={styles.secao}>
          <Text style={[styles.secaoRotulo, { color: theme.textoSecundario }]}>SISTEMA & PREFERÊNCIAS</Text>

          <View style={[styles.cardAgrupadoIos, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            {/* Trocar Estabelecimento */}
            <TouchableOpacity
              style={styles.itemIosLinha}
              onPress={() => router.push({ pathname: '/(app)/barbearias', params: { modo: 'painel' } })}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIosIconeBox, { backgroundColor: theme.superficie2 }]}>
                <Store size={16} color={theme.textoSecundario} />
              </View>
              <Text style={[styles.itemIosTitulo, { color: theme.textoPrimario }]}>Trocar Unidade</Text>
              <Text style={[styles.itemIosValor, { color: theme.textoSecundario }]} numberOfLines={1}>
                {barbearia?.nome || 'Selecionar'}
              </Text>
              <ChevronRight size={16} color={theme.textoDesabilitado} />
            </TouchableOpacity>

            <View style={[styles.divisorIos, { backgroundColor: theme.borda }]} />

            {/* Cadastrar Nova Unidade */}
            <TouchableOpacity
              style={styles.itemIosLinha}
              onPress={() => router.push('/(app)/(barbeiro)/cadastrar-barbearia')}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIosIconeBox, { backgroundColor: theme.superficie2 }]}>
                <Building2 size={16} color={theme.textoSecundario} />
              </View>
              <Text style={[styles.itemIosTitulo, { color: theme.textoPrimario }]}>Nova Unidade</Text>
              <ChevronRight size={16} color={theme.textoDesabilitado} />
            </TouchableOpacity>

            <View style={[styles.divisorIos, { backgroundColor: theme.borda }]} />

            {/* Segurança & Privacidade */}
            <TouchableOpacity
              style={styles.itemIosLinha}
              onPress={() => setModalAtivo('privacidade')}
              activeOpacity={0.7}
            >
              <View style={[styles.itemIosIconeBox, { backgroundColor: theme.superficie2 }]}>
                <ShieldCheck size={16} color={theme.textoSecundario} />
              </View>
              <Text style={[styles.itemIosTitulo, { color: theme.textoPrimario }]}>Segurança & Privacidade</Text>
              <ChevronRight size={16} color={theme.textoDesabilitado} />
            </TouchableOpacity>

            <View style={[styles.divisorIos, { backgroundColor: theme.borda }]} />

            {/* Versão do Aplicativo */}
            <View style={styles.itemIosLinha}>
              <View style={[styles.itemIosIconeBox, { backgroundColor: theme.superficie2 }]}>
                <Info size={16} color={theme.textoSecundario} />
              </View>
              <Text style={[styles.itemIosTitulo, { color: theme.textoPrimario }]}>Versão</Text>
              <Text style={[styles.itemIosValor, { color: theme.textoSecundario }]}>Na Régua Pro 1.0</Text>
            </View>
          </View>
        </View>

        {/* ─── BOTÃO SAIR DISCRETO E ELEGANTE ─── */}
        <TouchableOpacity
          style={[styles.btnSairIos, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
          onPress={() => setModalAtivo('sair')}
          activeOpacity={0.75}
        >
          <LogOut size={16} color={theme.erro} />
          <Text style={[styles.btnSairIosTexto, { color: theme.erro }]}>Sair da Conta</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.giant }} />
      </ScrollView>

      {/* ─── Modal da Tabela de Serviços & Reajustes ─── */}
      <Modal
        visible={modalAtivo === 'servicos'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalAtivo(null)} />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda, maxHeight: '88%' }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTituloLinha}>
                <View style={[styles.modalIconeBadge, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                  <Scissors size={20} color={theme.ouroTexto} />
                </View>
                <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Serviços & Preços</Text>
              </View>

              <TouchableOpacity onPress={() => setModalAtivo(null)} style={styles.modalBtnFechar}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={styles.servicosAcoesTopo}>
              <TouchableOpacity
                style={[styles.botaoNovoServico, { backgroundColor: theme.ouro }]}
                onPress={abrirNovoServico}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#09090B" />
                <Text style={styles.botaoNovoServicoTexto}>Novo Serviço</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoReajusteLote, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={abrirReajusteLote}
                activeOpacity={0.8}
              >
                <Zap size={14} color={theme.ouroTexto} />
                <Text style={[styles.botaoReajusteLoteTexto, { color: theme.textoPrimario }]}>Reajuste em Lote</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.dicaToqueTexto, { color: theme.textoSecundario }]}>
              Toque na paleta para editar fotos e moldura, ou no preço para reajustar valores.
            </Text>

            <ScrollView
              style={styles.servicosLista}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets={true}
              bounces={true}
              scrollEventThrottle={16}
            >
              {servicos.map((s) => (
                <View key={s.id} style={[styles.servicoItem, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <IlustracaoServico
                    id={s.id}
                    nome={s.nome}
                    categoria={s.categoria}
                    imagemUrl={s.imagem_url}
                    tipoPredefinido={s.icone as any}
                    corMoldura={s.cor_moldura || barbearia?.tema?.frameColor || barbearia?.tema?.primary || theme.ouro}
                    tamanho={48}
                  />

                  <View style={styles.servicoInfo}>
                    <Text style={[styles.servicoNome, { color: theme.textoPrimario }]}>{s.nome}</Text>
                    <Text style={[styles.servicoDescricao, { color: theme.textoSecundario }]} numberOfLines={1}>{s.descricao}</Text>
                    <Text style={[styles.servicoDuracao, { color: theme.textoSecundario }]}>{s.duracao_minutos} min</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => abrirReajusteIndividual(s)}
                      activeOpacity={0.7}
                      delayPressIn={50}
                    >
                      <Text style={[styles.servicoPreco, { color: theme.ouroTexto }]}>
                        {Number(s.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        style={[styles.btnEditarServicoIcone, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}
                        onPress={() => abrirEditarServicoCompleto(s)}
                        activeOpacity={0.7}
                        delayPressIn={50}
                      >
                        <Palette size={13} color={theme.ouroTexto} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.badgeEditarPreco, { backgroundColor: theme.ouroTranslucido }]}
                        onPress={() => abrirReajusteIndividual(s)}
                        activeOpacity={0.7}
                        delayPressIn={50}
                      >
                        <Edit3 size={11} color={theme.ouroTexto} />
                        <Text style={[styles.badgeEditarPrecoTexto, { color: theme.ouroTexto }]}>Reajustar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Modal de Edição Completa de Serviço ─── */}
      <Modal
        visible={modalEditorServico}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEditorServico(false)}
      >
        <View style={[styles.modalOverlay, alturaTeclado > 0 && { paddingBottom: alturaTeclado }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalEditorServico(false)} />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda, maxHeight: alturaTeclado > 0 ? '70%' : '88%' }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>
                {servicoEmEdicao ? 'Editar Serviço' : 'Novo Serviço'}
              </Text>
              <TouchableOpacity onPress={() => setModalEditorServico(false)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 480, flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <Text style={[styles.labelCampo, { color: theme.textoSecundario }]}>NOME DO SERVIÇO</Text>
              <TextInput
                style={[styles.inputModal, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                value={nomeForm}
                onChangeText={setNomeForm}
                placeholder="Ex: Corte Degradê, Barboterapia"
                placeholderTextColor={theme.textoDesabilitado}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.labelCampo, { color: theme.textoSecundario }]}>PREÇO (R$)</Text>
                  <TextInput
                    style={[styles.inputModal, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                    value={precoForm}
                    onChangeText={setPrecoForm}
                    placeholder="35,00"
                    placeholderTextColor={theme.textoDesabilitado}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.labelCampo, { color: theme.textoSecundario }]}>DURAÇÃO (MIN)</Text>
                  <TextInput
                    style={[styles.inputModal, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                    value={duracaoForm}
                    onChangeText={setDuracaoForm}
                    placeholder="30"
                    placeholderTextColor={theme.textoDesabilitado}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.labelCampo, { color: theme.textoSecundario }]}>DESCRIÇÃO (OPCIONAL)</Text>
              <TextInput
                style={[styles.inputModal, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                value={descricaoForm}
                onChangeText={setDescricaoForm}
                placeholder="Detalhes ou diferenciais do serviço..."
                placeholderTextColor={theme.textoDesabilitado}
              />

              <TouchableOpacity
                style={[styles.botaoConfirmarModal, { backgroundColor: theme.ouro, marginTop: Spacing.md }]}
                onPress={handleSalvarServicoCompleto}
                disabled={salvandoServico}
                activeOpacity={0.8}
              >
                {salvandoServico ? (
                  <ActivityIndicator size="small" color="#09090B" />
                ) : (
                  <Text style={styles.botaoConfirmarModalTexto}>
                    {servicoEmEdicao ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Modal de Reajuste Individual ─── */}
      <Modal
        visible={servicoParaReajuste !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setServicoParaReajuste(null)}
      >
        <View style={[styles.modalOverlay, alturaTeclado > 0 && { paddingBottom: alturaTeclado }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setServicoParaReajuste(null)} />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Reajustar Preço</Text>
              <TouchableOpacity onPress={() => setServicoParaReajuste(null)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            {servicoParaReajuste && (
              <View style={{ gap: Spacing.sm }}>
                <View style={[styles.cardInfoServico, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.cardInfoServicoNome, { color: theme.textoPrimario }]}>{servicoParaReajuste.nome}</Text>
                  <Text style={[styles.cardInfoServicoPreco, { color: theme.ouroTexto }]}>
                    Preço atual: {Number(servicoParaReajuste.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                </View>

                <Text style={[styles.labelCampo, { color: theme.textoSecundario }]}>NOVO PREÇO (R$)</Text>
                <TextInput
                  style={[styles.inputModal, { backgroundColor: theme.superficie2, borderColor: theme.borda, color: theme.textoPrimario }]}
                  value={novoPrecoIndividual}
                  onChangeText={setNovoPrecoIndividual}
                  placeholder="0,00"
                  placeholderTextColor={theme.textoDesabilitado}
                  keyboardType="numeric"
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.botaoConfirmarReajuste, { backgroundColor: theme.verde }]}
                  onPress={handleSalvarReajusteIndividual}
                  disabled={salvandoIndividual}
                  activeOpacity={0.8}
                >
                  {salvandoIndividual ? (
                    <ActivityIndicator size="small" color="#09090B" />
                  ) : (
                    <Text style={styles.botaoConfirmarReajusteTexto}>Confirmar Reajuste</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Modal de Reajuste em Lote ─── */}
      <Modal
        visible={modalLoteAberto}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setServicoEditandoLoteId(null);
          setModalLoteAberto(false);
        }}
      >
        <View style={[styles.modalOverlay, alturaTeclado > 0 && { paddingBottom: alturaTeclado }]}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setServicoEditandoLoteId(null);
              setModalLoteAberto(false);
            }}
          />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda, maxHeight: alturaTeclado > 0 ? '70%' : '88%' }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Reajuste em Lote</Text>
              <TouchableOpacity onPress={() => {
                setServicoEditandoLoteId(null);
                setModalLoteAberto(false);
              }}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.servicosLoteLista}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              bounces={true}
              scrollEventThrottle={16}
            >
              {servicos.map((s) => {
                const focado = servicoEditandoLoteId === s.id;
                const valorAtualOuEditado = precosLote[s.id] !== undefined ? precosLote[s.id] : String(s.preco);

                return (
                  <View key={s.id} style={[styles.linhaLoteServico, { borderBottomColor: theme.borda }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.linhaLoteNome, { color: theme.textoPrimario }]}>{s.nome}</Text>
                      <Text style={[styles.linhaLoteAtual, { color: theme.textoSecundario }]}>
                        Atual: R$ {Number(s.preco).toFixed(2)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.inputLote,
                        {
                          backgroundColor: theme.superficie2,
                          borderColor: focado ? theme.ouro : theme.borda,
                        },
                        focado && { backgroundColor: theme.ouroTranslucido },
                      ]}
                      onPress={() => setServicoEditandoLoteId(s.id)}
                      activeOpacity={0.7}
                      delayPressIn={40}
                    >
                      {focado ? (
                        <TextInput
                          style={[styles.inputLoteCampo, { color: theme.ouroTexto }]}
                          value={precosLote[s.id] ?? ''}
                          onChangeText={(val) => setPrecosLote((prev) => ({ ...prev, [s.id]: val }))}
                          keyboardType="numeric"
                          placeholder="0.00"
                          placeholderTextColor={theme.textoDesabilitado}
                          autoFocus
                          onBlur={() => setServicoEditandoLoteId(null)}
                          selectTextOnFocus
                          returnKeyType="done"
                        />
                      ) : (
                        <Text style={[styles.inputLoteTexto, { color: precosLote[s.id] && precosLote[s.id] !== String(s.preco) ? theme.ouroTexto : theme.textoPrimario }]}>
                          {precosLote[s.id] ? precosLote[s.id] : Number(s.preco).toFixed(2)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.botaoConfirmarReajuste, { backgroundColor: theme.verde }]}
              onPress={handleSalvarReajusteLote}
              disabled={salvandoLote}
              activeOpacity={0.8}
            >
              {salvandoLote ? (
                <ActivityIndicator size="small" color="#09090B" />
              ) : (
                <Text style={styles.botaoConfirmarReajusteTexto}>Salvar Todos os Reajustes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Modal de Aparência ─── */}
      <Modal
        visible={modalAtivo === 'aparencia'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalAtivo(null)} />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Aparência do Aplicativo</Text>
              <TouchableOpacity onPress={() => setModalAtivo(null)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <TouchableOpacity
                style={[
                  styles.opcaoTemaCard,
                  { backgroundColor: theme.superficie2, borderColor: theme.borda },
                  modoTema === 'escuro' && { borderColor: theme.ouro, backgroundColor: theme.ouroTranslucido },
                ]}
                onPress={() => setModoTema('escuro')}
                activeOpacity={0.7}
              >
                <Moon size={20} color={modoTema === 'escuro' ? theme.ouroTexto : theme.textoPrimario} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoPrimario }]}>Modo Escuro (Obsidian & Gold)</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoSecundario }]}>Visual noturno elegante e luxuoso.</Text>
                </View>
                {modoTema === 'escuro' && <Check size={18} color={theme.ouroTexto} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.opcaoTemaCard,
                  { backgroundColor: theme.superficie2, borderColor: theme.borda },
                  modoTema === 'claro' && { borderColor: theme.ouro, backgroundColor: theme.ouroTranslucido },
                ]}
                onPress={() => setModoTema('claro')}
                activeOpacity={0.7}
              >
                <Sun size={20} color={modoTema === 'claro' ? theme.ouroTexto : theme.textoPrimario} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoPrimario }]}>Modo Claro (Pearl White & Gold)</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoSecundario }]}>Interface iluminada e de alto contraste.</Text>
                </View>
                {modoTema === 'claro' && <Check size={18} color={theme.ouroTexto} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.opcaoTemaCard,
                  { backgroundColor: theme.superficie2, borderColor: theme.borda },
                  modoTema === 'sistema' && { borderColor: theme.ouro, backgroundColor: theme.ouroTranslucido },
                ]}
                onPress={() => setModoTema('sistema')}
                activeOpacity={0.7}
              >
                <Smartphone size={20} color={modoTema === 'sistema' ? theme.ouroTexto : theme.textoPrimario} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoPrimario }]}>Automático (Sistema)</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoSecundario }]}>Segue o tema das configurações do seu aparelho.</Text>
                </View>
                {modoTema === 'sistema' && <Check size={18} color={theme.ouroTexto} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal de Privacidade ─── */}
      <Modal
        visible={modalAtivo === 'privacidade'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalAtivo(null)} />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Segurança & Privacidade</Text>
              <TouchableOpacity onPress={() => setModalAtivo(null)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: Spacing.sm }}>
              <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <Text style={[styles.modalItemRotulo, { color: theme.ouroTexto }]}>Criptografia Ponta a Ponta</Text>
                <Text style={[styles.modalItemDescricao, { color: theme.textoSecundario }]}>
                  Seus dados financeiros, listas de clientes e registros de agendamentos são protegidos por criptografia de nível bancário.
                </Text>
              </View>

              <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <Text style={[styles.modalItemRotulo, { color: theme.ouroTexto }]}>LGPD & Privacidade</Text>
                <Text style={[styles.modalItemDescricao, { color: theme.textoSecundario }]}>
                  Respeitamos integralmente a Lei Geral de Proteção de Dados. Seus contatos nunca são compartilhados com terceiros.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal de Sair da Conta ─── */}
      <Modal
        visible={modalAtivo === 'sair'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalAtivo(null)} />
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={[styles.modalTraco, { backgroundColor: theme.textoDesabilitado }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Encerrar Sessão</Text>
              <TouchableOpacity onPress={() => setModalAtivo(null)}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTextoConfirmacao, { color: theme.textoPrimario }]}>
              Tem certeza que deseja sair da sua conta profissional?
            </Text>

            <View style={styles.modalAcoesRow}>
              <TouchableOpacity
                style={[styles.modalBotaoCancelar, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                onPress={() => setModalAtivo(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalBotaoCancelarTexto, { color: theme.textoPrimario }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBotaoSair, { backgroundColor: theme.erro }]}
                onPress={handleConfirmarSair}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBotaoSairTexto}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.fundo,
    },
    header: {
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
    },
    badgeTopoPro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    badgeTopoProTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
      letterSpacing: 0.5,
    },
    scroll: {
      padding: Spacing.telaH,
      gap: Spacing.md,
      paddingBottom: Spacing.giant,
    },

    /* ─── HERO CARD DO ESTABELECIMENTO (Apple Style) ─── */
    heroBarbeariaCard: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...Shadows.card,
    },
    heroTopo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      gap: Spacing.md,
    },
    heroLogoWrapper: {
      width: 60,
      height: 60,
      borderRadius: Radii.md,
      position: 'relative',
    },
    heroLogoLoading: {
      width: 60,
      height: 60,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.borda,
    },
    badgeCameraHero: {
      position: 'absolute',
      bottom: -3,
      right: -3,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroInfo: {
      flex: 1,
      gap: 2,
    },
    heroNomeBarbearia: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyLg,
    },
    heroDono: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
    },
    heroLinkLinha: {
      marginTop: 2,
    },
    heroLinkTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 11.5,
    },
    heroAcoesLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingVertical: 4,
    },
    heroBtnAcao: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
    },
    heroBtnAcaoTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
    },
    heroDivisorVertical: {
      width: 1,
      height: 24,
    },

    /* ─── SEÇÃO & GRID 2x2 GERENCIAR (Control Center Style) ─── */
    secao: {
      gap: Spacing.xs,
    },
    secaoRotulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      letterSpacing: 0.5,
      marginLeft: 4,
      marginBottom: 2,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    gridCard: {
      width: '48.2%',
      padding: Spacing.md,
      borderRadius: Radii.lg,
      borderWidth: 1,
      gap: 6,
      position: 'relative',
      ...Shadows.card,
    },
    gridIconeBox: {
      width: 40,
      height: 40,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginBottom: 2,
    },
    gridCardTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },
    gridCardSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      lineHeight: 14,
    },
    gridCardSeta: {
      position: 'absolute',
      top: 14,
      right: 14,
    },

    /* ─── CARD AGRUPADO: SISTEMA & PREFERÊNCIAS (iOS Settings Style) ─── */
    cardAgrupadoIos: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...Shadows.card,
    },
    itemIosLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      gap: Spacing.sm,
    },
    itemIosIconeBox: {
      width: 32,
      height: 32,
      borderRadius: Radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemIosTitulo: {
      flex: 1,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodyMd,
    },
    itemIosValor: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      marginRight: 4,
    },
    divisorIos: {
      height: 1,
      marginLeft: 54,
    },

    /* ─── BOTÃO SAIR ─── */
    btnSairIos: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: Radii.lg,
      borderWidth: 1,
      marginTop: Spacing.xs,
    },
    btnSairIosTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },

    /* ─── MODAIS ─── */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalConteudo: {
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.giant,
      borderWidth: 1,
      gap: Spacing.md,
    },
    modalTraco: {
      width: 36,
      height: 4,
      borderRadius: 2,
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
      width: 34,
      height: 34,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    modalTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
    },
    modalBtnFechar: {
      padding: 6,
    },
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
      paddingVertical: 12,
      borderRadius: Radii.md,
    },
    botaoNovoServicoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: '#09090B',
    },
    botaoReajusteLote: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: Radii.md,
      borderWidth: 1,
    },
    botaoReajusteLoteTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
    },
    dicaToqueTexto: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    servicosLista: {
      maxHeight: 380,
      flexGrow: 0,
    },
    servicoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.sm,
      borderRadius: Radii.md,
      borderWidth: 1,
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    servicoInfo: {
      flex: 1,
      gap: 2,
    },
    servicoNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },
    servicoDescricao: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    servicoDuracao: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
    },
    servicoPreco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    btnEditarServicoIcone: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radii.sm,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeEditarPreco: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: Radii.sm,
    },
    badgeEditarPrecoTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 10,
    },
    cardInfoServico: {
      borderRadius: Radii.md,
      padding: Spacing.md,
      gap: 2,
      borderWidth: 1,
    },
    cardInfoServicoNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    cardInfoServicoPreco: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
    },
    labelCampo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      letterSpacing: 0.5,
      marginTop: Spacing.xs,
      marginBottom: 4,
    },
    inputModal: {
      borderRadius: Radii.sm,
      borderWidth: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
    },
    botaoConfirmarReajuste: {
      paddingVertical: 14,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.md,
    },
    botaoConfirmarReajusteTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      color: '#09090B',
    },
    servicosLoteLista: {
      maxHeight: 380,
      flexGrow: 0,
    },
    linhaLoteServico: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      gap: Spacing.sm,
    },
    linhaLoteNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodySm,
    },
    linhaLoteAtual: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
    },
    inputLote: {
      width: 84,
      height: 38,
      borderRadius: Radii.sm,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    inputLoteCampo: {
      width: '100%',
      height: '100%',
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      textAlign: 'center',
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    inputLoteTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      textAlign: 'center',
    },
    botaoConfirmarModal: {
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
      color: '#09090B',
    },
    opcaoTemaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radii.lg,
      borderWidth: 1.5,
      marginBottom: Spacing.xs,
    },
    modalItemCard: {
      borderRadius: Radii.md,
      padding: Spacing.md,
      gap: 4,
      borderWidth: 1,
    },
    modalItemRotulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },
    modalItemDescricao: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      lineHeight: 18,
    },
    modalTextoConfirmacao: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyLg,
      textAlign: 'center',
      paddingVertical: Spacing.md,
    },
    modalAcoesRow: { flexDirection: 'row', gap: Spacing.sm },
    modalBotaoCancelar: {
      flex: 1,
      borderRadius: Radii.md,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    modalBotaoCancelarTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.bodyMd,
    },
    modalBotaoSair: {
      flex: 1,
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
  });
