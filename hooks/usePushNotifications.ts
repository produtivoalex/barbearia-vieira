import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

// Configuração do comportamento de notificações recebidas com o app em primeiro plano
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

// Detecta se está rodando no Expo Go (push remoto removido no SDK 53+)
function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

export function usePushNotifications() {
  const { session } = useAuth();
  const usuarioId = session?.user?.id;
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissaoStatus, setPermissaoStatus] = useState<Notifications.PermissionStatus | null>(null);

  const registrarTokenNoBanco = useCallback(
    async (token: string) => {
      if (!usuarioId) return;
      try {
        const plataforma = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
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
      } catch (error) {
        console.warn('Erro ao salvar token de notificação:', error);
      }
    },
    [usuarioId]
  );

  const solicitarPermissao = useCallback(async () => {
    // Push remoto não disponível no Expo Go desde SDK 53 — silencioso, sem crash
    if (isExpoGo()) {
      console.info('[usePushNotifications] Expo Go detectado: push remoto indisponível. Use um Development Build.');
      return null;
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Barbearia Vieira',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D32F2F',
        });
      }

      const { status: statusExistente } = await Notifications.getPermissionsAsync();
      let statusFinal = statusExistente;

      if (statusExistente !== Notifications.PermissionStatus.GRANTED) {
        const { status } = await Notifications.requestPermissionsAsync();
        statusFinal = status;
      }

      setPermissaoStatus(statusFinal);

      if (statusFinal !== Notifications.PermissionStatus.GRANTED) {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      if (tokenData?.data) {
        setExpoPushToken(tokenData.data);
        await registrarTokenNoBanco(tokenData.data);
        return tokenData.data;
      }
    } catch (err) {
      console.warn('Não foi possível obter push token:', err);
    }
    return null;
  }, [registrarTokenNoBanco]);

  useEffect(() => {
    if (!usuarioId || isExpoGo()) return;

    // Verifica permissão existente ao autenticar
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
      .catch((err) => console.warn('Erro ao verificar permissão de notificação:', err));
  }, [usuarioId, registrarTokenNoBanco]);

  return {
    expoPushToken,
    permissaoStatus,
    // No Expo Go, considera sem permissão (push indisponível)
    temPermissao: !isExpoGo() && permissaoStatus === Notifications.PermissionStatus.GRANTED,
    solicitarPermissao,
  };
}
