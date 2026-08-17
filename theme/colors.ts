/**
 * Paleta de cores — Barbearia Vieira
 * Fonte da verdade: mockup-barbearia.png
 */

export const Colors = {
  // ─── Primárias ──────────────────────────────────────────────────────────────
  /** Vermelho principal: botões primários, seleção ativa, destaques */
  vermelho: '#8B0013',
  vermelhoEscuro: '#6B0010',
  vermelhoClaro: '#B0001A',

  // ─── Dourado ─────────────────────────────────────────────────────────────────
  /** Ouro/Ocre: logo, badges de destaque, estrelas, ícones premium */
  ouro: '#CBA14A',
  ouroClaro: '#E0BA6A',

  // ─── Backgrounds ─────────────────────────────────────────────────────────────
  /** Fundo global do app */
  fundo: '#0E0E0E',
  /** Superfícies: cards, tab bar, modais */
  superficie: '#1A1A1A',
  /** Superfície secundária: inputs, linhas de lista, divisores */
  superficie2: '#242424',
  /** Bordas sutis */
  borda: '#2E2E2E',

  // ─── Texto ───────────────────────────────────────────────────────────────────
  /** Texto primário — creme claro, alta legibilidade no dark */
  textoPrimario: '#F7F3EC',
  /** Texto secundário — cinza médio */
  textoSecundario: '#A0A0A8',
  /** Texto desabilitado */
  textoDesabilitado: '#555560',

  // ─── Destaque / Estado ───────────────────────────────────────────────────────
  /** Azul barbeiro: botão Google, chips informativos */
  azulBarbeiro: '#1E5AA7',
  /** Verde: status Confirmado */
  verde: '#3DBF6A',
  verdeClaro: '#3DBF6A22',
  /** Amarelo: pendente, aviso */
  amarelo: '#F0A500',
  amareloClaro: '#F0A50022',
  /** Vermelho de alerta/cancelado (diferente do primário) */
  erro: '#E53935',
  erroClaro: '#E5393522',

  // ─── Utilitários ─────────────────────────────────────────────────────────────
  transparente: 'transparent',
  branco: '#FFFFFF',
  preto: '#000000',
} as const;

export type CorChave = keyof typeof Colors;
