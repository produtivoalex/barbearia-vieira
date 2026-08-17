/**
 * Espaçamento — Barbearia Vieira
 * Escala base 4: todos os valores são múltiplos de 4
 */
export const Spacing = {
  /** 4 */
  xxs: 4,
  /** 8 */
  xs: 8,
  /** 12 */
  sm: 12,
  /** 16 */
  md: 16,
  /** 20 */
  lg: 20,
  /** 24 */
  xl: 24,
  /** 32 */
  xxl: 32,
  /** 40 */
  xxxl: 40,
  /** 48 */
  huge: 48,
  /** 64 */
  giant: 64,

  // Atalhos semânticos
  /** Padding horizontal padrão das telas */
  telaH: 20,
  /** Padding vertical do header */
  headerV: 12,
  /** Espaço entre cards em listas */
  entreCards: 12,
  /** Padding interno dos cards */
  cardInterno: 16,
} as const;

export type EspacamentoChave = keyof typeof Spacing;
