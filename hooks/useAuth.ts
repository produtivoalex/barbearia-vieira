import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface EstadoAuth {
  carregando: boolean;
  autenticado: boolean;
  session: Session | null;
}

export function useAuth(): EstadoAuth {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Carrega a sessão atual ao montar
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    // Escuta mudanças de estado (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return {
    carregando,
    autenticado: !!session,
    session,
  };
}
