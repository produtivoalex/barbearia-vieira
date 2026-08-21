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

        {/* 1. Corte Navalhado: Navalha de Barbeiro Clássica Aberta */}
        {tipo === 'corte_navalhado' && (
          <G transform="translate(8, 8)">
            {/* Cabo ergonômico da navalha (Scale) */}
            <Path
              d="M8 40 C14 30 22 22 30 18 C32 17 34 18 33 20 C25 25 18 34 10 42 C8 43 6 42 8 40 Z"
              fill="#2A2A32"
              stroke={Colors.ouro}
              strokeWidth="1.5"
            />
            {/* Pino de articulação / Pivô dourado */}
            <Circle cx="30" cy="18" r="3" fill={Colors.ouro} stroke="#FFF" strokeWidth="0.8" />

            {/* Espiga e Lâmina aberta de aço afiado */}
            <Path
              d="M30 18 L36 13 L45 7 C47 5 49 7 48 9 L38 23 L32 20 Z"
              fill="url(#gradOuro)"
              stroke="#FFF"
              strokeWidth="1"
            />
            {/* Fio de corte polido prateado */}
            <Path
              d="M48 9 L38 23"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Sulco/detalhe da lâmina profissional */}
            <Path d="M36 14 L44 9" stroke="#3A2A10" strokeWidth="1" />
            {/* Brilho da navalha */}
            <Circle cx="44" cy="9" r="1.5" fill="#FFFFFF" />
            <Circle cx="20" cy="30" r="1" fill={Colors.ouroClaro} />
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

        {/* 2. Combos VIP: Coroa Imperial VIP Real */}
        {tipo.startsWith('combo') && (
          <G transform="translate(8, 8)">
            {/* Base almofadada em vermelho nobre */}
            <Rect x="6" y="32" width="36" height="7" rx="3.5" fill={Colors.vermelho} stroke={Colors.ouro} strokeWidth="1.5" />
            {/* 5 Pontas da Coroa Imperial */}
            <Path
              d="M7 32 L9 16 L17 24 L24 10 L31 24 L39 16 L41 32 Z"
              fill="url(#gradOuro)"
              stroke={Colors.ouroClaro}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Pedrarias / Brilhos nas pontas da coroa */}
            <Circle cx="9" cy="16" r="2.5" fill="#FFF" stroke={Colors.ouro} strokeWidth="0.8" />
            <Circle cx="24" cy="10" r="3.2" fill="#FFF" stroke={Colors.ouro} strokeWidth="1" />
            <Circle cx="39" cy="16" r="2.5" fill="#FFF" stroke={Colors.ouro} strokeWidth="0.8" />
            <Circle cx="17" cy="24" r="2" fill="#FFF" />
            <Circle cx="31" cy="24" r="2" fill="#FFF" />
            {/* Jóias no diadema inferior */}
            <Circle cx="14" cy="35.5" r="1.8" fill="#FFF" />
            <Circle cx="24" cy="35.5" r="2.2" fill="url(#gradOuro)" />
            <Circle cx="34" cy="35.5" r="1.8" fill="#FFF" />
            {/* Brilho VIP estelar */}
            <Path d="M24 2 L25 5 L28 6 L25 7 L24 10 L23 7 L20 6 L23 5 Z" fill="#FFF" />
          </G>
        )}

        {/* 3. Barba Desenhada: Rosto Masculino com Barba e Bigode Alinhados */}
        {tipo === 'barba_desenhada' && (
          <G transform="translate(9, 8)">
            {/* Contorno do rosto masculino (perfil moderno) */}
            <Path
              d="M14 12 C16 7 24 5 30 7 C36 9 38 15 38 22 C38 28 35 34 30 38 C24 41 16 39 12 35 C8 30 8 20 14 12 Z"
              fill="#222028"
              stroke={Colors.ouro}
              strokeWidth="1.5"
            />
            {/* Cabelo e topete estilizado */}
            <Path
              d="M14 12 C18 6 28 5 33 9 C30 11 26 12 22 12 C18 12 15 13 14 15 Z"
              fill="url(#gradOuro)"
            />
            {/* Bigode esculpido alinhado */}
            <Path
              d="M22 23 C26 23 30 26 33 29 C29 30 25 29 22 27 Z"
              fill={Colors.ouro}
            />
            {/* Barba desenhada cheia na régua */}
            <Path
              d="M14 20 C18 24 25 26 31 27 C33 33 29 38 23 40 C17 40 12 35 11 26 C12 23 13 21 14 20 Z"
              fill="url(#gradOuro)"
              stroke="#FFF"
              strokeWidth="0.8"
            />
            {/* Linha de precisão na bochecha (régua) */}
            <Path
              d="M14 20 C20 24 26 26 32 27"
              stroke="#FFF"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Brilho de alinhamento */}
            <Circle cx="32" cy="27" r="1.5" fill="#FFF" />
          </G>
        )}

        {/* 4. Barba Simples: Rosto Masculino Limpo sem Barba */}
        {tipo === 'barba_simples' && (
          <G transform="translate(9, 8)">
            {/* Rosto masculino barbeado / pele limpa e suave */}
            <Path
              d="M14 12 C16 7 24 5 30 7 C36 9 38 15 38 22 C38 28 35 34 30 38 C24 41 16 39 12 35 C8 30 8 20 14 12 Z"
              fill="#26242E"
              stroke={Colors.ouro}
              strokeWidth="1.5"
            />
            {/* Cabelo bem alinhado */}
            <Path
              d="M14 12 C18 6 28 5 33 9 C30 11 26 12 22 12 C18 12 15 13 14 15 Z"
              fill="url(#gradOuro)"
            />
            {/* Maxilar e queixo limpos e lisos (sem barba) */}
            <Path
              d="M15 25 C19 31 25 35 30 36"
              stroke="url(#gradOuro)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Estrelas cintilantes de pele limpa e macia */}
            <Path d="M28 22 L29 25 L32 26 L29 27 L28 30 L27 27 L24 26 L27 25 Z" fill="#FFF" />
            <Path d="M19 28 L19.5 30 L21.5 30.5 L19.5 31 L19 33 L18.5 31 L16.5 30.5 L18.5 30 Z" fill={Colors.ouroClaro} />
            <Circle cx="34" cy="32" r="1.5" fill="#FFF" />
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

        {/* 5. Limpeza de Pele: Rosto Masculino em Tratamento Facial / Cuidados */}
        {tipo === 'limpeza_de_pele' && (
          <G transform="translate(9, 8)">
            {/* Rosto relaxado em cuidado facial */}
            <Path
              d="M14 12 C16 7 24 5 30 7 C36 9 38 15 38 22 C38 28 35 34 30 38 C24 41 16 39 12 35 C8 30 8 20 14 12 Z"
              fill="#18242A"
              stroke="#4FA3D1"
              strokeWidth="1.5"
            />
            {/* Olho fechado sereno (tratamento relaxante) */}
            <Path
              d="M26 18 C28 20 31 20 33 18"
              stroke="#FFF"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Máscara facial / esfoliação revitalizante */}
            <Path
              d="M16 16 C20 13 28 13 32 16 C34 20 33 28 30 32 C26 35 20 34 16 30 Z"
              fill="rgba(79, 163, 209, 0.25)"
              stroke="url(#gradOuro)"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />
            {/* Gotas e bolhas de hidratação/purificação */}
            <Circle cx="8" cy="14" r="2.5" fill="#4FA3D1" opacity={0.8} />
            <Circle cx="38" cy="10" r="3" fill="url(#gradOuro)" />
            <Circle cx="39" cy="28" r="2" fill="#3DBF6A" />
            <Path d="M10 28 L11 30 L13 30.5 L11 31 L10 33 L9 31 L7 30.5 L9 30 Z" fill="#FFF" />
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
