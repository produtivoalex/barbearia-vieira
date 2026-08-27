import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Retorna o Web Client ID configurado no .env
 */
function obterGoogleWebClientId(): string {
  const chave = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  return (chave || '').trim();
}

/**
 * Inicia o login social oficial com o Google via token nativo (Google Play Services)
 * conectado diretamente ao Supabase com signInWithIdToken.
 */
export async function iniciarLoginGoogle(): Promise<Session | null> {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const webClientId = obterGoogleWebClientId();

  if (!webClientId) {
    throw new Error(
      'Chave do Google não configurada!\n\nAdicione EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no arquivo .env com o Web Client ID gerado no Google Cloud Console.'
    );
  }

  if (isExpoGo) {
    throw new Error(
      'O Google Sign-In nativo requer o aplicativo de desenvolvimento (Development Build).\n\nAbra o app "Na Régua" instalado no seu celular.'
    );
  }

  try {
    // 1. Configura o SDK do Google Sign-In
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });

    // 2. Valida disponibilidade dos serviços Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 3. Executa o diálogo nativo do Google
    const response = await GoogleSignin.signIn();

    // No v14+, o cancelamento pode vir como type: 'cancelled'
    if ((response as any)?.type === 'cancelled') {
      return null;
    }

    // Extrai o idToken retornado pelo Google Play Services
    const idToken = response.data?.idToken || (response as any).idToken;

    if (!idToken) {
      throw new Error(
        'Não foi possível obter o token de identificação (idToken) do Google. Verifique a configuração do projeto.'
      );
    }

    // 4. Autentica no Supabase usando o idToken nativo
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      throw error;
    }

    return data.session;
  } catch (error: any) {
    // Usuário cancelou o login
    if (error?.code === statusCodes.SIGN_IN_CANCELLED || error?.message?.includes('cancelled')) {
      return null;
    }

    // Operação já em andamento
    if (error?.code === statusCodes.IN_PROGRESS) {
      return null;
    }

    // Google Play Services indisponível
    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services indisponível ou desatualizado no dispositivo.');
    }

    // DEVELOPER_ERROR (código 10) - Erro clássico de credencial Android / SHA-1
    if (error?.code === 10 || error?.code === '10' || error?.message?.includes('DEVELOPER_ERROR')) {
      throw new Error(
        'Erro de configuração do Google (DEVELOPER_ERROR 10):\n\n' +
        '1. Certifique-se de que a credencial Android no Google Cloud Console possui:\n' +
        '   - Nome do pacote: com.barbearia.vieira\n' +
        '   - Impressão digital SHA-1 da Keystore do EAS\n' +
        '2. O Web Client ID configurado no .env deve pertencer exatamente ao MESMO projeto do Google Cloud Console.\n' +
        '3. O provedor Google no Supabase deve estar ativo com o mesmo Web Client ID e Client Secret.'
      );
    }

    throw new Error(error?.message || 'Falha ao autenticar com o Google.');
  }
}
