import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Lock,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react-native';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useMembrosBarbearia, type PapelMembro, type MembroBarbearia } from '@/hooks/useMembrosBarbearia';
import { extrairCaminhoStorage, removerMidiaStorage, uploadImagemTenant } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

type AbaGestao = 'dados' | 'midia' | 'equipe';

interface UsuarioBusca {
  id: string;
  nome_completo: string | null;
  email: string | null;
  telefone: string | null;
  role: string;
}

const PAPEL_ROTULOS: Record<PapelMembro, { rotulo: string; cor: string; desc: string }> = {
  proprietario: { rotulo: 'Proprietário', cor: Colors.ouro, desc: 'Acesso total, gestão comercial e membros' },
  gestor: { rotulo: 'Gestor', cor: '#4EA8DE', desc: 'Gerenciamento de agenda, dados e equipe' },
  barbeiro: { rotulo: 'Barbeiro', cor: Colors.verde, desc: 'Atendimentos, agenda própria e clientes' },
  atendente: { rotulo: 'Atendente', cor: '#B5838D', desc: 'Agendamentos e recepção' },
};

export default function GestaoBarbearia() {
  const router = useRouter();
  const { barbearia, selecionarBarbearia } = useBarbearia();
  const {
    membros,
    carregando: carregandoMembros,
    adicionarMembro,
    alterarPapel,
    alternarStatus,
    removerMembro,
  } = useMembrosBarbearia(barbearia?.id);

  // Aba ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaGestao>('dados');

  // Estados dos dados comerciais
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [publicada, setPublicada] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estados de mídia
  const [enviandoMidia, setEnviandoMidia] = useState<'logo' | 'banner' | 'fotos' | null>(null);
  const [removendoFoto, setRemovendoFoto] = useState<string | null>(null);

  // Estados de membros & busca
  const [modalNovoMembro, setModalNovoMembro] = useState(false);
  const [modalEditarMembro, setModalEditarMembro] = useState<MembroBarbearia | null>(null);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<UsuarioBusca[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioBusca | null>(null);
  const [papelNovoMembro, setPapelNovoMembro] = useState<PapelMembro>('barbeiro');
  const [salvandoMembro, setSalvandoMembro] = useState(false);

  useEffect(() => {
    if (!barbearia) return;
    setNome(barbearia.nome ?? '');
    setDescricao(barbearia.descricao ?? '');
    setCidade(barbearia.cidade ?? '');
    setBairro(barbearia.bairro ?? '');
    setEndereco(barbearia.endereco ?? '');
    setTelefone(barbearia.telefone ?? '');
    setWhatsapp(barbearia.whatsapp ?? '');
    setPublicada(barbearia.publicada === true);
  }, [barbearia]);

  const fotosArray = useMemo(() => {
    if (!barbearia?.fotos || !Array.isArray(barbearia.fotos)) return [];
    return barbearia.fotos.filter((f): f is string => typeof f === 'string');
  }, [barbearia?.fotos]);

  // ─── AÇÕES: DADOS COMERCIAIS ───
  async function salvarDados() {
    if (!barbearia || !nome.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome da barbearia para salvar.');
      return;
    }
    setSalvando(true);
    const { data, error } = await supabase
      .from('barbearias')
      .update({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        cidade: cidade.trim() || null,
        bairro: bairro.trim() || null,
        endereco: endereco.trim() || null,
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        publicada,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', barbearia.id)
      .select('id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema, publicada, status')
      .single();

    setSalvando(false);
    if (error) {
      Alert.alert('Erro ao salvar', error.message);
      return;
    }

    await selecionarBarbearia({ ...barbearia, ...data, publicada });
    Alert.alert(
      'Dados atualizados! ✨',
      publicada
        ? 'A barbearia está ativa e visível na vitrine pública para os clientes.'
        : 'A barbearia foi salva como privada (visível apenas para sua equipe).'
    );
  }

  // ─── AÇÕES: MÍDIA & STORAGE ───
  async function escolherEEnviarLogo() {
    if (!barbearia) return;
    setEnviandoMidia('logo');
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (resultado.canceled || !resultado.assets?.length) return;
      const asset = resultado.assets[0];

      // Remove logo antiga se existir no storage
      if (barbearia.logo_url) {
        await removerMidiaStorage(barbearia.logo_url);
      }

      const { publicUrl } = await uploadImagemTenant(barbearia.id, 'logo', asset.uri, asset.mimeType);

      const { error: erroUpdate } = await supabase
        .from('barbearias')
        .update({ logo_url: publicUrl, atualizado_em: new Date().toISOString() })
        .eq('id', barbearia.id);

      if (erroUpdate) throw erroUpdate;

      await selecionarBarbearia({ ...barbearia, logo_url: publicUrl });
      Alert.alert('Logo atualizada! 💈', 'A nova logo da barbearia foi aplicada com sucesso.');
    } catch (err: any) {
      console.error('[GestaoBarbearia] Falha ao enviar logo:', err);
      Alert.alert('Falha no upload', err.message || 'Não foi possível atualizar a logo.');
    } finally {
      setEnviandoMidia(null);
    }
  }

  async function removerLogo() {
    if (!barbearia?.logo_url) return;
    Alert.alert('Remover Logo', 'Deseja excluir a logo atual desta barbearia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setEnviandoMidia('logo');
          try {
            await removerMidiaStorage(barbearia.logo_url);
            await supabase
              .from('barbearias')
              .update({ logo_url: null, atualizado_em: new Date().toISOString() })
              .eq('id', barbearia.id);

            await selecionarBarbearia({ ...barbearia, logo_url: null });
            Alert.alert('Logo removida', 'O estabelecimento voltou a usar a inicial como padrão.');
          } catch (err: any) {
            Alert.alert('Erro ao remover', err.message);
          } finally {
            setEnviandoMidia(null);
          }
        },
      },
    ]);
  }

  async function escolherEEnviarBanner() {
    if (!barbearia) return;
    setEnviandoMidia('banner');
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 5],
        quality: 0.9,
      });

      if (resultado.canceled || !resultado.assets?.length) return;
      const asset = resultado.assets[0];

      // Remove banner antigo se existir no storage
      if (barbearia.banner_url) {
        await removerMidiaStorage(barbearia.banner_url);
      }

      const { publicUrl } = await uploadImagemTenant(barbearia.id, 'banner', asset.uri, asset.mimeType);

      const { error: erroUpdate } = await supabase
        .from('barbearias')
        .update({ banner_url: publicUrl, atualizado_em: new Date().toISOString() })
        .eq('id', barbearia.id);

      if (erroUpdate) throw erroUpdate;

      await selecionarBarbearia({ ...barbearia, banner_url: publicUrl });
      Alert.alert('Banner atualizado! 🖼️', 'O novo banner foi salvo e já está ativo.');
    } catch (err: any) {
      console.error('[GestaoBarbearia] Falha ao enviar banner:', err);
      Alert.alert('Falha no upload', err.message || 'Não foi possível atualizar o banner.');
    } finally {
      setEnviandoMidia(null);
    }
  }

  async function removerBanner() {
    if (!barbearia?.banner_url) return;
    Alert.alert('Remover Banner', 'Deseja excluir o banner atual desta barbearia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setEnviandoMidia('banner');
          try {
            await removerMidiaStorage(barbearia.banner_url);
            await supabase
              .from('barbearias')
              .update({ banner_url: null, atualizado_em: new Date().toISOString() })
              .eq('id', barbearia.id);

            await selecionarBarbearia({ ...barbearia, banner_url: null });
            Alert.alert('Banner removido', 'O estabelecimento agora usa o cabeçalho dourado padrão.');
          } catch (err: any) {
            Alert.alert('Erro ao remover', err.message);
          } finally {
            setEnviandoMidia(null);
          }
        },
      },
    ]);
  }

  async function escolherEEnviarFotos() {
    if (!barbearia) return;
    const limiteDisponivel = Math.max(0, 6 - fotosArray.length);
    if (limiteDisponivel === 0) {
      Alert.alert('Limite atingido', 'A galeria suporta no máximo 6 fotos. Remova alguma para adicionar novas.');
      return;
    }

    setEnviandoMidia('fotos');
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: limiteDisponivel,
        quality: 0.85,
      });

      if (resultado.canceled || !resultado.assets?.length) return;

      const novasUrls: string[] = [];
      for (const [idx, asset] of resultado.assets.entries()) {
        const { publicUrl } = await uploadImagemTenant(barbearia.id, 'fotos', asset.uri, asset.mimeType, idx);
        novasUrls.push(publicUrl);
      }

      const fotosAtualizadas = [...fotosArray, ...novasUrls];
      const { error: erroUpdate } = await supabase
        .from('barbearias')
        .update({ fotos: fotosAtualizadas, atualizado_em: new Date().toISOString() })
        .eq('id', barbearia.id);

      if (erroUpdate) throw erroUpdate;

      await selecionarBarbearia({ ...barbearia, fotos: fotosAtualizadas });
      Alert.alert('Galeria atualizada! 📸', `${novasUrls.length} foto(s) adicionada(s) com sucesso.`);
    } catch (err: any) {
      console.error('[GestaoBarbearia] Falha ao enviar fotos:', err);
      Alert.alert('Falha no upload', err.message || 'Não foi possível adicionar as fotos.');
    } finally {
      setEnviandoMidia(null);
    }
  }

  async function excluirFotoIndividual(fotoUrl: string) {
    if (!barbearia) return;
    Alert.alert('Excluir Foto', 'Deseja remover esta imagem da galeria?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setRemovendoFoto(fotoUrl);
          try {
            await removerMidiaStorage(fotoUrl);
            const fotosAtualizadas = fotosArray.filter((f) => f !== fotoUrl);
            const { error } = await supabase
              .from('barbearias')
              .update({ fotos: fotosAtualizadas, atualizado_em: new Date().toISOString() })
              .eq('id', barbearia.id);

            if (error) throw error;
            await selecionarBarbearia({ ...barbearia, fotos: fotosAtualizadas });
          } catch (err: any) {
            Alert.alert('Erro ao excluir foto', err.message);
          } finally {
            setRemovendoFoto(null);
          }
        },
      },
    ]);
  }

  // ─── AÇÕES: GESTÃO DE MEMBROS ───
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

  if (!barbearia) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.vazioContainer}>
          <Text style={styles.vazioTexto}>Selecione uma barbearia ativa primeiro no menu.</Text>
          <TouchableOpacity style={styles.voltarBotao} onPress={() => router.back()}>
            <Text style={styles.voltarBotaoTexto}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBotao}>
          <ArrowLeft color={Colors.textoPrimario} size={22} />
        </TouchableOpacity>
        <View style={styles.headerCentro}>
          <Text style={styles.headerTitulo}>Gestão do Estabelecimento</Text>
          <Text style={styles.headerSubtitulo} numberOfLines={1}>
            {barbearia.nome}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Segmented Tabs */}
      <View style={styles.segmentosContainer}>
        <TouchableOpacity
          style={[styles.segmento, abaAtiva === 'dados' && styles.segmentoAtivo]}
          onPress={() => setAbaAtiva('dados')}
        >
          <Globe size={16} color={abaAtiva === 'dados' ? Colors.ouro : Colors.textoSecundario} />
          <Text style={[styles.segmentoTexto, abaAtiva === 'dados' && styles.segmentoTextoAtivo]}>Dados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmento, abaAtiva === 'midia' && styles.segmentoAtivo]}
          onPress={() => setAbaAtiva('midia')}
        >
          <ImageIcon size={16} color={abaAtiva === 'midia' ? Colors.ouro : Colors.textoSecundario} />
          <Text style={[styles.segmentoTexto, abaAtiva === 'midia' && styles.segmentoTextoAtivo]}>Identidade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmento, abaAtiva === 'equipe' && styles.segmentoAtivo]}
          onPress={() => setAbaAtiva('equipe')}
        >
          <Users size={16} color={abaAtiva === 'equipe' ? Colors.ouro : Colors.textoSecundario} />
          <Text style={[styles.segmentoTexto, abaAtiva === 'equipe' && styles.segmentoTextoAtivo]}>
            Equipe ({membros.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* ─── ABA 1: DADOS COMERCIAIS ─── */}
        {abaAtiva === 'dados' && (
          <View style={styles.secao}>
            <Text style={styles.ajuda}>
              Edite as informações comerciais e controle a publicação do estabelecimento na vitrine.
            </Text>

            <Campo label="Nome do Estabelecimento *" value={nome} onChangeText={setNome} placeholder="Ex: Barbearia Vieira" />
            <Campo
              label="Descrição / Apresentação"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              placeholder="Descreva seu espaço, diferenciais e ambiente..."
            />
            <View style={styles.linhaDupla}>
              <View style={{ flex: 1 }}>
                <Campo label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Ex: São Paulo" />
              </View>
              <View style={{ flex: 1 }}>
                <Campo label="Bairro" value={bairro} onChangeText={setBairro} placeholder="Ex: Centro" />
              </View>
            </View>
            <Campo label="Endereço Completo" value={endereco} onChangeText={setEndereco} placeholder="Rua, número, complemento" />

            <View style={styles.linhaDupla}>
              <View style={{ flex: 1 }}>
                <Campo label="Telefone Fixo" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="(00) 0000-0000" />
              </View>
              <View style={{ flex: 1 }}>
                <Campo label="WhatsApp Comercial" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="(00) 90000-0000" />
              </View>
            </View>

            {/* Switch de Publicação na Vitrine */}
            <View style={styles.cardPublicacao}>
              <View style={styles.cardPublicacaoHeader}>
                {publicada ? <Globe size={22} color={Colors.ouro} /> : <Lock size={22} color={Colors.textoSecundario} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardPublicacaoTitulo}>
                    {publicada ? 'Estabelecimento Público na Vitrine' : 'Estabelecimento Privado (Em Modo Rascunho)'}
                  </Text>
                  <Text style={styles.cardPublicacaoSub}>
                    {publicada
                      ? 'Clientes do aplicativo podem encontrar sua barbearia, visualizar serviços e agendar horários.'
                      : 'O acesso fica restrito apenas aos profissionais e gestores vinculados à equipe.'}
                  </Text>
                </View>
                <Switch
                  value={publicada}
                  onValueChange={setPublicada}
                  trackColor={{ false: Colors.borda, true: Colors.ouro }}
                  thumbColor={Colors.branco}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.botaoSalvar} onPress={salvarDados} disabled={salvando}>
              {salvando ? (
                <ActivityIndicator color={Colors.fundo} size="small" />
              ) : (
                <>
                  <Save size={18} color={Colors.fundo} />
                  <Text style={styles.botaoSalvarTexto}>Salvar Alterações</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── ABA 2: IDENTIDADE VISUAL & MÍDIA ─── */}
        {abaAtiva === 'midia' && (
          <View style={styles.secao}>
            <Text style={styles.ajuda}>
              Personalize a imagem da sua barbearia no aplicativo. Imagens no formato correto garantem um visual premium para os clientes.
            </Text>

            {/* CARD LOGO */}
            <View style={styles.cardMidia}>
              <View style={styles.cardMidiaTopo}>
                <View style={styles.cardMidiaInfo}>
                  <Text style={styles.cardMidiaTitulo}>Logo Oficial (1:1 Quadrada)</Text>
                  <Text style={styles.cardMidiaSub}>Exibida no perfil, cabeçalhos e listas de busca.</Text>
                </View>
              </View>

              <View style={styles.previewLogoLinha}>
                <View style={styles.logoPreview}>
                  {barbearia.logo_url ? (
                    <Image source={{ uri: barbearia.logo_url }} style={styles.logoImagem} resizeMode="cover" />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Text style={styles.logoPlaceholderTexto}>{barbearia.nome.slice(0, 1).toUpperCase()}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.midiaBotoesColuna}>
                  <TouchableOpacity
                    style={styles.botaoMidiaPrincipal}
                    onPress={escolherEEnviarLogo}
                    disabled={enviandoMidia !== null}
                  >
                    {enviandoMidia === 'logo' ? (
                      <ActivityIndicator size="small" color={Colors.fundo} />
                    ) : (
                      <>
                        <Camera size={16} color={Colors.fundo} />
                        <Text style={styles.botaoMidiaPrincipalTexto}>
                          {barbearia.logo_url ? 'Alterar Logo' : 'Escolher Logo'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {barbearia.logo_url ? (
                    <TouchableOpacity
                      style={styles.botaoMidiaRemover}
                      onPress={removerLogo}
                      disabled={enviandoMidia !== null}
                    >
                      <Trash2 size={15} color={Colors.vermelho} />
                      <Text style={styles.botaoMidiaRemoverTexto}>Remover Logo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>

            {/* CARD BANNER */}
            <View style={styles.cardMidia}>
              <View style={styles.cardMidiaTopo}>
                <View style={styles.cardMidiaInfo}>
                  <Text style={styles.cardMidiaTitulo}>Banner de Destaque (16:5 Horizontal)</Text>
                  <Text style={styles.cardMidiaSub}>Exibido como capa no topo da vitrine da sua barbearia.</Text>
                </View>
              </View>

              <View style={styles.bannerPreviewContainer}>
                {barbearia.banner_url ? (
                  <Image source={{ uri: barbearia.banner_url }} style={styles.bannerImagem} resizeMode="cover" />
                ) : (
                  <View style={styles.bannerPlaceholder}>
                    <ImageIcon size={32} color={Colors.ouro} />
                    <Text style={styles.bannerPlaceholderTexto}>Nenhum banner cadastrado</Text>
                  </View>
                )}
              </View>

              <View style={styles.bannerAcoesLinha}>
                <TouchableOpacity
                  style={[styles.botaoMidiaPrincipal, { flex: 1 }]}
                  onPress={escolherEEnviarBanner}
                  disabled={enviandoMidia !== null}
                >
                  {enviandoMidia === 'banner' ? (
                    <ActivityIndicator size="small" color={Colors.fundo} />
                  ) : (
                    <>
                      <Camera size={16} color={Colors.fundo} />
                      <Text style={styles.botaoMidiaPrincipalTexto}>
                        {barbearia.banner_url ? 'Alterar Banner' : 'Escolher Banner'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {barbearia.banner_url ? (
                  <TouchableOpacity
                    style={styles.botaoMidiaRemover}
                    onPress={removerBanner}
                    disabled={enviandoMidia !== null}
                  >
                    <Trash2 size={15} color={Colors.vermelho} />
                    <Text style={styles.botaoMidiaRemoverTexto}>Remover</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* CARD GALERIA DE FOTOS */}
            <View style={styles.cardMidia}>
              <View style={styles.cardMidiaTopo}>
                <View style={styles.cardMidiaInfo}>
                  <Text style={styles.cardMidiaTitulo}>Galeria do Espaço ({fotosArray.length}/6 fotos)</Text>
                  <Text style={styles.cardMidiaSub}>Fotos do ambiente e cortes para encantar os clientes.</Text>
                </View>
              </View>

              <View style={styles.fotosGrid}>
                {fotosArray.map((fotoUrl, idx) => (
                  <View key={`${fotoUrl}-${idx}`} style={styles.fotoItem}>
                    <Image source={{ uri: fotoUrl }} style={styles.fotoImagem} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.fotoBotaoExcluir}
                      onPress={() => excluirFotoIndividual(fotoUrl)}
                      disabled={removendoFoto === fotoUrl}
                    >
                      {removendoFoto === fotoUrl ? (
                        <ActivityIndicator size="small" color={Colors.branco} />
                      ) : (
                        <Trash2 size={14} color={Colors.branco} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}

                {fotosArray.length < 6 && (
                  <TouchableOpacity
                    style={styles.fotoAddBotao}
                    onPress={escolherEEnviarFotos}
                    disabled={enviandoMidia !== null}
                  >
                    {enviandoMidia === 'fotos' ? (
                      <ActivityIndicator size="small" color={Colors.ouro} />
                    ) : (
                      <>
                        <Plus size={24} color={Colors.ouro} />
                        <Text style={styles.fotoAddTexto}>Adicionar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ─── ABA 3: GESTÃO DE EQUIPE & MEMBROS ─── */}
        {abaAtiva === 'equipe' && (
          <View style={styles.secao}>
            <View style={styles.equipeTopo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ajuda}>
                  Gerencie os profissionais vinculados a este estabelecimento e defina seus papéis de acesso.
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
                        >
                          <Shield size={16} color={Colors.ouro} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.membroAcaoBotao}
                          onPress={() => handleAlternarStatusMembro(membro)}
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
                    style={[styles.papelChip, selecionado && { borderColor: info.cor, backgroundColor: '#222222' }]}
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
                <ActivityIndicator color={Colors.fundo} size="small" />
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
                <X size={20} color={Colors.textoSecundario} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Membro:{' '}
              <Text style={{ color: Colors.ouro, fontFamily: FontFamily.bold }}>
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
                    style={[styles.papelChip, selecionado && { borderColor: info.cor, backgroundColor: '#222222' }]}
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
    </SafeAreaView>
  );
}

function Campo({
  label,
  multiline,
  ...props
}: {
  label: string;
  multiline?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor={Colors.textoDesabilitado}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  headerBotao: { padding: 4 },
  headerCentro: { alignItems: 'center' },
  headerTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg },
  headerSubtitulo: { color: Colors.ouro, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm, marginTop: 2 },

  segmentosContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.superficie,
    marginHorizontal: Spacing.telaH,
    marginTop: Spacing.md,
    borderRadius: Radii.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  segmento: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radii.sm,
  },
  segmentoAtivo: { backgroundColor: Colors.fundo, borderWidth: 1, borderColor: Colors.borda },
  segmentoTexto: { color: Colors.textoSecundario, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },
  segmentoTextoAtivo: { color: Colors.ouro, fontFamily: FontFamily.bold },

  scroll: { padding: Spacing.telaH, paddingBottom: Spacing.giant },
  secao: { gap: Spacing.md },
  ajuda: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, lineHeight: 20 },

  campo: { gap: 6 },
  campoLabel: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: Colors.borda,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
    color: Colors.textoPrimario,
    paddingHorizontal: Spacing.md,
    fontFamily: FontFamily.regular,
  },
  inputMultiline: { minHeight: 85, paddingTop: Spacing.sm, textAlignVertical: 'top' },
  linhaDupla: { flexDirection: 'row', gap: Spacing.sm },

  cardPublicacao: {
    borderWidth: 1,
    borderColor: Colors.borda,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  cardPublicacaoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardPublicacaoTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  cardPublicacaoSub: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, marginTop: 2 },

  botaoSalvar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ouro,
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: Spacing.sm,
  },
  botaoSalvarTexto: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },

  // Mídia
  cardMidia: {
    borderWidth: 1,
    borderColor: Colors.borda,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardMidiaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardMidiaInfo: { flex: 1 },
  cardMidiaTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  cardMidiaSub: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, marginTop: 2 },

  previewLogoLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 4 },
  logoPreview: { width: 80, height: 80, borderRadius: Radii.md, overflow: 'hidden', backgroundColor: Colors.fundo, borderWidth: 1, borderColor: Colors.borda },
  logoImagem: { width: '100%', height: '100%' },
  logoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.ouro },
  logoPlaceholderTexto: { fontFamily: FontFamily.bold, fontSize: 32, color: Colors.fundo },

  midiaBotoesColuna: { flex: 1, gap: 8 },
  botaoMidiaPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.ouro,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  botaoMidiaPrincipalTexto: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  botaoMidiaRemover: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.vermelho,
  },
  botaoMidiaRemoverTexto: { color: Colors.vermelho, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },

  bannerPreviewContainer: {
    height: 110,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.fundo,
    borderWidth: 1,
    borderColor: Colors.borda,
    marginTop: 4,
  },
  bannerImagem: { width: '100%', height: '100%' },
  bannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  bannerPlaceholderTexto: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  bannerAcoesLinha: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },

  fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  fotoItem: { width: '30.5%', aspectRatio: 1, borderRadius: Radii.md, overflow: 'hidden', position: 'relative' },
  fotoImagem: { width: '100%', height: '100%' },
  fotoBotaoExcluir: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(211, 47, 47, 0.85)',
    borderRadius: Radii.full,
    padding: 5,
  },
  fotoAddBotao: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.ouro,
    backgroundColor: Colors.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fotoAddTexto: { color: Colors.ouro, fontFamily: FontFamily.bold, fontSize: FontSize.labelXs },

  // Equipe
  equipeTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  botaoAdicionarMembro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ouro,
    borderRadius: Radii.md,
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
  },
  botaoAdicionarMembroTexto: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },

  membrosLista: { gap: Spacing.sm, marginTop: 6 },
  membroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    backgroundColor: Colors.superficie,
    gap: Spacing.sm,
  },
  membroCardInativo: { opacity: 0.6, borderColor: Colors.borda },
  membroAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.fundo,
    borderWidth: 1,
    borderColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membroAvatarTexto: { color: Colors.ouro, fontFamily: FontFamily.bold, fontSize: 18 },
  membroInfo: { flex: 1, gap: 2 },
  membroNomeLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  membroNome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  membroNomeInativo: { textDecorationLine: 'line-through' },
  badgePapel: { borderWidth: 1, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgePapelTexto: { fontFamily: FontFamily.bold, fontSize: 10 },
  membroContato: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  membroStatusLinha: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusPonto: { width: 6, height: 6, borderRadius: Radii.full },
  membroStatusTexto: { color: Colors.textoSecundario, fontFamily: FontFamily.medium, fontSize: 11 },
  membroAcoes: { flexDirection: 'row', gap: 6 },
  membroAcaoBotao: {
    padding: 8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.fundo,
    borderWidth: 1,
    borderColor: Colors.borda,
  },

  membrosVazio: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  membrosVazioTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  membrosVazioSub: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, textAlign: 'center' },

  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: Spacing.telaH },
  modalConteudo: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  modalTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg },
  modalSub: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, marginBottom: 12 },

  buscaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borda,
    borderRadius: Radii.md,
    backgroundColor: Colors.fundo,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  buscaInput: { flex: 1, color: Colors.textoPrimario, fontFamily: FontFamily.regular },
  buscaResultados: { maxHeight: 150, marginTop: 8, borderWidth: 1, borderColor: Colors.borda, borderRadius: Radii.md },
  buscaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  buscaItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buscaItemAvatarTexto: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: 14 },
  buscaItemNome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  buscaItemEmail: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: 11 },

  usuarioCardSelecionado: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.fundo,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.ouro,
    marginTop: 8,
  },
  usuarioCardNome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },
  usuarioCardEmail: { color: Colors.ouroClaro, fontFamily: FontFamily.regular, fontSize: 11 },

  papeisOpcoes: { gap: 8, marginTop: 6 },
  papelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    backgroundColor: Colors.fundo,
    gap: Spacing.sm,
  },
  papelPonto: { width: 8, height: 8, borderRadius: Radii.full },
  papelChipTexto: { color: Colors.textoPrimario, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },
  papelChipDesc: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: 11, marginTop: 1 },

  botaoConfirmarModal: {
    backgroundColor: Colors.ouro,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  botaoConfirmarModalTexto: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },

  botaoExcluirMembroModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borda,
  },
  botaoExcluirMembroModalTexto: { color: Colors.vermelho, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm },

  vazioContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.telaH, gap: Spacing.md },
  vazioTexto: { color: Colors.textoPrimario, fontFamily: FontFamily.medium, textAlign: 'center' },
  voltarBotao: { backgroundColor: Colors.ouro, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radii.md },
  voltarBotaoTexto: { color: Colors.fundo, fontFamily: FontFamily.bold },
});
