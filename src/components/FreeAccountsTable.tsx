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
import { Pencil, Trash2, Image as ImageIcon, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOwnerContext } from '@/contexts/OwnerContext';
import { supabase } from '@/lib/supabase';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Player {
  id: number;
  nick: string;
  special_access: boolean;
}

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
  const [selectedAccount, setSelectedAccount] = useState<FreeAccount | null>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!hasAccess && !loading) {
      setShowError(true);
    }
  }, [hasAccess, loading]);

  const fetchPlayers = async () => {
    if (!ownerId) return;
    
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, nick, special_access')
        .eq('idOwner', ownerId)
        .order('nick');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Erro ao buscar players:', error);
    }
  };

  const handleAccessClick = async (playerId: number, newAccessState: boolean) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ special_access: newAccessState })
        .eq('id', playerId)
        .eq('idOwner', ownerId);

      if (error) throw error;

      setPlayers(players.map(player => 
        player.id === playerId 
          ? { ...player, special_access: newAccessState }
          : player
      ));
    } catch (error) {
      console.error('Erro ao atualizar acesso:', error);
    }
  };

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

  const handleDeleteImage = async () => {
    if (!selectedAccount?.image_url) return;

    try {
      // Extrai o nome do arquivo da URL
      const fileName = selectedAccount.image_url.split('/').pop();
      if (!fileName) return;

      // Remove a imagem do bucket
      const { error: storageError } = await supabase.storage
        .from('print_account')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Atualiza o registro no banco removendo a URL da imagem
      const { error: dbError } = await supabase
        .from('free_accounts')
        .update({ image_url: null })
        .eq('id', selectedAccount.id)
        .eq('idOwner', ownerId);

      if (dbError) throw dbError;

      // Fecha o modal e recarrega a página
      setPreviewImage(null);
      setSelectedAccount(null);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
    }
  };

  const handleImageClick = (account: FreeAccount) => {
    setSelectedAccount(account);
    setPreviewImage(account.image_url);
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
            onClick={() => {
              setIsAccessModalOpen(true);
              fetchPlayers();
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Gerenciar Acesso
          </Button>
        </div>
      </div>

      <Dialog open={isAccessModalOpen} onOpenChange={setIsAccessModalOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Gerenciar Acesso aos Players</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-900/50">
                    <TableHead className="text-slate-400">Nick</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => (
                    <TableRow key={player.id} className="border-slate-800 hover:bg-slate-900/50">
                      <TableCell className="text-slate-300">{player.nick}</TableCell>
                      <TableCell className="text-slate-300">
                        {player.special_access ? 'Acesso Liberado' : 'Sem Acesso'}
                      </TableCell>
                      <TableCell>
                        {player.special_access ? (
                          <Button
                            onClick={() => handleAccessClick(player.id, false)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Bloquear
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleAccessClick(player.id, true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            size="sm"
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Liberar Acesso
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <TableHead className="text-slate-400">Print Conta</TableHead>
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
                  {account.image_url ? (
                    <div className="relative w-12 h-12 cursor-pointer" onClick={() => handleImageClick(account)}>
                      <img 
                        src={account.image_url} 
                        alt={`Print da conta ${account.login}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
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
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setPreviewImage(null);
            setSelectedAccount(null);
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImage} 
              alt="Print da conta em tamanho maior"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                onClick={handleDeleteImage}
                title="Excluir imagem"
              >
                <Trash2 className="h-6 w-6" />
              </button>
              <button
                className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                onClick={() => {
                  setPreviewImage(null);
                  setSelectedAccount(null);
                }}
                title="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
