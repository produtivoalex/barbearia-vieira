import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, Clock, Scissors, ChevronRight } from 'lucide-react-native';
import { ControleSegmentado } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { useMeusAgendamentos, type AgendamentoCompleto } from '@/hooks/useMeusAgendamentos';

const LABELS_STATUS: Record<AgendamentoCompleto['status'], { texto: string; cor: string }> = {
  pendente:   { texto: 'Pendente',   cor: Colors.amarelo },
  confirmado: { texto: 'Confirmado', cor: Colors.verde },
  cancelado:  { texto: 'Cancelado',  cor: Colors.erro },
  concluido:  { texto: 'Concluído',  cor: Colors.textoSecundario },
};

export default function TelaAgenda() {
  const router = useRouter();
  const [aba, setAba] = useState<'proximos' | 'historico'>('proximos');
  const { proximos, historico, carregando, recarregar } = useMeusAgendamentos();

  const dados = aba === 'proximos' ? proximos : historico;

  function formatarDataHora(isoString: string) {
    const d = new Date(isoString);
    const dia  = String(d.getDate()).padStart(2, '0');
    const mes  = String(d.getMonth() + 1).padStart(2, '0');
    const ano  = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    return { data: `${dia}/${mes}/${ano}`, hora: `${hora}:${min}` };
  }

  function renderItem({ item }: { item: AgendamentoCompleto }) {
    const { data, hora } = formatarDataHora(item.data_hora);
    const statusConfig = LABELS_STATUS[item.status];
    const precoFormatado = Number(item.servico.preco).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return (
      <View style={styles.card}>
        {/* Linha superior: data + badge de status */}
        <View style={styles.cardTopo}>
          <View style={styles.dataLinha}>
            <Calendar size={14} color={Colors.textoSecundario} />
            <Text style={styles.dataTexto}>{data}</Text>
            <Clock size={14} color={Colors.textoSecundario} />
            <Text style={styles.dataTexto}>{hora}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${statusConfig.cor}22` }]}>
            <Text style={[styles.badgeTexto, { color: statusConfig.cor }]}>
              {statusConfig.texto}
            </Text>
          </View>
        </View>

        <View style={styles.divisor} />

        {/* Linha inferior: serviço + barbeiro + preço */}
        <View style={styles.cardCorpo}>
          <View style={styles.iconeServico}>
            <Scissors size={18} color={Colors.ouro} />
          </View>
          <View style={styles.infoServico}>
            <Text style={styles.nomeServico}>{item.servico.nome}</Text>
            <Text style={styles.nomeBarbeiro}>
              {item.barbeiro.nome_completo || 'Barbearia Vieira'}
            </Text>
          </View>
          <Text style={styles.preco}>{precoFormatado}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Meus agendamentos</Text>
      </View>

      {/* Controle segmentado */}
      <View style={styles.controleContainer}>
        <ControleSegmentado
          opcoes={[
            { label: 'Próximos', valor: 'proximos' },
            { label: 'Histórico', valor: 'historico' },
          ]}
          valorAtivo={aba}
          onChange={(v) => setAba(v as 'proximos' | 'historico')}
        />
      </View>

      {carregando && dados.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.vermelho} />
        </View>
      ) : (
        <FlatList
          data={dados}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={carregando}
              onRefresh={recarregar}
              tintColor={Colors.vermelho}
              colors={[Colors.vermelho]}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Calendar size={48} color={Colors.textoDesabilitado} />
              <Text style={styles.vazioTitulo}>
                {aba === 'proximos' ? 'Nenhum agendamento próximo' : 'Nenhum histórico'}
              </Text>
              <Text style={styles.vazioSubtitulo}>
                {aba === 'proximos'
                  ? 'Seus próximos agendamentos aparecerão aqui.'
                  : 'Seus agendamentos anteriores aparecerão aqui.'}
              </Text>
              {aba === 'proximos' && (
                <TouchableOpacity
                  style={styles.botaoAgendar}
                  onPress={() => router.push('/(app)/(tabs)/servicos')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.botaoAgendarTexto}>Agendar agora</Text>
                  <ChevronRight size={16} color={Colors.vermelho} />
                </TouchableOpacity>
              )}
            </View>
          }
          contentContainerStyle={styles.lista}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  controleContainer: {
    paddingHorizontal: Spacing.telaH,
    paddingBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    flexGrow: 1,
    paddingHorizontal: Spacing.telaH,
    paddingBottom: Spacing.giant,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dataTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  badgeTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
  },
  divisor: {
    height: 1,
    backgroundColor: Colors.borda,
  },
  cardCorpo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconeServico: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoServico: {
    flex: 1,
    gap: 3,
  },
  nomeServico: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  nomeBarbeiro: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  preco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.ouro,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.giant,
  },
  vazioTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  vazioSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
    maxWidth: 280,
  },
  botaoAgendar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  botaoAgendarTexto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.vermelho,
  },
});
