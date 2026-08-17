import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, Radii } from '@/theme';

type StatusAgendamento = 'confirmado' | 'concluido' | 'cancelado' | 'pendente';

interface BadgeStatusProps {
  status: StatusAgendamento;
  estilo?: ViewStyle;
}

const configStatus: Record<StatusAgendamento, { label: string; cor: string; corFundo: string }> = {
  confirmado: {
    label: 'Confirmado',
    cor: Colors.verde,
    corFundo: Colors.verdeClaro,
  },
  concluido: {
    label: 'Concluído',
    cor: Colors.textoSecundario,
    corFundo: Colors.superficie2,
  },
  cancelado: {
    label: 'Cancelado',
    cor: Colors.erro,
    corFundo: Colors.erroClaro,
  },
  pendente: {
    label: 'Pendente',
    cor: Colors.amarelo,
    corFundo: Colors.amareloClaro,
  },
};

export function BadgeStatus({ status, estilo }: BadgeStatusProps) {
  const config = configStatus[status];
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
