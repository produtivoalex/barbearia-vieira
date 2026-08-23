import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Search, ChevronRight } from 'lucide-react-native';
import { useBarbearias, type BarbeariaPublica } from '@/hooks/useBarbearias';
import { usePerfil } from '@/hooks/usePerfil';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

export default function ListaBarbearias() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const { perfil } = usePerfil();
  const { barbearias, carregando, erro, recarregar } = useBarbearias({ busca, somenteVinculos: perfil?.role === 'barbeiro' });

  function renderItem({ item }: { item: BarbeariaPublica }) {
    return <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(app)/barbearias/[slug]', params: { slug: item.slug } })}>
      <View style={styles.logo}><Text style={styles.logoTexto}>{item.nome.slice(0, 1).toUpperCase()}</Text></View>
      <View style={styles.info}><Text style={styles.nome}>{item.nome}</Text><Text style={styles.local}>{[item.bairro, item.cidade].filter(Boolean).join(' • ') || 'Localização não informada'}</Text>{item.descricao ? <Text style={styles.descricao} numberOfLines={2}>{item.descricao}</Text> : null}</View>
      <ChevronRight size={20} color={Colors.ouro} />
    </TouchableOpacity>;
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><Text style={styles.eyebrow}>MARKETPLACE</Text><Text style={styles.titulo}>Encontre sua barbearia</Text><Text style={styles.subtitulo}>Escolha um estabelecimento e conheça os serviços.</Text></View>
    <View style={styles.busca}><Search size={18} color={Colors.textoSecundario} /><TextInput style={styles.input} placeholder="Buscar por nome ou descrição" placeholderTextColor={Colors.textoDesabilitado} value={busca} onChangeText={setBusca} /></View>
    {carregando && !barbearias.length ? <ActivityIndicator style={styles.loading} color={Colors.ouro} /> : <FlatList data={barbearias} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.lista} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.ouro} />} ListEmptyComponent={<View style={styles.vazio}><MapPin size={36} color={Colors.textoDesabilitado} /><Text style={styles.vazioTitulo}>{erro ? 'Não foi possível carregar' : 'Nenhuma barbearia encontrada'}</Text><Text style={styles.vazioTexto}>{erro ?? 'Tente buscar por outro nome.'}</Text></View>} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.fundo }, header: { padding: Spacing.telaH, paddingBottom: Spacing.sm }, eyebrow: { color: Colors.ouro, fontFamily: FontFamily.bold, fontSize: FontSize.labelXs, letterSpacing: 2 }, titulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.displayMd, marginTop: 4 }, subtitulo: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, marginTop: 4 }, busca: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.telaH, paddingHorizontal: Spacing.md, height: 46, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.borda, backgroundColor: Colors.superficie }, input: { flex: 1, color: Colors.textoPrimario, fontFamily: FontFamily.regular }, lista: { padding: Spacing.telaH, gap: Spacing.sm }, card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.borda, backgroundColor: Colors.superficie }, logo: { width: 48, height: 48, borderRadius: Radii.md, backgroundColor: Colors.ouro, alignItems: 'center', justifyContent: 'center' }, logoTexto: { fontFamily: FontFamily.bold, fontSize: 22, color: Colors.fundo }, info: { flex: 1, gap: 3 }, nome: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg }, local: { color: Colors.ouroClaro, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm }, descricao: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, fontSize: FontSize.bodySm }, loading: { marginTop: 40 }, vazio: { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.sm }, vazioTitulo: { color: Colors.textoPrimario, fontFamily: FontFamily.bold, fontSize: FontSize.bodyLg }, vazioTexto: { color: Colors.textoSecundario, fontFamily: FontFamily.regular, textAlign: 'center' } });
