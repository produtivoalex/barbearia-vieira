import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  MessageCircle,
  Clock,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  Sparkles,
  X,
  CheckCircle2,
  Phone,
  Mail,
  Store,
  Building2,
  Moon,
  Sun,
  Smartphone,
  Check,
  MapPin,
  Trash2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Avatar, LogoBarbearia } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

type TipoModal = 'dados_conta' | 'notificacoes' | 'horarios' | 'privacidade' | 'aparencia' | 'sair' | null;

export default function TelaPerfil() {
  const router = useRouter();
  const { perfil, carregandoPerfil } = usePerfil();
  const { session } = useAuth();
  const { barbearia } = useBarbearia();
  const { theme, isEscuro, modoTema, setModoTema } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [modalAtivo, setModalAtivo] = useState<TipoModal>(null);

  const nomeExibicao = carregandoPerfil
    ? 'Carregando...'
    : perfil?.nome_completo || 'Cliente';
  const emailExibicao = session?.user?.email || '';

  async function handleConfirmarSair() {
    setModalAtivo(null);
    await supabase.auth.signOut();
  }
  const handleSair = handleConfirmarSair;

  async function handleSolicitarExclusaoConta() {
    Alert.alert(
      'Excluir Conta Permanentemente',
      'Deseja realmente excluir sua conta? Esta ação apagará seu perfil e histórico de atendimentos. Esta operação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir Minha Conta',
          style: 'destructive',
          onPress: async () => {
            try {
              if (session?.user?.id) {
                await supabase.from('perfis').delete().eq('id', session.user.id);
              }
              await supabase.auth.signOut();
              setModalAtivo(null);
              Alert.alert('Conta excluída', 'Sua conta e seus dados foram removidos.');
            } catch (err: any) {
              Alert.alert('Erro', err?.message || 'Não foi possível concluir a exclusão.');
            }
          },
        },
      ]
    );
  }

  function handleAbrirWhatsApp() {
    const telefone = (barbearia?.whatsapp || barbearia?.telefone || '86981907478').replace(/\D/g, '');
    const url = `https://wa.me/55${telefone}?text=Olá! Gostaria de tirar uma dúvida sobre meu agendamento na ${barbearia?.nome || 'barbearia'}.`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  }
  const handleAbrirWhatsAppSuporte = handleAbrirWhatsApp;

  const labelAparencia =
    modoTema === 'escuro'
      ? 'Modo Escuro (Obsidian & Gold)'
      : modoTema === 'claro'
      ? 'Modo Claro (Pearl White & Gold)'
      : 'Automático (Segue o Sistema)';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header Apple Style */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Card de Identidade com a Logo da Barbearia em Destaque ─── */}
        <View style={[styles.perfilCardCliente, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/(app)/barbearias/[slug]', params: { slug: barbearia?.slug || 'barbearia-vieira' } })}
            activeOpacity={0.8}
            style={styles.logoPerfilContainer}
          >
            <LogoBarbearia
              tamanho={72}
              tipo="avatar"
              variante="compacto"
              uri={barbearia?.logo_url}
              slug={barbearia?.slug}
            />
          </TouchableOpacity>
          <View style={styles.perfilInfo}>
            <Text style={[styles.perfilNome, { color: theme.textoPrimario }]}>{nomeExibicao}</Text>
            <Text style={[styles.perfilContato, { color: theme.textoSecundario }]}>{perfil?.telefone || emailExibicao}</Text>
            <TouchableOpacity
              style={[styles.badgeCliente, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}
              onPress={() => router.push({ pathname: '/(app)/barbearias/[slug]', params: { slug: barbearia?.slug || 'barbearia-vieira' } })}
              activeOpacity={0.75}
            >
              <Sparkles size={10} color={theme.ouroTexto} />
              <Text style={[styles.badgeClienteTexto, { color: theme.ouroTexto }]}>
                {barbearia?.nome || 'Barbearia Vieira'} • Ver Vitrine ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 1: Minha Conta */}
        <View style={styles.secao}>
          <Text style={[styles.secaoTitulo, { color: theme.ouroTexto }]}>MINHA CONTA</Text>
          <View style={[styles.cardGrupo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('dados_conta')}
            >
              <View style={[styles.itemIconeContainer, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <User size={18} color={theme.ouroTexto} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>Dados do perfil</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>Nome e informações de login</Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>

            <View style={[styles.divisorItem, { backgroundColor: theme.borda }]} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('notificacoes')}
            >
              <View style={[styles.itemIconeContainer, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Bell size={18} color={theme.ouroTexto} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>Notificações & Lembretes</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>Avisos de abertura de agenda e cortes</Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 2: Barbearia Ativa */}
        <View style={styles.secao}>
          <Text style={[styles.secaoTitulo, { color: theme.ouroTexto }]}>{(barbearia?.nome || 'BARBEARIA').toUpperCase()}</Text>
          <View style={[styles.cardGrupo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={handleAbrirWhatsApp}
            >
              <View style={[styles.itemIconeContainer, styles.iconeWhatsapp]}>
                <MessageCircle size={18} color={theme.verde} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>WhatsApp Oficial</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>{barbearia?.whatsapp || barbearia?.telefone || 'Falar com o estabelecimento'}</Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>

            <View style={[styles.divisorItem, { backgroundColor: theme.borda }]} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('horarios')}
            >
              <View style={[styles.itemIconeContainer, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Clock size={18} color={theme.ouroTexto} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>Horários & Atendimento</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>Terça a Domingo (08:00 às 18:00)</Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 3: Informações & Aparência */}
        <View style={styles.secao}>
          <Text style={[styles.secaoTitulo, { color: theme.ouroTexto }]}>INFORMAÇÕES & CONFIGURAÇÕES</Text>
          <View style={[styles.cardGrupo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            {/* Seletor de Aparência / Modo Claro / Escuro */}
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('aparencia')}
            >
              <View style={[styles.itemIconeContainer, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                {isEscuro ? (
                  <Moon size={18} color={theme.ouroTexto} />
                ) : (
                  <Sun size={18} color={theme.ouroTexto} />
                )}
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>Aparência do App</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>{labelAparencia}</Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>

            <View style={[styles.divisorItem, { backgroundColor: theme.borda }]} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('privacidade')}
            >
              <View style={[styles.itemIconeContainer, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <ShieldCheck size={18} color={theme.ouroTexto} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>Privacidade e Segurança</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>Proteção e tratamento dos seus dados</Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>

            <View style={[styles.divisorItem, { backgroundColor: theme.borda }]} />

            {/* Opção de troca de unidade */}
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/barbearias')}
            >
              <View style={[styles.itemIconeContainer, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                <Store size={18} color={theme.ouroTexto} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>Unidade de Atendimento</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>
                  {barbearia?.nome ? `${barbearia.nome} • Alterar unidade` : 'Alterar unidade selecionada'}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>

            <View style={[styles.divisorItem, { backgroundColor: theme.borda }]} />

            {/* Cadastrar barbearia / modo profissional */}
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/(barbeiro)/cadastrar-barbearia')}
            >
              <View style={[styles.itemIconeContainer, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Building2 size={18} color={theme.ouroTexto} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, { color: theme.textoPrimario }]}>É Dono de Barbearia?</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>Cadastre seu estabelecimento no Na Régua</Text>
              </View>
              <ChevronRight size={18} color={theme.textoSecundario} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 4: Sair */}
        <View style={styles.secao}>
          <View style={[styles.cardGrupo, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('sair')}
            >
              <View style={[styles.itemIconeContainer, styles.iconeSair]}>
                <LogOut size={18} color="#FF453A" />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={[styles.itemTitulo, styles.textoSair]}>Desconectar</Text>
                <Text style={[styles.itemSubtitulo, { color: theme.textoSecundario }]}>Sair da conta neste aparelho</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Versão do App */}
        <Text style={[styles.versaoTexto, { color: theme.textoSecundario }]}>Na Régua App • v2.4.0 (Build 2026)</Text>
      </ScrollView>

      {/* ─── MODAL UNIFICADO ─── */}
      <Modal
        visible={modalAtivo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalAtivo(null)}>
          <Pressable style={[styles.modalConteudo, { backgroundColor: theme.superficie, borderColor: theme.borda }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalCabecalho, { borderBottomColor: theme.borda }]}>
              <Text style={[styles.modalTitulo, { color: theme.textoPrimario }]}>
                {modalAtivo === 'dados_conta' && 'Dados do Perfil'}
                {modalAtivo === 'notificacoes' && 'Notificações & Lembretes'}
                {modalAtivo === 'horarios' && 'Horários de Atendimento'}
                {modalAtivo === 'privacidade' && 'Privacidade & Segurança'}
                {modalAtivo === 'aparencia' && 'Aparência do Aplicativo'}
                {modalAtivo === 'sair' && 'Confirmar Saída'}
              </Text>
              <TouchableOpacity onPress={() => setModalAtivo(null)} style={styles.modalBtnFecharIcone}>
                <X size={20} color={theme.textoSecundario} />
              </TouchableOpacity>
            </View>

            {/* MODAL: SELETOR DE APARÊNCIA */}
            {modalAtivo === 'aparencia' && (
              <View style={styles.modalCorpo}>
                <Text style={[styles.modalDescricaoGeral, { color: theme.textoSecundario }]}>
                  Escolha o tema visual que melhor combina com seu estilo.
                </Text>

                {/* Opção 1: Automático do Sistema (Padrão) */}
                <TouchableOpacity
                  style={[
                    styles.opcaoTemaCard,
                    { backgroundColor: theme.superficie2, borderColor: theme.borda },
                    modoTema === 'sistema' && { borderColor: theme.ouro, backgroundColor: theme.ouroTranslucido },
                  ]}
                  onPress={() => setModoTema('sistema')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.opcaoTemaIconeWrapper, { backgroundColor: isEscuro ? '#1C1C22' : '#EAEAEA' }]}>
                    <Smartphone size={18} color={theme.ouroTexto} />
                  </View>
                  <View style={styles.opcaoTemaInfo}>
                    <Text style={[styles.opcaoTemaTitulo, { color: theme.textoPrimario }]}>Automático (Padrão do Sistema)</Text>
                    <Text style={[styles.opcaoTemaSub, { color: theme.textoSecundario }]}>Acompanha em tempo real o modo claro ou escuro do seu celular</Text>
                  </View>
                  {modoTema === 'sistema' && <Check size={18} color={theme.ouroTexto} strokeWidth={3} />}
                </TouchableOpacity>

                {/* Opção 2: Modo Escuro */}
                <TouchableOpacity
                  style={[
                    styles.opcaoTemaCard,
                    { backgroundColor: theme.superficie2, borderColor: theme.borda },
                    modoTema === 'escuro' && { borderColor: theme.ouro, backgroundColor: theme.ouroTranslucido },
                  ]}
                  onPress={() => setModoTema('escuro')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.opcaoTemaIconeWrapper, { backgroundColor: '#09090B' }]}>
                    <Moon size={18} color="#CBA14A" />
                  </View>
                  <View style={styles.opcaoTemaInfo}>
                    <Text style={[styles.opcaoTemaTitulo, { color: theme.textoPrimario }]}>Modo Escuro (Obsidian & Gold)</Text>
                    <Text style={[styles.opcaoTemaSub, { color: theme.textoSecundario }]}>Preto Obsidiana com acabamento Dourado Imperial</Text>
                  </View>
                  {modoTema === 'escuro' && <Check size={18} color={theme.ouroTexto} strokeWidth={3} />}
                </TouchableOpacity>

                {/* Opção 3: Modo Claro */}
                <TouchableOpacity
                  style={[
                    styles.opcaoTemaCard,
                    { backgroundColor: theme.superficie2, borderColor: theme.borda },
                    modoTema === 'claro' && { borderColor: theme.ouro, backgroundColor: theme.ouroTranslucido },
                  ]}
                  onPress={() => setModoTema('claro')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.opcaoTemaIconeWrapper, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7' }]}>
                    <Sun size={18} color="#8B6508" />
                  </View>
                  <View style={styles.opcaoTemaInfo}>
                    <Text style={[styles.opcaoTemaTitulo, { color: theme.textoPrimario }]}>Modo Claro (Luxury White)</Text>
                    <Text style={[styles.opcaoTemaSub, { color: theme.textoSecundario }]}>Branco Pérola, tipografia Carvão e Dourado de alto contraste</Text>
                  </View>
                  {modoTema === 'claro' && <Check size={18} color={theme.ouroTexto} strokeWidth={3} />}
                </TouchableOpacity>
              </View>
            )}

            {modalAtivo === 'dados_conta' && (
              <View style={styles.modalCorpo}>
                <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>NOME COMPLETO</Text>
                  <Text style={[styles.modalItemValor, { color: theme.textoPrimario }]}>{perfil?.nome_completo || 'Não informado'}</Text>
                </View>

                <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>E-MAIL CADASTRADO</Text>
                  <Text style={[styles.modalItemValor, { color: theme.textoPrimario }]}>{emailExibicao}</Text>
                </View>

                {perfil?.telefone && (
                  <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                    <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>WHATSAPP / CELULAR</Text>
                    <Text style={[styles.modalItemValor, { color: theme.textoPrimario }]}>{perfil.telefone}</Text>
                  </View>
                )}
              </View>
            )}

            {modalAtivo === 'notificacoes' && (
              <View style={styles.modalCorpo}>
                <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>Lembrete de Corte</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoPrimario }]}>
                    O aplicativo envia avisos pontuais 2 horas e 30 minutos antes do horário agendado.
                  </Text>
                </View>

                <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>Abertura de Agenda Semanal</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoPrimario }]}>
                    Você recebe uma notificação assim que a barbearia abre novos horários para a semana.
                  </Text>
                </View>
              </View>
            )}

            {modalAtivo === 'horarios' && (
              <View style={styles.modalCorpo}>
                <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>FUNCIONAMENTO</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoPrimario }]}>
                    • Os dias e horários são definidos e liberados em tempo real diretamente na agenda do aplicativo.{'\n'}
                    • Consulte as vagas disponíveis na tela de agendamento.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.modalBotaoWhats, { backgroundColor: theme.verde }]}
                  onPress={handleAbrirWhatsApp}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                  <Text style={styles.modalBotaoWhatsTexto}>Falar no WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalAtivo === 'privacidade' && (
              <View style={styles.modalCorpo}>
                <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>Segurança de Dados</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoPrimario }]}>
                    Seus dados cadastrais e histórico de agendamentos são armazenados com segurança e protegidos por políticas rigorosas de Row Level Security (RLS) no Supabase.
                  </Text>
                </View>

                <View style={[styles.modalItemCard, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.modalItemRotulo, { color: theme.textoSecundario }]}>Privacidade Garantida</Text>
                  <Text style={[styles.modalItemDescricao, { color: theme.textoPrimario }]}>
                    Nenhum outro cliente tem acesso ao seu perfil ou aos seus horários agendados. O sistema Na Régua garante total sigilo e proteção.
                  </Text>
                </View>

                {/* Botão de Exclusão de Conta Obrigatório pelas Lojas */}
                <TouchableOpacity
                  style={[styles.btnExcluirConta, { borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}
                  onPress={handleSolicitarExclusaoConta}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color={theme.erro} />
                  <Text style={[styles.btnExcluirContaTexto, { color: theme.erro }]}>
                    Excluir Minha Conta (LGPD)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {modalAtivo === 'sair' && (
              <View style={styles.modalCorpo}>
                <Text style={[styles.modalTextoConfirmacao, { color: theme.textoPrimario }]}>
                  Tem certeza que deseja desconectar sua conta deste dispositivo?
                </Text>

                <View style={styles.modalAcoesRow}>
                  <TouchableOpacity
                    style={[styles.modalBotaoCancelar, { backgroundColor: theme.superficie2 }]}
                    onPress={() => setModalAtivo(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalBotaoCancelarTexto, { color: theme.textoPrimario }]}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalBotaoSair}
                    onPress={handleConfirmarSair}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalBotaoSairTexto}>Sair da conta</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {modalAtivo !== 'sair' && modalAtivo !== 'horarios' && (
              <TouchableOpacity
                style={[styles.modalBotaoFechar, { backgroundColor: theme.ouro }]}
                onPress={() => setModalAtivo(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBotaoFecharTexto, { color: theme.textoEscuroSobreOuro }]}>Entendido</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1 },
    header: {
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
    },
    titulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.displayMd,
    },
    scroll: {
      padding: Spacing.telaH,
      gap: Spacing.lg,
      paddingBottom: Spacing.giant,
    },
    perfilCardCliente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderRadius: Radii.xl,
      padding: Spacing.md,
      borderWidth: 1,
      ...Shadows.card,
    },
    logoPerfilContainer: {
      width: 72,
      height: 72,
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
    },
    perfilContato: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
    },
    badgeCliente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: Radii.full,
      borderWidth: 1,
      alignSelf: 'flex-start',
      marginTop: 3,
    },
    badgeClienteTexto: {
      fontFamily: FontFamily.semiBold,
      fontSize: 10.5,
    },
  secao: {
    gap: Spacing.xs,
  },
  secaoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    letterSpacing: 1.1,
    marginLeft: 6,
    marginBottom: 6,
  },
  cardGrupo: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  itemLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  itemIconeContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeWhatsapp: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    borderColor: 'rgba(48, 209, 88, 0.25)',
  },
  iconeSair: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  itemTextoContainer: {
    flex: 1,
    gap: 2,
  },
  itemTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
  },
  textoSair: {
    color: '#FF453A',
  },
  itemSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 16,
  },
  divisorItem: {
    height: 1,
    marginLeft: 58,
  },
  versaoTexto: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    letterSpacing: 0.3,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.telaH,
  },
  modalConteudo: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadows.cardElevado,
  },
  modalCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
  },
  modalBtnFecharIcone: {
    padding: 4,
  },
  modalCorpo: {
    gap: Spacing.sm,
  },
  modalDescricaoGeral: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    marginBottom: 4,
  },

  /* Opções de Tema */
  opcaoTemaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
  },
  opcaoTemaIconeWrapper: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoTemaInfo: {
    flex: 1,
    gap: 2,
  },
  opcaoTemaTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
  },
  opcaoTemaSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15,
  },

  modalItemCard: {
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 4,
  },
  modalItemRotulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    letterSpacing: 0.5,
  },
  modalItemValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
  },
  modalItemDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    lineHeight: 20,
  },
  modalBotaoWhats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.md,
    marginTop: Spacing.xs,
  },
  modalBotaoWhatsTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  modalTextoConfirmacao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    textAlign: 'center',
    marginVertical: Spacing.sm,
    lineHeight: 22,
  },
  modalAcoesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBotaoCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  modalBotaoCancelarTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
  },
  modalBotaoSair: {
    flex: 1,
    backgroundColor: '#FF453A',
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  modalBotaoSairTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  modalBotaoFechar: {
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  modalBotaoFecharTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
  },
  btnExcluirConta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  btnExcluirContaTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySm,
  },
});
