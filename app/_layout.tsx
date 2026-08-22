import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { FontAssets } from '@/theme';
import { Colors } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';
import { usePerfil } from '@/hooks/usePerfil';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync();

function ControleRotas() {
  const { autenticado, carregando } = useAuth();
  const { perfil, carregandoPerfil } = usePerfil();
  const segments = useSegments();
  const router = useRouter();

  // Inicializa registro de push token (silencioso no Expo Go)
  usePushNotifications();

  useEffect(() => {
    // Listener de cliques em notificações push (deep linking)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const dados = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (!dados) return;

      try {
        if (dados.tipo === 'agenda_aberta') {
          router.push('/(app)/agendamento/horario');
        } else if (dados.tipo === 'oferta_fila' && dados.ofertaId) {
          router.push({
            pathname: '/(app)/lista-espera/oferta',
            params: { ofertaId: dados.ofertaId as string },
          });
        } else if (dados.tipo === 'lembrete' || dados.tipo === 'atraso') {
          router.push('/(app)/(tabs)/agenda');
        } else if (dados.tipo === 'barbeiro_sem_agenda') {
          router.push('/(app)/(barbeiro)/preparar-agenda');
        }
      } catch (err) {
        console.warn('[NotificationListener] erro de navegação:', err);
      }
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    // Aguarda autenticação carregar antes de qualquer redirecionamento
    if (carregando) return;

    const grupoAtual = segments[0] as string | undefined;
    const naAreaApp = grupoAtual === '(app)';
    const naPreAuth = grupoAtual === '(pre-auth)';
    const naCallback = grupoAtual === 'auth';

    if (!autenticado) {
      // Se não autenticado e não está na área de pré-autenticação nem em auth/callback, redireciona para login
      if (!naPreAuth && !naCallback) {
        router.replace('/(pre-auth)');
      }
    } else {
      // Se autenticado, aguarda carregar perfil para saber o role
      if (carregandoPerfil) return;

      // Se ainda não entrou na área (app) ou está na raiz / pre-auth / callback
      if (!naAreaApp) {
        if (perfil?.role === 'barbeiro') {
          router.replace('/(app)/(barbeiro)/hoje');
        } else {
          router.replace('/(app)/(tabs)');
        }
      }
    }
  }, [autenticado, carregando, perfil, carregandoPerfil, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor={Colors.fundo} />
      <ControleRotas />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(pre-auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.fundo,
  },
});
