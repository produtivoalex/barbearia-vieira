import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  Pressable,
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
} from 'lucide-react-native';
import { Avatar, LogoBarbearia } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type TipoModal = 'dados_conta' | 'notificacoes' | 'horarios' | 'privacidade' | 'sair' | null;

export default function TelaPerfil() {
  const { perfil, carregandoPerfil } = usePerfil();
  const { session } = useAuth();
  const [modalAtivo, setModalAtivo] = useState<TipoModal>(null);

  async function handleConfirmarSair() {
    setModalAtivo(null);
    await supabase.auth.signOut();
  }

  function handleAbrirWhatsApp() {
    const numero = '5586981907478';
    const msg = encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre a Barbearia Vieira.');
    Linking.openURL(`https://wa.me/${numero}?text=${msg}`).catch(() => {});
  }

  const nomeExibicao = carregandoPerfil
    ? 'Carregando...'
    : perfil?.nome_completo || 'Cliente Vieira';
  const emailExibicao = session?.user?.email || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Principal de Identidade com Vieira Avatar */}
        <View style={styles.perfilCard}>
          <View style={styles.avatarWrapper}>
            <LogoBarbearia tamanho={64} tipo="avatar" variante="compacto" />
          </View>

          <View style={styles.perfilInfo}>
            <Text style={styles.perfilNome}>{nomeExibicao}</Text>
            <Text style={styles.perfilContato}>{perfil?.telefone || emailExibicao}</Text>
            <View style={styles.badgeCliente}>
              <Sparkles size={11} color={Colors.ouro} />
              <Text style={styles.badgeClienteTexto}>Cliente Barbearia Vieira</Text>
            </View>
          </View>
        </View>

        {/* Seção 1: Minha Conta */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>MINHA CONTA</Text>
          <View style={styles.cardGrupo}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('dados_conta')}
            >
              <View style={styles.itemIconeContainer}>
                <User size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Dados do perfil</Text>
                <Text style={styles.itemSubtitulo}>Nome e informações de login</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('notificacoes')}
            >
              <View style={styles.itemIconeContainer}>
                <Bell size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Notificações & Lembretes</Text>
                <Text style={styles.itemSubtitulo}>Avisos de abertura de agenda e cortes</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 2: Barbearia Vieira */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>BARBEARIA VIEIRA</Text>
          <View style={styles.cardGrupo}>
            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={handleAbrirWhatsApp}
            >
              <View style={[styles.itemIconeContainer, styles.iconeWhatsapp]}>
                <MessageCircle size={18} color={Colors.verde} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>WhatsApp Oficial</Text>
                <Text style={styles.itemSubtitulo}>(86) 98190-7478 • Falar com o barbeiro</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>

            <View style={styles.divisorItem} />

            <TouchableOpacity
              style={styles.itemLinha}
              activeOpacity={0.7}
              onPress={() => setModalAtivo('horarios')}
            >
              <View style={styles.itemIconeContainer}>
                <Clock size={18} color={Colors.ouro} />
              </View>
              <View style={styles.itemTextoContainer}>
                <Text style={styles.itemTitulo}>Horários & Atendimento</Text>
                <Text style={styles.itemSubtitulo}>Terça a Domingo (08:00 às 18:00)</Text>
              </View>
              <ChevronRight size={18} color={Colors.textoDesabilitado} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção 3: Informações do App */}
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
                <Text style={styles.itemTitulo}>Privacidade e Segurança</Text>
                <Text style={styles.itemSubtitulo}>Proteção e tratamento dos seus dados</Text>
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
                <Text style={styles.itemSubtitulo}>Barbearia Vieira v1.0.0 (Oficial)</Text>
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

      {/* Modal Bottom Sheet Informativo Premium */}
      <Modal
        visible={modalAtivo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAtivo(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalAtivo(null)}>
          <Pressable style={styles.modalConteudo} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalTraco} />

            {/* Cabeçalho do Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTituloLinha}>
                <View style={[
                  styles.modalIconeBadge,
                  modalAtivo === 'sair' && styles.modalIconeBadgeErro,
                ]}>
                  {modalAtivo === 'dados_conta' && <User size={20} color={Colors.ouro} />}
                  {modalAtivo === 'notificacoes' && <Bell size={20} color={Colors.ouro} />}
                  {modalAtivo === 'horarios' && <Clock size={20} color={Colors.ouro} />}
                  {modalAtivo === 'privacidade' && <ShieldCheck size={20} color={Colors.ouro} />}
                  {modalAtivo === 'sair' && <LogOut size={20} color={Colors.erro} />}
                </View>
                <Text style={styles.modalTitulo}>
                  {modalAtivo === 'dados_conta' && 'Dados da Conta'}
                  {modalAtivo === 'notificacoes' && 'Notificações do App'}
                  {modalAtivo === 'horarios' && 'Horários & Atendimento'}
                  {modalAtivo === 'privacidade' && 'Privacidade & Segurança'}
                  {modalAtivo === 'sair' && 'Encerrar Sessão'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalAtivo(null)}
                style={styles.modalBtnFechar}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.textoSecundario} />
              </TouchableOpacity>
            </View>

            {/* Corpo do Modal por Tipo */}
            {modalAtivo === 'dados_conta' && (
              <View style={styles.modalCorpo}>
                <View style={styles.modalItemCard}>
                  <Text style={styles.modalItemRotulo}>Nome Completo</Text>
                  <Text style={styles.modalItemValor}>{nomeExibicao}</Text>
                </View>

                {emailExibicao ? (
                  <View style={styles.modalItemCard}>
                    <Text style={styles.modalItemRotulo}>E-mail de Acesso</Text>
                    <View style={styles.modalRow}>
                      <Mail size={14} color={Colors.textoSecundario} />
                      <Text style={styles.modalItemValor}>{emailExibicao}</Text>
                    </View>
                  </View>
                ) : null}

                {perfil?.telefone ? (
                  <View style={styles.modalItemCard}>
                    <Text style={styles.modalItemRotulo}>Telefone / WhatsApp</Text>
                    <View style={styles.modalRow}>
                      <Phone size={14} color={Colors.verde} />
                      <Text style={styles.modalItemValor}>{perfil.telefone}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            )}

            {modalAtivo === 'notificacoes' && (
              <View style={styles.modalCorpo}>
                <View style={styles.modalItemCard}>
                  <View style={styles.modalRow}>
                    <CheckCircle2 size={16} color={Colors.verde} />
                    <Text style={styles.modalItemValor}>Lembretes de Atendimento Ativos</Text>
                  </View>
                  <Text style={styles.modalItemDescricao}>
                    Você receberá lembretes automáticos na véspera (às 19:00) e 2 horas antes do seu corte para confirmar presença.
                  </Text>
                </View>

                <View style={styles.modalItemCard}>
                  <View style={styles.modalRow}>
                    <CheckCircle2 size={16} color={Colors.verde} />
                    <Text style={styles.modalItemValor}>Aviso de Abertura de Agenda</Text>
                  </View>
                  <Text style={styles.modalItemDescricao}>
                    Push instantâneo toda segunda-feira assim que o barbeiro abrir as vagas da próxima semana.
                  </Text>
                </View>
              </View>
            )}

            {modalAtivo === 'horarios' && (
              <View style={styles.modalCorpo}>
                <View style={styles.modalItemCard}>
                  <Text style={styles.modalItemRotulo}>Dias de Funcionamento</Text>
                  <Text style={styles.modalItemValor}>Terça-feira a Domingo</Text>
                  <Text style={styles.modalItemDescricao}>Segunda-feira: Fechado para descanso e organização da agenda.</Text>
                </View>

                <View style={styles.modalItemCard}>
                  <Text style={styles.modalItemRotulo}>Período da Manhã (Agendamento)</Text>
                  <Text style={styles.modalItemValor}>08:00 às 12:00</Text>
                  <Text style={styles.modalItemDescricao}>Reserve seu horário no app.</Text>
                </View>

                <View style={styles.modalItemCard}>
                  <Text style={styles.modalItemRotulo}>Período da Tarde (Ordem de Chegada)</Text>
                  <Text style={styles.modalItemValor}>14:00 às 18:00</Text>
                  <Text style={styles.modalItemDescricao}>Atendimento por ordem de chegada na barbearia.</Text>
                </View>

                <TouchableOpacity
                  style={styles.modalBotaoAcao}
                  onPress={handleAbrirWhatsApp}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                  <Text style={styles.modalBotaoAcaoTexto}>Tirar dúvida no WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}

            {modalAtivo === 'privacidade' && (
              <View style={styles.modalCorpo}>
                <View style={styles.modalItemCard}>
                  <Text style={styles.modalItemRotulo}>Segurança de Dados</Text>
                  <Text style={styles.modalItemDescricao}>
                    Seus dados cadastrais e histórico de agendamentos são armazenados com segurança e protegidos por políticas rigorosas de Row Level Security (RLS) no Supabase.
                  </Text>
                </View>

                <View style={styles.modalItemCard}>
                  <Text style={styles.modalItemRotulo}>Privacidade Garantida</Text>
                  <Text style={styles.modalItemDescricao}>
                    Nenhum outro cliente tem acesso ao seu perfil ou aos seus horários agendados. O sistema é exclusivo da Barbearia Vieira.
                  </Text>
                </View>
              </View>
            )}

            {modalAtivo === 'sair' && (
              <View style={styles.modalCorpo}>
                <Text style={styles.modalTextoConfirmacao}>
                  Tem certeza que deseja desconectar sua conta deste dispositivo?
                </Text>

                <View style={styles.modalAcoesRow}>
                  <TouchableOpacity
                    style={styles.modalBotaoCancelar}
                    onPress={() => setModalAtivo(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalBotaoCancelarTexto}>Cancelar</Text>
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
                style={styles.modalBotaoFechar}
                onPress={() => setModalAtivo(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBotaoFecharTexto}>Entendido</Text>
              </TouchableOpacity>
            )}
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
  badgeCliente: {
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
  badgeClienteTexto: {
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
  iconeWhatsapp: {
    backgroundColor: 'rgba(61, 191, 106, 0.15)',
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

  /* Modal Bottom Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    gap: Spacing.md,
    maxHeight: '85%',
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
  modalIconeBadgeErro: {
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
  },
  modalTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: '#FFFFFF',
  },
  modalBtnFechar: {
    padding: 6,
  },
  modalCorpo: {
    gap: Spacing.sm,
  },
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
    letterSpacing: 0.5,
  },
  modalItemValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  modalItemDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#A1A1AA',
    lineHeight: 19,
    marginTop: 2,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTextoConfirmacao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  modalAcoesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
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
  modalBotaoAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.verde,
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginTop: 4,
  },
  modalBotaoAcaoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  modalBotaoFechar: {
    backgroundColor: '#27272A',
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  modalBotaoFecharTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
});

