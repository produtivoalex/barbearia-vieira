import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Edit3, MessageCircle, Instagram } from 'lucide-react-native';
import { FontFamily, FontSize, Radii, Spacing } from '@/theme';
import { LogoBarbearia } from './LogoBarbearia';

export type TemaCanvaAviso = 'dark' | 'gold' | 'classico' | 'clean';

export interface CanvaAvisoCardProps {
  mensagem: string;
  tema?: TemaCanvaAviso;
  nomeBarbearia: string;
  logoUrl?: string | null;
  slug?: string | null;
  instagram?: string;
  whatsapp?: string;
  onPress?: () => void;
  isInteractive?: boolean;
  containerStyle?: ViewStyle;
}

export const CanvaAvisoCard = forwardRef<View, CanvaAvisoCardProps>(
  (
    {
      mensagem,
      tema = 'dark',
      nomeBarbearia,
      logoUrl,
      slug,
      instagram,
      whatsapp,
      onPress,
      isInteractive = false,
      containerStyle,
    },
    ref
  ) => {
    const temaStyles = getTemaConfig(tema);

    const CardContent = (
      <View
        ref={ref}
        collapsable={false}
        style={[styles.cardCanvas, temaStyles.card, containerStyle]}
      >
        {/* Moldura Interna Limpa e Elegante */}
        <View style={[styles.innerFrame, temaStyles.innerFrame]}>
          {/* 1. Header: Apenas Logo + Nome da Barbearia (Sem ícones extras no lado direito) */}
          <View style={styles.header}>
            <View style={[styles.logoWrapper, temaStyles.logoWrapper]}>
              <LogoBarbearia
                tamanho={38}
                tipo="avatar"
                variante="compacto"
                uri={logoUrl}
                slug={slug}
              />
            </View>
            <Text style={[styles.nomeBarbearia, temaStyles.nomeBarbearia]} numberOfLines={1}>
              {(nomeBarbearia || 'Barbearia').toUpperCase()}
            </Text>
          </View>

          {/* Divisória Sutil */}
          <View style={[styles.linhaDivisoria, temaStyles.linhaDivisoria]} />

          {/* 2. Corpo: Mensagem Direta e Limpa de Aviso */}
          <View style={styles.corpo}>
            <Text style={[styles.mensagem, temaStyles.mensagem]}>
              {mensagem || 'A barbearia estará fechada hoje à tarde. Agradecemos a compreensão de todos!'}
            </Text>
          </View>

          {/* 3. Rodapé: Apenas Redes Sociais se cadastradas (Sem marca d'água na régua) */}
          {(instagram || whatsapp) ? (
            <>
              <View style={[styles.linhaDivisoria, temaStyles.linhaDivisoria]} />
              <View style={styles.footer}>
                <View style={styles.contatosRow}>
                  {instagram ? (
                    <View style={styles.socialPill}>
                      <Instagram size={12} color={temaStyles.footerSubColor} />
                      <Text style={[styles.socialPillTexto, { color: temaStyles.footerSubColor }]} numberOfLines={1}>
                        @{instagram.replace(/^@/, '')}
                      </Text>
                    </View>
                  ) : null}

                  {whatsapp ? (
                    <View style={styles.socialPill}>
                      <MessageCircle size={12} color={temaStyles.footerSubColor} />
                      <Text style={[styles.socialPillTexto, { color: temaStyles.footerSubColor }]} numberOfLines={1}>
                        {whatsapp}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>
    );

    if (isInteractive && onPress) {
      return (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.touchableWrapper}>
          {CardContent}
          {/* Indicador Flutuante Interativo de Edição posicionado fora da captura */}
          <View style={styles.indicadorEdicao}>
            <Edit3 size={12} color="#09090B" />
            <Text style={styles.indicadorEdicaoTexto}>Toque para personalizar ✏️</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return CardContent;
  }
);

CanvaAvisoCard.displayName = 'CanvaAvisoCard';

function getTemaConfig(tema: TemaCanvaAviso) {
  switch (tema) {
    case 'gold':
      return {
        card: {
          backgroundColor: '#CBA14A',
          borderColor: '#E6C678',
        },
        innerFrame: {
          borderColor: 'rgba(9, 9, 11, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        },
        logoWrapper: {
          borderColor: '#09090B',
          backgroundColor: '#09090B',
        },
        nomeBarbearia: {
          color: '#09090B',
        },
        linhaDivisoria: {
          backgroundColor: 'rgba(9, 9, 11, 0.2)',
        },
        titulo: {
          color: '#09090B',
        },
        mensagem: {
          color: '#18181B',
        },
        footerSubColor: '#27272A',
      };

    case 'classico':
      return {
        card: {
          backgroundColor: '#161922',
          borderColor: '#2A303C',
        },
        innerFrame: {
          borderColor: 'rgba(203, 161, 74, 0.35)',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        },
        logoWrapper: {
          borderColor: '#CBA14A',
          backgroundColor: '#0E1015',
        },
        nomeBarbearia: {
          color: '#FFFFFF',
        },
        linhaDivisoria: {
          backgroundColor: 'rgba(203, 161, 74, 0.25)',
        },
        titulo: {
          color: '#FFFFFF',
        },
        mensagem: {
          color: '#E4E4E7',
        },
        footerSubColor: '#A1A1AA',
      };

    case 'clean':
      return {
        card: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E4E4E7',
        },
        innerFrame: {
          borderColor: 'rgba(203, 161, 74, 0.4)',
          backgroundColor: '#FAFAFA',
        },
        logoWrapper: {
          borderColor: '#CBA14A',
          backgroundColor: '#FFFFFF',
        },
        nomeBarbearia: {
          color: '#09090B',
        },
        linhaDivisoria: {
          backgroundColor: '#E4E4E7',
        },
        titulo: {
          color: '#09090B',
        },
        mensagem: {
          color: '#27272A',
        },
        footerSubColor: '#52525B',
      };

    case 'dark':
    default:
      return {
        card: {
          backgroundColor: '#0C0C0E',
          borderColor: '#27272A',
        },
        innerFrame: {
          borderColor: 'rgba(203, 161, 74, 0.35)',
          backgroundColor: 'rgba(18, 18, 22, 0.9)',
        },
        logoWrapper: {
          borderColor: '#CBA14A',
          backgroundColor: '#09090B',
        },
        nomeBarbearia: {
          color: '#FFFFFF',
        },
        linhaDivisoria: {
          backgroundColor: 'rgba(203, 161, 74, 0.25)',
        },
        titulo: {
          color: '#FFFFFF',
        },
        mensagem: {
          color: '#E4E4E7',
        },
        footerSubColor: '#A1A1AA',
      };
  }
}

const styles = StyleSheet.create({
  touchableWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  cardCanvas: {
    width: '100%',
    borderRadius: Radii.xl,
    borderWidth: 2,
    padding: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  innerFrame: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nomeBarbearia: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    letterSpacing: 1,
  },
  linhaDivisoria: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  corpo: {
    paddingVertical: Spacing.md,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  mensagem: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  contatosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  socialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  socialPillTexto: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  indicadorEdicao: {
    position: 'absolute',
    bottom: -12,
    alignSelf: 'center',
    backgroundColor: '#CBA14A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  indicadorEdicaoTexto: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#09090B',
  },
});
