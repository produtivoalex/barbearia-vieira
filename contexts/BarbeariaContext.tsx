import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { BarbeariaPublica } from '@/hooks/useBarbearias';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = '@barbearia/tenant-selecionado';

export interface TemaTenant {
  primary: string;
  secondary?: string;
  background?: string;
  card?: string;
  text?: string;
  secondaryText?: string;
  border?: string;
  accent: string;
  frameColor: string;
  nomeTema?: string;
  tipo?: 'predefinida' | 'personalizada';
  [key: string]: string | undefined;
}

export const TEMA_PADRAO: TemaTenant = {
  primary: '#CBA14A',
  secondary: '#141416',
  background: '#09090B',
  card: '#121215',
  text: '#F5F5F7',
  secondaryText: '#9898A2',
  border: 'rgba(255, 255, 255, 0.08)',
  accent: '#F0D17D',
  frameColor: '#CBA14A',
  nomeTema: 'Ouro Imperial',
  tipo: 'predefinida',
};

export const PALETAS_PREDEFINIDAS: {
  id: string;
  nome: string;
  descricao: string;
  primary: string;
  accent: string;
  frameColor: string;
  card: string;
  background: string;
  text: string;
}[] = [
  {
    id: 'ouro_imperial',
    nome: 'Ouro Imperial',
    descricao: 'Clássico requinte com tons dourados e preto ônix.',
    primary: '#CBA14A',
    accent: '#F0D17D',
    frameColor: '#CBA14A',
    card: '#121215',
    background: '#09090B',
    text: '#F5F5F7',
  },
  {
    id: 'rubi_barber',
    nome: 'Rubi Barber',
    descricao: 'Vermelho vibrante clássico de barbearia tradicional.',
    primary: '#E63946',
    accent: '#FF6B6B',
    frameColor: '#E63946',
    card: '#181314',
    background: '#0D0809',
    text: '#F5F5F7',
  },
  {
    id: 'esmeralda_luxo',
    nome: 'Esmeralda Luxo',
    descricao: 'Verde esmeralda sofisticado com acabamento nobre.',
    primary: '#2A9D8F',
    accent: '#52B788',
    frameColor: '#2A9D8F',
    card: '#111716',
    background: '#070C0B',
    text: '#F5F5F7',
  },
  {
    id: 'azul_royal',
    nome: 'Azul Royal & Safira',
    descricao: 'Azul profundo moderno, confiante e executivo.',
    primary: '#1E88E5',
    accent: '#64B5F6',
    frameColor: '#1E88E5',
    card: '#101620',
    background: '#070A10',
    text: '#F5F5F7',
  },
  {
    id: 'cyberpunk_ametista',
    nome: 'Ametista Cyberpunk',
    descricao: 'Roxo néon de vanguarda e estilo urbano futurista.',
    primary: '#8338EC',
    accent: '#C77DFF',
    frameColor: '#8338EC',
    card: '#161120',
    background: '#0A0612',
    text: '#F5F5F7',
  },
  {
    id: 'ambar_cobre',
    nome: 'Âmbar Cobre & Rústico',
    descricao: 'Tons terrosos quentes e acabamento artesanal em couro.',
    primary: '#E76F51',
    accent: '#F4A261',
    frameColor: '#E76F51',
    card: '#1B1411',
    background: '#0F0907',
    text: '#F5F5F7',
  },
  {
    id: 'carbono_silver',
    nome: 'Carbono Titanium',
    descricao: 'Monocromático elegante, minimalista e ultra-moderno.',
    primary: '#E0E1DD',
    accent: '#9BA1A6',
    frameColor: '#E0E1DD',
    card: '#161618',
    background: '#09090A',
    text: '#F5F5F7',
  },
  {
    id: 'rose_gold',
    nome: 'Rose Gold Elegance',
    descricao: 'Ouro rosa delicado, luxuoso e contemporâneo.',
    primary: '#E0A9AF',
    accent: '#F7D6D9',
    frameColor: '#E0A9AF',
    card: '#1A1316',
    background: '#0E080B',
    text: '#F5F5F7',
  },
  {
    id: 'midnight_bronze',
    nome: 'Midnight Bronze & Café',
    descricao: 'Bronze café intenso e acolhedor para ambientes refinados.',
    primary: '#CD7F32',
    accent: '#E5A65D',
    frameColor: '#CD7F32',
    card: '#181410',
    background: '#0D0A07',
    text: '#F5F5F7',
  },
  {
    id: 'mint_fresh',
    nome: 'Mint & Fresh Barber',
    descricao: 'Verde menta moderno e revigorante com alta vibração.',
    primary: '#00C49F',
    accent: '#5DF0D2',
    frameColor: '#00C49F',
    card: '#0F1816',
    background: '#060D0B',
    text: '#F5F5F7',
  },
  {
    id: 'stealth_black',
    nome: 'Total Black Stealth',
    descricao: 'Preto absoluto minimalista com detalhes em aço branco.',
    primary: '#FFFFFF',
    accent: '#D1D5DB',
    frameColor: '#FFFFFF',
    card: '#141416',
    background: '#050506',
    text: '#FFFFFF',
  },
  {
    id: 'sunset_solar',
    nome: 'Sunset Solar & Âmbar',
    descricao: 'Laranja pôr do sol enérgico, marcante e vibrante.',
    primary: '#FF7A00',
    accent: '#FFB03A',
    frameColor: '#FF7A00',
    card: '#1A140F',
    background: '#0E0905',
    text: '#F5F5F7',
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

const getStorageKey = (uid?: string) => uid ? `@barbearia/tenant-selecionado:${uid}` : '@barbearia/tenant-selecionado';

export function BarbeariaProvider({ children }: { children: React.ReactNode }) {
  const [barbearia, setBarbearia] = useState<BarbeariaPublica | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarSelecionada = useCallback(async () => {
    try {
      setCarregando(true);

      // Limpa qualquer chave legado não escopada que possa ter ficado em cache
      await AsyncStorage.removeItem('@barbearia/tenant-selecionado').catch(() => {});

      // 1. Obtém usuário autenticado
      const { data: usuario } = await supabase.auth.getUser();
      if (!usuario.user?.id) {
        setBarbearia(null);
        setCarregando(false);
        return;
      }

      const uid = usuario.user.id;
      const storageKeyUsuario = getStorageKey(uid);

      // 2. Verifica a última barbearia registrada no perfil ou no cache local
      const { data: perfil } = await supabase
        .from('perfis')
        .select('role, ultima_barbearia_id')
        .eq('id', uid)
        .maybeSingle();

      let barbeariaIdDesejada = perfil?.ultima_barbearia_id;

      if (!barbeariaIdDesejada) {
        const valorLocal = await AsyncStorage.getItem(storageKeyUsuario);
        if (valorLocal) {
          try {
            const parsed = JSON.parse(valorLocal) as BarbeariaPublica;
            if (parsed && parsed.id) {
              barbeariaIdDesejada = parsed.id;
            }
          } catch {}
        }
      }

      // 3. Se tiver uma barbearia desejada salva, carrega ela
      if (barbeariaIdDesejada) {
        const { data: estabSalvo } = await supabase
          .from('barbearias')
          .select('id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema, publicada, status, modo_agenda, dias_janela_agendamento, comissao_padrao, regras_fidelidade, mimo_ativo')
          .eq('id', barbeariaIdDesejada)
          .maybeSingle();

        if (estabSalvo && estabSalvo.id) {
          setBarbearia(estabSalvo as BarbeariaPublica);
          await AsyncStorage.setItem(storageKeyUsuario, JSON.stringify(estabSalvo));
          setCarregando(false);
          return;
        }
      }

      // 4. Se for barbeiro/proprietário, busca as barbearias onde é membro (priorizando a Vieira)
      const { data: membros } = await supabase
        .from('barbearia_membros')
        .select(
          'barbearia:barbearia_id(id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema, publicada, status, modo_agenda, dias_janela_agendamento, comissao_padrao, regras_fidelidade, mimo_ativo)'
        )
        .eq('usuario_id', uid)
        .eq('ativo', true);

      if (membros && membros.length > 0) {
        const listaMembros = membros
          .map((m: any) => (Array.isArray(m.barbearia) ? m.barbearia[0] : m.barbearia))
          .filter(Boolean);

        // Prioriza a Barbearia Vieira se o usuário for membro dela
        const vieiraMembro = listaMembros.find((b: any) => b.slug === 'barbearia-vieira');
        const estabEscolhido = vieiraMembro || listaMembros[0];

        if (estabEscolhido && estabEscolhido.id) {
          setBarbearia(estabEscolhido);
          await AsyncStorage.setItem(storageKeyUsuario, JSON.stringify(estabEscolhido));
          setCarregando(false);
          return;
        }
      }

      // 5. Fallback geral: Sempre seleciona a Barbearia Vieira Matriz
      const { data: barbeariaPadrao } = await supabase
        .from('barbearias')
        .select(
          'id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema, publicada, status, modo_agenda, dias_janela_agendamento, comissao_padrao, regras_fidelidade, mimo_ativo'
        )
        .eq('slug', 'barbearia-vieira')
        .maybeSingle();

      if (barbeariaPadrao && barbeariaPadrao.id) {
        setBarbearia(barbeariaPadrao as BarbeariaPublica);
        await AsyncStorage.setItem(storageKeyUsuario, JSON.stringify(barbeariaPadrao));
        await supabase.from('perfis').update({ ultima_barbearia_id: barbeariaPadrao.id }).eq('id', uid);
        setCarregando(false);
        return;
      }

      setBarbearia(null);

      // Cliente novo ou sem barbearia vinculada -> Permanece null para ser direcionado à vitrine
      setBarbearia(null);
    } catch (err) {
      console.warn('[BarbeariaContext] Erro ao carregar barbearia selecionada:', err);
      setBarbearia(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarSelecionada();

    // Reage a logins e trocas de conta
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        carregarSelecionada();
      } else if (event === 'SIGNED_OUT') {
        setBarbearia(null);
        AsyncStorage.removeItem('@barbearia/tenant-selecionado').catch(() => {});
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [carregarSelecionada]);

  const selecionarBarbearia = useCallback(async (novaBarbearia: BarbeariaPublica) => {
    setBarbearia(novaBarbearia);
    try {
      const { data: usuario } = await supabase.auth.getUser();
      if (usuario.user?.id) {
        const storageKeyUsuario = getStorageKey(usuario.user.id);
        await AsyncStorage.setItem(storageKeyUsuario, JSON.stringify(novaBarbearia));

        if (novaBarbearia?.id) {
          await supabase
            .from('perfis')
            .update({ ultima_barbearia_id: novaBarbearia.id })
            .eq('id', usuario.user.id);
        }
      }
    } catch (err) {
      console.warn('[BarbeariaContext] Falha ao persistir ultima_barbearia_id:', err);
    }
  }, []);

  const atualizarTemaLocal = useCallback(async (novoTema: Partial<TemaTenant>) => {
    setBarbearia((prev) => {
      if (!prev) return prev;
      const atualizado: BarbeariaPublica = {
        ...prev,
        tema: { ...(prev.tema ?? {}), ...(novoTema as Record<string, string>) },
      };
      supabase.auth.getUser().then(({ data: usuario }) => {
        if (usuario.user?.id) {
          AsyncStorage.setItem(getStorageKey(usuario.user.id), JSON.stringify(atualizado)).catch(() => {});
        }
      }).catch(() => {});
      return atualizado;
    });
  }, []);

  const limparBarbearia = useCallback(async () => {
    setBarbearia(null);
    try {
      const { data: usuario } = await supabase.auth.getUser();
      if (usuario.user?.id) {
        await AsyncStorage.removeItem(getStorageKey(usuario.user.id));
      }
    } catch {}
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
