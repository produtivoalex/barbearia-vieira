import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Botao, Chip } from '@/components';
import { Colors, FontFamily, FontSize, Spacing, Radii, Shadows } from '@/theme';

export default function TelaListaEspera() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVoltar}>
          <ChevronLeft size={24} color={Colors.textoPrimario} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Lista de espera</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Ícone e explicação */}
        <View style={styles.iconeContainer}>
          <Clock size={64} color={Colors.ouro} strokeWidth={1.5} />
        </View>

        <Text style={styles.textoTitulo}>Entre na lista de espera</Text>
        <Text style={styles.textoDescricao}>
          Avisaremos quando houver um horário disponível para você.
        </Text>

        {/* Serviço de interesse */}
        <View style={styles.servicoContainer}>
          <Text style={styles.servicoLabel}>Serviço de interesse</Text>
          <TouchableOpacity style={styles.servicoSeletor} activeOpacity={0.7}>
            <Text style={styles.servicoTexto}>Corte + Barba</Text>
            <ChevronRight size={18} color={Colors.textoSecundario} />
          </TouchableOpacity>
        </View>

        <Botao
          label="Entrar na lista"
          onPress={() => {
            // TODO: integrar com Supabase
          }}
          estiloContainer={styles.botao}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.fundo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.headerV,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  btnVoltar: { width: 40, alignItems: 'flex-start' },
  titulo: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.headingSm,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.telaH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingBottom: Spacing.giant,
  },
  iconeContainer: { marginBottom: Spacing.xs },
  textoTitulo: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
    textAlign: 'center',
  },
  textoDescricao: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: -Spacing.xs,
  },
  servicoContainer: {
    width: '100%',
    gap: Spacing.xs,
  },
  servicoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
  },
  servicoSeletor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.superficie,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  servicoTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
  },
  botao: { width: '100%', marginTop: Spacing.xs },
});
