/**
 * Paleta de cores — Sistema Dual Theme (Dark Obsidian & Light Luxury)
 * Steve Jobs Aesthetic: Obsidian & Gold (Dark) / Pearl White, Charcoal & Gold (Light)
 */

export interface ThemePalette {
  // ─── Primárias (Identidade Dourada) ──────────────────────────
  ouro: string;
  ouroClaro: string;
  ouroEscuro: string;
  ouroVibrante: string;
  ouroTranslucido: string;
  ouroGlow: string;
  ouroTexto: string; // Ouro de alto contraste garantido para leitura

  /** Mapeamento de compatibilidade */
  vermelho: string;
  vermelhoEscuro: string;
  vermelhoClaro: string;

  // ─── Backgrounds & Superfícies ──────────────────────────────
  fundo: string;
  superficie: string;
  superficie2: string;
  superficie3: string;
  borda: string;
  bordaOuro: string;
  bordaDestaque: string;

  // ─── Tipografia ─────────────────────────────────────────────
  textoPrimario: string;
  textoSecundario: string;
  textoDesabilitado: string;
  textoEscuroSobreOuro: string;

  // ─── Destaque / Estado ──────────────────────────────────────
  azulBarbeiro: string;
  verde: string;
  verdeClaro: string;
  amarelo: string;
  amareloClaro: string;
  erro: string;
  erroClaro: string;

  // ─── Utilitários ────────────────────────────────────────────
  transparente: string;
  branco: string;
  preto: string;
}

export const TemaEscuro: ThemePalette = {
  // Primárias
  ouro: '#CBA14A',
  ouroClaro: '#E5C06E',
  ouroEscuro: '#A88030',
  ouroVibrante: '#F3A818',
  ouroTranslucido: 'rgba(203, 161, 74, 0.14)',
  ouroGlow: 'rgba(203, 161, 74, 0.28)',
  ouroTexto: '#CBA14A',

  vermelho: '#CBA14A',
  vermelhoEscuro: '#A88030',
  vermelhoClaro: '#E5C06E',

  // Superfícies (Obsidian Dark)
  fundo: '#09090B',
  superficie: '#121215',
  superficie2: '#1C1C22',
  superficie3: '#262630',
  borda: 'rgba(255, 255, 255, 0.08)',
  bordaOuro: 'rgba(203, 161, 74, 0.35)',
  bordaDestaque: 'rgba(255, 255, 255, 0.15)',

  // Tipografia
  textoPrimario: '#F5F5F7',
  textoSecundario: '#9898A2',
  textoDesabilitado: '#585864',
  textoEscuroSobreOuro: '#09090B',

  // Estados
  azulBarbeiro: '#0A84FF',
  verde: '#30D158',
  verdeClaro: 'rgba(48, 209, 88, 0.15)',
  amarelo: '#FFD60A',
  amareloClaro: 'rgba(255, 214, 10, 0.15)',
  erro: '#FF453A',
  erroClaro: 'rgba(255, 69, 58, 0.15)',

  // Utilitários
  transparente: 'transparent',
  branco: '#FFFFFF',
  preto: '#000000',
};

export const TemaClaro: ThemePalette = {
  // Primárias: dourado quente, legível e com aparência premium sobre superfícies claras.
  ouro: '#C5963A',
  ouroClaro: '#D6AE5B',
  ouroEscuro: '#9A6A08',
  ouroVibrante: '#B7791F',
  ouroTranslucido: 'rgba(197, 150, 58, 0.14)',
  ouroGlow: 'rgba(197, 150, 58, 0.22)',
  ouroTexto: '#815B09',

  vermelho: '#CBA14A',
  vermelhoEscuro: '#855800',
  vermelhoClaro: '#B8860B',

  // Superfícies: marfim muito suave no fundo, branco limpo nos cards.
  fundo: '#F7F6F2',
  superficie: '#FFFFFF',
  superficie2: '#F1EFE9',
  superficie3: '#E7E2D7',
  borda: '#E5E1D8',
  bordaOuro: 'rgba(154, 106, 8, 0.32)',
  bordaDestaque: '#D6D0C4',

  // Tipografia (Pitch Charcoal profundo para contraste 16:1)
  textoPrimario: '#1C1B19',
  textoSecundario: '#625F58',
  textoDesabilitado: '#9C978D',
  textoEscuroSobreOuro: '#09090B',

  // Estados
  azulBarbeiro: '#007AFF',
  verde: '#237A3B',
  verdeClaro: 'rgba(35, 122, 59, 0.12)',
  amarelo: '#A36108',
  amareloClaro: 'rgba(163, 97, 8, 0.12)',
  erro: '#C5362E',
  erroClaro: 'rgba(197, 54, 46, 0.12)',

  // Utilitários
  transparente: 'transparent',
  branco: '#FFFFFF',
  preto: '#000000',
};

/** Padrão exportado para manter compatibilidade com estilos estáticos existentes */
// Compatibilidade para estilos legados. O novo código deve usar useTheme().
// O claro é o fallback visual mais seguro para telas antigas durante a migração.
export const Colors = TemaClaro;
export type CorChave = keyof typeof Colors;
export type TipoModoTema = 'escuro' | 'claro' | 'sistema';
