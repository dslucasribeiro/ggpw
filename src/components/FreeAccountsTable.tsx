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
    (account.rank?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
        className="max-w-sm bg-[#1A2332] border-[#2A3441] text-white"
      />
      <div className="rounded-lg border border-[#2A3441] bg-[#0B1120]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2A3441] hover:bg-[#1A2332]">
              <TableHead className="text-white">Login</TableHead>
              <TableHead className="text-white">Senha</TableHead>
              <TableHead className="text-white">Classe</TableHead>
              <TableHead className="text-white">Nível</TableHead>
              <TableHead className="text-white">Rank</TableHead>
              <TableHead className="text-white">Senha do Banco</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <TableRow key={account.id} className="border-[#2A3441] hover:bg-[#1A2332]">
                <TableCell className="text-white">{account.login}</TableCell>
                <TableCell className="text-white">{account.password}</TableCell>
                <TableCell className="text-white">{account.class}</TableCell>
                <TableCell className="text-white">{account.level}</TableCell>
                <TableCell className="text-white">{account.rank}</TableCell>
                <TableCell className="text-white">{account.password_bank}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    className={`w-28 ${
                      account.is_available
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
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
                      className="hover:bg-[#2A3441] text-blue-500 hover:text-blue-400"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                      className="hover:bg-[#2A3441] text-red-500 hover:text-red-400"
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
