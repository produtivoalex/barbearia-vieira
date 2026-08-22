import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

// Necessário para que o WebBrowser processe o retorno e feche a janela corretamente
WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '';

let googleConfigured = false;
function configurarGoogleNativo() {
  if (googleConfigured) return;
  try {
    GoogleSignin.configure({
      webClientId: webClientId || undefined,
      iosClientId: iosClientId || undefined,
      scopes: ['profile', 'email'],
    });
    googleConfigured = true;
  } catch (err) {
    console.warn('[SocialAuth] GoogleSignin.configure aviso:', err);
  }
}

/**
 * Retorna a URI de redirecionamento oficial configurada para o app:
 * - No Expo Go: utiliza o proxy HTTPS oficial "https://auth.expo.io/@owner/slug"
 *   o que elimina completamente o diálogo do Android de "Abrir com...".
 * - No APK / Dev Client instalado: utiliza "barbearia-vieira://auth/callback".
 */
export function obterRedirectUri(): string {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGo) {
    return AuthSession.makeRedirectUri();
  }

  return AuthSession.makeRedirectUri({
    scheme: 'barbearia-vieira',
    path: 'auth/callback',
  });
}

/**
 * Analisa a URL de retorno e extrai todos os parâmetros tanto da query string (?key=val)
 * quanto do hash fragment (#key=val), garantindo compatibilidade com fluxos PKCE e Implicit.
 */
export function extrairParametrosUrl(url: string): Record<string, string> {
  const parametros: Record<string, string> = {};

  if (!url) return parametros;

  try {
    // 1. Analisa query params (?key=val)
    if (url.includes('?')) {
      const queryString = url.split('?')[1].split('#')[0];
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        parametros[key] = value;
      });
    }

    // 2. Analisa hash params (#key=val)
    if (url.includes('#')) {
      const hashString = url.split('#')[1];
      const hashParams = new URLSearchParams(hashString);
      hashParams.forEach((value, key) => {
        parametros[key] = value;
      });
    }
  } catch (err) {
    console.warn('[SocialAuth] Erro ao extrair parâmetros da URL:', err);
  }

  return parametros;
}

/**
 * Processa uma URL recebida de redirecionamento OAuth, estabelecendo a sessão no Supabase
 * ou lançando uma exceção amigável caso haja erro do provedor.
 */
export async function processarUrlAuth(url: string): Promise<Session | null> {
  const params = extrairParametrosUrl(url);

  // 1. Tratamento de erro explícito do provedor OAuth ou Supabase
  if (params.error_description || params.error) {
    const desc = params.error_description || params.error;
    const msgLimpa = decodeURIComponent(desc.replace(/\+/g, ' '));
    throw new Error(msgLimpa);
  }

  // 2. Fluxo Implicit / Hash (#access_token=...&refresh_token=...)
  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  // 3. Fluxo PKCE (?code=...)
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  // Caso nenhum parâmetro esperado seja encontrado
  return null;
}

/**
 * Inicia o fluxo de autenticação OAuth com o Google ou Apple.
 * - No APK nativo / Development Build: executa estritamente o Google Sign-In 100% nativo com Google Play Services.
 * - No Expo Go: executa via WebBrowser/OAuth proxy.
 */
export async function iniciarLoginSocial(provider: 'google' | 'apple'): Promise<Session | null> {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // 1. FLUXO 100% NATIVO PARA GOOGLE (Em Development Build / APK nativo)
  if (provider === 'google' && !isExpoGo) {
    const currentWebClientId =
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ||
      '298975067668-h0qn3g0p009vjd4mdtlpkqo7t5e03e68.apps.googleusercontent.com';

    try {
      GoogleSignin.configure({
        webClientId: currentWebClientId,
        offlineAccess: false,
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Limpa qualquer sessão travada anterior do Google Play Services
      try {
        await GoogleSignin.signOut();
      } catch (_) {}

      const response = await GoogleSignin.signIn();

      // Suporta response.data.idToken (v13+) ou response.idToken
      const idToken = (response as any)?.data?.idToken || (response as any)?.idToken;

      if (!idToken) {
        throw new Error('O Google Play Services não retornou o idToken.');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        throw error;
      }

      return data.session;
    } catch (nativeError: any) {
      if (nativeError?.code === statusCodes.SIGN_IN_CANCELLED) {
        // Usuário fechou o menu do Google Play Services
        return null;
      }
      if (nativeError?.code === statusCodes.IN_PROGRESS) {
        return null;
      }
      if (nativeError?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services não disponível ou desatualizado no seu aparelho.');
      }

      // Detalha o erro 10 com as 3 causas exatas do Google Play Services
      if (
        nativeError?.code === '10' ||
        nativeError?.code === 10 ||
        nativeError?.message?.includes('10') ||
        nativeError?.message?.includes('DEVELOPER_ERROR')
      ) {
        throw new Error(
          'Erro 10 (DEVELOPER_ERROR) do Google:\n\n1. Verifique se o pacote na credencial Android é exatamente: com.barbearia.vieira\n2. Verifique se a credencial Android foi criada no MESMO projeto do Web Client ID (projeto: 298975067668)\n3. Confirme se o SHA-1 cadastrado é o da Keystore do EAS.'
        );
      }

      throw nativeError;
    }
  }

  // 2. FLUXO VIA NAVEGADOR SEGURO (Apenas quando executado dentro do Expo Go)
  const redirectUrl = obterRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error('Não foi possível gerar a URL de login.');
  }

  let sessionRecebida: Session | null = null;

  // Listener para capturar o retorno de deep link do sistema operacional
  const subscription = Linking.addEventListener('url', async (event) => {
    try {
      if (event.url && (event.url.includes('access_token') || event.url.includes('code='))) {
        WebBrowser.dismissAuthSession();
        const s = await processarUrlAuth(event.url);
        if (s) sessionRecebida = s;
      }
    } catch (e) {
      console.warn('[SocialAuth] Erro no listener de URL:', e);
    }
  });

  try {
    // Abre a janela de autenticação segura do sistema operacional
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, {
      showInRecents: true,
    });

    if (result.type === 'success' && result.url) {
      const session = await processarUrlAuth(result.url);
      return session;
    }

    if (sessionRecebida) {
      return sessionRecebida;
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return null;
    }

    return null;
  } finally {
    subscription.remove();
  }
}
