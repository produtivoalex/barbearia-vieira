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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  Clock,
  ChevronRight,
  Sparkles,
  Scissors,
  X,
} from 'lucide-react-native';
import {
  useServicos,
  type Servico,
  type CategoriaServico,
  CATEGORIAS_CONFIG,
  deduzirCategoria,
} from '@/hooks/useServicos';
import { IndicadorEtapas, IlustracaoServico } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';

export default function TelaServicos() {
  const router = useRouter();
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaServico>('todos');
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

  // Contagem por categoria
  const contagemPorCategoria = useMemo(() => {
    const mapa: Record<CategoriaServico, number> = {
      todos: todosServicos.length,
      cortes: 0,
      combos: 0,
      barba: 0,
      sobrancelha: 0,
      limpeza_de_pele: 0,
    };
    todosServicos.forEach((s) => {
      const cat = s.categoria || deduzirCategoria(s.nome);
      if (mapa[cat] !== undefined) {
        mapa[cat] += 1;
      }
    });
    return mapa;
  }, [todosServicos]);

  // Filtro composto: Categoria + Busca
  const servicosFiltrados = useMemo(() => {
    return todosServicos.filter((servico) => {
      const cat = servico.categoria || deduzirCategoria(servico.nome);
      const bateCategoria = categoriaAtiva === 'todos' || cat === categoriaAtiva;

      if (!bateCategoria) return false;
      if (!busca.trim()) return true;

      const termo = busca.toLowerCase();
      const nomeMatch = servico.nome.toLowerCase().includes(termo);
      const descMatch = (servico.descricao || '').toLowerCase().includes(termo);
      return nomeMatch || descMatch;
    });
  }, [todosServicos, categoriaAtiva, busca]);

  function renderServico({ item }: { item: Servico }) {
    const precoFormatado = Number(item.preco).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const ehCombo = (item.categoria || deduzirCategoria(item.nome)) === 'combos';
    const itensCombo = item.descricao && item.descricao.includes('+')
      ? item.descricao.split('+').map((s) => s.trim()).filter(Boolean)
      : null;

    return (
      <TouchableOpacity
        style={[styles.cardServico, ehCombo && styles.cardCombo]}
        onPress={() => handleSelecionarServico(item)}
        activeOpacity={0.75}
      >
        {/* Ilustração Exclusiva e Padronizada do Serviço */}
        <IlustracaoServico
          id={item.id}
          nome={item.nome}
          categoria={item.categoria}
          tamanho={58}
        />

        {/* Detalhes do Serviço */}
        <View style={styles.infoServico}>
          <View style={styles.linhaNome}>
            <Text style={styles.nomeServico}>{item.nome}</Text>
            {ehCombo && (
              <View style={styles.badgeVip}>
                <Sparkles size={9} color={Colors.ouro} />
                <Text style={styles.badgeVipTexto}>VIP</Text>
              </View>
            )}
          </View>

          {/* Tags de Itens Inclusos no Combo ou Descrição */}
          {itensCombo ? (
            <View style={styles.comboTagsContainer}>
              {itensCombo.map((tag, idx) => (
                <View key={idx} style={styles.comboTagPill}>
                  <Text style={styles.comboTagTexto}>✓ {tag}</Text>
                </View>
              ))}
            </View>
          ) : item.descricao ? (
            <Text style={styles.descricaoServico}>
              {item.descricao}
            </Text>
          ) : null}
        </View>

        {/* Lado Direito: Preço e Botão */}
        <View style={styles.ladoDireito}>
          <Text style={styles.precoServico}>{precoFormatado}</Text>
          <View style={styles.circuloSeta}>
            <ChevronRight size={15} color={Colors.textoPrimario} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Indicador de Etapas */}
      <IndicadorEtapas etapaAtual={1} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subtituloBarbearia}>CATÁLOGO COMPLETO</Text>
        <Text style={styles.titulo}>Escolha o serviço</Text>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.pesquisaContainer}>
        <View style={styles.inputPesquisaWrapper}>
          <Search size={18} color={Colors.textoSecundario} style={styles.iconePesquisa} />
          <TextInput
            style={styles.inputPesquisa}
            placeholder="Buscar corte, barba ou combo..."
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

      {/* Categorias em Rolagem Horizontal */}
      <View style={styles.categoriasContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriasScroll}
        >
          {CATEGORIAS_CONFIG.map((cat) => {
            const ativa = categoriaAtiva === cat.id;
            const qtd = contagemPorCategoria[cat.id] || 0;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chipCategoria, ativa && styles.chipCategoriaAtivo]}
                onPress={() => setCategoriaAtiva(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiCategoria}>{cat.iconeEmoji}</Text>
                <Text style={[styles.textoCategoria, ativa && styles.textoCategoriaAtivo]}>
                  {cat.label}
                </Text>
                <View style={[styles.badgeContagem, ativa && styles.badgeContagemAtiva]}>
                  <Text
                    style={[
                      styles.textoContagem,
                      ativa && styles.textoContagemAtiva,
                    ]}
                  >
                    {qtd}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Serviços */}
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
                {busca
                  ? `Nenhum resultado para "${busca}". Tente outro termo.`
                  : 'Nenhum serviço disponível nesta categoria.'}
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  subtituloBarbearia: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
    letterSpacing: 2,
    marginBottom: 2,
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  pesquisaContainer: {
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.xs,
  },
  inputPesquisaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borda,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  iconePesquisa: {
    marginRight: Spacing.xs,
  },
  inputPesquisa: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
    height: '100%',
  },
  btnLimpar: {
    padding: 4,
  },
  categoriasContainer: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  categoriasScroll: {
    paddingHorizontal: Spacing.telaH,
    gap: Spacing.xs,
  },
  chipCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  chipCategoriaAtivo: {
    backgroundColor: Colors.vermelho,
    borderColor: Colors.vermelhoClaro,
  },
  emojiCategoria: {
    fontSize: 13,
  },
  textoCategoria: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  textoCategoriaAtivo: {
    fontFamily: FontFamily.bold,
    color: Colors.branco,
  },
  badgeContagem: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie2,
  },
  badgeContagemAtiva: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  textoContagem: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.textoSecundario,
  },
  textoContagemAtiva: {
    color: Colors.branco,
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
    backgroundColor: '#151518',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#242428',
    minHeight: 84,
    ...Shadows.card,
  },
  cardCombo: {
    borderColor: 'rgba(203, 161, 74, 0.35)',
    backgroundColor: '#181412',
  },
  infoServico: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  linhaNome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  nomeServico: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  badgeVip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(203, 161, 74, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.ouro,
  },
  badgeVipTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: Colors.ouro,
    letterSpacing: 0.5,
  },
  descricaoServico: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  comboTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  comboTagPill: {
    backgroundColor: 'rgba(203, 161, 74, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.28)',
  },
  comboTagTexto: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Colors.ouroClaro,
  },
  detalhesLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  ladoDireito: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    minWidth: 70,
  },
  precoServico: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: Colors.ouro,
  },
  circuloSeta: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#202024',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: Colors.textoPrimario,
  },
  vazioSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

