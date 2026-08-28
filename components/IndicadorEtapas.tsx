import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily, FontSize, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface IndicadorEtapasProps {
  etapaAtual: 1 | 2 | 3;
}

const ETAPAS = [
  { numero: 1, label: 'Serviço' },
  { numero: 2, label: 'Data e Horário' },
  { numero: 3, label: 'Confirmar' },
];

export function IndicadorEtapas({ etapaAtual }: IndicadorEtapasProps) {
  const { theme, isEscuro } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.linhaEtapas}>
        {ETAPAS.map((etapa) => {
          const ativa = etapa.numero === etapaAtual;
          const concluida = etapa.numero < etapaAtual;

          const bgCirculo = ativa
            ? theme.ouro
            : concluida
            ? theme.ouroTranslucido
            : isEscuro
            ? theme.borda
            : '#E4E4E7';

          const corNumero = ativa
            ? theme.textoEscuroSobreOuro
            : concluida
            ? theme.ouroTexto
            : theme.textoSecundario;

          const corLabel = ativa
            ? theme.ouroTexto
            : concluida
            ? theme.textoPrimario
            : theme.textoSecundario;

          return (
            <View key={etapa.numero} style={styles.etapaItem}>
              <View style={[styles.circuloNumero, { backgroundColor: bgCirculo }]}>
                <Text style={[styles.numeroTexto, { color: corNumero }]}>
                  {etapa.numero}
                </Text>
              </View>
              <Text
                style={[
                  styles.etapaLabel,
                  { color: corLabel },
                  ativa && styles.etapaLabelAtivo,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  etapaLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
  },
  etapaLabelAtivo: {
    fontFamily: FontFamily.bold,
  },
});

