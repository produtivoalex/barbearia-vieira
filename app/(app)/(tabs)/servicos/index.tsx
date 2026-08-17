import React from 'react';
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
import { Scissors, ChevronRight, Clock } from 'lucide-react-native';
import { useServicos, type Servico } from '@/hooks/useServicos';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';

export default function TelaServicos() {
  const router = useRouter();
  const { servicos, carregando, recarregar } = useServicos();

  function handleSelecionarServico(servico: Servico) {
    router.push({
      pathname: '/(app)/agendamento/horario',
      params: {
        servicoId: servico.id,
        servicoNome: servico.nome,
        servicoPreco: String(servico.preco),
        servicoDuracao: String(servico.duracao_minutos),
      },
    });
  }

  function renderServico({ item }: { item: Servico }) {
    const precoFormatado = Number(item.preco).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return (
      <TouchableOpacity
        style={styles.cardServico}
        onPress={() => handleSelecionarServico(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconeServico}>
          <Scissors size={20} color={Colors.ouro} />
        </View>

        <View style={styles.infoServico}>
          <Text style={styles.nomeServico}>{item.nome}</Text>
          {item.descricao && (
            <Text style={styles.descricaoServico} numberOfLines={2}>
              {item.descricao}
            </Text>
          )}
          <View style={styles.detalhesLinha}>
            <Clock size={14} color={Colors.textoSecundario} />
            <Text style={styles.duracaoServico}>{item.duracao_minutos} min</Text>
          </View>
        </View>

        <View style={styles.ladoDireito}>
          <Text style={styles.precoServico}>{precoFormatado}</Text>
          <ChevronRight size={18} color={Colors.textoDesabilitado} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Escolha o serviço</Text>
      </View>

      {carregando && servicos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.vermelho} />
        </View>
      ) : (
        <FlatList
          data={servicos}
          keyExtractor={(item) => item.id}
          renderItem={renderServico}
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
              <Scissors size={48} color={Colors.textoDesabilitado} />
              <Text style={styles.vazioTitulo}>Nenhum serviço disponível</Text>
              <Text style={styles.vazioSubtitulo}>
                Não encontramos serviços ativos no momento. Puxe para atualizar.
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
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
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
  cardServico: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  iconeServico: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoServico: {
    flex: 1,
    gap: 4,
  },
  nomeServico: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  descricaoServico: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  detalhesLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  duracaoServico: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  ladoDireito: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  precoServico: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
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
});
