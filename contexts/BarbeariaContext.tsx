import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BarbeariaPublica } from '@/hooks/useBarbearias';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = '@barbearia/tenant-selecionado';

interface BarbeariaContextValue {
  barbearia: BarbeariaPublica | null;
  tema: Record<string, string>;
  carregando: boolean;
  selecionarBarbearia: (barbearia: BarbeariaPublica) => Promise<void>;
  limparBarbearia: () => Promise<void>;
}

const BarbeariaContext = createContext<BarbeariaContextValue | undefined>(undefined);
const TEMA_PADRAO = { primary: '#CBA14A', secondary: '#141416', background: '#0F0F10', text: '#FFFFFF', accent: '#F0D17D' };

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
        .select('barbearia:barbearia_id(id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema)')
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

  const limparBarbearia = useCallback(async () => {
    setBarbearia(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const tema = useMemo(() => ({ ...TEMA_PADRAO, ...(barbearia?.tema ?? {}) }), [barbearia?.tema]);
  const value = useMemo(() => ({ barbearia, tema, carregando, selecionarBarbearia, limparBarbearia }), [barbearia, tema, carregando, selecionarBarbearia, limparBarbearia]);
  return <BarbeariaContext.Provider value={value}>{children}</BarbeariaContext.Provider>;
}

export function useBarbearia() {
  const context = useContext(BarbeariaContext);
  if (!context) throw new Error('useBarbearia deve ser usado dentro de BarbeariaProvider');
  return context;
}
