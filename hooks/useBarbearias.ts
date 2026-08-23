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
  somenteVinculos?: boolean;
}

export function useBarbearias(filtros: FiltrosBarbearias = {}) {
  const [barbearias, setBarbearias] = useState<BarbeariaPublica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    if (filtros.somenteVinculos) {
      const { data: usuario } = await supabase.auth.getUser();
      const { data: vinculos, error: vinculosError } = await supabase
        .from('barbearia_membros')
        .select('barbearia_id')
        .eq('usuario_id', usuario.user?.id ?? '')
        .eq('ativo', true);
      if (vinculosError) setErro(vinculosError.message);
      const ids = (vinculos ?? []).map((item) => item.barbearia_id).filter(Boolean);
      if (!ids.length) {
        setBarbearias([]);
      } else {
        const { data, error } = await supabase
          .from('barbearias')
          .select('id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema')
          .in('id', ids)
          .order('nome');
        if (error) setErro(error.message);
        setBarbearias((data ?? []) as BarbeariaPublica[]);
      }
    } else {
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
    }
    setCarregando(false);
  }, [filtros.busca, filtros.cidade, filtros.bairro, filtros.latitude, filtros.longitude, filtros.raioKm, filtros.somenteVinculos]);

  useEffect(() => { carregar(); }, [carregar]);

  return { barbearias, carregando, erro, recarregar: carregar };
}

export async function buscarDetalheBarbearia(slug: string, somenteVinculos = false) {
  const { data, error } = await supabase.rpc('detalhe_barbearia_publica', { p_slug: slug });
  if (data || !somenteVinculos) return { barbearia: (data ?? null) as BarbeariaPublica | null, error };

  const { data: usuario } = await supabase.auth.getUser();
  const { data: vinculos, error: vinculosError } = await supabase
    .from('barbearia_membros')
    .select('barbearia_id')
    .eq('usuario_id', usuario.user?.id ?? '')
    .eq('ativo', true);
  const ids = (vinculos ?? []).map((item) => item.barbearia_id).filter(Boolean);
  const { data: estabelecimento, error: estabelecimentoError } = await supabase
    .from('barbearias')
    .select('id, slug, nome, descricao, cidade, bairro, endereco, telefone, whatsapp, logo_url, banner_url, fotos, tema')
    .eq('slug', slug)
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    .maybeSingle();
  if (!estabelecimento) return { barbearia: null, error: estabelecimentoError ?? vinculosError ?? error };

  const { data: servicos } = await supabase
    .from('servicos')
    .select('id, nome, descricao, preco')
    .eq('barbearia_id', estabelecimento.id)
    .eq('ativo', true)
    .order('ordem_exibicao')
    .order('nome');
  return { barbearia: { ...estabelecimento, servicos: servicos ?? [] }, error: null };
}
