/**
 * Sombras — Barbearia Vieira
 * Dark mode: sombras escuras intensas para separar superfícies
 */
import { Platform } from 'react-native';

export const Shadows = {
  /** Sem sombra */
  none: {},

  /** Card padrão — separação sutil */
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),

  /** Card elevado — modais, bottom sheets */
  cardElevado: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.8,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),

  /** Botão primário — brilho vermelho sutil */
  botaoPrimario: Platform.select({
    ios: {
      shadowColor: '#8B0013',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
