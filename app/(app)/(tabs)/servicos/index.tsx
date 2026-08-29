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
import { identificarTipoServico } from '@/components/IlustracaoServico';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows, type ThemePalette } from '@/theme';
import { useBarbearia } from '@/contexts/BarbeariaContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function TelaServicos() {
  const router = useRouter();
  const { theme, isEscuro } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaServico>('todos');
  const [busca, setBusca] = useState('');
  const { barbearia, tema } = useBarbearia();
  const { todosServicos, carregando, recarregar } = useServicos('todos', barbearia?.id);

  function handleSelecionarServico(servico: Servico) {
    router.push({
      pathname: '/(app)/agendamento/horario',
      params: {
        servicoId: servico.id,
        servicoNome: servico.nome,
        servicoPreco: String(servico.preco),
        servicoDuracao: String(servico.duracao_minutos),
        barbeariaId: barbearia?.id || (servico as any).barbearia_id || '',
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
    const tipoServico = identificarTipoServico(undefined, item.nome, item.categoria);
    const itensCombo = item.descricao && item.descricao.includes('+')
      ? item.descricao.split('+').map((s) => s.trim()).filter(Boolean)
      : null;

    return (
      <TouchableOpacity
        style={[
          styles.cardServico,
          { backgroundColor: theme.superficie, borderColor: theme.borda },
          ehCombo && { borderColor: theme.ouro, backgroundColor: isEscuro ? '#181612' : '#FFFDF6' },
        ]}
        onPress={() => handleSelecionarServico(item)}
        activeOpacity={0.75}
      >
        {/* Ilustração com Moldura Externa Personalizada */}
        <IlustracaoServico
          id={item.id}
          nome={item.nome}
          categoria={item.categoria}
          imagemUrl={null}
          tipoPredefinido={tipoServico}
          corMoldura={item.cor_moldura || tema.frameColor || tema.primary}
          tamanho={58}
        />

        {/* Detalhes do Serviço */}
        <View style={styles.infoServico}>
          <View style={styles.linhaNome}>
            <Text style={[styles.nomeServico, { color: theme.textoPrimario }]}>{item.nome}</Text>
            {ehCombo && (
              <View style={[styles.badgeVip, { backgroundColor: theme.ouroTranslucido, borderColor: theme.bordaOuro }]}>
                <Sparkles size={9} color={theme.ouroTexto} />
                <Text style={[styles.badgeVipTexto, { color: theme.ouroTexto }]}>VIP</Text>
              </View>
            )}
          </View>

          {/* Tags de Itens Inclusos no Combo ou Descrição */}
          {itensCombo ? (
            <View style={styles.comboTagsContainer}>
              {itensCombo.map((tag, idx) => (
                <View key={idx} style={[styles.comboTagPill, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
                  <Text style={[styles.comboTagTexto, { color: theme.textoSecundario }]}>✓ {tag}</Text>
                </View>
              ))}
            </View>
          ) : item.descricao ? (
            <Text style={[styles.descricaoServico, { color: theme.textoSecundario }]}>
              {item.descricao}
            </Text>
          ) : null}
        </View>

        {/* Lado Direito: Preço e Botão */}
        <View style={styles.ladoDireito}>
          <Text style={[styles.precoServico, { color: theme.ouroTexto }]}>{precoFormatado}</Text>
          <View style={[styles.circuloSeta, { backgroundColor: theme.superficie2 }]}>
            <ChevronRight size={15} color={theme.textoPrimario} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.fundo }]} edges={['top']}>
      {/* Indicador de Etapas */}
      <IndicadorEtapas etapaAtual={1} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.subtituloBarbearia, { color: theme.ouroTexto }]}>CORTES & BARBA</Text>
        <Text style={[styles.titulo, { color: theme.textoPrimario }]}>Escolha seu estilo</Text>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.pesquisaContainer}>
        <View style={[styles.inputPesquisaWrapper, { backgroundColor: theme.superficie, borderColor: theme.borda }]}>
          <Search size={18} color={theme.textoSecundario} style={styles.iconePesquisa} />
          <TextInput
            style={[styles.inputPesquisa, { color: theme.textoPrimario }]}
            placeholder="Buscar corte, barba ou combo..."
            placeholderTextColor={theme.textoDesabilitado}
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} style={styles.btnLimpar}>
              <X size={16} color={theme.textoSecundario} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorias em Rolagem Horizontal */}
      <View style={[styles.categoriasContainer, { borderBottomColor: theme.borda }]}>
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
                style={[
                  styles.chipCategoria,
                  { backgroundColor: theme.superficie, borderColor: theme.borda },
                  ativa && { backgroundColor: theme.ouro, borderColor: theme.ouro },
                ]}
                onPress={() => setCategoriaAtiva(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiCategoria}>{cat.iconeEmoji}</Text>
                <Text style={[
                  styles.textoCategoria,
                  { color: theme.textoSecundario },
                  ativa && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
                ]}>
                  {cat.label}
                </Text>
                <View style={[
                  styles.badgeContagem,
                  { backgroundColor: theme.superficie2 },
                  ativa && { backgroundColor: 'rgba(0,0,0,0.18)' },
                ]}>
                  <Text
                    style={[
                      styles.textoContagem,
                      { color: theme.textoSecundario },
                      ativa && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
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
          <ActivityIndicator size="large" color={theme.ouro} />
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
              tintColor={theme.ouro}
              colors={[theme.ouro]}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Scissors size={48} color={theme.textoDesabilitado} />
              <Text style={[styles.vazioTitulo, { color: theme.textoPrimario }]}>Nenhum serviço encontrado</Text>
              <Text style={[styles.vazioSubtitulo, { color: theme.textoSecundario }]}>
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

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.fundo },
    header: {
      paddingHorizontal: Spacing.telaH,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.sm,
      gap: 2,
    },
    subtituloBarbearia: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.labelXs,
      color: theme.ouroTexto,
      letterSpacing: 1.5,
    },
    titulo: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.displayMd,
      color: theme.textoPrimario,
    },
    pesquisaContainer: {
      paddingHorizontal: Spacing.telaH,
      paddingBottom: Spacing.xs,
    },
    inputPesquisaWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.superficie,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: theme.borda,
      paddingHorizontal: Spacing.sm,
      height: 46,
      gap: Spacing.xs,
    },
    iconePesquisa: {
      marginRight: 2,
    },
    inputPesquisa: {
      flex: 1,
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      color: theme.textoPrimario,
      height: '100%',
    },
    btnLimpar: {
      padding: 4,
    },
    categoriasContainer: {
      paddingVertical: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.borda,
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
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
    },
    chipCategoriaAtivo: {
      backgroundColor: theme.ouro,
      borderColor: theme.ouro,
    },
    emojiCategoria: {
      fontSize: 13,
    },
    textoCategoria: {
      fontFamily: FontFamily.medium,
      fontSize: FontSize.bodySm,
      color: theme.textoSecundario,
    },
    textoCategoriaAtivo: {
      fontFamily: FontFamily.bold,
      color: theme.textoEscuroSobreOuro,
    },
    badgeContagem: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.full,
      backgroundColor: theme.superficie2,
    },
    badgeContagemAtiva: {
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
    },
    textoContagem: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
      color: theme.textoSecundario,
    },
    textoContagemAtiva: {
      color: theme.textoEscuroSobreOuro,
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
      backgroundColor: theme.superficie,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.borda,
      minHeight: 84,
      ...Shadows.card,
    },
    cardCombo: {
      borderColor: theme.bordaOuro,
      backgroundColor: theme.superficie,
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
      color: theme.textoPrimario,
    },
    badgeVip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: Radii.full,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    badgeVipTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 9,
      color: theme.ouroTexto,
      letterSpacing: 0.5,
    },
    descricaoServico: {
      fontFamily: FontFamily.regular,
      fontSize: 12,
      color: theme.textoSecundario,
      lineHeight: 16,
    },
    comboTagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 2,
    },
    comboTagPill: {
      backgroundColor: theme.ouroTranslucido,
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: Radii.sm,
      borderWidth: 1,
      borderColor: theme.bordaOuro,
    },
    comboTagTexto: {
      fontFamily: FontFamily.medium,
      fontSize: 10.5,
      color: theme.ouroTexto,
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
      color: theme.ouroTexto,
    },
    circuloSeta: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.superficie2,
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
      color: theme.textoPrimario,
    },
    vazioSubtitulo: {
      fontFamily: FontFamily.regular,
      fontSize: FontSize.bodyMd,
      color: theme.textoSecundario,
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
    },
  });
