/**
 * Tipografia — Barbearia Vieira
 * Fonte: Montserrat (Regular 400, Medium 500, SemiBold 600, Bold 700)
 * Referência: mockup-barbearia.png → painel "TIPOGRAFIA"
 */

export const FontFamily = {
  regular: 'Montserrat-Regular',
  medium: 'Montserrat-Medium',
  semiBold: 'Montserrat-SemiBold',
  bold: 'Montserrat-Bold',
} as const;

/**
 * Arquivos .ttf embarcados em assets/fonts/
 * Carregados via expo-font no _layout.tsx raiz
 */
export const FontAssets = {
  'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
  'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
  'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
  'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
} as const;

export const FontSize = {
  /** Título grande: Barbearia Vieira heading, nome do app */
  displayLg: 28,
  /** Título de tela principal */
  displayMd: 22,
  /** Seções, cards de destaque */
  headingSm: 18,
  /** Corpo principal */
  bodyLg: 16,
  /** Corpo secundário, subtítulos */
  bodyMd: 14,
  /** Labels, chips, captions */
  bodySm: 12,
  /** Badges, tab bar labels */
  labelXs: 10,
} as const;

export const LineHeight = {
  displayLg: 36,
  displayMd: 30,
  headingSm: 26,
  bodyLg: 24,
  bodyMd: 22,
  bodySm: 18,
  labelXs: 14,
} as const;

export type FontSizeChave = keyof typeof FontSize;
