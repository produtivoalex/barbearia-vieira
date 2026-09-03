import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Phone,
  Plus,
  Search,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  X,
} from 'lucide-react-native';
import { useBarbearias, type BarbeariaPublica } from '@/hooks/useBarbearias';
import { useLocalizacao } from '@/hooks/useLocalizacao';
import { usePerfil } from '@/hooks/usePerfil';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Colors, FontFamily, FontSize, Radii, Shadows, Spacing, type ThemePalette } from '@/theme';

function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ListaBarbearias() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const [busca, setBusca] = useState('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('Todas');
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const { perfil } = usePerfil();
  const { barbearia: barbeariaAtiva, selecionarBarbearia } = useBarbearia();
  const { coordenadas, permissaoConcedida } = useLocalizacao(true);

  const modoPainel = modo === 'painel';
  const somenteVinculos = modoPainel || perfil?.role === 'barbeiro';
  const { barbearias, carregando, erro, recarregar } = useBarbearias({
    busca,
    latitude: coordenadas?.latitude,
    longitude: coordenadas?.longitude,
    somenteVinculos,
  });

  // Lista única de cidades para filtros rápidos
  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    barbearias.forEach((b) => {
      if (b.cidade?.trim()) set.add(b.cidade.trim());
    });
    return ['Todas', ...Array.from(set)];
  }, [barbearias]);

  // Filtro por cidade selecionada
  const barbeariasExibidas = useMemo(() => {
    if (cidadeSelecionada === 'Todas') return barbearias;
    return barbearias.filter((b) => b.cidade?.toLowerCase() === cidadeSelecionada.toLowerCase());
  }, [barbearias, cidadeSelecionada]);

  async function handleEscolherBarbearia(item: BarbeariaPublica) {
    await selecionarBarbearia(item);
    if (somenteVinculos) {
      router.replace('/(app)/(barbeiro)/hoje');
    } else {
      router.replace('/(app)/(tabs)');
    }
  }

  async function handleExcluirBarbearia(item: BarbeariaPublica) {
    if (item.slug === 'barbearia-vieira' || item.id === '7917fb7a-e118-4928-b16b-94e4f26f8591') {
      Alert.alert('Operação Bloqueada 🔒', 'A Barbearia Vieira é a matriz principal e está protegida contra exclusão.');
      return;
    }

    Alert.alert(
      `Excluir ${item.nome}?`,
      `Deseja realmente excluir a unidade "${item.nome}"?\n\n• Todos os dados desta unidade serão apagados.\n• A Barbearia Vieira e todos os seus serviços permanecerão 100% intactos.\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Excluir Unidade',
          style: 'destructive',
          onPress: async () => {
            try {
              setExcluindoId(item.id);
              await supabase.from('barbearia_membros').delete().eq('barbearia_id', item.id);
              await supabase.from('servicos').delete().eq('barbearia_id', item.id);
              await supabase.from('horarios_atendimento').delete().eq('barbearia_id', item.id);
              await supabase.from('reajustes_precos').delete().eq('barbearia_id', item.id);
              const { error } = await supabase.from('barbearias').delete().eq('id', item.id);
              if (error) throw error;

              // Se a barbearia excluída era a ativa no momento, reseta para a Barbearia Vieira
              if (barbeariaAtiva?.id === item.id) {
                const { data: vieira } = await supabase
                  .from('barbearias')
                  .select('id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema, publicada, status, modo_agenda, dias_janela_agendamento, comissao_padrao, regras_fidelidade, mimo_ativo')
                  .eq('slug', 'barbearia-vieira')
                  .maybeSingle();

                if (vieira) {
                  await selecionarBarbearia(vieira as BarbeariaPublica);
                }
              }

              recarregar();
              Alert.alert('Sucesso', `A unidade "${item.nome}" foi excluída com sucesso.`);
            } catch (err: any) {
              Alert.alert('Erro ao excluir', err?.message || 'Não foi possível excluir a barbearia no momento.');
            } finally {
              setExcluindoId(null);
            }
          },
        },
      ]
    );
  }

  function renderCardBarbearia({ item }: { item: BarbeariaPublica }) {
    const isAtiva = barbeariaAtiva?.id === item.id;
    const isTeste = item.slug.includes('teste') || item.nome?.toLowerCase().includes('teste');
    const isVieira = item.slug === 'barbearia-vieira' || item.nome?.toLowerCase().includes('vieira');

    const enderecoAbreviado = (item.endereco || '')
      .replace(/^rua[:\s]+/i, 'R. ')
      .replace(/^avenida[:\s]+/i, 'Av. ')
      .replace(/\brua\b/gi, 'R.')
      .replace(/\bavenida\b/gi, 'Av.')
      .trim();

    const localizacao = isVieira
      ? 'São José do Divino, PI, R. Jeova Monte, 120, Brancas'
      : [item.cidade ? `${item.cidade}, PI` : '', enderecoAbreviado, item.bairro].filter(Boolean).join(', ') || 'Localização a confirmar';

    const descricaoExibida = isTeste
      ? 'Teste'
      : isVieira
      ? 'Tradição, estilo e o melhor atendimento para o seu visual. Cortes modernos, barba na navalha e cuidados masculinos de alto nível.'
      : item.descricao;

    const corDestaque = item.tema?.primary || theme.ouro;

    let distanciaKm: number | null = null;
    if (coordenadas?.latitude && coordenadas?.longitude) {
      const latBarbearia = isVieira ? -3.6074 : (item as any).latitude ?? -3.6074;
      const lonBarbearia = isVieira ? -41.8242 : (item as any).longitude ?? -41.8242;
      distanciaKm = calcularDistanciaKm(coordenadas.latitude, coordenadas.longitude, latBarbearia, lonBarbearia);
    } else if (item.distancia_km !== null && item.distancia_km !== undefined) {
      distanciaKm = Number(item.distancia_km);
    }

    return (
      <View style={[styles.card, isAtiva && styles.cardAtiva, { borderColor: isAtiva ? corDestaque : theme.borda }]}>
        {/* Banner de Capa */}
        <View style={styles.bannerContainer}>
          {isTeste ? (
            <View style={[styles.bannerImagem, { backgroundColor: theme.superficie2, alignItems: 'center', justifyContent: 'center' }]}>
              <Store size={38} color={theme.textoDesabilitado} />
            </View>
          ) : item.banner_url ? (
            <Image
              source={{ uri: item.banner_url }}
              style={styles.bannerImagem}
              resizeMode="cover"
            />
          ) : isVieira ? (
            <Image
              source={require('@/assets/barbearia-vieira-banner.png')}
              style={styles.bannerImagem}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.bannerImagem, { backgroundColor: theme.superficie2, alignItems: 'center', justifyContent: 'center' }]}>
              <Store size={38} color={theme.textoDesabilitado} />
            </View>
          )}
          <View style={styles.bannerGradiente} />

          {/* Badges do Topo */}
          <View style={styles.badgesTopoLinha}>
            {/* Badge de Distância */}
            {distanciaKm !== null && distanciaKm !== undefined ? (
              <View style={styles.badgeDistancia}>
                <MapPin size={10} color={Colors.ouro} />
                <Text style={styles.badgeDistanciaTexto}>
                  {distanciaKm < 1
                    ? `${Math.round(Number(distanciaKm) * 1000)} m`
                    : `${Number(distanciaKm).toFixed(1)} km`}
                </Text>
              </View>
            ) : null}

            {/* Badge de Ativa */}
            {isAtiva ? (
              <View style={[styles.badgeAtiva, { backgroundColor: corDestaque }]}>
                <Sparkles size={11} color={Colors.fundo} />
                <Text style={styles.badgeAtivaTexto}>Ativa no App</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.cardCorpo, { backgroundColor: theme.superficie }]}>
          <View style={styles.topoCard}>
            {/* Logo / Avatar do Estabelecimento */}
            <View style={[styles.logoWrapper, { backgroundColor: theme.superficie2, borderColor: corDestaque }]}>
              {isTeste ? (
                <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} color={corDestaque} />
                </View>
              ) : item.logo_url ? (
                <Image
                  source={{ uri: item.logo_url }}
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
                  <Building2 size={24} color={corDestaque} />
                </View>
              )}
            </View>

            <View style={styles.titulosContainer}>
              <Text style={[styles.nomeBarbearia, { color: theme.textoPrimario }]} numberOfLines={1}>
                {item.nome}
              </Text>
              <View style={styles.localLinha}>
                <MapPin size={13} color={corDestaque} />
                <Text style={[styles.localTexto, { color: theme.ouroTexto }]} numberOfLines={1}>
                  {localizacao}
                </Text>
              </View>
            </View>
          </View>

          {descricaoExibida ? (
            <Text style={[styles.descricaoBarbearia, { color: theme.textoSecundario }]} numberOfLines={2}>
              {descricaoExibida}
            </Text>
          ) : null}

          {/* Rodapé do Card com Ações */}
          <View style={styles.cardAcoes}>
            <TouchableOpacity
              style={[styles.btnDetalhes, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}
              onPress={() => router.push({ pathname: '/(app)/barbearias/[slug]', params: { slug: item.slug } })}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnDetalhesTexto, { color: theme.textoPrimario }]}>Ver Vitrine</Text>
            </TouchableOpacity>

            {!isVieira && (
              <TouchableOpacity
                style={[styles.btnExcluirCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                onPress={() => handleExcluirBarbearia(item)}
                disabled={excluindoId === item.id}
                activeOpacity={0.7}
              >
                {excluindoId === item.id ? (
                  <ActivityIndicator size="small" color={theme.erro} />
                ) : (
                  <>
                    <Trash2 size={14} color={theme.erro} />
                    <Text style={[styles.btnExcluirCardTexto, { color: theme.erro }]}>Excluir</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btnEscolher, isAtiva && styles.btnEscolherAtivo, { backgroundColor: isAtiva ? 'transparent' : corDestaque, borderColor: corDestaque }]}
              onPress={() => handleEscolherBarbearia(item)}
              activeOpacity={0.8}
            >
              <Scissors size={15} color={isAtiva ? corDestaque : theme.textoEscuroSobreOuro} />
              <Text style={[styles.btnEscolherTexto, isAtiva ? { color: corDestaque } : { color: theme.textoEscuroSobreOuro }]}>
                {isAtiva ? 'Acessar Barbearia' : 'Escolher Barbearia'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Header Principal */}
      <View style={[styles.header, modoPainel && styles.headerPainel]}>
        {modoPainel && (
          <View style={styles.headerPainelTopo}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.btnVoltarPainel}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={theme.textoPrimario} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnNovaUnidadeHeader, { backgroundColor: theme.ouro }]}
              onPress={() => router.push('/(app)/(barbeiro)/cadastrar-barbearia')}
              activeOpacity={0.8}
            >
              <Plus size={16} color={theme.textoEscuroSobreOuro} />
              <Text style={[styles.btnNovaUnidadeHeaderTexto, { color: theme.textoEscuroSobreOuro }]}>
                Nova Unidade
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerTexto}>
          <Text style={[styles.eyebrow, { color: theme.ouroTexto }]}>
            {modoPainel ? 'GESTÃO DE UNIDADES' : 'NA RÉGUA'}
          </Text>
          <Text style={[styles.titulo, { color: theme.textoPrimario }]}>
            {modoPainel ? 'Filiais' : 'Descubra as Melhores Barbearias 💈'}
          </Text>
          <Text style={[styles.subtitulo, { color: theme.textoSecundario }]}>
            {modoPainel
              ? 'Alterne entre suas filiais ou cadastre uma nova unidade.'
              : 'Encontre estilo, tradição e conveniência perto de você.'}
          </Text>
        </View>
      </View>

      {/* Barra de Busca */}
      <View style={styles.buscaContainer}>
        <View style={[styles.buscaWrapper, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
          <Search size={18} color={theme.textoSecundario} />
          <TextInput
            style={[styles.inputBusca, { color: theme.textoPrimario }]}
            placeholder="Buscar por nome, bairro ou cidade..."
            placeholderTextColor={theme.textoDesabilitado}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <X size={16} color={theme.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chips de Cidades */}
      {cidadesDisponiveis.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cidadesContainer}
        >
          {cidadesDisponiveis.map((cidade) => {
            const ativa = cidadeSelecionada === cidade;
            return (
              <TouchableOpacity
                key={cidade}
                style={[
                  styles.chipCidade,
                  { backgroundColor: theme.superficie, borderColor: theme.borda },
                  ativa && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                ]}
                onPress={() => setCidadeSelecionada(cidade)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.chipCidadeTexto,
                  { color: theme.textoSecundario },
                  ativa && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                ]}>
                  {cidade}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Lista de Barbearias */}
      {carregando && !barbearias.length ? (
        <View style={styles.centroLoading}>
          <ActivityIndicator color={theme.ouro} size="large" />
          <Text style={[styles.loadingTexto, { color: theme.textoSecundario }]}>Buscando estabelecimentos...</Text>
        </View>
      ) : (
        <FlatList
          data={barbeariasExibidas}
          renderItem={renderCardBarbearia}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={carregando}
              onRefresh={recarregar}
              tintColor={theme.ouro}
              colors={[theme.ouro]}
            />
          }
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.cardFooterCadastro, { backgroundColor: theme.superficie, borderColor: theme.bordaOuro }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(app)/(barbeiro)/cadastrar-barbearia')}
            >
              <View style={[styles.cardFooterIcone, { backgroundColor: theme.ouroTranslucido }]}>
                <Store size={22} color={theme.ouroTexto} />
              </View>
              <View style={styles.cardFooterTextos}>
                <Text style={[styles.cardFooterTitulo, { color: theme.ouroTexto }]}>
                  {modoPainel ? '+ Cadastrar Nova Filial' : 'Tem uma Barbearia?'}
                </Text>
                <Text style={[styles.cardFooterSub, { color: theme.textoSecundario }]}>
                  {modoPainel
                    ? 'Adicione uma nova unidade da sua rede com equipe, serviços e agenda próprios'
                    : 'Cadastre seu estabelecimento e apareça aqui na vitrine'}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.ouroTexto} />
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Building2 size={44} color={Colors.textoDesabilitado} />
              <Text style={styles.vazioTitulo}>
                {erro ? 'Não foi possível carregar' : 'Nenhuma barbearia encontrada'}
              </Text>
              <Text style={styles.vazioTexto}>
                {erro ?? 'Tente buscar por outro termo ou selecione outra cidade.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.fundo },
    header: {
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    headerPainel: {
      paddingTop: Spacing.xs,
    },
    headerPainelTopo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    btnVoltarPainel: {
      padding: 4,
    },
    btnNovaUnidadeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: Radii.full,
    },
    btnNovaUnidadeHeaderTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 12,
    },
    headerTexto: { gap: 3 },
    eyebrow: {
      color: theme.ouro,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      letterSpacing: 2,
    },
    titulo: {
      color: theme.textoPrimario,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.displayMd,
      marginTop: 2,
    },
    subtitulo: {
      color: theme.textoSecundario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
    },

    buscaContainer: {
      paddingHorizontal: Spacing.telaH,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    buscaWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: Spacing.md,
      height: 46,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
      backgroundColor: theme.superficie2,
    },
    inputBusca: {
      flex: 1,
      color: theme.textoPrimario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
    },

    cidadesContainer: {
      paddingHorizontal: Spacing.telaH,
      paddingVertical: Spacing.xs,
      gap: 8,
    },
    chipCidade: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: Radii.full,
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    chipCidadeAtivo: {
      backgroundColor: theme.ouroTranslucido,
      borderColor: theme.ouro,
    },
    chipCidadeTexto: {
      color: theme.textoSecundario,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
    },
    chipCidadeTextoAtivo: {
      color: theme.ouroTexto,
      fontFamily: FontFamily.bold,
    },

    lista: {
      padding: Spacing.telaH,
      paddingBottom: Spacing.giant,
      gap: Spacing.lg,
    },

    card: {
      borderRadius: Radii.lg,
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
      overflow: 'hidden',
      ...Shadows.card,
    },
    cardAtiva: {
      borderColor: theme.bordaOuro,
      shadowColor: theme.ouro,
      shadowOpacity: 0.15,
    },

    bannerContainer: {
      width: '100%',
      height: 120,
      backgroundColor: theme.superficie,
      position: 'relative',
    },
    bannerImagem: {
      width: '100%',
      height: '100%',
    },
    bannerPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.superficie,
      gap: 4,
    },
    bannerPlaceholderTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.ouroTexto,
      letterSpacing: 0.5,
    },
    bannerGradiente: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 15, 16, 0.35)',
    },

    badgesTopoLinha: {
      position: 'absolute',
      top: 10,
      left: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badgeDistancia: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    badgeDistanciaTexto: {
      color: theme.ouro,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
    },
    badgeAtiva: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.ouro,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radii.full,
      marginLeft: 'auto',
    },
    badgeAtivaTexto: {
      color: theme.textoEscuroSobreOuro,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
    },

    cardCorpo: {
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    topoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: -Spacing.xl,
    },
    logoWrapper: {
      width: 60,
      height: 60,
      borderRadius: Radii.md,
      borderWidth: 2,
      borderColor: theme.ouro,
      backgroundColor: theme.superficie,
      overflow: 'hidden',
      ...Shadows.card,
    },
    logoImg: {
      width: '100%',
      height: '100%',
    },
    logoPlaceholder: {
      flex: 1,
      backgroundColor: theme.ouro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoLetra: {
      fontFamily: FontFamily.bold,
      fontSize: 26,
      color: theme.textoEscuroSobreOuro,
    },

    titulosContainer: {
      flex: 1,
      paddingTop: Spacing.md,
    },
    nomeBarbearia: {
      color: theme.textoPrimario,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyLg,
    },
    localLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    localTexto: {
      color: theme.ouroClaro,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
    },

    descricaoBarbearia: {
      color: theme.textoSecundario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      lineHeight: 18,
      marginTop: 2,
    },

    cardAcoes: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.borda,
    },
    btnDetalhes: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
      backgroundColor: theme.superficie2,
    },
    btnDetalhesTexto: {
      color: theme.textoSecundario,
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
    },
    btnExcluirCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: Radii.md,
      borderWidth: 1,
    },
    btnExcluirCardTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },
    btnEscolher: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.ouro,
      paddingVertical: 10,
      borderRadius: Radii.md,
    },
    btnEscolherAtivo: {
      backgroundColor: theme.ouroTranslucido,
      borderWidth: 1,
      borderColor: theme.ouro,
    },
    btnEscolherTexto: {
      color: theme.textoEscuroSobreOuro,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
    },
    btnEscolherTextoAtivo: {
      color: theme.ouroTexto,
    },

    centroLoading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    loadingTexto: {
      color: theme.textoSecundario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
    },

    vazio: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.giant,
      gap: Spacing.xs,
    },
    vazioTitulo: {
      color: theme.textoPrimario,
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodyLg,
      marginTop: Spacing.sm,
    },
    vazioTexto: {
      color: theme.textoSecundario,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodySm,
      textAlign: 'center',
      maxWidth: 280,
    },

    cardFooterCadastro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.superficie,
      borderRadius: Radii.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
      marginVertical: Spacing.md,
      ...Shadows.card,
    },
    cardFooterIcone: {
      width: 42,
      height: 42,
      borderRadius: Radii.md,
      backgroundColor: theme.ouroTranslucido,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardFooterTextos: {
      flex: 1,
      gap: 2,
    },
    cardFooterTitulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.ouroTexto,
    },
    cardFooterSub: {
      fontFamily: FontFamily.regular,
      fontSize: 11,
      color: theme.textoSecundario,
      lineHeight: 15,
    },
  });
