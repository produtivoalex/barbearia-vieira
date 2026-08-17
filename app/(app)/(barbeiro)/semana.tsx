import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scissors, User } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type AgendamentoBarbeiro } from '@/hooks/usePainelBarbeiro';

const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatarDataCurta(iso: string) {
  const d = new Date(iso);
  return `${DIAS_CURTOS[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

function formatarHora(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TelaBarbeiroSemana() {
  const { agendamentosSemana, carregando, recarregar } = usePainelBarbeiro();

  // Agrupa agendamentos por dia (chave: YYYY-MM-DD)
  const porDia = useMemo(() => {
    const mapa = new Map<string, AgendamentoBarbeiro[]>();
    for (const ag of agendamentosSemana) {
      const chave = ag.data_hora.slice(0, 10);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(ag);
    }
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [agendamentosSemana]);

  // Calcula intervalo legível da semana
  const { labelSemana } = useMemo(() => {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const diffSeg = diaSemana === 0 ? -6 : 1 - diaSemana;
    const segunda = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + diffSeg);
    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);

    const fmtData = (d: Date) => `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`;
    return { labelSemana: `${fmtData(segunda)} – ${fmtData(domingo)}` };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Semana</Text>
        <Text style={styles.subtitulo}>{labelSemana}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.vermelho} colors={[Colors.vermelho]} />
        }
      >
        {carregando && agendamentosSemana.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.vermelho} />
          </View>
        ) : porDia.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>Sem agendamentos nesta semana.</Text>
          </View>
        ) : (
          porDia.map(([chave, itens]) => (
            <View key={chave} style={styles.grupodia}>
              {/* Cabeçalho do dia */}
              <View style={styles.diaCabecalho}>
                <Text style={styles.diaNome}>{formatarDataCurta(itens[0].data_hora)}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeTexto}>{itens.length} ag.</Text>
                </View>
              </View>

              {/* Cards do dia */}
              {itens.map((item) => (
                <View key={item.id} style={styles.cardItem}>
                  <Text style={styles.cardHora}>{formatarHora(item.data_hora)}</Text>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardLinha}>
                      <User size={13} color={Colors.textoSecundario} />
                      <Text style={styles.cardCliente} numberOfLines={1}>
                        {item.cliente.nome_completo || 'Cliente'}
                      </Text>
                    </View>
                    <View style={styles.cardLinha}>
                      <Scissors size={13} color={Colors.ouro} />
                      <Text style={styles.cardServico} numberOfLines={1}>{item.servico.nome}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDuracao}>{item.servico.duracao_minutos} min</Text>
                </View>
              ))}
            </View>
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
  loadingContainer: {
    paddingTop: Spacing.giant,
    alignItems: 'center',
  },
  scroll: {
    padding: Spacing.telaH,
    gap: Spacing.lg,
    paddingBottom: Spacing.giant,
  },
  vazio: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  vazioTexto: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  grupodia: {
    gap: Spacing.xs,
  },
  diaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  diaNome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  badge: {
    backgroundColor: Colors.vermelho,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  badgeTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.textoPrimario,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cardHora: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
    minWidth: 44,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardCliente: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoPrimario,
    flex: 1,
  },
  cardServico: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    flex: 1,
  },
  cardDuracao: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
});
