import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Phone } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';
import { usePainelBarbeiro, type ClienteResumo } from '@/hooks/usePainelBarbeiro';
import { Avatar } from '@/components';

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatarDataCurta(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function TelaClientes() {
  const { clientes, carregando, recarregar } = usePainelBarbeiro();

  function renderCliente({ item }: { item: ClienteResumo }) {
    return (
      <View style={styles.card}>
        <Avatar nome={item.nome_completo || 'C'} tamanho={44} />
        <View style={styles.info}>
          <Text style={styles.nome} numberOfLines={1}>
            {item.nome_completo || 'Cliente sem nome'}
          </Text>
          <Text style={styles.detalhe}>
            {item.totalAgendamentos} {item.totalAgendamentos === 1 ? 'visita' : 'visitas'}
            {' · '}último: {formatarDataCurta(item.ultimoAtendimento)}
          </Text>
          {item.telefone && (
            <View style={styles.telefoneLinha}>
              <Phone size={12} color={Colors.textoSecundario} />
              <Text style={styles.telefone}>{item.telefone}</Text>
            </View>
          )}
        </View>
        <View style={styles.visitasBadge}>
          <Text style={styles.visitasBadgeTexto}>{item.totalAgendamentos}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Clientes</Text>
        {!carregando && (
          <Text style={styles.contagem}>{clientes.length} no total</Text>
        )}
      </View>

      {carregando && clientes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.vermelho} />
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id}
          renderItem={renderCliente}
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
              <Users size={48} color={Colors.textoDesabilitado} />
              <Text style={styles.vazioTitulo}>Nenhum cliente ainda</Text>
              <Text style={styles.vazioSubtitulo}>
                Os clientes aparecerão aqui quando houver agendamentos concluídos.
              </Text>
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  contagem: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    flexGrow: 1,
    padding: Spacing.telaH,
    paddingBottom: Spacing.giant,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nome: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  detalhe: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  telefoneLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telefone: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  visitasBadge: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.vermelhoClaro + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitasBadgeTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.vermelhoClaro,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.telaH,
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
});
