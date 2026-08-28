import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';

/**
 * Tela raiz — aparece enquanto o estado de autenticação é verificado.
 * O ControleRotas em _layout.tsx faz o redirecionamento correto logo
 * que `carregando` vira false. Sem este arquivo, Expo Router exibiria
 * "Unmatched Route" para a rota raiz "/" do Expo Go.
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.ouro} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
