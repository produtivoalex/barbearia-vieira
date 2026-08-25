import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { MessageCircle, Scissors, Sparkles } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii } from '@/theme';

export type TipoLogo = 'navalha' | 'avatar' | 'borda_sf' | 'padrao' | 'plataforma';

interface LogoBarbeariaProps {
  tamanho?: number;
  tipo?: TipoLogo;
  uri?: string | null;
  mostrarTelefone?: boolean;
  telefoneClicavel?: boolean;
  numeroTelefone?: string;
  mensagemWhatsApp?: string;
  variante?: 'vertical' | 'horizontal' | 'compacto';
}

export function LogoBarbearia({
  tamanho = 100,
  tipo = 'navalha',
  uri,
  mostrarTelefone = false,
  telefoneClicavel = true,
  numeroTelefone = '(86) 98190-7478',
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
    const numeroLimpo = numeroTelefone.replace(/\D/g, '');
    const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
    const msg = encodeURIComponent(mensagemWhatsApp);
    Linking.openURL(`https://wa.me/${numeroFinal}?text=${msg}`).catch(() => {});
  }

  const renderImagem = () => {
    if (tipo === 'plataforma' && !uri) {
      return (
        <View
          style={[
            styles.badgePlataforma,
            { width: tamanho, height: tamanho, borderRadius: Math.round(tamanho * 0.28) },
          ]}
        >
          <Scissors size={Math.round(tamanho * 0.45)} color={Colors.ouro} />
          <View style={styles.badgePlataformaSparkle}>
            <Sparkles size={Math.round(tamanho * 0.22)} color={Colors.ouroClaro} />
          </View>
        </View>
      );
    }

    return (
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
  };

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
  badgePlataforma: {
    backgroundColor: '#161618',
    borderWidth: 2,
    borderColor: Colors.ouro,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.ouro,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  badgePlataformaSparkle: {
    position: 'absolute',
    top: 6,
    right: 8,
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


