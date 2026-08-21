import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Scissors, X } from 'lucide-react-native';
import { useServicos, type Servico } from '@/hooks/useServicos';
import { IndicadorEtapas } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii } from '@/theme';

export default function TelaServicos() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const { todosServicos, carregando, recarregar } = useServicos();

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

  // Filtro por busca
  const servicosFiltrados = useMemo(() => {
    if (!busca.trim()) return todosServicos;
    const termo = busca.toLowerCase();
    return todosServicos.filter((servico) => {
      const nomeMatch = servico.nome.toLowerCase().includes(termo);
      const descMatch = (servico.descricao || '').toLowerCase().includes(termo);
      return nomeMatch || descMatch;
    });
  }, [todosServicos, busca]);

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
        <View style={styles.cardCabecalho}>
          <Text style={styles.nomeServico}>{item.nome}</Text>
          <Text style={styles.precoServico}>{precoFormatado}</Text>
        </View>

        {item.descricao ? (
          <Text style={styles.descricaoServico} numberOfLines={2}>
            {item.descricao}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Indicador de Etapas: 1 Serviço > 2 Data > 3 Horário > 4 Confirmar */}
      <IndicadorEtapas etapaAtual={1} />

      {/* Header com Título */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Escolha o serviço</Text>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.pesquisaContainer}>
        <View style={styles.inputPesquisaWrapper}>
          <Search size={18} color={Colors.textoSecundario} style={styles.iconePesquisa} />
          <TextInput
            style={styles.inputPesquisa}
            placeholder="Buscar serviço..."
            placeholderTextColor={Colors.textoDesabilitado}
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.btnLimpar}>
              <X size={16} color={Colors.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista dos 14 Serviços Originais */}
      {carregando && todosServicos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.vermelho} />
        </View>
      ) : (
        <FlatList
          data={servicosFiltrados}
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
              <Text style={styles.vazioTitulo}>Nenhum serviço encontrado</Text>
              <Text style={styles.vazioSubtitulo}>
                {busca ? `Nenhum resultado para "${busca}".` : 'Nenhum serviço disponível.'}
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
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: '#FFFFFF',
  },
  pesquisaContainer: {
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.xs,
  },
  inputPesquisaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181A',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#262629',
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  iconePesquisa: {
    marginRight: Spacing.xs,
  },
  inputPesquisa: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
    height: '100%',
  },
  btnLimpar: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    flexGrow: 1,
    paddingHorizontal: Spacing.telaH,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.giant,
    gap: Spacing.sm,
  },
  cardServico: {
    backgroundColor: '#18181A',
    borderRadius: Radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#262629',
    gap: 4,
  },
  cardCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  nomeServico: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
    flex: 1,
  },
  precoServico: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: '#FFFFFF',
  },
  descricaoServico: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
    lineHeight: 18,
    marginTop: 2,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  vazioTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: '#FFFFFF',
  },
  vazioSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
});
