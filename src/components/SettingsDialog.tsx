'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useSettings } from '@/store/settings';
import { supabase } from '@/lib/supabase';
import { useOwnerContext } from '@/contexts/OwnerContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface MenuVisibility {
  id: string;
  label: string;
  visible: boolean;
}

const defaultMenuVisibility: MenuVisibility[] = [
  { id: 'players', label: 'Players', visible: true },
  { id: 'guerra', label: 'Guerra', visible: true },
  { id: 'eventos', label: 'Eventos', visible: true },
  { id: 'bank', label: 'Bank Clã', visible: true },
];

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { clanName, setClanName } = useSettings();
  const [newClanName, setNewClanName] = useState(clanName);
  const { ownerId } = useOwnerContext();
  const [menuVisibility, setMenuVisibility] = useState<MenuVisibility[]>(defaultMenuVisibility);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && ownerId) {
      loadSettings();
    }
  }, [open, ownerId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('menu_settings')
        .eq('idOwner', ownerId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data?.menu_settings) {
        // Mescla as configurações salvas com as configurações padrão
        setMenuVisibility(defaultMenuVisibility.map(defaultMenu => ({
          ...defaultMenu,
          visible: data.menu_settings[defaultMenu.id] ?? defaultMenu.visible
        })));
      } else {
        // Se não houver configurações, usa as padrões
        setMenuVisibility(defaultMenuVisibility);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ownerId || isLoading) return;

    try {
      // Salvar nome do clã
      setClanName(newClanName);

      // Preparar as configurações dos menus
      const menuSettings = menuVisibility.reduce((acc, menu) => ({
        ...acc,
        [menu.id]: menu.visible
      }), {});

      // Buscar configuração existente
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('idOwner', ownerId)
        .maybeSingle();

      if (existingSettings) {
        // Atualizar configurações existentes
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({ menu_settings: menuSettings })
          .eq('id', existingSettings.id);

        if (updateError) {
          console.error('Erro ao atualizar configurações:', updateError);
          return;
        }
      } else {
        // Criar novas configurações
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert([{
            idOwner: ownerId,
            menu_settings: menuSettings
          }]);

        if (insertError) {
          console.error('Erro ao criar configurações:', insertError);
          return;
        }
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const toggleMenuVisibility = (menuId: string) => {
    setMenuVisibility(prevMenus =>
      prevMenus.map(menu =>
        menu.id === menuId
          ? { ...menu, visible: !menu.visible }
          : menu
      )
    );
  };

  if (isLoading) {
    return null; // ou um componente de loading
  }

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-dark-card border border-white/5 p-6 shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white mb-4"
                >
                  Configurações
                </Dialog.Title>

                <div className="mt-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Nome do Clã
                  </label>
                  <input
                    type="text"
                    value={newClanName}
                    onChange={(e) => setNewClanName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Visibilidade dos Menus
                  </label>
                  <div className="space-y-2">
                    {menuVisibility.map((menu) => (
                      <div
                        key={menu.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-white">{menu.label}</span>
                        <button
                          onClick={() => toggleMenuVisibility(menu.id)}
                          className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                          {menu.visible ? (
                            <EyeIcon className="w-5 h-5" />
                          ) : (
                            <EyeSlashIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium bg-gradient-purple text-white rounded-lg hover:opacity-90 transition-all"
                    onClick={handleSave}
                  >
                    Salvar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
