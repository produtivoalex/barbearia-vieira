/**
 * Raios de borda — Barbearia Vieira
 * Extraídos do mockup: chips (4), inputs (8), cards (12-16), botões (24), pills (999)
 */
export const Radii = {
  /** 6 — micro-badges, tags */
  xs: 6,
  /** 10 — inputs, chips compactos */
  sm: 10,
  /** 14 — cards secundários, botões padrão */
  md: 14,
  /** 20 — cards principais, bottom sheets */
  lg: 20,
  /** 24 — hero cards, botões de destaque */
  xl: 24,
  /** 32 — containers VIP */
  xxl: 32,
  /** 9999 — pills completamente arredondadas */
  full: 9999,
} as const;

export type RadiiChave = keyof typeof Radii;
