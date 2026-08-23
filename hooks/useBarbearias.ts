import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface BarbeariaPublica {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  cidade: string | null;
  bairro: string | null;
  endereco: string | null;
  telefone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  banner_url: string | null;
  fotos: unknown[];
  distancia_km?: number | null;
  total_resultados?: number;
  servicos?: Array<{ id: string; nome: string; descricao: string | null; preco: number }>;
  tema?: Record<string, string> | null;
}

export interface FiltrosBarbearias {
  busca?: string;
  cidade?: string;
  bairro?: string;
  latitude?: number;
  longitude?: number;
  raioKm?: number;
}

export function useBarbearias(filtros: FiltrosBarbearias = {}) {
  const [barbearias, setBarbearias] = useState<BarbeariaPublica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase.rpc('buscar_barbearias', {
      p_busca: filtros.busca?.trim() || null,
      p_cidade: filtros.cidade?.trim() || null,
      p_bairro: filtros.bairro?.trim() || null,
      p_latitude: filtros.latitude ?? null,
      p_longitude: filtros.longitude ?? null,
      p_raio_km: filtros.raioKm ?? null,
      p_pagina: 1,
      p_por_pagina: 30,
    });
    if (error) setErro(error.message);
    setBarbearias((data ?? []) as BarbeariaPublica[]);
    setCarregando(false);
  }, [filtros.busca, filtros.cidade, filtros.bairro, filtros.latitude, filtros.longitude, filtros.raioKm]);

  useEffect(() => { carregar(); }, [carregar]);

  return { barbearias, carregando, erro, recarregar: carregar };
}

export async function buscarDetalheBarbearia(slug: string) {
  const { data, error } = await supabase.rpc('detalhe_barbearia_publica', { p_slug: slug });
  return { barbearia: (data ?? null) as BarbeariaPublica | null, error };
}
