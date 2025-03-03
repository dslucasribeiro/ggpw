'use client';

import { useState } from 'react';
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
import { Image as ImageIcon } from 'lucide-react';

interface FreeAccountFormProps {
  account?: FreeAccount;
  onClose: () => void;
}

const DEFAULT_CLASSES = ['WR', 'MG', 'EA', 'EP', 'WB', 'WF'];
const RANKS = ['1', '2', '3', '4', '5'];

export function FreeAccountForm({ account, onClose }: FreeAccountFormProps) {
  const { ownerId } = useOwnerContext();
  const [formData, setFormData] = useState<CreateFreeAccount>({
    idOwner: ownerId || null,
    login: account?.login || '',
    password: account?.password || '',
    class: account?.class || '',
    level: account?.level || 0,
    rank: account?.rank || '',
    password_bank: account?.password_bank || '',
    is_available: account?.is_available ?? true,
    image_url: account?.image_url || null
  });
  const [newClass, setNewClass] = useState('');
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [showNewClassInput, setShowNewClassInput] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    const fileExt = selectedImage.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      setUploading(true);

      const { error: uploadError } = await supabase.storage
        .from('print_account')
        .upload(filePath, selectedImage);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('print_account')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = formData.image_url;
    
    if (selectedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl) {
        console.error('Falha ao fazer upload da imagem');
        return;
      }
    }

    if (account?.id) {
      // Se estiver editando
      const updateData = {
        ...formData,
        image_url: imageUrl
      };

      const { error } = await supabase
        .from('free_accounts')
        .update(updateData)
        .eq('id', account.id)
        .eq('idOwner', ownerId);

      if (error) {
        console.error('Erro ao atualizar conta:', error);
        return;
      }
    } else {
      const dataToSend = {
        ...formData,
        image_url: imageUrl
      };

      const { error } = await supabase
        .from('free_accounts')
        .insert([dataToSend]);

      if (error) {
        console.error('Erro ao criar conta:', error);
        return;
      }
    }

    onClose();
  };

  const handleAddNewClass = () => {
    if (newClass && !classes.includes(newClass)) {
      setClasses([...classes, newClass]);
      setFormData({ ...formData, class: newClass });
      setNewClass('');
      setShowNewClassInput(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#0B1120] p-6 rounded-lg text-white">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="login" className="text-sm font-medium">Login</label>
          <Input
            id="login"
            value={formData.login}
            onChange={(e) => setFormData({ ...formData, login: e.target.value })}
            required={!account}
            className="bg-[#1A2332] border-[#2A3441] text-white"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Senha</label>
          <Input
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!account}
            className="bg-[#1A2332] border-[#2A3441] text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Classe</label>
          {showNewClassInput ? (
            <div className="flex gap-2">
              <Input
                value={newClass}
                onChange={(e) => setNewClass(e.target.value.toUpperCase())}
                className="bg-[#1A2332] border-[#2A3441] text-white"
                placeholder="Nova classe..."
              />
              <Button 
                type="button" 
                onClick={handleAddNewClass}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Adicionar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select
                value={formData.class}
                onValueChange={(value) => setFormData({ ...formData, class: value })}
              >
                <SelectTrigger className="bg-[#1A2332] border-[#2A3441] text-white w-44 h-6">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A2332] border-[#2A3441] text-white">
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls} className="text-white hover:bg-[#2A3441]">
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={() => setShowNewClassInput(true)}
                className="bg-green-600 hover:bg-green-700 w-10 h-6"
              >
                Nova
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="level" className="text-sm font-medium">Nível</label>
          <Input
            id="level"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.level}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setFormData({ ...formData, level: parseInt(value) || 0 });
            }}
            required={!account}
            className="bg-[#1A2332] border-[#2A3441] text-white"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="rank" className="text-sm font-medium">Rank</label>
          <Select
            value={formData.rank || ''}
            onValueChange={(value) => setFormData({ ...formData, rank: value })}
          >
            <SelectTrigger className="bg-[#1A2332] border-[#2A3441] text-white w-44 h-6">
              <SelectValue placeholder="Rank do personagem" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A2332] border-[#2A3441] text-white">
              {RANKS.map((rank) => (
                <SelectItem key={rank} value={rank} className="text-white hover:bg-[#2A3441]">
                  {rank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="password_bank" className="text-sm font-medium">Senha do Banco</label>
          <Input
            id="password_bank"
            value={formData.password_bank || ''}
            onChange={(e) => setFormData({ ...formData, password_bank: e.target.value })}
            className="bg-[#1A2332] border-[#2A3441] text-white"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="image" className="text-sm font-medium">Print da Conta</label>
          <div className="flex gap-2 items-center">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => document.getElementById('image')?.click()}
              className="bg-[#1A2332] border-[#2A3441] text-white hover:bg-[#2A3441] w-full h-9 flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              {selectedImage ? selectedImage.name : 'Selecionar imagem'}
            </Button>
          </div>
          {formData.image_url && !selectedImage && (
            <p className="text-xs text-gray-400">Imagem atual: {formData.image_url.split('/').pop()}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="border-[#2A3441] text-white hover:bg-[#2A3441]"
          disabled={uploading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={uploading}
        >
          {uploading ? 'Enviando...' : account ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
