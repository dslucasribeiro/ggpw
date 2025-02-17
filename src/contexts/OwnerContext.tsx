import { createContext, useContext, ReactNode } from 'react';
import { useOwner } from '@/hooks/useOwner';

interface OwnerContextType {
  ownerId: number | null;
  loading: boolean;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export function OwnerProvider({ children }: { children: ReactNode }) {
  const { ownerId, loading } = useOwner();

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
