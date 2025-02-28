'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { usePathname } from 'next/navigation';

interface OwnerContextType {
  ownerId: number | null;
  loading: boolean;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: ReactNode }) {
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const fetchOwnerId = async () => {
      // Se não houver usuário ou estiver na página de login, limpa o estado
      if (!user || pathname === '/') {
        setOwnerId(null);
        setLoading(false);
        return;
      }

      try {
        const { data: memberData, error } = await supabase
          .from('member')
          .select('idOwner')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching owner ID:', error);
          setOwnerId(null);
        } else if (memberData) {
          setOwnerId(memberData.idOwner);
        } else {
          setOwnerId(null);
        }
      } catch (error) {
        console.error('Error in useOwner hook:', error);
        setOwnerId(null);
      } finally {
        setLoading(false);
      }
    };

    // Só executa a busca se não estiver carregando a autenticação
    if (!authLoading) {
      fetchOwnerId();
    }
  }, [user, authLoading, pathname]);

  // Limpa o estado quando o usuário faz logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setOwnerId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <OwnerContext.Provider value={{ ownerId, loading }}>
      {children}
    </OwnerContext.Provider>
  );
}

export function useOwnerContext() {
  const context = useContext(OwnerContext);
  if (context === undefined) {
    throw new Error('useOwnerContext must be used within an OwnerProvider');
  }
  return context;
}
