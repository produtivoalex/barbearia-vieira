import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G, Rect } from 'react-native-svg';
import { Colors, FontFamily, FontSize, Spacing } from '@/theme';

interface LogoBarbeariaProps {
  tamanho?: number;
  mostrarTexto?: boolean;
  mostrarTelefone?: boolean;
  variante?: 'vertical' | 'horizontal' | 'compacto';
}

export function LogoBarbearia({
  tamanho = 96,
  mostrarTexto = true,
  mostrarTelefone = true,
  variante = 'vertical',
}: LogoBarbeariaProps) {
  const raioCirculo = tamanho / 2;

  const renderIcone = () => (
    <View style={[styles.seloContainer, { width: tamanho, height: tamanho, borderRadius: raioCirculo }]}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100" fill="none">
        {/* Anel externo dourado com acabamento duplo */}
        <Circle cx="50" cy="50" r="46" stroke={Colors.ouro} strokeWidth="2.5" strokeDasharray="3, 3" />
        <Circle cx="50" cy="50" r="41" stroke={Colors.ouro} strokeWidth="1.8" />

        {/* Círculo de fundo escuro com leve brilho */}
        <Circle cx="50" cy="50" r="39" fill="#141414" />

        {/* Tesoura / Navalhete Vetorial de Luxo em Ouro */}
        <G transform="translate(26, 26) scale(0.48)">
          {/* Lâmina 1 */}
          <Path
            d="M50 42 C45 32 30 20 18 12 C14 9 10 10 10 14 C10 17 13 22 20 28 C28 35 38 43 45 47 Z"
            fill={Colors.ouro}
          />
          {/* Lâmina 2 */}
          <Path
            d="M50 58 C45 68 30 80 18 88 C14 91 10 90 10 86 C10 83 13 78 20 72 C28 65 38 57 45 53 Z"
            fill={Colors.ouro}
          />
          {/* Eixo central */}
          <Circle cx="48" cy="50" r="5" fill={Colors.ouroClaro} stroke="#141414" strokeWidth="2" />
          
          {/* Cabos / Anéis da Tesoura */}
          <Path
            d="M48 48 L72 30 C78 25 88 28 88 36 C88 44 78 47 72 42 Z"
            stroke={Colors.ouro}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M48 52 L72 70 C78 75 88 72 88 64 C88 56 78 53 72 58 Z"
            stroke={Colors.ouro}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Navalha detalhe horizontal */}
          <Rect x="20" y="47" width="24" height="6" rx="3" fill={Colors.ouroClaro} />
        </G>

        {/* Estrelas decorativas */}
        <Path d="M50 8 L51.5 12.5 L56 12.5 L52.5 15 L54 19.5 L50 17 L46 19.5 L47.5 15 L44 12.5 L48.5 12.5 Z" fill={Colors.ouro} />
        <Path d="M50 92 L51.5 87.5 L56 87.5 L52.5 85 L54 80.5 L50 83 L46 80.5 L47.5 85 L44 87.5 L48.5 87.5 Z" fill={Colors.ouro} />
      </Svg>
    </View>
  );

  if (variante === 'compacto') {
    return renderIcone();
  }

  if (variante === 'horizontal') {
    return (
      <View style={styles.containerHorizontal}>
        {renderIcone()}
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
      {renderIcone()}
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
  seloContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.ouro,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  containerVertical: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoVertical: {
    alignItems: 'center',
    gap: 2,
  },
  infoHorizontal: {
    justifyContent: 'center',
    gap: 1,
  },
  nomeAppVertical: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.displayMd,
    color: Colors.textoPrimario,
    letterSpacing: 3,
    textAlign: 'center',
  },
  nomeAppHorizontal: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodyLg,
    color: Colors.textoPrimario,
    letterSpacing: 1.5,
  },
  telefoneVertical: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.textoSecundario,
    letterSpacing: 0.5,
  },
  telefoneHorizontal: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.labelXs,
    color: Colors.ouro,
    letterSpacing: 0.5,
  },
});
