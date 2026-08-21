import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

interface IndicadorEtapasProps {
  etapaAtual: 1 | 2 | 3;
}

const ETAPAS = [
  { numero: 1, label: 'Serviço' },
  { numero: 2, label: 'Data e Horário' },
  { numero: 3, label: 'Confirmar' },
];

export function IndicadorEtapas({ etapaAtual }: IndicadorEtapasProps) {
  return (
    <View style={styles.container}>
      <View style={styles.linhaEtapas}>
        {ETAPAS.map((etapa) => {
          const ativa = etapa.numero === etapaAtual;
          const concluida = etapa.numero < etapaAtual;

          return (
            <View key={etapa.numero} style={styles.etapaItem}>
              <View
                style={[
                  styles.circuloNumero,
                  ativa && styles.circuloAtivo,
                  concluida && styles.circuloConcluido,
                ]}
              >
                <Text
                  style={[
                    styles.numeroTexto,
                    ativa && styles.numeroTextoAtivo,
                    concluida && styles.numeroTextoConcluido,
                  ]}
                >
                  {etapa.numero}
                </Text>
              </View>
              <Text
                style={[
                  styles.etapaLabel,
                  ativa && styles.etapaLabelAtivo,
                  concluida && styles.etapaLabelConcluido,
                ]}
              >
                {etapa.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.telaH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaEtapas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  etapaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circuloNumero: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloAtivo: {
    backgroundColor: Colors.vermelho,
  },
  circuloConcluido: {
    backgroundColor: '#383838',
  },
  numeroTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#8E8E93',
  },
  numeroTextoAtivo: {
    color: '#FFFFFF',
  },
  numeroTextoConcluido: {
    color: '#CCCCCC',
  },
  etapaLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: '#8E8E93',
  },
  etapaLabelAtivo: {
    fontFamily: FontFamily.semiBold,
    color: '#FFFFFF',
  },
  etapaLabelConcluido: {
    color: '#BBBBBB',
  },
});

