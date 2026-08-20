import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii } from '@/theme';

interface IndicadorEtapasProps {
  etapaAtual: 1 | 2 | 3 | 4;
}

const ETAPAS = [
  { numero: 1, label: 'Serviço' },
  { numero: 2, label: 'Data' },
  { numero: 3, label: 'Horário' },
  { numero: 4, label: 'Confirmar' },
];

export function IndicadorEtapas({ etapaAtual }: IndicadorEtapasProps) {
  return (
    <View style={styles.container}>
      <View style={styles.linhaEtapas}>
        {ETAPAS.map((etapa, index) => {
          const concluida = etapa.numero < etapaAtual;
          const ativa = etapa.numero === etapaAtual;

          return (
            <React.Fragment key={etapa.numero}>
              {/* Conector entre etapas */}
              {index > 0 && (
                <View
                  style={[
                    styles.conector,
                    (concluida || ativa) && styles.conectorAtivo,
                  ]}
                />
              )}

              {/* Pílula / Botão da Etapa */}
              <View
                style={[
                  styles.etapaPill,
                  ativa && styles.etapaPillAtiva,
                  concluida && styles.etapaPillConcluida,
                ]}
              >
                <View
                  style={[
                    styles.numeroCirculo,
                    ativa && styles.numeroCirculoAtivo,
                    concluida && styles.numeroCirculoConcluido,
                  ]}
                >
                  {concluida ? (
                    <Check size={12} color={Colors.branco} strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.numeroTexto,
                        ativa && styles.numeroTextoAtivo,
                      ]}
                    >
                      {etapa.numero}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.labelTexto,
                    ativa && styles.labelTextoAtivo,
                    concluida && styles.labelTextoConcluido,
                  ]}
                >
                  {etapa.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.telaH,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.superficie,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borda,
  },
  linhaEtapas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.borda,
    marginHorizontal: 4,
  },
  conectorAtivo: {
    backgroundColor: Colors.vermelho,
  },
  etapaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.superficie2,
  },
  etapaPillAtiva: {
    backgroundColor: Colors.vermelho,
  },
  etapaPillConcluida: {
    backgroundColor: '#2A181A',
  },
  numeroCirculo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroCirculoAtivo: {
    backgroundColor: Colors.branco,
  },
  numeroCirculoConcluido: {
    backgroundColor: Colors.vermelho,
  },
  numeroTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.textoSecundario,
  },
  numeroTextoAtivo: {
    color: Colors.vermelho,
  },
  labelTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.labelXs,
    color: Colors.textoSecundario,
  },
  labelTextoAtivo: {
    fontFamily: FontFamily.bold,
    color: Colors.branco,
  },
  labelTextoConcluido: {
    color: Colors.textoPrimario,
  },
});
