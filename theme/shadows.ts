/**
 * Sombras — separação suave para superfícies claras, sem aparência pesada.
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
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }),

  /** Card elevado — modais, bottom sheets */
  cardElevado: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    android: { elevation: 5 },
    default: {},
  }),

  /** Botão primário — brilho dourado elegante */
  botaoPrimario: Platform.select({
    ios: {
      shadowColor: '#CBA14A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
    },
    android: { elevation: 5 },
    default: {},
  }),
} as const;
