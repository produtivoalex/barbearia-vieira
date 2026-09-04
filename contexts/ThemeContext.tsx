import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { TemaEscuro, TemaClaro, type ThemePalette, type TipoModoTema } from '@/theme/colors';
import { useBarbearia, type TemaTenant } from '@/contexts/BarbeariaContext';

const STORAGE_KEY_TEMA = '@barbearia/modo-tema';

function hexParaRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(203, 161, 74, ${alpha})`;
  let limpo = hex.replace('#', '').trim();
  if (limpo.length === 3) {
    limpo = limpo
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (limpo.length !== 6) return `rgba(203, 161, 74, ${alpha})`;
  const r = parseInt(limpo.substring(0, 2), 16);
  const g = parseInt(limpo.substring(2, 4), 16);
  const b = parseInt(limpo.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(203, 161, 74, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function gerarPaletaTenant(
  base: ThemePalette,
  temaTenant?: TemaTenant | null,
  isEscuro: boolean = true
): ThemePalette {
  if (!temaTenant || !temaTenant.primary) {
    return base;
  }

  const primary = temaTenant.primary;
  const accent = temaTenant.accent || primary;
  const card = temaTenant.card;
  const background = temaTenant.background;
  const text = temaTenant.text;
  const secondaryText = temaTenant.secondaryText;
  const border = temaTenant.border;

  // Se estiver no Modo Claro, preserva a base clara (fundos, cards e textos pretos/cinzas com alto contraste)
  // e injeta a marca personalizada da barbearia apenas nos destaques (ouro, bordas, botões)
  if (!isEscuro) {
    return {
      ...base,
      ouro: primary,
      ouroClaro: accent,
      ouroEscuro: primary,
      ouroVibrante: accent,
      ouroTexto: primary,
      ouroTranslucido: hexParaRgba(primary, 0.12),
      ouroGlow: hexParaRgba(primary, 0.22),
      bordaOuro: hexParaRgba(primary, 0.32),
      bordaDestaque: hexParaRgba(primary, 0.25),
    };
  }

  return {
    ...base,
    // Cores de marca / destaque que adaptam o app todo
    ouro: primary,
    ouroClaro: accent,
    ouroEscuro: primary,
    ouroVibrante: accent,
    ouroTexto: primary,
    ouroTranslucido: hexParaRgba(primary, 0.16),
    ouroGlow: hexParaRgba(primary, 0.30),
    bordaOuro: hexParaRgba(primary, 0.40),

    // Cores de superfície & fundo no modo escuro
    fundo: background || base.fundo,
    superficie: card || base.superficie,
    superficie2: card ? hexParaRgba(card, 0.85) : base.superficie2,
    superficie3: card ? hexParaRgba(card, 0.70) : base.superficie3,
    borda: border || (card ? hexParaRgba(primary, 0.12) : base.borda),
    bordaDestaque: hexParaRgba(primary, 0.25),

    // Tipografia
    textoPrimario: text || base.textoPrimario,
    textoSecundario: secondaryText || base.textoSecundario,
  };
}

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
  const { barbearia } = useBarbearia();
  const temaTenant = barbearia?.tema as TemaTenant | undefined;

  // Por padrão, segue a preferência visual do sistema operacional do smartphone (Modo Escuro / Claro)
  const [modoTema, setModoTemaState] = useState<TipoModoTema>('sistema');
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
      return schemeOS === 'dark';
    }
    return modoTema === 'escuro';
  }, [modoTema, schemeOS]);

  const alternarTema = useCallback(async () => {
    const proximo = isEscuro ? 'claro' : 'escuro';
    await setModoTema(proximo);
  }, [isEscuro, setModoTema]);

  // Paleta de cores ativa com injeção em tempo real das preferências da barbearia
  const theme = useMemo(() => {
    const base = isEscuro ? TemaEscuro : TemaClaro;
    return gerarPaletaTenant(base, temaTenant, isEscuro);
  }, [isEscuro, temaTenant]);

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
      modoTema: 'sistema',
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

