import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing } from '@/theme';

interface OpcaoControle {
  label: string;
  valor: string;
}

interface ControleSegmentadoProps {
  opcoes: OpcaoControle[];
  valorAtivo: string;
  onChange: (valor: string) => void;
}

export function ControleSegmentado({
  opcoes,
  valorAtivo,
  onChange,
}: ControleSegmentadoProps) {
  return (
    <View style={styles.container}>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valorAtivo;
        return (
          <TouchableOpacity
            key={opcao.valor}
            style={[styles.opcao, ativo && styles.opcaoAtiva]}
            onPress={() => onChange(opcao.valor)}
            activeOpacity={0.7}
          >
            <Text style={[styles.texto, ativo && styles.textoAtivo]}>
              {opcao.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.superficie2,
    borderRadius: Radii.full,
    padding: 3,
  },
  opcao: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    alignItems: 'center',
  },
  opcaoAtiva: {
    backgroundColor: Colors.vermelho,
  },
  texto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
    color: Colors.textoSecundario,
  },
  textoAtivo: {
    fontFamily: FontFamily.semiBold,
    color: Colors.textoPrimario,
  },
});
