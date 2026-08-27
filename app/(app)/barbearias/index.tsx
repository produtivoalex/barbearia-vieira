import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
  Building2,
  ChevronRight,
  Compass,
  MapPin,
  Phone,
  Search,
  Scissors,
  Sparkles,
  Store,
  X,
} from 'lucide-react-native';
import { useBarbearias, type BarbeariaPublica } from '@/hooks/useBarbearias';
import { useLocalizacao } from '@/hooks/useLocalizacao';
import { usePerfil } from '@/hooks/usePerfil';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { Colors, FontFamily, FontSize, Radii, Shadows, Spacing } from '@/theme';

export default function ListaBarbearias() {
  const router = useRouter();
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const [busca, setBusca] = useState('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('Todas');
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

  function renderCardBarbearia({ item }: { item: BarbeariaPublica }) {
    const isAtiva = barbeariaAtiva?.id === item.id;
    const localizacao = [item.bairro, item.cidade].filter(Boolean).join(', ') || 'Localização a confirmar';
    const corDestaque = item.tema?.primary || Colors.ouro;

    return (
      <View style={[styles.card, isAtiva && styles.cardAtiva, { borderColor: isAtiva ? corDestaque : Colors.borda }]}>
        {/* Banner de Capa */}
        <View style={styles.bannerContainer}>
          {item.banner_url ? (
            <Image source={{ uri: item.banner_url }} style={styles.bannerImagem} resizeMode="cover" />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Store size={36} color="rgba(203, 161, 74, 0.45)" />
              <Text style={styles.bannerPlaceholderTexto}>{item.nome}</Text>
            </View>
          )}
          <View style={styles.bannerGradiente} />

          {/* Badges do Topo */}
          <View style={styles.badgesTopoLinha}>
            {/* Badge de Distância */}
            {item.distancia_km !== null && item.distancia_km !== undefined ? (
              <View style={styles.badgeDistancia}>
                <MapPin size={10} color={Colors.ouro} />
                <Text style={styles.badgeDistanciaTexto}>
                  {item.distancia_km < 1
                    ? `${Math.round(Number(item.distancia_km) * 1000)} m`
                    : `${Number(item.distancia_km).toFixed(1)} km`}
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

        {/* Informações Principais & Logo */}
        <View style={styles.cardCorpo}>
          <View style={styles.topoCard}>
            {/* Logo Flutuante */}
            <View style={[styles.logoWrapper, { borderColor: corDestaque }]}>
              {item.logo_url ? (
                <Image source={{ uri: item.logo_url }} style={styles.logoImg} resizeMode="cover" />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: corDestaque }]}>
                  <Text style={styles.logoLetra}>{item.nome.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={styles.titulosContainer}>
              <Text style={styles.nomeBarbearia} numberOfLines={1}>
                {item.nome}
              </Text>
              <View style={styles.localLinha}>
                <MapPin size={13} color={corDestaque} />
                <Text style={styles.localTexto} numberOfLines={1}>
                  {localizacao}
                </Text>
              </View>
            </View>
          </View>

          {item.descricao ? (
            <Text style={styles.descricaoBarbearia} numberOfLines={2}>
              {item.descricao}
            </Text>
          ) : null}

          {/* Rodapé do Card com Ações */}
          <View style={styles.cardAcoes}>
            <TouchableOpacity
              style={styles.btnDetalhes}
              onPress={() => router.push({ pathname: '/(app)/barbearias/[slug]', params: { slug: item.slug } })}
              activeOpacity={0.7}
            >
              <Text style={styles.btnDetalhesTexto}>Ver Vitrine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnEscolher, isAtiva && styles.btnEscolherAtivo, { backgroundColor: isAtiva ? 'transparent' : corDestaque, borderColor: corDestaque }]}
              onPress={() => handleEscolherBarbearia(item)}
              activeOpacity={0.8}
            >
              <Scissors size={15} color={isAtiva ? corDestaque : Colors.fundo} />
              <Text style={[styles.btnEscolherTexto, isAtiva && { color: corDestaque }]}>
                {isAtiva ? 'Acessar Barbearia' : 'Escolher Barbearia'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header Principal */}
      <View style={styles.header}>
        <View style={styles.headerTexto}>
          <Text style={styles.eyebrow}>
            {modoPainel ? 'PAINEL PROFISSIONAL' : 'NA RÉGUA'}
          </Text>
          <Text style={styles.titulo}>
            {modoPainel ? 'Selecione a Barbearia' : 'Descubra as Melhores Barbearias 💈'}
          </Text>
          <Text style={styles.subtitulo}>
            {modoPainel
              ? 'Gerencie agendamentos, equipe e faturamento da sua unidade.'
              : 'Encontre estilo, tradição e conveniência perto de você.'}
          </Text>
        </View>
      </View>

      {/* Barra de Busca */}
      <View style={styles.buscaContainer}>
        <View style={styles.buscaWrapper}>
          <Search size={18} color={Colors.textoSecundario} />
          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar por nome, bairro ou cidade..."
            placeholderTextColor={Colors.textoDesabilitado}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <X size={16} color={Colors.textoSecundario} />
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
                style={[styles.chipCidade, ativa && styles.chipCidadeAtivo]}
                onPress={() => setCidadeSelecionada(cidade)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipCidadeTexto, ativa && styles.chipCidadeTextoAtivo]}>
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
          <ActivityIndicator color={Colors.ouro} size="large" />
          <Text style={styles.loadingTexto}>Buscando estabelecimentos...</Text>
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
              tintColor={Colors.ouro}
              colors={[Colors.ouro]}
            />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerTexto: { gap: 3 },
  eyebrow: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    letterSpacing: 2,
  },
  titulo: {
    color: Colors.textoPrimario,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    marginTop: 2,
  },
  subtitulo: {
    color: Colors.textoSecundario,
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
    borderColor: Colors.borda,
    backgroundColor: Colors.superficie,
  },
  inputBusca: {
    flex: 1,
    color: Colors.textoPrimario,
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
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  chipCidadeAtivo: {
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    borderColor: Colors.ouro,
  },
  chipCidadeTexto: {
    color: Colors.textoSecundario,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
  },
  chipCidadeTextoAtivo: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
  },

  lista: {
    padding: Spacing.telaH,
    paddingBottom: Spacing.giant,
    gap: Spacing.lg,
  },

  card: {
    borderRadius: Radii.lg,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardAtiva: {
    borderColor: 'rgba(203, 161, 74, 0.5)',
    shadowColor: Colors.ouro,
    shadowOpacity: 0.15,
  },

  bannerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#161618',
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
    backgroundColor: '#161618',
    gap: 4,
  },
  bannerPlaceholderTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: 'rgba(203, 161, 74, 0.7)',
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
    borderColor: 'rgba(203, 161, 74, 0.4)',
  },
  badgeDistanciaTexto: {
    color: Colors.ouro,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
  },
  badgeAtiva: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.ouro,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    marginLeft: 'auto',
  },
  badgeAtivaTexto: {
    color: Colors.fundo,
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
    borderColor: Colors.ouro,
    backgroundColor: '#161618',
    overflow: 'hidden',
    ...Shadows.card,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    flex: 1,
    backgroundColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetra: {
    fontFamily: FontFamily.bold,
    fontSize: 26,
    color: Colors.fundo,
  },

  titulosContainer: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  nomeBarbearia: {
    color: Colors.textoPrimario,
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
    color: Colors.ouroClaro,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
  },

  descricaoBarbearia: {
    color: Colors.textoSecundario,
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
    borderTopColor: Colors.borda,
  },
  btnDetalhes: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borda,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  btnDetalhesTexto: {
    color: Colors.textoSecundario,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
  },
  btnEscolher: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ouro,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  btnEscolherAtivo: {
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    borderWidth: 1,
    borderColor: Colors.ouro,
  },
  btnEscolherTexto: {
    color: Colors.fundo,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
  },
  btnEscolherTextoAtivo: {
    color: Colors.ouro,
  },

  centroLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingTexto: {
    color: Colors.textoSecundario,
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
    color: Colors.textoPrimario,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    marginTop: Spacing.sm,
  },
  vazioTexto: {
    color: Colors.textoSecundario,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    textAlign: 'center',
    maxWidth: 280,
  },
});
