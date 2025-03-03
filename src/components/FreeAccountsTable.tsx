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
  onEdit: (account: FreeAccount | undefined) => void;
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

  const handleStatusChange = async (account: FreeAccount) => {
    try {
      const { error } = await supabase
        .from('free_accounts')
        .update({ is_available: !account.is_available })
        .eq('id', account.id);

      if (error) throw error;

      setAccounts(accounts.map(acc => 
        acc.id === account.id 
          ? { ...acc, is_available: !acc.is_available }
          : acc
      ));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (accountId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    
    try {
      const { error } = await supabase
        .from('free_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(accounts.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Input
          placeholder="Buscar por login, classe ou rank..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-transparent border-slate-800 text-slate-200 placeholder:text-slate-500"
        />
        <div className="flex gap-3">
          <Button
            onClick={() => onEdit(undefined)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Nova Conta
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Gerenciar Acesso
          </Button>
        </div>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-900/50">
              <TableHead className="text-slate-400">Login</TableHead>
              <TableHead className="text-slate-400">Senha</TableHead>
              <TableHead className="text-slate-400">Classe</TableHead>
              <TableHead className="text-slate-400">Nível</TableHead>
              <TableHead className="text-slate-400">Rank</TableHead>
              <TableHead className="text-slate-400">Senha do Banco</TableHead>
              <TableHead className="text-slate-400 text-center">Status</TableHead>
              <TableHead className="text-slate-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map((account) => (
              <TableRow key={account.id} className="border-slate-800 hover:bg-slate-900/50">
                <TableCell className="text-slate-300">{account.login}</TableCell>
                <TableCell className="text-slate-300 font-mono">{account.is_available ? account.password : '••••••••'}</TableCell>
                <TableCell className="text-slate-300">{account.class}</TableCell>
                <TableCell className="text-slate-300">{account.level}</TableCell>
                <TableCell className="text-slate-300">{account.rank}</TableCell>
                <TableCell className="text-slate-300 font-mono">{account.is_available ? account.password_bank : '••••••••'}</TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => handleStatusChange(account)}
                    className={`w-32 transition-colors ${
                      account.is_available 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' 
                        : 'bg-red-600 hover:bg-red-700 text-white border-0'
                    }`}
                    size="sm"
                  >
                    {account.is_available ? 'Disponível' : 'Indisponível'}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(account)}
                      className="hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                      className="hover:bg-slate-800 text-red-500 hover:text-red-600"
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
