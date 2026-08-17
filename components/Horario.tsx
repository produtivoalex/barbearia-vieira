import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

type EstadoHorario = 'disponivel' | 'selecionado' | 'indisponivel';

interface HorarioProps {
  horario: string;
  estado: EstadoHorario;
  onPress?: () => void;
  estilo?: ViewStyle;
}

export function Horario({ horario, estado, onPress, estilo }: HorarioProps) {
  const config = configPorEstado[estado];

  return (
    <TouchableOpacity
      style={[styles.base, config.container, estilo]}
      onPress={onPress}
      disabled={estado === 'indisponivel' || !onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.texto, config.texto]}>{horario}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    borderWidth: 1,
  },
  texto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyMd,
  } as TextStyle,
});

const configPorEstado: Record<
  EstadoHorario,
  { container: ViewStyle; texto: TextStyle }
> = {
  disponivel: {
    container: {
      backgroundColor: Colors.superficie2,
      borderColor: Colors.borda,
    },
    texto: { color: Colors.textoPrimario },
  },
  selecionado: {
    container: {
      backgroundColor: Colors.vermelho,
      borderColor: Colors.vermelho,
    },
    texto: { color: Colors.textoPrimario },
  },
  indisponivel: {
    container: {
      backgroundColor: Colors.transparente,
      borderColor: Colors.transparente,
      opacity: 0.3,
    },
    texto: { color: Colors.textoDesabilitado },
  },
};

export type { EstadoHorario };
