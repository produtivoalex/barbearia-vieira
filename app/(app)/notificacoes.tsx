import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Notificacao { id: string; tipo: string; titulo: string; mensagem: string; dados: { ofertaId?: string }; lida_em: string | null; criada_em: string; }

export default function TelaNotificacoes() {
  const router = useRouter();
  const { session } = useAuth();
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!session?.user?.id) { setCarregando(false); return; }
    setCarregando(true);
    const { data } = await supabase.from('notifications').select('id, tipo, titulo, mensagem, dados, lida_em, criada_em').eq('usuario_id', session.user.id).order('criada_em', { ascending: false }).limit(50);
    setItens((data as unknown as Notificacao[]) ?? []);
    setCarregando(false);
  }, [session?.user?.id]);

  useEffect(() => { carregar(); }, [carregar]);

  async function abrir(item: Notificacao) {
    if (!item.lida_em) { await supabase.from('notifications').update({ lida_em: new Date().toISOString() }).eq('id', item.id); setItens((atual) => atual.map((notificacao) => notificacao.id === item.id ? { ...notificacao, lida_em: new Date().toISOString() } : notificacao)); }
    if (item.tipo === 'oferta_fila' && item.dados?.ofertaId) router.push({ pathname: '/(app)/lista-espera/oferta', params: { ofertaId: item.dados.ofertaId } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color={Colors.textoPrimario} /></TouchableOpacity><Text style={styles.titulo}>Notificações</Text><View style={styles.placeholder} /></View>
      {carregando && itens.length === 0 ? <View style={styles.loading}><ActivityIndicator color={Colors.vermelho} /></View> : <ScrollView contentContainerStyle={styles.lista} refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} tintColor={Colors.vermelho} />}>
        {itens.length === 0 ? <View style={styles.vazio}><Bell size={42} color={Colors.textoDesabilitado} /><Text style={styles.vazioTitulo}>Tudo em dia</Text><Text style={styles.vazioTexto}>Avisos importantes aparecerão aqui.</Text></View> : itens.map((item) => <TouchableOpacity key={item.id} style={[styles.card, !item.lida_em && styles.cardNaoLido]} onPress={() => abrir(item)} activeOpacity={0.75}><View style={styles.icone}><Bell size={18} color={item.lida_em ? Colors.textoSecundario : Colors.vermelho} /></View><View style={styles.conteudo}><Text style={styles.cardTitulo}>{item.titulo}</Text><Text style={styles.mensagem}>{item.mensagem}</Text><Text style={styles.data}>{new Date(item.criada_em).toLocaleString('pt-BR')}</Text></View>{item.tipo === 'oferta_fila' && <ChevronRight size={18} color={Colors.textoSecundario} />}</TouchableOpacity>)}
      </ScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.telaH, borderBottomWidth: 1, borderBottomColor: Colors.borda },
  titulo: { fontFamily: FontFamily.bold, fontSize: FontSize.headingSm, color: Colors.textoPrimario },
  placeholder: { width: 24 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lista: { padding: Spacing.telaH, gap: Spacing.sm, paddingBottom: Spacing.giant },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radii.md, backgroundColor: Colors.superficie },
  cardNaoLido: { borderLeftWidth: 3, borderLeftColor: Colors.vermelho },
  icone: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.superficie2 },
  conteudo: { flex: 1, gap: 3 },
  cardTitulo: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyMd, color: Colors.textoPrimario },
  mensagem: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, color: Colors.textoSecundario },
  data: { fontFamily: FontFamily.regular, fontSize: FontSize.labelXs, color: Colors.textoDesabilitado },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, padding: Spacing.telaH },
  vazioTitulo: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyLg, color: Colors.textoPrimario },
  vazioTexto: { fontFamily: FontFamily.regular, fontSize: FontSize.bodyMd, color: Colors.textoSecundario },
});
