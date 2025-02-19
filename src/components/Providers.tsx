'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { OwnerProvider } from '@/contexts/OwnerContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <OwnerProvider>
        {children}
      </OwnerProvider>
    </AuthProvider>
  );
}
