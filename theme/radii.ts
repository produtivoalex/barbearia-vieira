/**
 * Raios de borda — Barbearia Vieira
 * Extraídos do mockup: chips (4), inputs (8), cards (12-16), botões (24), pills (999)
 */
export const Radii = {
  /** 4 — chips, badges */
  xs: 4,
  /** 8 — inputs, itens de lista */
  sm: 8,
  /** 12 — cards */
  md: 12,
  /** 16 — cards de destaque, bottom sheets */
  lg: 16,
  /** 24 — botões primários */
  xl: 24,
  /** 999 — pills completamente arredondadas */
  full: 999,
} as const;

export type RadiiChave = keyof typeof Radii;
