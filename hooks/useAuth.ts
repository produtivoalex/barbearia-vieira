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
  // Inicia como carregando=true até termos a resposta do getSession
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true;

    // 1. Carrega a sessão existente ao montar
    supabase.auth.getSession().then(({ data }) => {
      if (!montado) return;
      setSession(data.session);
      setCarregando(false); // só para de carregar após getSession responder
    });

    // 2. Escuta mudanças (login, logout, refresh de token)
    // IMPORTANTE: não zeramos carregando aqui para não causar race condition;
    // o getSession já resolve o estado inicial.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!montado) return;
      setSession(newSession);
      // Garante que carregando seja false após qualquer evento de auth
      // (cobre casos onde getSession ainda não resolveu)
      setCarregando(false);
    });

    return () => {
      montado = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    carregando,
    autenticado: !!session,
    session,
  };
}
