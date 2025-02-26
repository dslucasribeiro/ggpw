'use client';

import { useState } from 'react';
import { FreeAccount } from '@/types/free-accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { useOwnerContext } from '@/contexts/OwnerContext';
import { supabase } from '@/lib/supabase';

interface FreeAccountsTableProps {
  accounts: FreeAccount[];
  onEdit: (account: FreeAccount) => void;
}

export function FreeAccountsTable({ accounts, onEdit }: FreeAccountsTableProps) {
  const { ownerId } = useOwnerContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAccounts = accounts.filter(account => 
    account.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.rank?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;

    const { error } = await supabase
      .from('free_accounts')
      .delete()
      .eq('id', id)
      .eq('idOwner', ownerId);

    if (error) {
      console.error('Erro ao deletar conta:', error);
      return;
    }

    window.location.reload();
  };

  const toggleAvailability = async (account: FreeAccount) => {
    const { error } = await supabase
      .from('free_accounts')
      .update({ is_available: !account.is_available })
      .eq('id', account.id)
      .eq('idOwner', ownerId);

    if (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      return;
    }

    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por login, classe ou rank..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
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
                <TableCell>{account.password}</TableCell>
                <TableCell>{account.class}</TableCell>
                <TableCell>{account.level}</TableCell>
                <TableCell>{account.rank}</TableCell>
                <TableCell>{account.password_bank}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    className={`w-28 ${
                      account.is_available
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
                    onClick={() => toggleAvailability(account)}
                  >
                    {account.is_available ? 'Disponível' : 'Indisponível'}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(account)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
