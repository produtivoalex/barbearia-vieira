import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BarbeariaPublica } from '@/hooks/useBarbearias';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = '@barbearia/tenant-selecionado';

export interface TemaTenant {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  accent: string;
  frameColor: string;
  nomeTema?: string;
  [key: string]: string | undefined;
}

export const TEMA_PADRAO: TemaTenant = {
  primary: '#CBA14A',
  secondary: '#141416',
  background: '#0F0F10',
  card: '#18181B',
  text: '#FFFFFF',
  accent: '#F0D17D',
  frameColor: '#CBA14A',
  nomeTema: 'Ouro Imperial',
};

export const PALETAS_PREDEFINIDAS: {
  id: string;
  nome: string;
  descricao: string;
  primary: string;
  accent: string;
  frameColor: string;
  card: string;
}[] = [
  {
    id: 'ouro_imperial',
    nome: 'Ouro Imperial',
    descricao: 'Clássico requinte com tons dourados e preto ônix.',
    primary: '#CBA14A',
    accent: '#F0D17D',
    frameColor: '#CBA14A',
    card: '#18181B',
  },
  {
    id: 'rubi_barber',
    nome: 'Rubi Barber',
    descricao: 'Vermelho vibrante clássico de barbearia tradicional.',
    primary: '#E63946',
    accent: '#FF6B6B',
    frameColor: '#E63946',
    card: '#1C1516',
  },
  {
    id: 'esmeralda_luxo',
    nome: 'Esmeralda Luxo',
    descricao: 'Verde esmeralda sofisticado com acabamento nobre.',
    primary: '#2A9D8F',
    accent: '#52B788',
    frameColor: '#2A9D8F',
    card: '#141B1A',
  },
  {
    id: 'azul_royal',
    nome: 'Azul Royal / Safira',
    descricao: 'Azul profundo moderno e confiante.',
    primary: '#3182CE',
    accent: '#63B3ED',
    frameColor: '#3182CE',
    card: '#131820',
  },
  {
    id: 'cyberpunk_ametista',
    nome: 'Ametista Cyberpunk',
    descricao: 'Roxo néon de vanguarda e estilo urbano.',
    primary: '#8338EC',
    accent: '#C77DFF',
    frameColor: '#8338EC',
    card: '#181420',
  },
  {
    id: 'carbono_silver',
    nome: 'Carbono & Prata',
    descricao: 'Monocromático elegante e minimalista.',
    primary: '#E0E1DD',
    accent: '#778DA9',
    frameColor: '#E0E1DD',
    card: '#19191B',
  },
  {
    id: 'ambar_cobre',
    nome: 'Âmbar Cobre',
    descricao: 'Tons terrosos quentes e acabamento artesanal.',
    primary: '#E76F51',
    accent: '#F4A261',
    frameColor: '#E76F51',
    card: '#1D1715',
  },
];

interface BarbeariaContextValue {
  barbearia: BarbeariaPublica | null;
  tema: TemaTenant;
  carregando: boolean;
  jaEscolheuBarbearia: boolean;
  selecionarBarbearia: (barbearia: BarbeariaPublica) => Promise<void>;
  atualizarTemaLocal: (novoTema: Partial<TemaTenant>) => Promise<void>;
  limparBarbearia: () => Promise<void>;
}

const BarbeariaContext = createContext<BarbeariaContextValue | undefined>(undefined);

export function BarbeariaProvider({ children }: { children: React.ReactNode }) {
  const [barbearia, setBarbearia] = useState<BarbeariaPublica | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarSelecionada() {
      const valor = await AsyncStorage.getItem(STORAGE_KEY);
      if (valor) {
        setBarbearia(JSON.parse(valor) as BarbeariaPublica);
        return;
      }

      // No painel do barbeiro, seleciona automaticamente o primeiro vínculo ativo.
      const { data: usuario } = await supabase.auth.getUser();
      if (!usuario.user?.id) return;
      const { data: membro } = await supabase
        .from('barbearia_membros')
        .select(
          'barbearia:barbearia_id(id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema, publicada, status)'
        )
        .eq('usuario_id', usuario.user.id)
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();
      const relacao = (membro as { barbearia?: BarbeariaPublica | BarbeariaPublica[] } | null)?.barbearia;
      const estabelecimento = Array.isArray(relacao) ? relacao[0] : relacao;
      if (estabelecimento) {
        setBarbearia(estabelecimento);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(estabelecimento));
      }
    }

    carregarSelecionada()
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const selecionarBarbearia = useCallback(async (novaBarbearia: BarbeariaPublica) => {
    setBarbearia(novaBarbearia);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaBarbearia));
  }, []);

  const atualizarTemaLocal = useCallback(async (novoTema: Partial<TemaTenant>) => {
    setBarbearia((prev) => {
      if (!prev) return prev;
      const atualizado: BarbeariaPublica = {
        ...prev,
        tema: { ...(prev.tema ?? {}), ...(novoTema as Record<string, string>) },
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado)).catch(() => {});
      return atualizado;
    });
  }, []);

  const limparBarbearia = useCallback(async () => {
    setBarbearia(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const tema: TemaTenant = useMemo(() => {
    const custom = (barbearia?.tema ?? {}) as Record<string, string>;
    return {
      ...TEMA_PADRAO,
      ...custom,
      frameColor: custom.frameColor || custom.primary || TEMA_PADRAO.frameColor,
    };
  }, [barbearia?.tema]);

  const value = useMemo(
    () => ({
      barbearia,
      tema,
      carregando,
      jaEscolheuBarbearia: Boolean(barbearia?.id),
      selecionarBarbearia,
      atualizarTemaLocal,
      limparBarbearia,
    }),
    [barbearia, tema, carregando, selecionarBarbearia, atualizarTemaLocal, limparBarbearia]
  );

  return <BarbeariaContext.Provider value={value}>{children}</BarbeariaContext.Provider>;
}

export function useBarbearia() {
  const context = useContext(BarbeariaContext);
  if (!context) throw new Error('useBarbearia deve ser usado dentro de BarbeariaProvider');
  return context;
}
