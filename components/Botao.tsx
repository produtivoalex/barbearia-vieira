import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { FontFamily, FontSize, Radii, Spacing, Shadows } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();

  const estilosDinamicos: Record<Variante, { container: ViewStyle; texto: TextStyle }> = {
    primario: {
      container: {
        backgroundColor: theme.ouro,
      },
      texto: {
        color: theme.textoEscuroSobreOuro,
        fontFamily: FontFamily.bold,
      },
    },
    secundario: {
      container: {
        backgroundColor: theme.ouroTranslucido,
        borderWidth: 1.5,
        borderColor: theme.ouro,
      },
      texto: {
        color: theme.ouroTexto,
        fontFamily: FontFamily.bold,
      },
    },
    fantasma: {
      container: {
        backgroundColor: theme.transparente,
      },
      texto: {
        color: theme.textoSecundario,
      },
    },
    perigo: {
      container: {
        backgroundColor: theme.erro,
      },
      texto: {
        color: theme.branco,
        fontFamily: FontFamily.bold,
      },
    },
  };

  const estilos = estilosDinamicos[variante];

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
          color={variante === 'primario' ? theme.textoEscuroSobreOuro : theme.ouro}
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
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    letterSpacing: 0.3,
  },
  desabilitado: {
    opacity: 0.45,
  },
});
