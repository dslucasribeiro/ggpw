'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useAccessControl() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Se ainda está carregando a autenticação ou não há usuário, não faz nada
      if (authLoading || !user?.email) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('players')
          .select('posicao, special_access')
          .eq('email', user.email)
          .single();

        if (error) {
          console.error('Error checking access:', error);
          setHasAccess(false);
        } else {
          // Verifica se é Marechal OU tem special_access
          setHasAccess(data?.posicao === 'Marechal' || data?.special_access === true);
        }
      } catch (error) {
        console.error('Error in useAccessControl:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, authLoading]);

  return { hasAccess, loading };
}
