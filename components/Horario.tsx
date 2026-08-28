import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

type EstadoHorario = 'disponivel' | 'selecionado' | 'indisponivel';

interface HorarioProps {
  horario: string;
  estado: EstadoHorario;
  onPress?: () => void;
  estilo?: ViewStyle;
}

export function Horario({ horario, estado, onPress, estilo }: HorarioProps) {
  const { theme } = useTheme();
  const config = {
    disponivel: { container: { backgroundColor: theme.superficie2, borderColor: theme.borda }, texto: { color: theme.textoPrimario } },
    selecionado: { container: { backgroundColor: theme.ouro, borderColor: theme.ouro }, texto: { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold } },
    indisponivel: { container: { backgroundColor: theme.transparente, borderColor: theme.transparente, opacity: 0.3 }, texto: { color: theme.textoDesabilitado } },
  }[estado];

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

export type { EstadoHorario };
