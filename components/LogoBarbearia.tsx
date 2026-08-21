import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';

interface LogoBarbeariaProps {
  tamanho?: number;
  mostrarTexto?: boolean;
  mostrarTelefone?: boolean;
  variante?: 'vertical' | 'horizontal' | 'compacto';
}

// Proporção exata do brasão oficial: 476 largura x 456 altura (~1.044)
const ASPECT_RATIO = 476 / 456;

export function LogoBarbearia({
  tamanho = 96,
  mostrarTexto = true,
  mostrarTelefone = true,
  variante = 'vertical',
}: LogoBarbeariaProps) {
  const altura = tamanho;
  const largura = tamanho * ASPECT_RATIO;

  const renderImagem = () => (
    <Image
      source={require('@/assets/logo.png')}
      style={[styles.logoImagem, { width: largura, height: altura }]}
      resizeMode="contain"
    />
  );

  if (variante === 'compacto') {
    return renderImagem();
  }

  if (variante === 'horizontal') {
    return (
      <View style={styles.containerHorizontal}>
        {renderImagem()}
        {mostrarTexto && (
          <View style={styles.infoHorizontal}>
            <Text style={styles.nomeAppHorizontal}>BARBEARIA VIEIRA</Text>
            {mostrarTelefone && <Text style={styles.telefoneHorizontal}>(86) 98190-7478</Text>}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.containerVertical}>
      {renderImagem()}
      {mostrarTexto && (
        <View style={styles.infoVertical}>
          <Text style={styles.nomeAppVertical}>BARBEARIA VIEIRA</Text>
          {mostrarTelefone && <Text style={styles.telefoneVertical}>(86) 98190-7478</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoImagem: {
    alignSelf: 'center',
  },
  containerVertical: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoVertical: {
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  infoHorizontal: {
    justifyContent: 'center',
    gap: 1,
  },
  nomeAppVertical: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
    letterSpacing: 2,
    textAlign: 'center',
  },
  nomeAppHorizontal: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    letterSpacing: 1.2,
  },
  telefoneVertical: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
    letterSpacing: 0.5,
  },
  telefoneHorizontal: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
    letterSpacing: 0.5,
  },
});

