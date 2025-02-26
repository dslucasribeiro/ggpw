'use client';

import { useState, useEffect } from 'react';
import { FreeAccount, CreateFreeAccount } from '@/types/free-accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOwnerContext } from '@/contexts/OwnerContext';
import { supabase } from '@/lib/supabase';

interface FreeAccountFormProps {
  account?: FreeAccount;
  onClose: () => void;
}

const CLASSES = ['WR', 'MG', 'EA', 'WB', 'EP', 'VT', 'SE', 'MY', 'BR'];
const RANKS = ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Coronel', 'Marechal'];

export function FreeAccountForm({ account, onClose }: FreeAccountFormProps) {
  const { ownerId } = useOwnerContext();
  const [formData, setFormData] = useState<CreateFreeAccount>({
    idOwner: ownerId,
    login: '',
    password: '',
    class: '',
    level: 0,
    rank: '',
    password_bank: '',
    is_available: true
  });

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (account?.id) {
      const { error } = await supabase
        .from('free_accounts')
        .update(formData)
        .eq('id', account.id)
        .eq('idOwner', ownerId);

      if (error) {
        console.error('Erro ao atualizar conta:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('free_accounts')
        .insert([formData]);

      if (error) {
        console.error('Erro ao criar conta:', error);
        return;
      }
    }

    onClose();
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="login">Login</label>
          <Input
            id="login"
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password">Senha</label>
          <Input
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="class">Classe</label>
          <Select
            value={formData.class}
            onValueChange={(value) => setFormData({ ...formData, class: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a classe" />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="level">Nível</label>
          <Input
            id="level"
            type="number"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="rank">Rank</label>
          <Select
            value={formData.rank || ''}
            onValueChange={(value) => setFormData({ ...formData, rank: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o rank" />
            </SelectTrigger>
            <SelectContent>
              {RANKS.map((rank) => (
                <SelectItem key={rank} value={rank}>
                  {rank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="password_bank">Senha do Banco</label>
          <Input
            id="password_bank"
            value={formData.password_bank || ''}
            onChange={(e) => setFormData({ ...formData, password_bank: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {account ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
