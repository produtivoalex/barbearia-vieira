import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  duracao_minutos: number;
  ativo: boolean;
}

export function useServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarServicos = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .order('preco', { ascending: true });

    if (error) {
      setErro(error.message);
      setServicos([]);
    } else if (data) {
      setServicos(data as Servico[]);
    }

    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarServicos();
  }, [carregarServicos]);

  return { servicos, carregando, erro, recarregar: carregarServicos };
}
