'use client';

import { useState, useEffect } from 'react';
import { FreeAccount } from '@/types/free-accounts';
import { FreeAccountsTable } from '@/components/FreeAccountsTable';
import { FreeAccountForm } from '@/components/FreeAccountForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOwnerContext } from '@/contexts/OwnerContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function FreeAccountsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { ownerId } = useOwnerContext();
  const [accounts, setAccounts] = useState<FreeAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FreeAccount | undefined>();

  // Redireciona para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchAccounts = async () => {
    if (!ownerId) return;

    const { data, error } = await supabase
      .from('free_accounts')
      .select('*')
      .eq('idOwner', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contas:', error);
      return;
    }

    setAccounts(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [ownerId]);

  const handleEdit = (account: FreeAccount | undefined) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedAccount(undefined);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAccount(undefined);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas 0800</h1>
      </div>

      <FreeAccountsTable
        accounts={accounts}
        onEdit={handleEdit}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? 'Editar Conta' : 'Nova Conta'}
            </DialogTitle>
          </DialogHeader>
          <FreeAccountForm
            account={selectedAccount}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
