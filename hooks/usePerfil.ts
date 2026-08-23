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
  const [isBloqueado, setIsBloqueado] = useState(false);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      if (!session?.user?.id) {
        setPerfil(null);
        setIsBloqueado(false);
        setCarregandoPerfil(false);
        return;
      }

      setCarregandoPerfil(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const emailUsuario = (session.user.email || '').toLowerCase().trim();
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

        // Verifica se o cliente está na lista negra (bloqueios_clientes)
        const telLimpo = (data.telefone || '').replace(/\D/g, '');
        const { data: bloqueio } = await supabase
          .from('bloqueios_clientes')
          .select('id')
          .or(`cliente_id.eq.${session.user.id},email.eq.${emailUsuario}${telLimpo ? `,telefone.eq.${telLimpo}` : ''}`)
          .maybeSingle();

        setIsBloqueado(!!bloqueio);
      } else {
        // Fallback transitório caso o perfil ainda esteja sendo criado pelo trigger
        setPerfil({
          id: session.user.id,
          nome_completo: nomeMeta,
          telefone: null,
          role: 'cliente',
        });
        setIsBloqueado(false);
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

  return { perfil, isBloqueado, carregandoPerfil, atualizarPerfil };
}
