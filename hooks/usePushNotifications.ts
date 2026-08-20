import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

// Detecta Expo Go: push remoto foi removido no SDK 53+
// storeClient = Expo Go | bare = build proprio
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configura o comportamento de notificações em foreground
// Chamado apenas uma vez no nível de módulo (seguro para Expo Go)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export function usePushNotifications() {
  const { session } = useAuth();
  const usuarioId = session?.user?.id;
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissaoStatus, setPermissaoStatus] = useState<Notifications.PermissionStatus | null>(null);

  const registrarTokenNoBanco = useCallback(
    async (token: string) => {
      if (!usuarioId) return;
      try {
        const plataforma =
          Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
        await supabase.from('notification_tokens').upsert(
          {
            usuario_id: usuarioId,
            token,
            plataforma,
            ativo: true,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: 'usuario_id,token' }
        );
      } catch (err) {
        console.warn('[usePushNotifications] Erro ao salvar token:', err);
      }
    },
    [usuarioId]
  );

  const solicitarPermissao = useCallback(async (): Promise<string | null> => {
    // No Expo Go push remoto não está disponível desde SDK 53 — falha silenciosa
    if (isExpoGo) {
      console.info(
        '[usePushNotifications] Expo Go detectado. Push remoto indisponível — use um Development Build para testar notificações.'
      );
      return null;
    }

    try {
      // Cria canal de notificação no Android (necessário para push funcionar)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Barbearia Vieira',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D32F2F',
        });
      }

      // Verifica/solicita permissão
      const { status: statusAtual } = await Notifications.getPermissionsAsync();
      let statusFinal = statusAtual;

      if (statusAtual !== Notifications.PermissionStatus.GRANTED) {
        const { status } = await Notifications.requestPermissionsAsync();
        statusFinal = status;
      }

      setPermissaoStatus(statusFinal);

      if (statusFinal !== Notifications.PermissionStatus.GRANTED) {
        return null;
      }

      // Obtém Expo Push Token
      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      if (tokenData?.data) {
        setExpoPushToken(tokenData.data);
        await registrarTokenNoBanco(tokenData.data);
        return tokenData.data;
      }
    } catch (err) {
      console.warn('[usePushNotifications] Não foi possível obter push token:', err);
    }
    return null;
  }, [registrarTokenNoBanco]);

  useEffect(() => {
    // Pula completamente no Expo Go
    if (!usuarioId || isExpoGo) return;

    // Se já tem permissão, registra o token automaticamente ao autenticar
    Notifications.getPermissionsAsync()
      .then(async ({ status }) => {
        setPermissaoStatus(status);
        if (status === Notifications.PermissionStatus.GRANTED) {
          const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
          if (tokenData?.data) {
            setExpoPushToken(tokenData.data);
            await registrarTokenNoBanco(tokenData.data);
          }
        }
      })
      .catch((err) => console.warn('[usePushNotifications] Erro ao verificar permissão:', err));
  }, [usuarioId, registrarTokenNoBanco]);

  return {
    expoPushToken,
    permissaoStatus,
    // No Expo Go, push não disponível — nunca mostra como "com permissão"
    temPermissao: !isExpoGo && permissaoStatus === Notifications.PermissionStatus.GRANTED,
    estaNoExpoGo: isExpoGo,
    solicitarPermissao,
  };
}
