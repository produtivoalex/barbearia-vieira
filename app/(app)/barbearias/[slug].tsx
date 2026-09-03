import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  Store,
  Building2,
  Instagram,
  Clock,
  Sparkles,
  X,
  Play,
} from 'lucide-react-native';
import { buscarDetalheBarbearia, type BarbeariaPublica } from '@/hooks/useBarbearias';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { usePerfil } from '@/hooks/usePerfil';
import { useTheme } from '@/contexts/ThemeContext';
import { IlustracaoServico } from '@/components';
import { SERVICOS_REAIS_CATALOGO, ordenarServicos } from '@/hooks/useServicos';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows, type ThemePalette } from '@/theme';

function isMidiaVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|mov|webm|m4v|3gp|mkv)(\?|$)/i.test(url);
}

export default function DetalheBarbearia() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { barbearia: barbeariaSelecionada, selecionarBarbearia } = useBarbearia();
  const { perfil } = usePerfil();

  // Dados iniciais instantâneos com catálogo de serviços carregado no frame 1
  const dadosIniciais = useMemo<BarbeariaPublica | null>(() => {
    if (barbeariaSelecionada && (barbeariaSelecionada.slug === slug || !slug)) {
      const isV = barbeariaSelecionada.slug === 'barbearia-vieira' || barbeariaSelecionada.nome?.toLowerCase().includes('vieira');
      const servicosAtuais = barbeariaSelecionada.servicos && barbeariaSelecionada.servicos.length > 0
        ? barbeariaSelecionada.servicos
        : isV
          ? (SERVICOS_REAIS_CATALOGO as any[])
          : [];
      return {
        ...barbeariaSelecionada,
        servicos: servicosAtuais,
      };
    }
    return null;
  }, [barbeariaSelecionada, slug]);

  const [barbearia, setBarbearia] = useState<BarbeariaPublica | null>(dadosIniciais);
  const [carregando, setCarregando] = useState<boolean>(!dadosIniciais);

  useEffect(() => {
    if (!slug) return;
    if (!dadosIniciais) {
      setCarregando(true);
    }
    buscarDetalheBarbearia(slug, perfil?.role === 'barbeiro').then(({ barbearia: resultado }) => {
      if (resultado) {
        setBarbearia(resultado);
      }
      setCarregando(false);
    });
  }, [slug]);

  const fotosArray = useMemo(() => {
    if (!barbearia?.fotos || !Array.isArray(barbearia.fotos)) return [];
    return barbearia.fotos.filter((f): f is string => typeof f === 'string');
  }, [barbearia?.fotos]);

  const instagramHandle = useMemo(() => {
    if (barbearia?.tema?.instagram) return barbearia.tema.instagram;
    const isVieira = barbearia?.slug === 'barbearia-vieira' || barbearia?.nome?.toLowerCase().includes('vieira');
    if (isVieira) return '@barber_vieira';
    return null;
  }, [barbearia]);

  const isVieira = barbearia?.slug === 'barbearia-vieira' || barbearia?.nome?.toLowerCase().includes('vieira');

  const servicosOrdenados = useMemo(() => {
    let lista = barbearia?.servicos && barbearia.servicos.length > 0 ? barbearia.servicos : [];
    if (lista.length === 0 && isVieira) {
      lista = SERVICOS_REAIS_CATALOGO as any[];
    }
    return ordenarServicos(lista);
  }, [barbearia?.servicos, isVieira]);

  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.ouro} size="large" />
      </View>
    );
  }

  if (!barbearia) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.vazio}>Barbearia não encontrada ou indisponível.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.voltarSimples}>
            <Text style={styles.voltarTexto}>Voltar para a busca</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const abrirUrl = (url: string | null | undefined) => {
    if (url) Linking.openURL(url).catch(() => { });
  };

  const estaSelecionada = barbeariaSelecionada?.id === barbearia.id;

  const isTeste = barbearia.slug.includes('teste') || barbearia.nome?.toLowerCase().includes('teste');
  const corDestaque = barbearia.tema?.primary || theme.ouro;

  const localizacao = isVieira
    ? 'São José do Divino, PI, Rua Jeova Monte, 120, Brancas'
    : [barbearia.cidade ? `${barbearia.cidade}, PI` : '', barbearia.endereco, barbearia.bairro].filter(Boolean).join(', ') || 'Endereço não informado';

  const descricaoExibida = isTeste
    ? 'Teste'
    : isVieira
      ? 'Tradição, estilo e o melhor atendimento para o seu visual. Cortes modernos, barba na navalha e cuidados masculinos de alto nível.'
      : barbearia.descricao;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Botão Voltar */}
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <ArrowLeft size={20} color={theme.textoPrimario} />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        {/* Hero Banner / Logo */}
        <View style={styles.heroContainer}>
          {isTeste ? (
            <View style={[styles.heroBanner, { backgroundColor: theme.superficie2, alignItems: 'center', justifyContent: 'center' }]}>
              <Store size={48} color={theme.textoDesabilitado} />
            </View>
          ) : barbearia.banner_url ? (
            <Image
              source={{ uri: barbearia.banner_url }}
              style={styles.heroBanner}
              resizeMode="cover"
            />
          ) : isVieira ? (
            <Image
              source={require('@/assets/barbearia-vieira-banner.png')}
              style={styles.heroBanner}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroBanner, { backgroundColor: theme.superficie2, alignItems: 'center', justifyContent: 'center' }]}>
              <Store size={48} color={theme.textoDesabilitado} />
            </View>
          )}

          {/* Logo Flutuante */}
          <View style={[styles.logoWrapper, { backgroundColor: theme.superficie2, borderColor: corDestaque }]}>
            {isTeste ? (
              <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={32} color={corDestaque} />
              </View>
            ) : barbearia.logo_url ? (
              <Image
                source={{ uri: barbearia.logo_url }}
                style={styles.logoImg}
                resizeMode="cover"
              />
            ) : isVieira ? (
              <Image
                source={require('@/assets/barbearia-vieira-logo.png')}
                style={styles.logoImg}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={32} color={corDestaque} />
              </View>
            )}
          </View>
        </View>

        {/* Cabeçalho de Identificação */}
        <View style={styles.identificacao}>
          <Text style={styles.nome}>{barbearia.nome}</Text>
          {descricaoExibida ? <Text style={styles.descricao}>{descricaoExibida}</Text> : null}

          <View style={styles.localLinha}>
            <MapPin size={15} color={theme.ouro} />
            <Text style={styles.localTexto}>{localizacao}</Text>
          </View>
        </View>

        {/* Botões de Ação de Contato (WhatsApp, Ligar, Instagram) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.acoesScroll}>
          {barbearia.whatsapp ? (
            <TouchableOpacity
              style={styles.acao}
              onPress={() => abrirUrl(`https://wa.me/${barbearia.whatsapp?.replace(/\D/g, '')}`)}
              activeOpacity={0.75}
            >
              <MessageCircle size={17} color={theme.verde} />
              <Text style={styles.acaoTexto}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}

          {barbearia.telefone ? (
            <TouchableOpacity
              style={styles.acao}
              onPress={() => abrirUrl(`tel:${barbearia.telefone}`)}
              activeOpacity={0.75}
            >
              <Phone size={17} color={theme.ouro} />
              <Text style={styles.acaoTexto}>Ligar</Text>
            </TouchableOpacity>
          ) : null}

          {instagramHandle ? (
            <TouchableOpacity
              style={[styles.acao, { borderColor: theme.borda }]}
              onPress={() => {
                const handle = instagramHandle.replace('@', '').trim();
                abrirUrl(`https://instagram.com/${handle}`);
              }}
              activeOpacity={0.75}
            >
              <Instagram size={17} color="#E1306C" />
              <Text style={[styles.acaoTexto, { color: theme.textoPrimario }]}>
                {instagramHandle}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        {/* Botão Selecionar / Escolher Barbearia */}
        <TouchableOpacity
          style={[styles.selecionar, estaSelecionada && styles.selecionadoAtivo]}
          onPress={async () => {
            await selecionarBarbearia(barbearia);
            router.push('/(app)/(tabs)/servicos');
          }}
          activeOpacity={0.8}
        >
          {estaSelecionada ? (
            <>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.selecionarTextoAtivo}>Barbearia Selecionada</Text>
            </>
          ) : (
            <Text style={styles.selecionarTexto}>Escolher esta Barbearia</Text>
          )}
        </TouchableOpacity>

        {/* ─── 1. Serviços & Cortes (Rolagem Horizontal) ─── */}
        <View style={styles.secaoServicos}>
          <View style={styles.secaoHeader}>
            <Scissors size={18} color={theme.ouro} />
            <Text style={styles.secaoTitulo}>Serviços Disponíveis</Text>
          </View>

          {servicosOrdenados.length === 0 ? (
            <Text style={styles.servicosVazio}>Nenhum serviço cadastrado no momento.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicosScroll}
            >
              {servicosOrdenados.map((servico) => (
                <TouchableOpacity
                  key={servico.id}
                  style={[styles.cardServicoHorizontal, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
                  onPress={async () => {
                    await selecionarBarbearia(barbearia);
                    router.push({
                      pathname: '/(app)/agendamento/horario',
                      params: {
                        servicoId: servico.id,
                        servicoNome: servico.nome,
                        servicoPreco: String(servico.preco),
                        servicoDuracao: String((servico as any).duracao_minutos || 30),
                        barbeariaId: barbearia.id,
                      },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardServicoTopoImg}>
                    <IlustracaoServico
                      id={servico.id}
                      nome={servico.nome}
                      tamanho={72}
                      corMoldura={theme.ouro}
                    />
                    <View style={[styles.badgeDuracao, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                      <Clock size={10} color={theme.ouroTexto} />
                      <Text style={[styles.badgeDuracaoTexto, { color: theme.ouroTexto }]}>
                        {String((servico as any).duracao_minutos || 30)} min
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardServicoInfo}>
                    <Text style={[styles.cardServicoNome, { color: theme.textoPrimario }]} numberOfLines={1}>
                      {servico.nome}
                    </Text>
                    <Text style={[styles.cardServicoDesc, { color: theme.textoSecundario }]} numberOfLines={2}>
                      {servico.descricao || 'Corte e acabamento com perfeição e atenção aos detalhes.'}
                    </Text>

                    <View style={styles.cardServicoPrecoLinha}>
                      <Text style={[styles.cardServicoPreco, { color: theme.ouroTexto }]}>
                        {Number(servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </Text>
                      <View style={[styles.btnReservarPill, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                        <Text style={[styles.btnReservarPillTexto, { color: theme.ouroTexto }]}>Agendar</Text>
                        <ChevronRight size={12} color={theme.ouroTexto} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ─── 2. Galeria do Espaço & Cortes (Fotos da aba Mídias) ─── */}
        <View style={styles.secaoGaleria}>
          <View style={styles.secaoHeader}>
            <Camera size={18} color={theme.ouro} />
            <Text style={styles.secaoTitulo}>Galeria do Espaço & Cortes</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galeriaScroll}
          >
            {fotosArray.length > 0 ? (
              fotosArray.map((fotoUrl, idx) => {
                const ehVideo = isMidiaVideo(fotoUrl);
                return (
                  <TouchableOpacity
                    key={`${fotoUrl}-${idx}`}
                    style={[styles.galeriaCard, { backgroundColor: theme.superficie, borderColor: theme.borda }]}
                    onPress={() => setFotoSelecionada(fotoUrl)}
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
                      <Image source={{ uri: fotoUrl }} style={styles.galeriaImagem} resizeMode="cover" />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={[styles.galeriaBannerCard, { backgroundColor: theme.superficie, borderColor: theme.bordaOuro }]}>
                <Image
                  source={
                    barbearia.banner_url
                      ? { uri: barbearia.banner_url }
                      : isVieira
                        ? require('@/assets/barbearia-vieira-banner.png')
                        : require('@/assets/banner-na-regua.png')
                  }
                  style={styles.galeriaBannerImg}
                  resizeMode="cover"
                />
                <View style={styles.galeriaBannerOverlay}>
                  <Text style={styles.galeriaBannerTitulo}>{barbearia.nome}</Text>
                  <Text style={styles.galeriaBannerSub}>Ambiente climatizado, equipamentos profissionais e toalha quente</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modal de Foto em Tela Cheia */}
      <Modal
        visible={fotoSelecionada !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFotoSelecionada(null)}
      >
        <Pressable style={styles.modalFotoOverlay} onPress={() => setFotoSelecionada(null)}>
          <SafeAreaView style={styles.modalFotoSafeArea}>
            <TouchableOpacity style={styles.modalFotoFechar} onPress={() => setFotoSelecionada(null)}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {fotoSelecionada && isMidiaVideo(fotoSelecionada) ? (
              <View style={styles.modalVideoCard}>
                <View style={styles.modalVideoIconeCaixa}>
                  <Play size={36} color={theme.ouro} fill={theme.ouro} style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.modalVideoTitulo}>Vídeo da Barbearia</Text>
                <Text style={styles.modalVideoSub}>Assista ao vídeo dos cortes e ambiente</Text>
                <TouchableOpacity
                  style={[styles.botaoAssistirVideo, { backgroundColor: theme.ouro }]}
                  onPress={() => Linking.openURL(fotoSelecionada)}
                  activeOpacity={0.8}
                >
                  <Play size={16} color={theme.textoEscuroSobreOuro} fill={theme.textoEscuroSobreOuro} />
                  <Text style={styles.botaoAssistirVideoTexto}>Assistir Vídeo no Player</Text>
                </TouchableOpacity>
              </View>
            ) : fotoSelecionada ? (
              <Image
                source={{ uri: fotoSelecionada }}
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

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.fundo },
    scroll: { padding: Spacing.telaH, paddingBottom: Spacing.giant },
    loading: { flex: 1, backgroundColor: theme.fundo, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    vazio: { color: theme.textoPrimario, fontFamily: FontFamily.medium, fontSize: FontSize.bodyMd },
    voltarSimples: { backgroundColor: theme.ouro, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radii.md },

    voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
    voltarTexto: { color: theme.textoPrimario, fontFamily: FontFamily.medium },

    heroContainer: { position: 'relative', marginBottom: 40 },
    heroBanner: { height: 140, borderRadius: Radii.lg, width: '100%' },

    logoWrapper: {
      position: 'absolute',
      bottom: -30,
      left: Spacing.md,
      width: 68,
      height: 68,
      borderRadius: Radii.md,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.fundo,
      backgroundColor: theme.superficie,
      ...Shadows.card,
    },
    logoImg: { width: '100%', height: '100%' },

    identificacao: { marginTop: Spacing.xs },
    nome: { color: theme.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.displayMd },
    descricao: {
      color: theme.textoSecundario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      lineHeight: 21,
      marginTop: 6,
    },
    localLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
    localTexto: { color: theme.ouroClaro, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm, flex: 1 },

    acoesScroll: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md, paddingRight: Spacing.md },
    acao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: 9,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.borda,
      backgroundColor: theme.superficie,
      flexShrink: 0,
    },
    acaoTexto: { color: theme.textoPrimario, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },

    selecionar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: Radii.md,
      backgroundColor: theme.ouro,
      marginBottom: Spacing.lg,
      ...Shadows.card,
    },
    selecionadoAtivo: { backgroundColor: theme.verde },
    selecionarTexto: { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
    selecionarTextoAtivo: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },

    /* ─── Serviços em Scroll Horizontal ─── */
    secaoServicos: { marginBottom: Spacing.xl },
    secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
    secaoTitulo: { color: theme.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg },
    servicosVazio: { color: theme.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, paddingVertical: 8 },
    servicosScroll: { gap: 12, paddingVertical: 4 },
    cardServicoHorizontal: {
      width: 220,
      borderRadius: Radii.xl,
      borderWidth: 1,
      padding: Spacing.md,
      gap: Spacing.sm,
      ...Shadows.card,
    },
    cardServicoTopoImg: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      paddingVertical: 4,
    },
    badgeDuracao: {
      position: 'absolute',
      bottom: -4,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    badgeDuracaoTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 9.5,
    },
    cardServicoInfo: {
      gap: 4,
    },
    cardServicoNome: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    cardServicoDesc: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.labelXs,
      lineHeight: 15,
      minHeight: 30,
    },
    cardServicoPrecoLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: theme.borda,
    },
    cardServicoPreco: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyMd,
    },
    btnReservarPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radii.full,
      borderWidth: 1,
    },
    btnReservarPillTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10.5,
    },

    /* ─── Galeria do Espaço & Cortes (Visual Retrato Amplo) ─── */
    secaoGaleria: { marginBottom: Spacing.lg },
    galeriaScroll: { gap: 12, paddingVertical: 4 },
    galeriaCard: {
      width: 195,
      height: 260,
      borderRadius: Radii.xl,
      overflow: 'hidden',
      borderWidth: 1,
      position: 'relative',
      ...Shadows.card,
    },
    galeriaImagem: { width: '100%', height: '100%' },
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
    galeriaBannerCard: {
      width: 320,
      height: 180,
      borderRadius: Radii.xl,
      borderWidth: 1,
      overflow: 'hidden',
      position: 'relative',
      ...Shadows.card,
    },
    galeriaBannerImg: { width: '100%', height: '100%' },
    galeriaBannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 2,
    },
    galeriaBannerTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: 13.5,
      color: '#FFFFFF',
    },
    galeriaBannerSub: {
      fontFamily: FontFamily.regular,
      fontSize: 10.5,
      color: 'rgba(255, 255, 255, 0.8)',
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
