import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Clock } from 'lucide-react-native';
import { Card, CabecalhoSecao, Botao } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii } from '@/theme';

import { usePerfil } from '@/hooks/usePerfil';

export default function TelaHome() {
  const router = useRouter();
  const { perfil, carregandoPerfil } = usePerfil();

  const primeiroNome = perfil?.nome_completo?.split(' ')[0] || 'Bem-vindo';

  return (
    <SafeAreaView style={styles.safe}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          {/* ASSET NECESSÁRIO: assets/logo-header.png (180×40) */}
          <Text style={styles.logoTexto}>BARBEARIA VIEIRA</Text>
        </View>
        <TouchableOpacity style={styles.sinoBotao} activeOpacity={0.7}>
          <Bell size={22} color={Colors.textoPrimario} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Boas-vindas ─────────────────────────────────────── */}
        <View style={styles.boasVindas}>
          <Text style={styles.boasVindasTitulo}>
            {carregandoPerfil ? 'Carregando...' : `Olá, ${primeiroNome}!`}
          </Text>
          <Text style={styles.boasVindasSubtitulo}>
            Agende seu horário e cuide do seu estilo.
          </Text>
        </View>

        {/* ─── Próximo horário (estado vazio) ─────────────────── */}
        <Card estilo={styles.cardProximo}>
          <View style={styles.cardVazioConteudo}>
            <Clock size={32} color={Colors.textoDesabilitado} />
            <Text style={styles.cardVazioTitulo}>Nenhum agendamento</Text>
            <Text style={styles.cardVazioSubtitulo}>
              Que tal marcar um horário agora?
            </Text>
          </View>
          <Botao
            label="Ver agenda"
            onPress={() => router.push('/(app)/agendamento/horario')}
            estiloContainer={styles.botaoVerAgenda}
          />
        </Card>

        {/* ─── Destaques ──────────────────────────────────────── */}
        <CabecalhoSecao titulo="Destaques" estilo={styles.cabecalhoSecao} />

        {/* Card de destaque — Pacote Fidelidade */}
        <TouchableOpacity activeOpacity={0.85}>
          <Card estilo={styles.cardDestaque}>
            <View style={styles.cardDestaqueConteudo}>
              {/* ASSET NECESSÁRIO: assets/mascote.png (200×200) */}
              <View style={styles.mascotePlaceholder}>
                <Text style={styles.mascotePlaceholderTexto}>IMG</Text>
              </View>
              <View style={styles.cardDestaqueTexto}>
                <Text style={styles.cardDestaqueTitulo}>Pacote Fidelidade</Text>
                <Text style={styles.cardDestaqueDescricao}>
                  10 cortes + 1 barba
                </Text>
                <Text style={styles.cardDestaquePreco}>R$ 280,00</Text>
              </View>
              <ChevronRight size={20} color={Colors.textoDesabilitado} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* ─── Link ver agenda completa ────────────────────────── */}
        <TouchableOpacity
          style={styles.linkAgenda}
          onPress={() => router.push('/(app)/(tabs)/agenda')}
          activeOpacity={0.7}
        >
          <Text style={styles.linkAgendaTexto}>Ver agenda completa</Text>
          <ChevronRight size={16} color={Colors.vermelho} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.headerV,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  logoPlaceholder: {},
  logoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
    letterSpacing: 1.5,
  },
  sinoBotao: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.telaH,
    gap: Spacing.md,
    paddingBottom: Spacing.giant,
  },
  boasVindas: { gap: 4 },
  boasVindasTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
  },
  boasVindasSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  cardProximo: { gap: Spacing.md },
  cardVazioConteudo: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  cardVazioTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  cardVazioSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
  },
  botaoVerAgenda: { width: '100%' },
  cabecalhoSecao: { marginTop: Spacing.xs },
  cardDestaque: { padding: 0, overflow: 'hidden' },
  cardDestaqueConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  mascotePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: Radii.sm,
    backgroundColor: Colors.superficie2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotePlaceholderTexto: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.labelXs,
    color: Colors.textoDesabilitado,
  },
  cardDestaqueTexto: { flex: 1, gap: 2 },
  cardDestaqueTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  cardDestaqueDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  cardDestaquePreco: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.ouro,
    marginTop: 4,
  },
  linkAgenda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  linkAgendaTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    color: Colors.vermelho,
  },
});
