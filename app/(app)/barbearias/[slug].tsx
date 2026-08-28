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
} from 'lucide-react-native';
import { buscarDetalheBarbearia, type BarbeariaPublica } from '@/hooks/useBarbearias';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { usePerfil } from '@/hooks/usePerfil';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

export default function DetalheBarbearia() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [barbearia, setBarbearia] = useState<BarbeariaPublica | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { barbearia: barbeariaSelecionada, selecionarBarbearia } = useBarbearia();
  const { perfil } = usePerfil();

  useEffect(() => {
    if (!slug) return;
    setCarregando(true);
    buscarDetalheBarbearia(slug, perfil?.role === 'barbeiro').then(({ barbearia: resultado }) => {
      setBarbearia(resultado);
      setCarregando(false);
    });
  }, [slug, perfil?.role]);

  const fotosArray = useMemo(() => {
    if (!barbearia?.fotos || !Array.isArray(barbearia.fotos)) return [];
    return barbearia.fotos.filter((f): f is string => typeof f === 'string');
  }, [barbearia?.fotos]);

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.ouro} size="large" />
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
    if (url) Linking.openURL(url).catch(() => {});
  };

  const estaSelecionada = barbeariaSelecionada?.id === barbearia.id;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Botão Voltar */}
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <ArrowLeft size={20} color={Colors.textoPrimario} />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        {/* Hero Banner / Logo */}
        <View style={styles.heroContainer}>
          {barbearia.banner_url ? (
            <Image source={{ uri: barbearia.banner_url }} style={styles.heroBanner} resizeMode="cover" />
          ) : (
            <View style={styles.heroBannerPlaceholder}>
              <Text style={styles.heroBannerLetra}>{barbearia.nome.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}

          {/* Logo Flutuante */}
          <View style={styles.logoWrapper}>
            {barbearia.logo_url ? (
              <Image source={{ uri: barbearia.logo_url }} style={styles.logoImg} resizeMode="cover" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoLetra}>{barbearia.nome.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Cabeçalho de Identificação */}
        <View style={styles.identificacao}>
          <Text style={styles.nome}>{barbearia.nome}</Text>
          {barbearia.descricao ? <Text style={styles.descricao}>{barbearia.descricao}</Text> : null}

          <View style={styles.localLinha}>
            <MapPin size={15} color={Colors.ouro} />
            <Text style={styles.localTexto}>
              {[barbearia.endereco, barbearia.bairro, barbearia.cidade].filter(Boolean).join(' • ') ||
                'Endereço não informado'}
            </Text>
          </View>
        </View>

        {/* Botões de Ação de Contato */}
        <View style={styles.acoes}>
          {barbearia.whatsapp ? (
            <TouchableOpacity
              style={styles.acao}
              onPress={() => abrirUrl(`https://wa.me/${barbearia.whatsapp?.replace(/\D/g, '')}`)}
            >
              <MessageCircle size={17} color={Colors.verde} />
              <Text style={styles.acaoTexto}>WhatsApp</Text>
            </TouchableOpacity>
          ) : null}

          {barbearia.telefone ? (
            <TouchableOpacity style={styles.acao} onPress={() => abrirUrl(`tel:${barbearia.telefone}`)}>
              <Phone size={17} color={Colors.ouro} />
              <Text style={styles.acaoTexto}>Ligar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Botão Selecionar / Escolher */}
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
              <Check size={18} color={Colors.branco} />
              <Text style={styles.selecionarTextoAtivo}>Barbearia Selecionada</Text>
            </>
          ) : (
            <Text style={styles.selecionarTexto}>Escolher esta Barbearia</Text>
          )}
        </TouchableOpacity>

        {/* Galeria de Fotos */}
        {fotosArray.length > 0 && (
          <View style={styles.secaoGaleria}>
            <View style={styles.secaoHeader}>
              <Camera size={18} color={Colors.ouro} />
              <Text style={styles.secaoTitulo}>Galeria do Espaço</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galeriaScroll}>
              {fotosArray.map((fotoUrl, idx) => (
                <View key={`${fotoUrl}-${idx}`} style={styles.galeriaItem}>
                  <Image source={{ uri: fotoUrl }} style={styles.galeriaImagem} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lista de Serviços */}
        <View style={styles.secaoServicos}>
          <View style={styles.secaoHeader}>
            <Scissors size={18} color={Colors.ouro} />
            <Text style={styles.secaoTitulo}>Serviços Disponíveis</Text>
          </View>

          {(barbearia.servicos ?? []).length === 0 ? (
            <Text style={styles.servicosVazio}>Nenhum serviço cadastrado no momento.</Text>
          ) : (
            (barbearia.servicos ?? []).map((servico) => (
              <View key={servico.id} style={styles.servico}>
                <View style={styles.servicoInfo}>
                  <Text style={styles.servicoNome}>{servico.nome}</Text>
                  {servico.descricao ? <Text style={styles.servicoDescricao}>{servico.descricao}</Text> : null}
                </View>
                <Text style={styles.preco}>
                  {Number(servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  scroll: { padding: Spacing.telaH, paddingBottom: Spacing.giant },
  loading: { flex: 1, backgroundColor: Colors.fundo, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  vazio: { color: Colors.textoPrimario, fontFamily: FontFamily.medium, fontSize: FontSize.bodyMd },
  voltarSimples: { backgroundColor: Colors.ouro, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radii.md },

  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  voltarTexto: { color: Colors.textoPrimario, fontFamily: FontFamily.medium },

  heroContainer: { position: 'relative', marginBottom: 40 },
  heroBanner: { height: 140, borderRadius: Radii.lg, width: '100%' },
  heroBannerPlaceholder: {
    height: 140,
    borderRadius: Radii.lg,
    backgroundColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerLetra: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: 54 },

  logoWrapper: {
    position: 'absolute',
    bottom: -30,
    left: Spacing.md,
    width: 68,
    height: 68,
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.fundo,
    backgroundColor: Colors.superficie,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoImg: { width: '100%', height: '100%' },
  logoPlaceholder: { flex: 1, backgroundColor: Colors.ouro, alignItems: 'center', justifyContent: 'center' },
  logoLetra: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: 26 },

  identificacao: { marginTop: Spacing.xs },
  nome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.displayMd },
  descricao: {
    color: Colors.textoSecundario,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    lineHeight: 21,
    marginTop: 6,
  },
  localLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  localTexto: { color: Colors.ouroClaro, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm, flex: 1 },

  acoes: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borda,
    backgroundColor: Colors.superficie,
  },
  acaoTexto: { color: Colors.textoPrimario, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },

  selecionar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.md,
    backgroundColor: Colors.ouro,
    marginBottom: Spacing.lg,
  },
  selecionadoAtivo: { backgroundColor: '#2E7D32' },
  selecionarTexto: { color: Colors.textoEscuroSobreOuro, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
  selecionarTextoAtivo: { color: Colors.branco, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },

  secaoGaleria: { marginBottom: Spacing.lg },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  secaoTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg },
  galeriaScroll: { gap: 10, paddingVertical: 4 },
  galeriaItem: { width: 120, height: 90, borderRadius: Radii.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borda },
  galeriaImagem: { width: '100%', height: '100%' },

  secaoServicos: { gap: Spacing.xs },
  servicosVazio: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, paddingVertical: 8 },
  servico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
    marginBottom: Spacing.xs,
  },
  servicoInfo: { flex: 1, gap: 3 },
  servicoNome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold },
  servicoDescricao: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  preco: { color: Colors.ouro, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd },
});
