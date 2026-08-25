import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii } from '@/theme';

export type TipoLogo = 'navalha' | 'avatar' | 'borda_sf' | 'padrao';

interface LogoBarbeariaProps {
  tamanho?: number;
  tipo?: TipoLogo;
  uri?: string | null;
  mostrarTelefone?: boolean;
  telefoneClicavel?: boolean;
  mensagemWhatsApp?: string;
  variante?: 'vertical' | 'horizontal' | 'compacto';
}

export function LogoBarbearia({
  tamanho = 100,
  tipo = 'navalha',
  uri,
  mostrarTelefone = false,
  telefoneClicavel = true,
  mensagemWhatsApp = 'Não estou conseguindo entrar no aplicativo',
  variante = 'vertical',
}: LogoBarbeariaProps) {
  let sourceImg = require('@/assets/logo-navalha.png');
  let ratio = 943 / 981;

  if (tipo === 'avatar') {
    sourceImg = require('@/assets/logo-avatar.png');
    ratio = 904 / 831;
  } else if (tipo === 'borda_sf') {
    sourceImg = require('@/assets/logo-borda-sf.png');
    ratio = 1;
  }

  const altura = tamanho;
  const largura = uri ? tamanho : tamanho * ratio;

  function handleAbrirWhatsApp() {
    if (!telefoneClicavel) return;
    const numero = '5586981907478';
    const msg = encodeURIComponent(mensagemWhatsApp);
    Linking.openURL(`https://wa.me/${numero}?text=${msg}`).catch(() => {});
  }

  const renderImagem = () => (
    <Image
      source={uri ? { uri } : sourceImg}
      style={[
        styles.logoImagem,
        { width: largura, height: altura },
        uri && styles.logoRemota,
      ]}
      resizeMode={uri ? 'cover' : 'contain'}
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
  logoRemota: {
    borderRadius: Radii.md,
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


