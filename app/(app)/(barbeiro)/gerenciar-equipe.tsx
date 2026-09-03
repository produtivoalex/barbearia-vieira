import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  Check,
  Percent,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radii, Shadows, Spacing, type ThemePalette } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useMembrosBarbearia,
  type MembroBarbearia,
  type PapelMembro,
} from '@/hooks/useMembrosBarbearia';
import { supabase } from '@/lib/supabase';

interface UsuarioBusca {
  id: string;
  nome_completo: string | null;
  email: string | null;
  telefone: string | null;
  role: string;
}

const PAPEL_ROTULOS: Record<PapelMembro, { rotulo: string; desc: string; cor: string }> = {
  proprietario: {
    rotulo: 'Proprietário / Dono',
    desc: 'Acesso total: gerencia equipe, comissões, faturamento e configurações.',
    cor: '#E5A93C',
  },
  gestor: {
    rotulo: 'Gestor / Gerente',
    desc: 'Gerenciamento de agenda, dados operacionais e equipe.',
    cor: '#4EA8DE',
  },
  barbeiro: {
    rotulo: 'Barbeiro / Profissional',
    desc: 'Gerencia sua própria agenda, atendimentos do dia e clientes.',
    cor: '#3B82F6',
  },
  atendente: {
    rotulo: 'Atendente / Recepção',
    desc: 'Visualiza e cria agendamentos para todos os profissionais da barbearia.',
    cor: '#8B5CF6',
  },
};

export default function TelaGerenciarEquipe() {
  const router = useRouter();
  const { session } = useAuth();
  const { barbearia, selecionarBarbearia } = useBarbearia();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    membros,
    carregando: carregandoMembros,
    adicionarMembro,
    alterarPapel,
    alternarStatus,
    removerMembro,
  } = useMembrosBarbearia(barbearia?.id);

  // Comissão Padrão da Equipe
  const [comissaoPadrao, setComissaoPadrao] = useState(
    String(barbearia?.comissao_padrao !== undefined ? barbearia.comissao_padrao : 50)
  );
  const [salvandoComissao, setSalvandoComissao] = useState(false);

  useEffect(() => {
    if (barbearia?.comissao_padrao !== undefined) {
      setComissaoPadrao(String(barbearia.comissao_padrao));
    }
  }, [barbearia?.comissao_padrao]);

  async function handleSalvarComissao(valor?: string) {
    if (!barbearia) return;
    const valorParaSalvar = valor !== undefined ? valor : comissaoPadrao;
    const comissaoNum = Number(valorParaSalvar.replace(',', '.')) || 50;

    setSalvandoComissao(true);
    try {
      const { error } = await supabase
        .from('barbearias')
        .update({
          comissao_padrao: comissaoNum,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', barbearia.id);

      if (error) throw error;

      await selecionarBarbearia({
        ...barbearia,
        comissao_padrao: comissaoNum,
      });

      Alert.alert('Comissão Atualizada! 💰', `A comissão padrão da equipe foi definida para ${comissaoNum}%.`);
    } catch (err: any) {
      Alert.alert('Erro ao salvar comissão', err.message || 'Tente novamente.');
    } finally {
      setSalvandoComissao(false);
    }
  }

  // Estados do Modal Novo Membro
  const [modalNovoMembro, setModalNovoMembro] = useState(false);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<UsuarioBusca[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioBusca | null>(null);
  const [papelNovoMembro, setPapelNovoMembro] = useState<PapelMembro>('barbeiro');
  const [salvandoMembro, setSalvandoMembro] = useState(false);

  // Estados do Modal Editar Papel
  const [modalEditarMembro, setModalEditarMembro] = useState<MembroBarbearia | null>(null);

  // Busca em tempo real de usuários para novo membro
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
        .or(`nome_completo.ilike.%${termoLimpo}%,email.ilike.%${termoLimpo}%,telefone.ilike.%${termoLimpo}%`)
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
      `Tem certeza que deseja desvincular ${membro.perfil?.nome_completo || 'este profissional'} permanentemente da barbearia?`,
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

  const membrosAtivos = useMemo(() => membros.filter((m) => m.ativo), [membros]);
  const membrosInativos = useMemo(() => membros.filter((m) => !m.ativo), [membros]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header Principal */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botaoVoltar}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={theme.textoPrimario} />
        </TouchableOpacity>

        <View style={styles.headerCentro}>
          <Text style={[styles.headerTitulo, { color: theme.textoPrimario }]}>Gerenciar Equipe</Text>
          <Text style={[styles.headerSubtitulo, { color: theme.textoSecundario }]} numberOfLines={1}>
            {barbearia?.nome || 'Minha Barbearia'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.botaoAddHeader, { backgroundColor: theme.ouro }]}
          onPress={() => {
            setUsuarioSelecionado(null);
            setBuscaUsuario('');
            setUsuariosEncontrados([]);
            setPapelNovoMembro('barbeiro');
            setModalNovoMembro(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={16} color={theme.textoEscuroSobreOuro} />
          <Text style={[styles.botaoAddHeaderTexto, { color: theme.textoEscuroSobreOuro }]}>Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Card Resumo do Time */}
        <View style={[styles.cardResumo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
          <View style={[styles.iconeResumoWrapper, { backgroundColor: theme.ouroTranslucido }]}>
            <Users size={22} color={theme.ouroTexto} />
          </View>
          <View style={styles.textosResumo}>
            <Text style={[styles.tituloResumo, { color: theme.textoPrimario }]}>
              {membros.length} {membros.length === 1 ? 'Profissional' : 'Profissionais'} na Equipe
            </Text>
            <Text style={[styles.descResumo, { color: theme.textoSecundario }]}>
              {membrosAtivos.length} ativo(s){membrosInativos.length > 0 ? ` · ${membrosInativos.length} inativo(s)` : ''} · Adicione barbeiros ou atendentes para gerenciar os horários da unidade.
            </Text>
          </View>
        </View>

        {/* Card Comissão Padrão da Equipe */}
        <View style={[styles.cardComissao, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
          <View style={styles.cardComissaoHeader}>
            <View style={[styles.cardComissaoIconeWrapper, { backgroundColor: theme.ouroTranslucido }]}>
              <Percent size={18} color={theme.ouroTexto} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardComissaoTitulo, { color: theme.textoPrimario }]}>
                Comissão Padrão da Equipe (%)
              </Text>
              <Text style={[styles.cardComissaoDesc, { color: theme.textoSecundario }]}>
                Percentual padrão pago aos barbeiros nos relatórios de fechamento de caixa e financeiro.
              </Text>
            </View>
          </View>

          <View style={styles.comissaoInputLinha}>
            <View style={[styles.inputComissaoWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
              <TextInput
                style={[styles.inputComissao, { color: theme.textoPrimario }]}
                value={comissaoPadrao}
                onChangeText={setComissaoPadrao}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={theme.textoDesabilitado}
                maxLength={3}
              />
              <Text style={[styles.inputComissaoSufixo, { color: theme.ouroTexto }]}>% de comissão</Text>
            </View>

            <TouchableOpacity
              style={[styles.botaoSalvarComissao, { backgroundColor: theme.ouro }]}
              onPress={() => handleSalvarComissao()}
              disabled={salvandoComissao}
              activeOpacity={0.8}
            >
              {salvandoComissao ? (
                <ActivityIndicator size="small" color={theme.textoEscuroSobreOuro} />
              ) : (
                <Text style={[styles.botaoSalvarComissaoTexto, { color: theme.textoEscuroSobreOuro }]}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Atalhos Rápidos de Comissão */}
          <View style={styles.comissaoPresetsLinha}>
            {['30', '40', '50', '60', '70'].map((pct) => {
              const selecionado = comissaoPadrao === pct;
              return (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.comissaoPresetChip,
                    { backgroundColor: theme.superficie2, borderColor: theme.borda },
                    selecionado && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                  ]}
                  onPress={() => {
                    setComissaoPadrao(pct);
                    handleSalvarComissao(pct);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.comissaoPresetTexto,
                      { color: theme.textoSecundario },
                      selecionado && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                    ]}
                  >
                    {pct}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Lista de Membros */}
        <View style={styles.secao}>
          <Text style={[styles.secaoTitulo, { color: theme.ouroTexto }]}>PROFISSIONAIS CADASTRADOS</Text>

          {carregandoMembros ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.ouro} size="large" />
              <Text style={[styles.loadingTexto, { color: theme.textoSecundario }]}>Carregando equipe...</Text>
            </View>
          ) : membros.length === 0 ? (
            <View style={[styles.vazioContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
              <Users size={40} color={theme.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: theme.textoPrimario }]}>Nenhum membro cadastrado</Text>
              <Text style={[styles.vazioSub, { color: theme.textoSecundario }]}>
                Toque no botão "+ Novo" acima para vincular barbeiros ou atendentes à sua barbearia.
              </Text>
            </View>
          ) : (
            <View style={styles.membrosLista}>
              {membros.map((membro) => {
                const papelInfo = PAPEL_ROTULOS[membro.papel] || PAPEL_ROTULOS.barbeiro;
                const inicial = (membro.perfil?.nome_completo || 'M').slice(0, 1).toUpperCase();

                return (
                  <View
                    key={membro.id}
                    style={[
                      styles.membroCard,
                      { backgroundColor: theme.superficie, borderColor: theme.borda },
                      !membro.ativo && styles.membroCardInativo,
                    ]}
                  >
                    <View style={[styles.membroAvatar, { backgroundColor: theme.superficie2, borderColor: papelInfo.cor }]}>
                      <Text style={[styles.membroAvatarTexto, { color: theme.textoPrimario }]}>{inicial}</Text>
                    </View>

                    <View style={styles.membroInfo}>
                      <View style={styles.membroNomeLinha}>
                        <Text
                          style={[
                            styles.membroNome,
                            { color: theme.textoPrimario },
                            !membro.ativo && { color: theme.textoSecundario },
                          ]}
                          numberOfLines={1}
                        >
                          {membro.perfil?.nome_completo || 'Profissional'}
                        </Text>
                      </View>

                      <View style={styles.tagsLinha}>
                        <View style={[styles.badgePapel, { borderColor: papelInfo.cor, backgroundColor: `${papelInfo.cor}18` }]}>
                          <Text style={[styles.badgePapelTexto, { color: papelInfo.cor }]}>
                            {papelInfo.rotulo.split('/')[0].trim()}
                          </Text>
                        </View>

                        <View style={styles.statusLinha}>
                          <View
                            style={[
                              styles.statusPonto,
                              { backgroundColor: membro.ativo ? theme.verde : theme.textoDesabilitado },
                            ]}
                          />
                          <Text style={[styles.statusTexto, { color: membro.ativo ? theme.verde : theme.textoSecundario }]}>
                            {membro.ativo ? 'Ativo' : 'Desativado'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.membroContato, { color: theme.textoSecundario }]} numberOfLines={1}>
                        {membro.perfil?.email || membro.perfil?.telefone || 'Sem contato cadastrado'}
                      </Text>
                    </View>

                    <View style={styles.membroAcoes}>
                      <TouchableOpacity
                        style={[styles.membroAcaoBotao, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                        onPress={() => setModalEditarMembro(membro)}
                        activeOpacity={0.7}
                      >
                        <Shield size={16} color={theme.ouroTexto} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.membroAcaoBotao, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
                        onPress={() => handleAlternarStatusMembro(membro)}
                        activeOpacity={0.7}
                      >
                        {membro.ativo ? (
                          <UserX size={16} color={theme.erro} />
                        ) : (
                          <UserCheck size={16} color={theme.verde} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── MODAL ADICIONAR NOVO MEMBRO ─── */}
      <Modal
        visible={modalNovoMembro}
        transparent
        animationType="slide"
        onRequestClose={() => setModalNovoMembro(false)}
      >
        <View style={styles.modalFundo}>
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borda }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Adicionar Membro</Text>
                <Text style={[styles.modalSubtitulo, { color: theme.textoSecundario }]}>
                  Pesquise por nome, e-mail ou telefone
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalNovoMembro(false)} style={styles.modalBotaoFechar}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* Campo de Busca */}
              <View style={[styles.inputBuscaWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <Search size={18} color={theme.textoSecundario} />
                <TextInput
                  style={[styles.inputBusca, { color: theme.textoPrimario }]}
                  placeholder="Buscar profissional..."
                  placeholderTextColor={theme.textoDesabilitado}
                  value={buscaUsuario}
                  onChangeText={buscarUsuariosParaMembro}
                  autoCapitalize="none"
                />
                {buscandoUsuarios && <ActivityIndicator size="small" color={theme.ouro} />}
              </View>

              {/* Lista de Usuários Encontrados */}
              {usuariosEncontrados.length > 0 && (
                <View style={styles.usuariosEncontradosLista}>
                  {usuariosEncontrados.map((u) => {
                    const selecionado = usuarioSelecionado?.id === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[
                          styles.usuarioItem,
                          { backgroundColor: theme.superficie2, borderColor: theme.borda },
                          selecionado && { backgroundColor: theme.ouroTranslucido, borderColor: theme.ouro },
                        ]}
                        onPress={() => setUsuarioSelecionado(u)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.usuarioAvatar, { backgroundColor: theme.superficie }]}>
                          <Text style={[styles.usuarioAvatarTexto, { color: theme.textoPrimario }]}>
                            {(u.nome_completo || 'U').slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={[styles.usuarioNome, { color: theme.textoPrimario }]}>{u.nome_completo || 'Sem Nome'}</Text>
                          <Text style={[styles.usuarioDetalhe, { color: theme.textoSecundario }]}>{u.email || u.telefone || 'Sem contato'}</Text>
                        </View>
                        {selecionado && <Check size={18} color={theme.ouroTexto} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Seleção do Papel */}
              {usuarioSelecionado && (
                <View style={styles.papelSelecaoContainer}>
                  <Text style={[styles.papelSelecaoTitulo, { color: theme.textoPrimario }]}>Selecione a Função / Papel:</Text>
                  {(['barbeiro', 'gestor', 'atendente', 'proprietario'] as PapelMembro[]).map((papel) => {
                    const ativo = papelNovoMembro === papel;
                    const info = PAPEL_ROTULOS[papel];
                    return (
                      <TouchableOpacity
                        key={papel}
                        style={[
                          styles.papelItem,
                          { backgroundColor: theme.superficie2, borderColor: theme.borda },
                          ativo && { backgroundColor: theme.ouroTranslucido, borderColor: theme.ouro },
                        ]}
                        onPress={() => setPapelNovoMembro(papel)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.papelItemHeader}>
                          <Text style={[styles.papelItemRotulo, { color: ativo ? theme.ouroTexto : theme.textoPrimario }]}>
                            {info.rotulo}
                          </Text>
                          {ativo && <Check size={16} color={theme.ouroTexto} />}
                        </View>
                        <Text style={[styles.papelItemDesc, { color: theme.textoSecundario }]}>{info.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalAcoes, { borderTopColor: theme.borda }]}>
              <TouchableOpacity
                style={[styles.modalBotaoCancelar, { borderColor: theme.borda }]}
                onPress={() => setModalNovoMembro(false)}
              >
                <Text style={[styles.modalBotaoCancelarTexto, { color: theme.textoSecundario }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBotaoSalvar,
                  { backgroundColor: theme.ouro },
                  (!usuarioSelecionado || salvandoMembro) && { opacity: 0.5 },
                ]}
                onPress={handleConfirmarNovoMembro}
                disabled={!usuarioSelecionado || salvandoMembro}
              >
                {salvandoMembro ? (
                  <ActivityIndicator color={theme.textoEscuroSobreOuro} size="small" />
                ) : (
                  <Text style={[styles.modalBotaoSalvarTexto, { color: theme.textoEscuroSobreOuro }]}>
                    Adicionar Membro
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL EDITAR PAPEL DO MEMBRO ─── */}
      <Modal
        visible={!!modalEditarMembro}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEditarMembro(null)}
      >
        <View style={styles.modalFundo}>
          <View style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.borda }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>Alterar Papel de Acesso</Text>
                <Text style={[styles.modalSubtitulo, { color: theme.textoSecundario }]}>
                  {modalEditarMembro?.perfil?.nome_completo || 'Profissional'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalEditarMembro(null)} style={styles.modalBotaoFechar}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: Spacing.md, gap: 10 }}>
              {(['barbeiro', 'gestor', 'atendente', 'proprietario'] as PapelMembro[]).map((papel) => {
                const ativo = modalEditarMembro?.papel === papel;
                const info = PAPEL_ROTULOS[papel];
                return (
                  <TouchableOpacity
                    key={papel}
                    style={[
                      styles.papelItem,
                      { backgroundColor: theme.superficie2, borderColor: theme.borda },
                      ativo && { backgroundColor: theme.ouroTranslucido, borderColor: theme.ouro },
                    ]}
                    onPress={() => handleAlterarPapelMembro(papel)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.papelItemHeader}>
                      <Text style={[styles.papelItemRotulo, { color: ativo ? theme.ouroTexto : theme.textoPrimario }]}>
                        {info.rotulo}
                      </Text>
                      {ativo && <Check size={16} color={theme.ouroTexto} />}
                    </View>
                    <Text style={[styles.papelItemDesc, { color: theme.textoSecundario }]}>{info.desc}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.botaoRemoverMembro, { borderColor: theme.erro }]}
                onPress={() => modalEditarMembro && handleRemoverMembro(modalEditarMembro)}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color={theme.erro} />
                <Text style={[styles.botaoRemoverMembroTexto, { color: theme.erro }]}>Desvincular Profissional</Text>
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
    botaoVoltar: {
      padding: 4,
    },
    headerCentro: {
      flex: 1,
      marginHorizontal: Spacing.sm,
    },
    headerTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.headingSm,
    },
    headerSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
    },
    botaoAddHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: Radii.full,
    },
    botaoAddHeaderTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
    scroll: {
      padding: Spacing.telaH,
      gap: Spacing.lg,
      paddingBottom: Spacing.giant,
    },
    cardResumo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      ...Shadows.card,
    },
    iconeResumoWrapper: {
      width: 44,
      height: 44,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textosResumo: {
      flex: 1,
      gap: 2,
    },
    tituloResumo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    descResumo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      lineHeight: 16,
    },
    secao: {
      gap: Spacing.sm,
    },
    secaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      letterSpacing: 0.8,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      gap: Spacing.sm,
    },
    loadingTexto: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
    },
    vazioContainer: {
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      borderWidth: 1,
      alignItems: 'center',
      gap: Spacing.sm,
    },
    vazioTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
      marginTop: 4,
    },
    vazioSub: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      textAlign: 'center',
      lineHeight: 18,
    },
    membrosLista: {
      gap: Spacing.sm,
    },
    membroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    membroCardInativo: {
      opacity: 0.6,
    },
    membroAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    membroAvatarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 16,
    },
    membroInfo: {
      flex: 1,
      gap: 4,
    },
    membroNomeLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    membroNome: {
      fontFamily: FontFamily.bold,
      fontSize: 14,
    },
    tagsLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badgePapel: {
      paddingVertical: 2,
      paddingHorizontal: 7,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    badgePapelTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 10,
    },
    statusLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusPonto: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 11,
    },
    membroContato: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
    },
    membroAcoes: {
      flexDirection: 'row',
      gap: 6,
    },
    membroAcaoBotao: {
      width: 34,
      height: 34,
      borderRadius: Radii.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalFundo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalConteudo: {
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      borderWidth: 1,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
    },
    modalTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    modalSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
    },
    modalBotaoFechar: {
      padding: 4,
    },
    modalScroll: {
      padding: Spacing.md,
    },
    inputBuscaWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radii.md,
      borderWidth: 1,
      paddingHorizontal: Spacing.sm,
      height: 44,
      gap: Spacing.xs,
    },
    inputBusca: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
    },
    usuariosEncontradosLista: {
      marginTop: Spacing.sm,
      gap: 6,
    },
    usuarioItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radii.md,
      borderWidth: 1,
      padding: Spacing.sm,
      gap: Spacing.sm,
    },
    usuarioAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    usuarioAvatarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
    },
    usuarioNome: {
      fontFamily: FontFamily.semiBold,
      fontSize: 13,
    },
    usuarioDetalhe: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
    },
    papelSelecaoContainer: {
      marginTop: Spacing.md,
      gap: 8,
    },
    papelSelecaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
      marginBottom: 2,
    },
    papelItem: {
      borderRadius: Radii.md,
      borderWidth: 1,
      padding: Spacing.sm,
      gap: 2,
    },
    papelItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    papelItemRotulo: {
      fontFamily: FontFamily.semiBold,
      fontSize: 12.5,
    },
    papelItemDesc: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      lineHeight: 15,
    },
    modalAcoes: {
      flexDirection: 'row',
      padding: Spacing.md,
      gap: Spacing.sm,
      borderTopWidth: 1,
    },
    modalBotaoCancelar: {
      flex: 1,
      height: 44,
      borderRadius: Radii.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBotaoCancelarTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 13,
    },
    modalBotaoSalvar: {
      flex: 1.5,
      height: 44,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBotaoSalvarTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
    },
    botaoRemoverMembro: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: Radii.md,
      borderWidth: 1,
      paddingVertical: 10,
      marginTop: Spacing.sm,
    },
    botaoRemoverMembroTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 12.5,
    },
    cardComissao: {
      borderRadius: Radii.lg,
      borderWidth: 1,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    cardComissaoHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    cardComissaoIconeWrapper: {
      width: 34,
      height: 34,
      borderRadius: Radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardComissaoTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    cardComissaoDesc: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      lineHeight: 16,
      marginTop: 2,
    },
    comissaoInputLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    inputComissaoWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Radii.md,
      borderWidth: 1,
      paddingHorizontal: Spacing.sm,
      height: 44,
    },
    inputComissao: {
      flex: 1,
      fontFamily: FontFamily.bold,
      fontSize: 16,
      paddingVertical: 0,
    },
    inputComissaoSufixo: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
    botaoSalvarComissao: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: Radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botaoSalvarComissaoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
    },
    comissaoPresetsLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    comissaoPresetChip: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: Radii.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    comissaoPresetTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 12,
    },
  });
