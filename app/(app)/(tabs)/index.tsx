import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  BellRing,
  CalendarCheck,
  ChevronRight,
  Clock,
  ListPlus,
  Scissors,
  Calendar,
  AlertCircle,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Gift,
  Camera,
  X,
  Play,
} from 'lucide-react-native';
import { Botao, LogoBarbearia } from '@/components';
import { FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { usePerfil } from '@/hooks/usePerfil';
import { useMeusAgendamentos } from '@/hooks/useMeusAgendamentos';
import { useAgendaSemanal, useNotificacoes } from '@/hooks/useAgendaSemanal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

function isMidiaVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|mov|webm|m4v|3gp|mkv)(\?|$)/i.test(url);
}

export default function TelaHome() {
  const router = useRouter();
  const { perfil, carregandoPerfil } = usePerfil();
  const { barbearia } = useBarbearia();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { proximos, historico, recarregar: recarregarAgendamentos } = useMeusAgendamentos(barbearia?.id);
  const { agenda, carregando: carregandoAgenda, ativarLembrete } = useAgendaSemanal(barbearia?.id);
  const { naoLidas } = useNotificacoes(barbearia?.id);
  const { temPermissao, solicitarPermissao } = usePushNotifications();

  const [notificandoAbertura, setNotificandoAbertura] = useState(false);
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  const localizacaoCabecalho = useMemo(() => {
    if (!barbearia) return 'São José do Divino, PI, Rua Jeova Monte, 120, Brancas';
    const isVieira = barbearia.slug === 'barbearia-vieira' || barbearia.id === '7917fb7a-e118-4928-b16b-94e4f26f8591';
    if (isVieira) {
      return 'São José do Divino, PI, Rua Jeova Monte, 120, Brancas';
    }
    const cidadeEstado = barbearia.cidade ? `${barbearia.cidade}, PI` : 'São José do Divino, PI';
    const partes = [
      cidadeEstado,
      barbearia.endereco,
      barbearia.bairro,
    ].filter(Boolean);
    return partes.join(', ');
  }, [barbearia]);

  // Primeiro nome para a saudação
  const primeiroNome = useMemo(() => {
    if (!perfil?.nome_completo) return 'Cliente';
    return perfil.nome_completo.trim().split(' ')[0];
  }, [perfil?.nome_completo]);

  // Próximo agendamento ativo
  const proximo = proximos[0] ?? null;

  // Detecta se a tarde está fechada hoje
  const tardeFechadaHoje = false;

  async function handleAtivarLembrete() {
    if (!agenda) return;
    if (!temPermissao) {
      await solicitarPermissao();
    }
    const resultado = await ativarLembrete(agenda.id);
    Alert.alert(
      resultado.error ? 'Não foi possível ativar' : 'Lembrete ativado! 💈',
      resultado.error?.message ?? 'Você receberá uma notificação assim que a agenda for aberta.'
    );
  }

  const corDestaque = barbearia?.tema?.primary || theme.ouro;
  const fotosGaleria = Array.isArray(barbearia?.fotos) ? (barbearia.fotos as string[]).filter(Boolean) : [];
  const fidelidade = barbearia?.regras_fidelidade;
  const cortesFidelidade = historico.filter((item: any) => item.status === 'concluido').length;
  const metaFidelidade = fidelidade?.meta_cortes ?? 0;
  const fidelidadeVisivel = fidelidade?.ativo === true && metaFidelidade > 0;
  const agendaPermiteReserva = barbearia?.modo_agenda === 'continua' || agenda?.status === 'aberta';
  const modoDropsProgramado = barbearia?.modo_agenda === 'drops' && agenda?.status === 'programada';
  const abertura = agenda?.data_abertura_programada
    ? new Date(agenda.data_abertura_programada).toLocaleString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Abertura em breve';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header Minimalista Apple-like com Barbearia Selecionada */}
      <View style={[styles.header, { borderBottomColor: theme.borda }]}>
        <TouchableOpacity
          style={styles.headerBarbearia}
          onPress={() => router.push('/(app)/barbearias')}
          activeOpacity={0.8}
        >
          <LogoBarbearia tamanho={64} tipo="avatar" variante="compacto" uri={barbearia?.logo_url} slug={barbearia?.slug} />
          <View style={styles.headerInfo}>
            <View style={styles.headerLinhaNome}>
              <Text style={[styles.logo, { color: theme.textoPrimario }]} numberOfLines={1}>
                {barbearia?.nome || 'Barbearia Vieira'}
              </Text>
            </View>
            <Text style={[styles.localHeader, { color: theme.ouroTexto }]} numberOfLines={2}>
              {localizacaoCabecalho}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerAcoes}>
          {/* Sino de Notificações */}
          <TouchableOpacity
            style={[styles.sino, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/notificacoes')}
          >
            <Bell size={18} color={theme.textoPrimario} />
            {naoLidas > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTexto}>{naoLidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Saudação com Respiração */}
        <View style={styles.boasVindas}>
          <Text style={[styles.titulo, { color: theme.textoPrimario }]}>
            {carregandoPerfil ? 'Olá...' : `Olá, ${primeiroNome}!`}
          </Text>
          <Text style={[styles.subtitulo, { color: theme.textoSecundario }]}>
            {barbearia?.nome ? `Agendamento exclusivo na ${barbearia.nome}` : 'Sua experiência de corte na régua'}
          </Text>
        </View>

        {/* Banner contextual de notificações */}
        {!temPermissao && (
          <View style={[styles.bannerNotif, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
            <View style={styles.bannerNotifMain}>
              <BellRing size={18} color={theme.ouroTexto} />
              <View style={styles.bannerNotifInfo}>
                <Text style={[styles.bannerNotifTitulo, { color: theme.ouroTexto }]}>Fique por dentro</Text>
                <Text style={[styles.bannerNotifTexto, { color: theme.textoPrimario }]}>
                  Receba aviso de abertura da agenda e lembretes do corte.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.bannerNotifBotao, { backgroundColor: theme.ouro }]}
              onPress={solicitarPermissao}
              activeOpacity={0.8}
            >
              <Text style={[styles.bannerNotifBotaoTexto, { color: theme.textoEscuroSobreOuro }]}>Ativar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Banner de Aviso: Tarde Fechada */}
        {tardeFechadaHoje && (
          <View style={styles.bannerTardeFechada}>
            <AlertCircle size={18} color="#FF453A" />
            <View style={styles.bannerTardeInfo}>
              <Text style={styles.bannerTardeTitulo}>Aviso: Tarde Fechada Hoje</Text>
              <Text style={styles.bannerTardeTexto}>
                A barbearia estará fechada hoje na parte da tarde. Agradecemos a compreensão!
              </Text>
            </View>
          </View>
        )}

        {/* ─── Apple Wallet VIP Pass / Hero Dinâmico ─── */}
        {proximo ? (
          <View style={[styles.passContainer, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
            {/* Top Header do Pass */}
            <View style={[styles.passHeader, { backgroundColor: isEscuro ? 'rgba(203, 161, 74, 0.08)' : 'rgba(139, 101, 8, 0.06)' }]}>
              <View style={styles.passHeaderEsquerda}>
                <Sparkles size={14} color={theme.ouroTexto} />
                <Text style={[styles.passHeaderTitulo, { color: theme.ouroTexto }]}>VIP PASS • AGENDAMENTO</Text>
              </View>
              <View style={styles.passStatusBadge}>
                <View style={styles.passStatusPonto} />
                <Text style={styles.passStatusTexto}>CONFIRMADO</Text>
              </View>
            </View>

            {/* Corpo do Pass */}
            <View style={[styles.passCorpo, { backgroundColor: theme.superficie }]}>
              <View style={styles.passInfoPrincipal}>
                <Text style={[styles.passDataLabel, { color: theme.ouroTexto }]}>
                  {new Date(proximo.data_hora)
                    .toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    })
                    .toUpperCase()}
                </Text>
                <Text style={[styles.passHora, { color: theme.textoPrimario }]}>
                  {new Date(proximo.data_hora).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.passServicoWrapper}>
                <Text style={[styles.passServicoNome, { color: theme.textoPrimario }]} numberOfLines={1}>
                  {proximo.servico.nome}
                </Text>
                <Text style={[styles.passServicoPreco, { color: theme.textoSecundario }]}>
                  {Number(proximo.servico.preco).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}{' '}
                  • {proximo.servico.duracao_minutos} min
                </Text>
              </View>
            </View>

            {/* Linha Tracejada de Picote */}
            <View style={styles.passDivisorRow}>
              <View style={[styles.passCutout, styles.passCutoutEsquerda, { backgroundColor: theme.fundo }]} />
              <View style={[styles.passLinhaPontilhada, { borderColor: theme.borda }]} />
              <View style={[styles.passCutout, styles.passCutoutDireita, { backgroundColor: theme.fundo }]} />
            </View>

            {/* Ações do Pass */}
            <View style={[styles.passFooter, { backgroundColor: theme.superficie2 }]}>
              <TouchableOpacity
                style={[styles.passBtnSecundario, { backgroundColor: theme.superficie3, borderColor: theme.borda }]}
                onPress={() => router.push('/(app)/(tabs)/agenda')}
                activeOpacity={0.7}
              >
                <Calendar size={15} color={theme.textoPrimario} />
                <Text style={[styles.passBtnSecundarioTexto, { color: theme.textoPrimario }]}>Meus Agendamentos</Text>
              </TouchableOpacity>

            </View>
          </View>
        ) : modoDropsProgramado ? (
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderPill}>
              <Clock size={13} color={theme.ouro} />
              <Text style={styles.heroHeaderPillTexto}>Abertura Programada</Text>
            </View>

            <Text style={styles.heroDataDisplay}>{abertura}</Text>
            <Text style={styles.heroDescricao}>
              Ative o lembrete para receber uma notificação instantânea quando os horários forem abertos.
            </Text>

            <Botao
              label="Ativar Lembrete de Abertura"
              onPress={handleAtivarLembrete}
              estiloContainer={styles.heroBtnMonumental}
            />
          </View>
        ) : (
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderPill}>
              <Sparkles size={13} color={theme.ouro} />
              <Text style={styles.heroHeaderPillTexto}>
                {carregandoAgenda
                  ? 'Verificando vagas...'
                  : agendaPermiteReserva
                  ? 'Agenda Aberta'
                  : 'Vagas Esgotadas'}
              </Text>
            </View>

            <Text style={styles.heroTituloDisplay}>
              {agendaPermiteReserva
                ? 'Garanta seu corte na régua'
                : 'Horários da semana esgotados'}
            </Text>
            <Text style={styles.heroDescricao}>
              {agendaPermiteReserva
                ? 'Escolha seu serviço e reserve seu horário com rapidez e sem filas.'
                : 'Cadastre-se na lista de espera para ser avisado se surgir uma desistência.'}
            </Text>

            <TouchableOpacity
              style={styles.heroBtnReserva}
              onPress={() =>
                agendaPermiteReserva
                  ? router.push('/(app)/(tabs)/servicos')
                  : router.push('/(app)/lista-espera')
              }
              activeOpacity={0.85}
            >
              <View style={styles.heroBtnIconeWrapper}>
                {agendaPermiteReserva ? (
                  <Scissors size={18} color={theme.textoEscuroSobreOuro} />
                ) : (
                  <ListPlus size={18} color={theme.textoEscuroSobreOuro} />
                )}
              </View>
              <Text style={styles.heroBtnReservaTexto}>
                {agendaPermiteReserva ? 'Reservar Horário Agora' : 'Entrar na Lista de Espera'}
              </Text>
              <ArrowRight size={18} color={theme.textoEscuroSobreOuro} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Card de Mimo VIP / Oferta Exclusiva ─── */}
        {fidelidadeVisivel && (
          <View style={styles.cardMimoCliente}>
            <View style={styles.mimoClienteIconeWrapper}>
              <Gift size={22} color={corDestaque} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.mimoPillTexto, { color: corDestaque }]}>PROGRAMA DE FIDELIDADE</Text>
              <Text style={styles.mimoClienteTitulo}>{cortesFidelidade}/{metaFidelidade} atendimentos</Text>
              <Text style={styles.mimoClienteDesc}>{cortesFidelidade >= metaFidelidade ? 'Recompensa disponível!' : fidelidade?.recompensa}</Text>
            </View>
          </View>
        )}

        {/* ─── Grid de Atalhos de Luxo (3 Cards) ─── */}
        <View style={styles.atalhosGrid}>
          <TouchableOpacity
            style={styles.cardAtalho}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/(tabs)/servicos')}
          >
            <View style={styles.iconeAtalhoWrapper}>
              <Scissors size={20} color={corDestaque} />
            </View>
            <Text style={styles.atalhoTitulo}>Serviços</Text>
            <Text style={styles.atalhoDescricao}>Preços e tempos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardAtalho}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/(tabs)/agenda')}
          >
            <View style={styles.iconeAtalhoWrapper}>
              <Calendar size={20} color={corDestaque} />
            </View>
            <Text style={styles.atalhoTitulo}>Minha Agenda</Text>
            <Text style={styles.atalhoDescricao}>Histórico</Text>
          </TouchableOpacity>

        </View>

        {/* ─── Vitrine do Espaço & Fotos (Galeria de Mídias) ─── */}
        <View style={styles.secaoVitrine}>
          <View style={styles.secaoVitrineHeader}>
            <View style={styles.secaoVitrineTituloLinha}>
              <Camera size={16} color={theme.ouroTexto} />
              <Text style={[styles.secaoVitrineTitulo, { color: theme.textoPrimario }]}>Espaço & Cortes</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(app)/barbearias/[slug]', params: { slug: barbearia?.slug || 'barbearia-vieira' } })}
              activeOpacity={0.7}
              style={styles.btnVerTudoVitrine}
            >
              <Text style={[styles.btnVerTudoTexto, { color: theme.ouroTexto }]}>Ver Vitrine</Text>
              <ChevronRight size={13} color={theme.ouroTexto} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vitrineScroll}
          >
            {fotosGaleria.length > 0 ? (
              fotosGaleria.map((foto, idx) => {
                const ehVideo = isMidiaVideo(foto);
                return (
                  <TouchableOpacity
                    key={`foto-vitrine-${idx}`}
                    style={[styles.vitrineCardFoto, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
                    onPress={() => setFotoModal(foto)}
                    activeOpacity={0.85}
                  >
                    {ehVideo ? (
                      <View style={styles.galeriaVideoCaixa}>
                        <View style={styles.galeriaVideoPoster}>
                          <Camera size={30} color="rgba(255, 255, 255, 0.2)" />
                        </View>
                        {/* Play central no preview */}
                        <View style={styles.playCentralOverlay} pointerEvents="none">
                          <View style={styles.playCentralCirculo}>
                            <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                          </View>
                        </View>
                        <View style={styles.badgeVideoGaleria}>
                          <Play size={11} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={styles.badgeVideoGaleriaTexto}>Vídeo</Text>
                        </View>
                      </View>
                    ) : (
                      <Image source={{ uri: foto }} style={styles.vitrineFotoImagem} resizeMode="cover" />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <TouchableOpacity
                style={[styles.vitrineCardBanner, { backgroundColor: theme.superficie, borderColor: theme.bordaOuro }]}
                onPress={() => router.push({ pathname: '/(app)/barbearias/[slug]', params: { slug: barbearia?.slug || 'barbearia-vieira' } })}
                activeOpacity={0.85}
              >
                <Image
                  source={
                    barbearia?.banner_url
                      ? { uri: barbearia.banner_url }
                      : (barbearia?.slug === 'barbearia-vieira' || !barbearia?.slug)
                      ? require('@/assets/barbearia-vieira-banner.png')
                      : require('@/assets/banner-na-regua.png')
                  }
                  style={styles.vitrineFotoBanner}
                  resizeMode="cover"
                />
                <View style={styles.vitrineBannerGradiente}>
                  <Text style={[styles.vitrineBannerTitulo, { color: '#FFFFFF' }]}>{barbearia?.nome || 'Barbearia Vieira'}</Text>
                  <Text style={[styles.vitrineBannerSub, { color: 'rgba(255, 255, 255, 0.8)' }]}>Ambiente climatizado, estilo e cortes modernos • Toque para ver</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modal de Visualização de Foto em Tela Cheia */}
      <Modal
        visible={fotoModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFotoModal(null)}
      >
        <Pressable style={styles.modalFotoOverlay} onPress={() => setFotoModal(null)}>
          <SafeAreaView style={styles.modalFotoSafeArea}>
            <TouchableOpacity style={styles.modalFotoFechar} onPress={() => setFotoModal(null)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {fotoModal && isMidiaVideo(fotoModal) ? (
              <View style={styles.modalVideoCard}>
                <View style={styles.modalVideoIconeCaixa}>
                  <Play size={36} color={theme.ouro} fill={theme.ouro} style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.modalVideoTitulo}>Vídeo da Barbearia</Text>
                <Text style={styles.modalVideoSub}>Assista ao vídeo dos cortes e ambiente</Text>
                <TouchableOpacity
                  style={[styles.botaoAssistirVideo, { backgroundColor: theme.ouro }]}
                  onPress={() => Linking.openURL(fotoModal)}
                  activeOpacity={0.8}
                >
                  <Play size={16} color={theme.textoEscuroSobreOuro} fill={theme.textoEscuroSobreOuro} />
                  <Text style={styles.botaoAssistirVideoTexto}>Assistir Vídeo no Player</Text>
                </TouchableOpacity>
              </View>
            ) : fotoModal ? (
              <Image
                source={{ uri: fotoModal }}
                style={styles.modalFotoImagem}
                resizeMode="contain"
              />
            ) : null}
          </SafeAreaView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.fundo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borda,
    backgroundColor: theme.fundo,
  },
  headerBarbearia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerLinhaNome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logo: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: theme.textoPrimario,
    letterSpacing: 0.2,
  },
  localHeader: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: theme.ouro,
    marginTop: 1,
  },
  headerAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sino: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.superficie2,
    borderWidth: 1,
    borderColor: theme.borda,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.ouro,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTexto: {
    color: theme.textoEscuroSobreOuro,
    fontFamily: FontFamily.bold,
    fontSize: 9,
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.md,
    paddingBottom: Spacing.giant,
  },
  boasVindas: { gap: 2, marginTop: 4 },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: theme.textoPrimario,
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: theme.textoSecundario,
  },

  /* ─── Apple Wallet VIP Pass ─── */
  passContainer: {
    backgroundColor: theme.superficie,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: theme.bordaOuro,
    overflow: 'hidden',
    ...Shadows.cardElevado,
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: 'rgba(203, 161, 74, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(203, 161, 74, 0.15)',
  },
  passHeaderEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passHeaderTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: theme.ouro,
    letterSpacing: 0.8,
  },
  passStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  passStatusPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.verde,
  },
  passStatusTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: theme.verde,
    letterSpacing: 0.5,
  },
  passCorpo: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  passInfoPrincipal: {
    gap: 2,
  },
  passDataLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: theme.ouro,
    letterSpacing: 1,
  },
  passHora: {
    fontFamily: FontFamily.bold,
    fontSize: 40,
    color: theme.textoPrimario,
    letterSpacing: -1,
  },
  passServicoWrapper: {
    marginTop: 6,
    gap: 2,
  },
  passServicoNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    color: theme.textoPrimario,
  },
  passServicoPreco: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: theme.textoSecundario,
  },

  /* Divisor de Picote estilo Ticket */
  passDivisorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 20,
    marginVertical: -4,
  },
  passCutout: {
    width: 16,
    height: 20,
    backgroundColor: theme.fundo,
    position: 'absolute',
  },
  passCutoutEsquerda: {
    left: -8,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  passCutoutDireita: {
    right: -8,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  passLinhaPontilhada: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  passFooter: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: theme.superficie2,
  },
  passBtnSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: theme.borda,
  },
  passBtnSecundarioTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: theme.textoPrimario,
  },
  /* ─── Hero Card para Reserva ─── */
  heroCard: {
    backgroundColor: theme.superficie,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.borda,
    gap: Spacing.xs,
  },
  heroHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(203, 161, 74, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  heroHeaderPillTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: theme.ouro,
  },
  heroTituloDisplay: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: theme.textoPrimario,
    marginTop: 4,
  },
  heroDataDisplay: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: theme.textoPrimario,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  heroDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: theme.textoSecundario,
    lineHeight: 18,
  },
  heroBtnMonumental: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  heroBtnReserva: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.ouro,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    marginTop: Spacing.xs,
    ...Shadows.botaoPrimario,
  },
  heroBtnIconeWrapper: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnReservaTexto: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: theme.textoEscuroSobreOuro,
  },

  /* ─── Atalhos Grid ─── */
  atalhosGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardAtalho: {
    flex: 1,
    backgroundColor: theme.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.borda,
    ...Shadows.card,
  },
  iconeAtalhoWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: theme.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  atalhoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: theme.textoPrimario,
    textAlign: 'center',
  },
  atalhoDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: theme.textoSecundario,
    textAlign: 'center',
  },

  /* ─── Estabelecimento ─── */
  cardEstabelecimento: {
    backgroundColor: theme.superficie,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: theme.borda,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cardEstabHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardEstabIcone: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: theme.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEstabTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: theme.textoPrimario,
  },
  cardEstabEndereco: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.textoSecundario,
    marginTop: 2,
    lineHeight: 15,
  },
  galeriaMini: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingTop: 4,
  },
  fotoMini: {
    width: 84,
    height: 62,
    borderRadius: Radii.md,
    backgroundColor: theme.superficie2,
  },
  bannerNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.superficie,
    borderRadius: Radii.md,
    padding: 10,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 8,
  },
  bannerNotifMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  bannerNotifInfo: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  bannerNotifTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: theme.ouro,
  },
  bannerNotifTexto: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: theme.textoSecundario,
    marginTop: 2,
  },
  bannerNotifBotao: {
    backgroundColor: theme.ouro,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  bannerNotifBotaoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: theme.textoEscuroSobreOuro,
  },
  bannerTardeFechada: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.erroClaro,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  bannerTardeInfo: {
    flex: 1,
    gap: 3,
  },
  bannerTardeTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: theme.erro,
  },
  bannerTardeTexto: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.textoSecundario,
    lineHeight: 15,
  },
  cardMimoCliente: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.superficie,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: theme.bordaOuro,
    ...Shadows.card,
  },
  mimoClienteIconeWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: theme.ouroTranslucido,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mimoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mimoPillTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  mimoClienteTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: theme.textoPrimario,
  },
  mimoClienteDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: theme.textoSecundario,
    lineHeight: 15,
  },
  mimoClienteBotao: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mimoClienteBotaoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: theme.textoEscuroSobreOuro,
  },

  /* ─── Vitrine do Espaço & Fotos (Horizontal Gallery) ─── */
  secaoVitrine: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  secaoVitrineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  secaoVitrineTituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secaoVitrineTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    letterSpacing: 0.3,
  },
  btnVerTudoVitrine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  btnVerTudoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
  },
  vitrineScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  vitrineCardFoto: {
    width: 195,
    height: 260,
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  vitrineFotoImagem: {
    width: '100%',
    height: '100%',
  },
  playCentralOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  playCentralCirculo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  badgeVideoGaleria: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeVideoGaleriaTexto: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
  },
  vitrineCardBanner: {
    width: 320,
    height: 180,
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  vitrineFotoBanner: {
    width: '100%',
    height: '100%',
  },
  vitrineBannerGradiente: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  vitrineBannerTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  vitrineBannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
  },

  /* ─── Modal de Foto em Tela Cheia ─── */
  modalFotoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFotoSafeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalFotoFechar: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  galeriaVideoCaixa: {
    width: '100%',
    height: '100%',
    backgroundColor: '#151518',
    position: 'relative',
    overflow: 'hidden',
  },
  galeriaVideoPoster: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C22',
  },
  modalFotoImagem: {
    width: '92%',
    height: '80%',
  },
  modalVideoLoopContainer: {
    width: '92%',
    height: '75%',
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  modalVideoCard: {
    width: '85%',
    backgroundColor: '#1C1C22',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: theme.bordaOuro,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.card,
  },
  modalVideoIconeCaixa: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.ouroTranslucido,
    borderWidth: 1.5,
    borderColor: theme.bordaOuro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  modalVideoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalVideoSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  botaoAssistirVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 13,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    width: '100%',
  },
  botaoAssistirVideoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: theme.textoEscuroSobreOuro,
  },
});
