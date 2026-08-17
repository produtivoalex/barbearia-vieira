import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';

interface BotaoProps {
  label: string;
  onPress: () => void;
  variante?: Variante;
  iconeEsquerda?: React.ReactNode;
  iconeDireita?: React.ReactNode;
  carregando?: boolean;
  desabilitado?: boolean;
  estiloContainer?: ViewStyle;
  estiloTexto?: TextStyle;
}

export function Botao({
  label,
  onPress,
  variante = 'primario',
  iconeEsquerda,
  iconeDireita,
  carregando = false,
  desabilitado = false,
  estiloContainer,
  estiloTexto,
}: BotaoProps) {
  const estilos = estilosPorVariante[variante];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        estilos.container,
        variante === 'primario' && Shadows.botaoPrimario,
        (desabilitado || carregando) && styles.desabilitado,
        estiloContainer,
      ]}
      onPress={onPress}
      disabled={desabilitado || carregando}
      activeOpacity={0.8}
    >
      {iconeEsquerda && !carregando && iconeEsquerda}
      {carregando ? (
        <ActivityIndicator
          size="small"
          color={variante === 'primario' ? Colors.textoPrimario : Colors.vermelho}
        />
      ) : (
        <Text style={[styles.textoBase, estilos.texto, estiloTexto]}>
          {label}
        </Text>
      )}
      {iconeDireita && !carregando && iconeDireita}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.xl,
    gap: Spacing.xs,
    minHeight: 52,
  },
  textoBase: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodyLg,
    letterSpacing: 0.3,
  },
  desabilitado: {
    opacity: 0.45,
  },
});

const estilosPorVariante: Record<Variante, { container: ViewStyle; texto: TextStyle }> = {
  primario: {
    container: {
      backgroundColor: Colors.vermelho,
    },
    texto: {
      color: Colors.textoPrimario,
    },
  },
  secundario: {
    container: {
      backgroundColor: Colors.transparente,
      borderWidth: 1.5,
      borderColor: Colors.vermelho,
    },
    texto: {
      color: Colors.vermelho,
    },
  },
  fantasma: {
    container: {
      backgroundColor: Colors.transparente,
    },
    texto: {
      color: Colors.textoSecundario,
    },
  },
  perigo: {
    container: {
      backgroundColor: Colors.erro,
    },
    texto: {
      color: Colors.textoPrimario,
    },
  },
};
