import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { Botao } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';

export default function TelaOfertaListaEspera() {
  const router = useRouter();
  const [segundos, setSegundos] = useState(298); // ~4:58

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Ícone estrela dourada */}
        <View style={styles.iconeContainer}>
          <Star size={72} color={Colors.ouro} strokeWidth={1.5} fill={Colors.ouro} />
        </View>

        <Text style={styles.titulo}>Horário disponível!</Text>
        <Text style={styles.subtitulo}>
          Temos um horário disponível para você.
        </Text>

        {/* Card de detalhes */}
        <View style={styles.card}>
          <View style={styles.detalheRow}>
            <Text style={styles.detalheLabel}>Quando</Text>
            <Text style={styles.detalheValor}>Hoje • 18:00</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.detalheRow}>
            <Text style={styles.detalheLabel}>Serviço</Text>
            <Text style={styles.detalheValor}>Corte + Barba</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.detalheRow}>
            <Text style={styles.detalheLabel}>Barbeiro</Text>
            <Text style={styles.detalheValor}>com João</Text>
          </View>
        </View>

        {/* Timer de expiração */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Expira em</Text>
          <Text style={styles.timerValor}>{tempoFormatado}</Text>
        </View>

        {/* Ações */}
        <Botao
          label="Confirmar horário"
          onPress={() => router.replace('/(app)/agendamento/confirmacao')}
          estiloContainer={styles.botao}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  scroll: {
    flexGrow: 1,
    padding: Spacing.telaH,
    paddingBottom: Spacing.giant,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  iconeContainer: { marginBottom: Spacing.xs },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  detalheRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detalheLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  detalheValor: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
    color: Colors.textoPrimario,
  },
  divisor: { height: 1, backgroundColor: Colors.borda },
  timerContainer: {
    alignItems: 'center',
    gap: 4,
  },
  timerLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  timerValor: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.ouro,
  },
  botao: { width: '100%' },
});
