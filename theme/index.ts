/**
 * Theme — ponto de entrada único do design system
 * Uso: import { Theme, useTheme, TemaEscuro, TemaClaro } from '@/theme'
 */
export { Colors, TemaEscuro, TemaClaro } from './colors';
export type { CorChave, ThemePalette, TipoModoTema } from './colors';

export { FontFamily, FontAssets, FontSize, LineHeight } from './typography';
export type { FontSizeChave } from './typography';

export { Spacing } from './spacing';
export type { EspacamentoChave } from './spacing';

export { Radii } from './radii';
export type { RadiiChave } from './radii';

export { Shadows } from './shadows';
