'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Settings, ChevronLeft, ChevronRight, ShieldAlert, Calendar, Coins, LogOut, GraduationCap, Store } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useSettings } from '@/store/settings';
import SettingsDialog from './SettingsDialog';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useOwnerContext } from '@/contexts/OwnerContext';

const menuItems = [
  { 
    id: 'players', 
    name: 'Players', 
    href: '/players', 
    icon: Users,
    subItems: [
      { name: 'Lista de Players', href: '/players' },
      { name: 'Contas 0800', href: '/players/free-accounts' }
    ]
  },
  { 
    id: 'guerra',
    name: 'Guerra', 
    href: '/war', 
    icon: ShieldAlert,
    subItems: [
      { name: 'Confirmados', href: '/war/confirmed' },
      { 
        name: 'Formação', 
        href: '/war/formation/[tw_id]', 
      },
      { name: 'Estratégia', href: '/war/strategy' },
    ]
  },
  { 
    id: 'eventos',
    name: 'Eventos', 
    href: '/events', 
    icon: Calendar,
    subItems: [
      { name: 'Lista de Eventos', href: '/events/list' },
      { name: 'Total Geral', href: '/events/total' },
      { name: 'Artes Marciais', href: '/events/martial-arts' },
      { name: 'Feras Sombrias', href: '/events/dark-beasts' },
      { name: 'Tigres Celestiais', href: '/events/celestial-tigers' },
      { name: 'World Boss', href: '/events/world-boss' },
      { name: 'GVG', href: '/events/gvg' },
      { name: 'TW', href: '/events/tw' },
    ]
  },
  { 
    id: 'tutoria',
    name: 'Tutoria',
    href: '/tutoria',
    icon: GraduationCap
  },
  { 
    id: 'comercio',
    name: 'Comércio',
    href: '/comercio',
    icon: Store
  },
  {
    id: 'bank',
    name: 'Bank Clã',
    href: '/bank',
    icon: Coins,
    subItems: [
      { name: 'Caixa Clã', href: '/bank/cash' },
      { name: 'Fila 35k', href: '/bank/queue' },
      { name: 'Retiradas', href: '/bank/withdrawals' },
    ]
  },
];

interface MenuSettings {
  [key: string]: boolean;
}

const defaultMenuSettings: MenuSettings = {
  players: true,
  guerra: true,
  eventos: true,
  bank: true,
  tutoria: true,
  comercio: true
};

export default function Sidebar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { clanName, setClanName } = useSettings();
  const { ownerId, loading: ownerLoading } = useOwnerContext();
  const [menuSettings, setMenuSettings] = useState<MenuSettings>(defaultMenuSettings);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!ownerId) return;

        const { data, error } = await supabase
          .from('user_settings')
          .select('name_guild')
          .eq('idOwner', ownerId)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar nome do clã:', error);
          return;
        }

        if (data?.name_guild) {
          setClanName(data.name_guild);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    loadSettings();
  }, [ownerId, setClanName]);

  useEffect(() => {
    if (isAuthenticated && !ownerLoading && ownerId) {
      loadMenuSettings();
    }
  }, [isAuthenticated, ownerLoading, ownerId]);

  useEffect(() => {
    // Adiciona evento para limpar autenticação quando fechar o navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        supabase.auth.signOut();
      });
    }
  }, []);

  const loadMenuSettings = async () => {
    try {
      setIsLoadingSettings(true);

      if (!ownerId) {
        console.log('Sem ownerId disponível, usando configurações padrão');
        setMenuSettings(defaultMenuSettings);
        return;
      }

      // Primeiro, vamos buscar todos os registros para este owner
      const { data: allSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('idOwner', ownerId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erro ao carregar configurações dos menus:', fetchError.message);
        setMenuSettings(defaultMenuSettings);
        return;
      }

      // Se não encontrou nenhum registro
      if (!allSettings || allSettings.length === 0) {
        console.log('Nenhuma configuração encontrada, criando padrão');
        
        // Criar novo registro com configurações padrão
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert([{
            idOwner: ownerId,
            menu_settings: defaultMenuSettings
          }]);

        if (insertError) {
          console.error('Erro ao criar configurações padrão:', insertError.message);
        }
        
        setMenuSettings(defaultMenuSettings);
        return;
      }

      // Se encontrou múltiplos registros, usa o mais recente e limpa os outros
      if (allSettings.length > 1) {
        console.log('Encontrados múltiplos registros, mantendo apenas o mais recente');
        const [mostRecent, ...outdated] = allSettings;
        
        // Remove registros antigos
        if (outdated.length > 0) {
          const { error: deleteError } = await supabase
            .from('user_settings')
            .delete()
            .in('id', outdated.map(s => s.id));

          if (deleteError) {
            console.error('Erro ao remover registros antigos:', deleteError.message);
          }
        }

        // Usa as configurações mais recentes
        const mergedSettings = {
          ...defaultMenuSettings,
          ...mostRecent.menu_settings
        };
        setMenuSettings(mergedSettings);
      } else {
        // Caso normal: apenas um registro encontrado
        const mergedSettings = {
          ...defaultMenuSettings,
          ...allSettings[0].menu_settings
        };
        setMenuSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações dos menus:', error);
      setMenuSettings(defaultMenuSettings);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleFormationClick = () => {
    const twId = 1; // Example twId, replace with actual logic
    router.push(`/war/formation/${twId}`);
  };

  const toggleSubmenu = (menuName: string) => {
    setOpenMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isMenuVisible = (menuId: string) => {
    return menuSettings[menuId] ?? true;
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    loadMenuSettings();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (ownerLoading || isLoadingSettings) {
    return (
      <div className="flex h-screen flex-col justify-between border-r border-white/5 bg-[#0B1120] transition-all duration-300 w-64">
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/5 px-4">
          <div className="h-6 w-32 bg-white/5 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={clsx(
          'flex h-screen flex-col justify-between border-r border-white/5 bg-[#0B1120] transition-all duration-300',
          {
            'w-64': !isCollapsed,
            'w-20': isCollapsed,
          }
        )}
      >
        <div>
          <div className="relative">
            <div className="flex h-16 w-full items-center justify-between px-4">
              {!isCollapsed && (
                <h1 className="w-full text-center text-2xl font-medium text-white">
                  {clanName || 'UNLOCK'}
                </h1>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={clsx(
                  "absolute -right-3 top-6 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white",
                  isCollapsed && "w-full flex justify-center"
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
          </div>

          <nav className="flex-1 px-2 pt-4">
            {menuItems.map((item) => 
              isMenuVisible(item.id) && (
                <div key={item.name}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={clsx(
                          'flex items-center w-full px-2 py-2 text-sm font-medium transition-all duration-200',
                          pathname?.startsWith(item.href) 
                            ? 'text-white italic drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]' 
                            : 'text-gray-300 hover:text-white hover:drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]'
                        )}
                      >
                        <item.icon className={clsx('flex-shrink-0 w-5 h-5', isCollapsed ? '' : 'mr-3')} />
                        {!isCollapsed && (
                          <>
                            <span>{item.name}</span>
                            <ChevronRight
                              className={clsx('ml-auto h-4 w-4 transition-transform duration-200', {
                                'rotate-90': openMenus.includes(item.name),
                              })}
                            />
                          </>
                        )}
                      </button>
                      {!isCollapsed && openMenus.includes(item.name) && (
                        <div className="pl-8 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href === '/war/formation/[tw_id]' ? '/war/formation/1' : subItem.href}
                              className={clsx(
                                'block px-2 py-2 text-sm transition-all duration-200',
                                (pathname === subItem.href || (subItem.href === '/war/formation/[tw_id]' && pathname.startsWith('/war/formation/')))
                                  ? 'text-white italic drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]' 
                                  : 'text-gray-300 hover:text-white hover:drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]'
                              )}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center w-full px-2 py-2 text-sm font-medium transition-all duration-200',
                        pathname === item.href 
                          ? 'text-white italic drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]' 
                          : 'text-gray-300 hover:text-white hover:drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]'
                      )}
                    >
                      <item.icon className={clsx('flex-shrink-0 w-5 h-5', isCollapsed ? '' : 'mr-3')} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  )}
                </div>
              )
            )}
          </nav>
        </div>

        <div className="border-t border-white/5 p-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={clsx(
              'flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors'
            )}
          >
            <Settings className="h-5 w-5" />
            {!isCollapsed && <span>Configurações</span>}
          </button>
          <button
            onClick={handleLogout}
            className={clsx(
              'flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onClose={handleSettingsClose}
      />
    </>
  );
}
