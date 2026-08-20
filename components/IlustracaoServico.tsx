import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/theme';

export type TipoServicoId =
  | 'corte_degrade'
  | 'corte_navalhado'
  | 'corte_social'
  | 'social_maquina'
  | 'combo_1'
  | 'combo_2'
  | 'combo_3'
  | 'combo_4'
  | 'combo_5'
  | 'combo_6'
  | 'barba_desenhada'
  | 'barba_simples'
  | 'sobrancelha'
  | 'limpeza_de_pele'
  | 'generico';

interface IlustracaoServicoProps {
  id?: string;
  nome?: string;
  categoria?: string;
  tamanho?: number;
}

/** Identifica o tipo de ilustração baseado no nome ou id do serviço */
export function identificarTipoServico(id?: string, nome?: string, categoria?: string): TipoServicoId {
  const str = `${id || ''} ${nome || ''}`.toLowerCase();
  
  if (str.includes('combo 1')) return 'combo_1';
  if (str.includes('combo 2')) return 'combo_2';
  if (str.includes('combo 3')) return 'combo_3';
  if (str.includes('combo 4')) return 'combo_4';
  if (str.includes('combo 5')) return 'combo_5';
  if (str.includes('combo 6')) return 'combo_6';
  if (str.includes('combo') || categoria === 'combos') return 'combo_1';

  if (str.includes('degrad') || str.includes('fade')) return 'corte_degrade';
  if (str.includes('navalhad') || str.includes('navalha')) return 'corte_navalhado';
  if (str.includes('máquina') || str.includes('maquina')) return 'social_maquina';
  if (str.includes('social') || categoria === 'cortes') return 'corte_social';

  if (str.includes('barba desenhada') || str.includes('desenhada')) return 'barba_desenhada';
  if (str.includes('barba') || categoria === 'barba') return 'barba_simples';

  if (str.includes('sobrancelha') || categoria === 'sobrancelha') return 'sobrancelha';
  if (str.includes('limpeza') || str.includes('pele') || categoria === 'limpeza_de_pele') return 'limpeza_de_pele';

  return 'generico';
}

export function IlustracaoServico({
  id,
  nome,
  categoria,
  tamanho = 48,
}: IlustracaoServicoProps) {
  const tipo = identificarTipoServico(id, nome, categoria);

  return (
    <View style={[styles.container, { width: tamanho, height: tamanho, borderRadius: tamanho * 0.28 }]}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64" fill="none">
        <Defs>
          <LinearGradient id="gradFundoOuro" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#2A2416" />
            <Stop offset="100%" stopColor="#17140E" />
          </LinearGradient>
          <LinearGradient id="gradFundoVermelho" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#350B11" />
            <Stop offset="100%" stopColor="#190609" />
          </LinearGradient>
          <LinearGradient id="gradFundoAzul" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#11253C" />
            <Stop offset="100%" stopColor="#0B1522" />
          </LinearGradient>
          <LinearGradient id="gradOuro" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#F5D07A" />
            <Stop offset="100%" stopColor="#CBA14A" />
          </LinearGradient>
        </Defs>

        {/* Fundo do Card da Ilustração */}
        <Rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="16"
          fill={
            tipo.startsWith('combo')
              ? 'url(#gradFundoVermelho)'
              : tipo === 'limpeza_de_pele' || tipo === 'sobrancelha'
              ? 'url(#gradFundoAzul)'
              : 'url(#gradFundoOuro)'
          }
          stroke={tipo.startsWith('combo') ? Colors.vermelhoClaro : Colors.ouro}
          strokeWidth="1.2"
          strokeOpacity={0.6}
        />

        {/* Desenhos Vetoriais Exclusivos por Serviço */}
        {tipo === 'corte_degrade' && (
          <G transform="translate(10, 10)">
            {/* Linhas de Degradê Fade */}
            <Rect x="4" y="8" width="36" height="4" rx="2" fill={Colors.ouro} opacity={0.9} />
            <Rect x="8" y="15" width="32" height="4" rx="2" fill={Colors.ouro} opacity={0.7} />
            <Rect x="14" y="22" width="26" height="4" rx="2" fill={Colors.ouro} opacity={0.5} />
            <Rect x="20" y="29" width="20" height="4" rx="2" fill={Colors.ouro} opacity={0.3} />
            {/* Tesoura sobreposta */}
            <Path
              d="M32 6 L12 28 M12 6 L32 28"
              stroke="url(#gradOuro)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <Circle cx="12" cy="30" r="4" stroke={Colors.ouro} strokeWidth="2" />
            <Circle cx="32" cy="30" r="4" stroke={Colors.ouro} strokeWidth="2" />
          </G>
        )}

        {tipo === 'corte_navalhado' && (
          <G transform="translate(10, 10)">
            {/* Cabo da Navalhete */}
            <Path
              d="M8 36 C10 24 16 16 26 12 L38 24 C30 28 20 38 8 36 Z"
              fill="#3A3A44"
              stroke={Colors.ouro}
              strokeWidth="1.5"
            />
            {/* Lâmina aberta em aço e ouro */}
            <Path
              d="M26 12 L40 6 C42 5 44 7 43 9 L34 28 Z"
              fill="url(#gradOuro)"
              stroke="#FFF"
              strokeWidth="0.8"
            />
            {/* Linha de corte afiada */}
            <Path d="M40 6 L34 28" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Brilho da navalha */}
            <Circle cx="36" cy="14" r="2" fill="#FFF" />
          </G>
        )}

        {tipo === 'corte_social' && (
          <G transform="translate(10, 10)">
            {/* Pente Clássico */}
            <Rect x="6" y="8" width="32" height="6" rx="2" fill={Colors.ouro} />
            <Path d="M8 14 L8 22 M12 14 L12 22 M16 14 L16 22 M20 14 L20 22 M24 14 L24 22 M28 14 L28 22 M32 14 L32 22 M36 14 L36 22" stroke={Colors.ouro} strokeWidth="1.8" strokeLinecap="round" />
            {/* Tesoura elegante */}
            <Path d="M10 38 L34 22 M10 22 L34 38" stroke="url(#gradOuro)" strokeWidth="2.5" strokeLinecap="round" />
            <Circle cx="8" cy="22" r="3.5" stroke={Colors.ouro} strokeWidth="1.8" />
            <Circle cx="8" cy="38" r="3.5" stroke={Colors.ouro} strokeWidth="1.8" />
          </G>
        )}

        {tipo === 'social_maquina' && (
          <G transform="translate(11, 10)">
            {/* Corpo da Máquina de Corte */}
            <Rect x="12" y="14" width="18" height="24" rx="5" fill="#2E2E38" stroke={Colors.ouro} strokeWidth="1.5" />
            {/* Dentes do Pente da Máquina */}
            <Path d="M10 14 L32 14 M12 8 L12 14 M16 8 L16 14 M20 8 L20 14 M24 8 L24 14 M28 8 L28 14 M30 8 L30 14" stroke="url(#gradOuro)" strokeWidth="2" strokeLinecap="round" />
            {/* Botão de força e detalhes */}
            <Rect x="18" y="22" width="6" height="8" rx="2" fill={Colors.ouro} />
            <Circle cx="21" cy="33" r="1.5" fill="#3DBF6A" />
          </G>
        )}

        {tipo.startsWith('combo') && (
          <G transform="translate(10, 10)">
            {/* Coroa VIP Dourada com rubi */}
            <Path
              d="M6 30 L10 12 L22 22 L34 12 L38 30 Z"
              fill="url(#gradOuro)"
              stroke={Colors.ouroClaro}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Base da Coroa */}
            <Rect x="6" y="30" width="32" height="6" rx="2" fill={Colors.vermelho} stroke={Colors.ouro} strokeWidth="1.2" />
            {/* Jóias da coroa */}
            <Circle cx="10" cy="12" r="2.5" fill="#FFF" />
            <Circle cx="22" cy="14" r="3" fill="#FFF" />
            <Circle cx="34" cy="12" r="2.5" fill="#FFF" />
            <Circle cx="22" cy="33" r="2" fill={Colors.ouro} />
          </G>
        )}

        {tipo === 'barba_desenhada' && (
          <G transform="translate(10, 10)">
            {/* Silhueta de Barba e Bigode Perfeito */}
            <Path
              d="M10 12 C14 18 30 18 34 12 C36 26 30 36 22 38 C14 36 8 26 10 12 Z"
              fill="#222228"
              stroke={Colors.ouro}
              strokeWidth="2"
            />
            {/* Linhas de alinhamento milimétrico */}
            <Path d="M12 18 C18 22 26 22 32 18" stroke="url(#gradOuro)" strokeWidth="2" strokeLinecap="round" />
            <Path d="M22 24 L22 32" stroke={Colors.ouroClaro} strokeWidth="1.5" strokeLinecap="round" />
            <Circle cx="22" cy="12" r="2" fill={Colors.ouro} />
          </G>
        )}

        {tipo === 'barba_simples' && (
          <G transform="translate(10, 10)">
            {/* Lâmina de Barbear Tradicional Dupla */}
            <Rect x="8" y="12" width="28" height="20" rx="3" fill="#30303A" stroke={Colors.ouro} strokeWidth="1.8" />
            {/* Centro vazado da lâmina */}
            <Circle cx="22" cy="22" r="4" fill="#141414" stroke={Colors.ouro} strokeWidth="1.5" />
            <Rect x="14" y="20.5" width="16" height="3" rx="1" fill="#141414" />
            <Path d="M10 12 L10 32 M34 12 L34 32" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
          </G>
        )}

        {tipo === 'sobrancelha' && (
          <G transform="translate(10, 10)">
            {/* Arco da Sobrancelha Estilizada */}
            <Path
              d="M8 26 C16 12 28 12 36 20"
              stroke="url(#gradOuro)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Pinça de Alta Precisão */}
            <Path
              d="M16 38 L28 16 M24 38 L30 18"
              stroke="#D8D8E0"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Circle cx="30" cy="16" r="2" fill={Colors.ouro} />
          </G>
        )}

        {tipo === 'limpeza_de_pele' && (
          <G transform="translate(10, 10)">
            {/* Frasco / Gota de Hidratação e Cuidados */}
            <Path
              d="M22 6 C22 6 12 18 12 26 C12 32 16.5 36 22 36 C27.5 36 32 32 32 26 C32 18 22 6 22 6 Z"
              fill="url(#gradOuro)"
              stroke="#FFF"
              strokeWidth="1"
            />
            {/* Brilho da Gota */}
            <Path
              d="M17 22 C17 18 20 14 22 12"
              stroke="#FFF"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Estrelas de pureza/revitalização */}
            <Circle cx="34" cy="12" r="2" fill={Colors.ouro} />
            <Circle cx="10" cy="30" r="1.5" fill={Colors.ouro} />
            <Circle cx="32" cy="34" r="2.5" fill="#3DBF6A" />
          </G>
        )}

        {tipo === 'generico' && (
          <G transform="translate(10, 10)">
            <Circle cx="22" cy="22" r="16" stroke={Colors.ouro} strokeWidth="2" />
            <Path d="M14 22 L30 22 M22 14 L22 30" stroke="url(#gradOuro)" strokeWidth="2.5" strokeLinecap="round" />
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
