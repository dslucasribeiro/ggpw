'use client';

import { useState, useEffect } from 'react';
import { FreeAccount } from '@/types/free-accounts';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOwnerContext } from '@/contexts/OwnerContext';
import { supabase } from '@/lib/supabase';
import { useAccessControl } from '@/hooks/useAccessControl';

interface FreeAccountsTableProps {
  accounts: FreeAccount[];
  onEdit: (account: FreeAccount) => void;
}

export function FreeAccountsTable({ accounts: initialAccounts, onEdit }: FreeAccountsTableProps) {
  const { ownerId } = useOwnerContext();
  const { hasAccess, loading } = useAccessControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!hasAccess && !loading) {
      setShowError(true);
    }
  }, [hasAccess, loading]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!hasAccess) {
    if (showError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Acesso negado!</strong>
          <span className="block sm:inline"> Você não tem permissão para acessar esta página.</span>
          
        </div>
      );
    }
    return null;
  }

  const filteredAccounts = accounts.filter(account => 
    account.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.rank?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por login, classe ou rank..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Login</TableHead>
            <TableHead>Senha</TableHead>
            <TableHead>Classe</TableHead>
            <TableHead>Nível</TableHead>
            <TableHead>Rank</TableHead>
            <TableHead>Senha do Banco</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAccounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>{account.login}</TableCell>
              <TableCell>{account.is_available ? account.password : '••••••••'}</TableCell>
              <TableCell>{account.class}</TableCell>
              <TableCell>{account.level}</TableCell>
              <TableCell>{account.rank}</TableCell>
              <TableCell>{account.is_available ? account.password_bank : '••••••••'}</TableCell>
              <TableCell>
                <span className={account.is_available ? 'text-green-500' : 'text-red-500'}>
                  {account.is_available ? 'Disponível' : 'Indisponível'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(account)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
