import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, ImageSourcePropType } from 'react-native';
import { MessageCircle, Scissors, Sparkles } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radii, type ThemePalette } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';

export type TipoLogo =
  | 'banner'
  | 'avatar'
  | 'logo_na_regua'
  | 'padrao'
  | 'plataforma'
  | 'navalha'
  | 'borda_sf';

export interface LogoBarbeariaProps {
  tamanho?: number;
  tipo?: TipoLogo;
  uri?: string | null;
  slug?: string | null;
  mostrarTelefone?: boolean;
  telefoneClicavel?: boolean;
  numeroTelefone?: string;
  mensagemWhatsApp?: string;
  variante?: 'vertical' | 'horizontal' | 'compacto' | 'banner';
}

export function LogoBarbearia({
  tamanho = 100,
  tipo = 'padrao',
  uri,
  slug,
  mostrarTelefone = false,
  telefoneClicavel = true,
  numeroTelefone = '(86) 98190-7478',
  mensagemWhatsApp = 'Olá! Gostaria de falar com o suporte do Na Régua.',
  variante = 'vertical',
}: LogoBarbeariaProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isVieira = !slug || slug === 'barbearia-vieira' || slug.includes('vieira');
  let sourceImg: ImageSourcePropType = require('@/assets/logo-na-regua.png');
  let ratio = 1;

  if (tipo === 'banner') {
    sourceImg = isVieira ? require('@/assets/barbearia-vieira-banner.png') : require('@/assets/banner-na-regua.png');
    ratio = 1024 / 341; // ~3.003
  } else if (tipo === 'avatar') {
    sourceImg = isVieira ? require('@/assets/barbearia-vieira-logo.png') : require('@/assets/avatar-na-regua.png');
    ratio = 1;
  } else if (tipo === 'plataforma') {
    sourceImg = require('@/assets/banner-na-regua.png');
    ratio = 1024 / 341;
  } else if (tipo === 'navalha') {
    sourceImg = require('@/assets/logo-navalha.png');
    ratio = 943 / 981;
  } else if (tipo === 'borda_sf') {
    sourceImg = require('@/assets/logo-borda-sf.png');
    ratio = 1;
  } else if (tipo === 'logo_na_regua' || tipo === 'padrao') {
    sourceImg = require('@/assets/logo-na-regua.png');
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

  if (variante === 'compacto' || variante === 'banner') {
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
          <MessageCircle size={14} color={theme.verde} />
          <Text style={styles.telefoneTexto}>{numeroTelefone}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.telefoneBadge}>
        <Text style={styles.telefoneTexto}>{numeroTelefone}</Text>
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

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    containerVertical: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    containerHorizontal: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
    },
    logoImagem: {
      borderRadius: Radii.md,
    },
    logoRemota: {
      borderRadius: Radii.md,
    },
    telefoneBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.superficie,
      borderWidth: 1,
      borderColor: theme.borda,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radii.full,
    },
    telefoneTexto: {
      fontFamily: FontFamily.bold,
      fontSize: FontSize.bodySm,
      color: theme.textoPrimario,
    },
  });
