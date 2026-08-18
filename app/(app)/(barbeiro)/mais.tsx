import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoreHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';

export default function TelaMais() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mais</Text>
      </View>
      <View style={styles.vazio}>
        <TouchableOpacity style={styles.opcao} onPress={() => router.push('/(app)/(barbeiro)/preparar-agenda')}>
          <Text style={styles.opcaoTexto}>Preparar próxima agenda</Text>
        </TouchableOpacity>
        <MoreHorizontal size={48} color={Colors.textoDesabilitado} />
        <Text style={styles.vazioTitulo}>Em breve</Text>
        <Text style={styles.vazioSubtitulo}>
          Configurações e opções adicionais aparecerão aqui.
        </Text>
      </View>
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
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.telaH,
  },
  vazioTitulo: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    marginTop: Spacing.xs,
  },
  vazioSubtitulo: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
    textAlign: 'center',
    maxWidth: 280,
  },
  opcao: { width: '100%', padding: Spacing.md, borderRadius: 12, backgroundColor: Colors.superficie, marginBottom: Spacing.xl },
  opcaoTexto: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodyLg, color: Colors.textoPrimario, textAlign: 'center' },
});
