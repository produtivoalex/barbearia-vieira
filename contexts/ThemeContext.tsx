import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { TemaEscuro, TemaClaro, type ThemePalette, type TipoModoTema } from '@/theme/colors';

const STORAGE_KEY_TEMA = '@barbearia/modo-tema';

interface ThemeContextData {
  modoTema: TipoModoTema;
  isEscuro: boolean;
  theme: ThemePalette;
  colors: ThemePalette; // alias para conveniência
  setModoTema: (modo: TipoModoTema) => Promise<void>;
  alternarTema: () => Promise<void>;
  carregandoTema: boolean;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const schemeOS = useColorScheme(); // 'dark' | 'light' | null
  // O primeiro contato do produto é claro; a preferência do usuário continua soberana.
  const [modoTema, setModoTemaState] = useState<TipoModoTema>('claro');
  const [carregandoTema, setCarregandoTema] = useState(true);

  // Carrega preferência persistida
  useEffect(() => {
    async function carregarPreferencia() {
      try {
        const salvo = await AsyncStorage.getItem(STORAGE_KEY_TEMA);
        if (salvo === 'claro' || salvo === 'escuro' || salvo === 'sistema') {
          setModoTemaState(salvo);
        }
      } catch (err) {
        console.log('[ThemeProvider] Erro ao carregar tema:', err);
      } finally {
        setCarregandoTema(false);
      }
    }
    carregarPreferencia();
  }, []);

  const setModoTema = useCallback(async (novoModo: TipoModoTema) => {
    setModoTemaState(novoModo);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TEMA, novoModo);
    } catch (err) {
      console.log('[ThemeProvider] Erro ao salvar tema:', err);
    }
  }, []);

  // Determina se o tema ativo é escuro
  const isEscuro = useMemo(() => {
    if (modoTema === 'sistema') {
      return schemeOS !== 'light';
    }
    return modoTema === 'escuro';
  }, [modoTema, schemeOS]);

  const alternarTema = useCallback(async () => {
    const proximo = isEscuro ? 'claro' : 'escuro';
    await setModoTema(proximo);
  }, [isEscuro, setModoTema]);

  // Paleta de cores ativa
  const theme = useMemo(() => {
    return isEscuro ? TemaEscuro : TemaClaro;
  }, [isEscuro]);

  const value = useMemo(
    () => ({
      modoTema,
      isEscuro,
      theme,
      colors: theme,
      setModoTema,
      alternarTema,
      carregandoTema,
    }),
    [modoTema, isEscuro, theme, setModoTema, alternarTema, carregandoTema]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextData {
  const context = useContext(ThemeContext);
  if (!context || !context.theme) {
    // Fallback caso chamado fora do provider
    return {
      modoTema: 'claro',
      isEscuro: false,
      theme: TemaClaro,
      colors: TemaClaro,
      setModoTema: async () => {},
      alternarTema: async () => {},
      carregandoTema: false,
    };
  }
  return context;
}
