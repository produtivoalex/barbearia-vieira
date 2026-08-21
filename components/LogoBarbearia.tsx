import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii } from '@/theme';

interface LogoBarbeariaProps {
  tamanho?: number;
  mostrarTelefone?: boolean;
  telefoneClicavel?: boolean;
  mensagemWhatsApp?: string;
  variante?: 'vertical' | 'horizontal' | 'compacto';
}

// Proporção exata do brasão oficial: 476 largura x 456 altura (~1.044)
const ASPECT_RATIO = 476 / 456;

export function LogoBarbearia({
  tamanho = 100,
  mostrarTelefone = false,
  telefoneClicavel = true,
  mensagemWhatsApp = 'Não estou conseguindo entrar no aplicativo',
  variante = 'vertical',
}: LogoBarbeariaProps) {
  const altura = tamanho;
  const largura = tamanho * ASPECT_RATIO;

  function handleAbrirWhatsApp() {
    if (!telefoneClicavel) return;
    const numero = '5586981907478';
    const msg = encodeURIComponent(mensagemWhatsApp);
    Linking.openURL(`https://wa.me/${numero}?text=${msg}`).catch(() => {});
  }

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

  const renderTelefone = () => {
    if (!mostrarTelefone) return null;

    if (telefoneClicavel) {
      return (
        <TouchableOpacity
          style={styles.telefoneBadge}
          onPress={handleAbrirWhatsApp}
          activeOpacity={0.7}
        >
          <MessageCircle size={14} color={Colors.verde} />
          <Text style={styles.telefoneTexto}>(86) 98190-7478</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.telefoneBadge}>
        <Text style={styles.telefoneTexto}>(86) 98190-7478</Text>
      </View>
    );
  };

  if (variante === 'horizontal') {
    return (
      <View style={styles.containerHorizontal}>
        {renderImagem()}
        {renderTelefone()}
      </View>
    );
  }

  return (
    <View style={styles.containerVertical}>
      {renderImagem()}
      {renderTelefone()}
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
  telefoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(203, 161, 74, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(203, 161, 74, 0.3)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    marginTop: 4,
  },
  telefoneTexto: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    color: Colors.ouro,
    letterSpacing: 0.5,
  },
});


