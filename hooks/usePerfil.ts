import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface Perfil {
  id: string;
  nome_completo: string | null;
  telefone: string | null;
  role: 'cliente' | 'barbeiro';
}

export function usePerfil() {
  const { session } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      if (!session?.user?.id) {
        setPerfil(null);
        setCarregandoPerfil(false);
        return;
      }

      setCarregandoPerfil(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const nomeMeta =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.user_metadata?.nome_completo ||
        session.user.email?.split('@')[0] ||
        'Cliente Vieira';

      if (!error && data) {
        setPerfil({
          ...data,
          nome_completo: data.nome_completo || nomeMeta,
        } as Perfil);
      } else {
        // Fallback transitório caso o perfil ainda esteja sendo criado pelo trigger
        setPerfil({
          id: session.user.id,
          nome_completo: nomeMeta,
          telefone: null,
          role: 'cliente',
        });
      }
      setCarregandoPerfil(false);
    }

    carregarPerfil();
  }, [session?.user?.id, session?.user?.user_metadata, session?.user?.email]);

  async function atualizarPerfil(updates: Partial<Perfil>) {
    if (!session?.user?.id) return { error: new Error('Não autenticado') };
    
    const { error } = await supabase
      .from('perfis')
      .update(updates)
      .eq('id', session.user.id);
      
    if (!error) {
      setPerfil((prev) => prev ? { ...prev, ...updates } : null);
    }
    return { error };
  }

  return { perfil, carregandoPerfil, atualizarPerfil };
}
