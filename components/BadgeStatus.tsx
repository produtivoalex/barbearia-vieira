import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FontFamily, FontSize, Radii } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

type StatusAgendamento = 'confirmado' | 'concluido' | 'cancelado' | 'pendente';

interface BadgeStatusProps {
  status: StatusAgendamento;
  estilo?: ViewStyle;
}

export function BadgeStatus({ status, estilo }: BadgeStatusProps) {
  const { theme } = useTheme();

  const configStatus: Record<StatusAgendamento, { label: string; cor: string; corFundo: string }> = {
    confirmado: {
      label: 'Confirmado',
      cor: theme.verde,
      corFundo: theme.verdeClaro,
    },
    concluido: {
      label: 'Concluído',
      cor: theme.textoSecundario,
      corFundo: theme.superficie2,
    },
    cancelado: {
      label: 'Cancelado',
      cor: theme.erro,
      corFundo: theme.erroClaro,
    },
    pendente: {
      label: 'Pendente',
      cor: theme.amarelo,
      corFundo: theme.amareloClaro,
    },
  };

  const config = configStatus[status] || configStatus.confirmado;
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: config.corFundo },
        estilo,
      ]}
    >
      <Text style={[styles.texto, { color: config.cor }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.xs,
    alignSelf: 'flex-start',
  },
  texto: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.labelXs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export type { StatusAgendamento };
