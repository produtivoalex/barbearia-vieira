import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.superficie2, borderColor: theme.borda }]}>
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valorAtivo;
        return (
          <TouchableOpacity
            key={opcao.valor}
            style={[
              styles.opcao,
              ativo && { backgroundColor: theme.ouro },
            ]}
            onPress={() => onChange(opcao.valor)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.texto,
                { color: theme.textoSecundario },
                ativo && { color: theme.textoEscuroSobreOuro, fontFamily: FontFamily.bold },
              ]}
            >
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
    borderRadius: Radii.full,
    padding: 3,
    borderWidth: 1,
  },
  opcao: {
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    alignItems: 'center',
  },
  texto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodyMd,
  },
});
