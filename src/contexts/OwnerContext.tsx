'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface OwnerContextType {
  ownerId: number | null;
  loading: boolean;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: ReactNode }) {
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchOwnerId = async () => {
      if (!user) {
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
          return;
        }

        if (memberData) {
          setOwnerId(memberData.idOwner);
        }
      } catch (error) {
        console.error('Error in useOwner hook:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchOwnerId();
    }
  }, [user, authLoading]);

  return (
    <OwnerContext.Provider value={{ ownerId, loading: loading || authLoading }}>
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
