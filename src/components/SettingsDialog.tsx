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
        .select('menu_settings, name_guild')
        .eq('idOwner', ownerId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        // Atualiza o nome do clã
        if (data.name_guild) {
          setNewClanName(data.name_guild);
          setClanName(data.name_guild);
        }

        // Mescla as configurações salvas com as configurações padrão
        if (data.menu_settings) {
          setMenuVisibility(defaultMenuVisibility.map(defaultMenu => ({
            ...defaultMenu,
            visible: data.menu_settings[defaultMenu.id] ?? defaultMenu.visible
          })));
        }
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
          .update({ 
            menu_settings: menuSettings,
            name_guild: newClanName 
          })
          .eq('id', existingSettings.id);

        if (updateError) {
          console.error('Erro ao atualizar configurações:', updateError);
          return;
        }
      } else {
        // Criar novas configurações
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({ 
            idOwner: ownerId, 
            menu_settings: menuSettings,
            name_guild: newClanName 
          });

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

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Solicitar funcionalidade
                  </label>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex flex-col gap-2">
                      <p className="text-slate-400 text-sm">
                        Fale diretamente com o desenvolvedor para solicitar uma funcionalidade
                      </p>
                      <button
                        onClick={() => window.open('https://wa.me/5591980145928', '_blank')}
                        className="w-full px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Entrar em contato
                      </button>
                    </div>
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
