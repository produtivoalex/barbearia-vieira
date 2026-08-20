import { useEffect } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { FontAssets } from '@/theme';
import { Colors } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';
import { usePerfil } from '@/hooks/usePerfil';


import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync();

function ControleRotas() {
  const { autenticado, carregando } = useAuth();
  const { perfil, carregandoPerfil } = usePerfil();
  const segments = useSegments();
  const router = useRouter();

  // Inicializa registro de push token quando autenticado
  usePushNotifications();

  useEffect(() => {
    // Listener de cliques em notificações push (deep linking)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const dados = response.notification.request.content.data as Record<string, any> | undefined;
      if (!dados) return;

      if (dados.tipo === 'agenda_aberta') {
        router.push('/(app)/agendamento/horario' as Href);
      } else if (dados.tipo === 'oferta_fila' && dados.ofertaId) {
        router.push({
          pathname: '/(app)/lista-espera/oferta' as any,
          params: { ofertaId: dados.ofertaId },
        });
      } else if (dados.tipo === 'lembrete' || dados.tipo === 'atraso') {
        router.push('/(app)/(tabs)/agenda' as Href);
      } else if (dados.tipo === 'barbeiro_sem_agenda') {
        router.push('/(app)/(barbeiro)/preparar-agenda' as Href);
      }
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    // Aguarda apenas o estado de autenticação; não bloqueia por perfil
    // (o perfil pode ainda não existir logo após o cadastro)
    if (carregando) return;

    const naAreaProtegida = segments[0] === '(app)';

    if (!autenticado && naAreaProtegida) {
      router.replace('/(pre-auth)');
    } else if (autenticado && !naAreaProtegida) {
      // Se o perfil ainda está carregando, aguarda sem bloquear
      if (carregandoPerfil) return;
      if (perfil?.role === 'barbeiro') {
        router.replace('/(app)/(barbeiro)/hoje' as Href);
      } else {
        router.replace('/(app)/(tabs)/index' as Href);
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
        <Stack.Screen name="(pre-auth)" />
        <Stack.Screen name="(app)" />
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
