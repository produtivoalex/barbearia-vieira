import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Scissors, User } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type AgendamentoBarbeiro } from '@/hooks/usePainelBarbeiro';
import { usePerfil } from '@/hooks/usePerfil';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const DIAS_SEMANA_EXT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES_EXT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function CardAgendamento({ item }: { item: AgendamentoBarbeiro }) {
  return (
    <View style={styles.cardAgendamento}>
      <View style={styles.cardHoraColuna}>
        <Text style={styles.cardHora}>{formatarHora(item.data_hora)}</Text>
        <Text style={styles.cardDuracao}>{item.servico.duracao_minutos} min</Text>
      </View>
      <View style={styles.cardDivisorVertical} />
      <View style={styles.cardInfo}>
        <View style={styles.cardLinha}>
          <User size={14} color={Colors.textoSecundario} />
          <Text style={styles.cardClienteNome} numberOfLines={1}>
            {item.cliente.nome_completo || 'Cliente'}
          </Text>
        </View>
        <View style={styles.cardLinha}>
          <Scissors size={14} color={Colors.ouro} />
          <Text style={styles.cardServico} numberOfLines={1}>{item.servico.nome}</Text>
        </View>
      </View>
      <Text style={styles.cardPreco}>
        {Number(item.servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </Text>
    </View>
  );
}

export default function TelaBarbeiroHoje() {
  const { session } = useAuth();
  const { perfil } = usePerfil();
  const { agendamentosHoje, carregando, recarregar } = usePainelBarbeiro();

  const agora = new Date();
  const dataFormatada = `${DIAS_SEMANA_EXT[agora.getDay()]}, ${agora.getDate()} de ${MESES_EXT[agora.getMonth()]}`;
  const primeiroNome = perfil?.nome_completo?.split(' ')[0] || 'Barbeiro';

  async function definirAtraso(minutos: number) {
    if (!session?.user?.id) return;
    const data = agora.toISOString().slice(0, 10);
    try {
      const { data: afetados, error } = await supabase.rpc('registrar_atraso_agenda', {
        p_minutos: minutos,
        p_data: data,
      });

      if (error) {
        // Fallback direto via upsert
        const { error: errUpsert } = await supabase.from('atrasos_agenda').upsert(
          {
            barbeiro_id: session.user.id,
            data,
            minutos_atraso: minutos,
            normalizado_em: minutos === 0 ? new Date().toISOString() : null,
          },
          { onConflict: 'barbeiro_id,data' }
        );
        if (errUpsert) throw errUpsert;
      }

      if (minutos === 0) {
        Alert.alert('Agenda Normalizada 💈', 'Os clientes voltarão a ver os horários normais de atendimento.');
      } else {
        const qtdMsg = typeof afetados === 'number' && afetados > 0 ? ` (${afetados} cliente(s) avisado(s))` : '';
        Alert.alert(
          'Atraso Registrado ⏳',
          `+${minutos} minutos adicionados à previsão de hoje.${qtdMsg}`
        );
      }
    } catch (err: any) {
      Alert.alert('Erro ao registrar atraso', err.message || 'Tente novamente.');
    }
  }

  const faturamentoDia = agendamentosHoje.reduce((acc, a) => acc + Number(a.servico.preco), 0);
  const faturamentoFormatado = faturamentoDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Olá, {primeiroNome}!</Text>
          <Text style={styles.subtitulo}>{dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.vermelho} colors={[Colors.vermelho]} />
        }
      >
        {/* ─── Métricas ─── */}
        <View style={styles.metricasRow}>
          <View style={styles.metricaCard}>
            <Text style={styles.metricaValor}>{agendamentosHoje.length}</Text>
            <Text style={styles.metricaLabel}>Agendamentos</Text>
          </View>
          <View style={styles.metricaCard}>
            <Text style={styles.metricaValor}>—</Text>
            <Text style={styles.metricaLabel}>Na lista</Text>
          </View>
          <View style={styles.metricaCard}>
            <Text style={[styles.metricaValor, styles.metricaValorPequeno]}>{faturamentoFormatado}</Text>
            <Text style={styles.metricaLabel}>Estimado</Text>
          </View>
        </View>

        {/* ─── Agenda de hoje ─── */}
        <Text style={styles.secaoTitulo}>Agenda de hoje</Text>

        <View style={styles.atrasoBox}>
          <Text style={styles.atrasoTitulo}>Estou atrasado</Text>
          <View style={styles.atrasoOpcoes}>
            {[10, 15, 20, 30].map((minutos) => (
              <TouchableOpacity key={minutos} style={styles.atrasoBotao} onPress={() => definirAtraso(minutos)}>
                <Text style={styles.atrasoTexto}>+{minutos} min</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.normalizarBotao} onPress={() => definirAtraso(0)}>
              <Text style={styles.normalizarTexto}>Normalizar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {carregando && agendamentosHoje.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.vermelho} />
          </View>
        ) : agendamentosHoje.length === 0 ? (
          <View style={styles.vazio}>
            <Clock size={32} color={Colors.textoDesabilitado} />
            <Text style={styles.vazioTexto}>Nenhum agendamento para hoje.</Text>
          </View>
        ) : (
          agendamentosHoje.map((item) => (
            <CardAgendamento key={item.id} item={item} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    marginTop: 2,
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.md,
    paddingBottom: Spacing.giant,
  },
  metricasRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  metricaCard: {
    flex: 1,
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.card,
  },
  metricaValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  metricaValorPequeno: {
    fontSize: FontSize.bodyMd,
    color: Colors.verde,
  },
  metricaLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
  secaoTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  vazio: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  vazioTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  atrasoBox: { backgroundColor: Colors.superficie, borderRadius: Radii.md, padding: Spacing.md, gap: Spacing.sm },
  atrasoTitulo: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyMd, color: Colors.textoPrimario },
  atrasoOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  atrasoBotao: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radii.sm, backgroundColor: Colors.amarelo },
  atrasoTexto: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodySm, color: Colors.fundo },
  normalizarBotao: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radii.sm, borderWidth: 1, borderColor: Colors.verde },
  normalizarTexto: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodySm, color: Colors.verde },
  cardAgendamento: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cardHoraColuna: {
    alignItems: 'center',
    minWidth: 44,
    gap: 2,
  },
  cardHora: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  cardDuracao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  cardDivisorVertical: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.borda,
    alignSelf: 'stretch',
  },
  cardInfo: {
    flex: 1,
    gap: 5,
  },
  cardLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardClienteNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
    flex: 1,
  },
  cardServico: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    flex: 1,
  },
  cardPreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
  },
});
