import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, MessageCircle, Phone, Scissors } from 'lucide-react-native';
import { buscarDetalheBarbearia, type BarbeariaPublica } from '@/hooks/useBarbearias';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { usePerfil } from '@/hooks/usePerfil';

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

  if (carregando) return <View style={styles.loading}><ActivityIndicator color={Colors.ouro} /></View>;
  if (!barbearia) return <View style={styles.loading}><Text style={styles.vazio}>Barbearia não encontrada.</Text></View>;

  const abrir = (url: string | null | undefined) => { if (url) Linking.openURL(url).catch(() => {}); };
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={() => router.back()} style={styles.voltar}><ArrowLeft size={20} color={Colors.textoPrimario} /><Text style={styles.voltarTexto}>Voltar</Text></TouchableOpacity>
      <View style={styles.hero}><Text style={styles.heroLetra}>{barbearia.nome.slice(0, 1).toUpperCase()}</Text></View>
      <Text style={styles.nome}>{barbearia.nome}</Text>
      {barbearia.descricao ? <Text style={styles.descricao}>{barbearia.descricao}</Text> : null}
      <Text style={styles.local}><MapPin size={15} color={Colors.ouro} /> {[barbearia.endereco, barbearia.bairro, barbearia.cidade].filter(Boolean).join(' • ') || 'Endereço não informado'}</Text>
      <View style={styles.acoes}>{barbearia.whatsapp ? <TouchableOpacity style={styles.acao} onPress={() => abrir(`https://wa.me/${barbearia.whatsapp?.replace(/\D/g, '')}`)}><MessageCircle size={17} color={Colors.verde} /><Text style={styles.acaoTexto}>WhatsApp</Text></TouchableOpacity> : null}{barbearia.telefone ? <TouchableOpacity style={styles.acao} onPress={() => abrir(`tel:${barbearia.telefone}`)}><Phone size={17} color={Colors.ouro} /><Text style={styles.acaoTexto}>Ligar</Text></TouchableOpacity> : null}</View>
      <TouchableOpacity style={styles.selecionar} onPress={async () => { await selecionarBarbearia(barbearia); router.push('/(app)/(tabs)/servicos'); }} activeOpacity={0.8}>
        <Text style={styles.selecionarTexto}>{barbeariaSelecionada?.id === barbearia.id ? 'Barbearia selecionada' : 'Escolher esta barbearia'}</Text>
      </TouchableOpacity>
      <Text style={styles.secao}><Scissors size={18} color={Colors.ouro} /> Serviços disponíveis</Text>
      {(barbearia.servicos ?? []).map((servico) => <View key={servico.id} style={styles.servico}><View style={styles.servicoInfo}><Text style={styles.servicoNome}>{servico.nome}</Text>{servico.descricao ? <Text style={styles.servicoDescricao}>{servico.descricao}</Text> : null}</View><Text style={styles.preco}>{Number(servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text></View>)}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.fundo }, scroll: { padding: Spacing.telaH, paddingBottom: Spacing.giant }, loading: { flex: 1, backgroundColor: Colors.fundo, alignItems: 'center', justifyContent: 'center' }, vazio: { color: Colors.textoPrimario, fontFamily: FontFamily.medium }, voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md }, voltarTexto: { color: Colors.textoPrimario, fontFamily: FontFamily.medium }, hero: { height: 150, borderRadius: Radii.lg, backgroundColor: Colors.ouro, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }, heroLetra: { color: Colors.fundo, fontFamily: FontFamily.bold, fontSize: 64 }, nome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.displayMd }, descricao: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, lineHeight: 21, marginTop: 6 }, local: { flexDirection: 'row', alignItems: 'center', color: Colors.ouroClaro, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm, marginTop: Spacing.md }, acoes: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.lg }, acao: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.borda, backgroundColor: Colors.superficie }, acaoTexto: { color: Colors.textoPrimario, fontFamily: FontFamily.medium }, selecionar: { alignItems: 'center', paddingVertical: 13, borderRadius: Radii.md, backgroundColor: Colors.vermelho, marginBottom: Spacing.lg }, selecionarTexto: { color: Colors.branco, fontFamily: FontFamily.bold, fontSize: FontSize.bodyMd }, secao: { flexDirection: 'row', alignItems: 'center', gap: 8, color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg, marginBottom: Spacing.sm }, servico: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radii.md, backgroundColor: Colors.superficie, borderWidth: 1, borderColor: Colors.borda, marginBottom: Spacing.xs }, servicoInfo: { flex: 1, gap: 3 }, servicoNome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold }, servicoDescricao: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm }, preco: { color: Colors.ouro, fontFamily: FontFamily.bold } });
