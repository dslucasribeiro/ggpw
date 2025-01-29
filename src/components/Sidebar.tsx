'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, ShieldAlert, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { useSettings } from '@/store/settings';
import SettingsDialog from './SettingsDialog';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Players', href: '/players', icon: Users },
  { 
    name: 'Guerra', 
    href: '/war', 
    icon: ShieldAlert,
    subItems: [
      { name: 'Confirmados', href: '/war/confirmed' },
      { name: 'Formação', href: '/war/formation' },
      { name: 'Estratégia', href: '/war/strategy' },
    ]
  },
  { 
    name: 'Eventos', 
    href: '/events', 
    icon: Calendar,
    subItems: [
      { name: 'Dashboard', href: '/events/dashboard' },
      { name: 'Total Geral', href: '/events/total' },
      { name: 'Artes Marciais', href: '/events/martial-arts' },
      { name: 'Feras Sombrias', href: '/events/dark-beasts' },
      { name: 'Tigres Celestiais', href: '/events/celestial-tigers' },
      { name: 'World Boss', href: '/events/world-boss' },
      { name: 'GVG', href: '/events/gvg' },
      { name: 'TW', href: '/events/tw' },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const { clanName } = useSettings();

  const toggleSubmenu = (menuName: string) => {
    setOpenMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={clsx(
        'hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 overflow-hidden',
        isCollapsed ? 'md:w-20' : 'md:w-64'
      )}>
        <div className="flex flex-col flex-1 min-h-0 bg-[#0B1120] border-r border-gray-800 relative">
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Clan Name */}
          <div className="px-4 py-4">
            <h1 className={clsx(
              'font-semibold text-white truncate transition-all',
              isCollapsed ? 'text-sm text-center' : 'text-xl'
            )}>
              {isCollapsed ? clanName?.slice(0, 3) : clanName}
            </h1>
          </div>

          {/* Red Separator Line */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-75"></div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {menuItems.map((item) => (
              <div key={item.href}>
                {item.subItems ? (
                  // Menu com submenu
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={clsx(
                        'flex items-center w-full px-4 py-2 text-sm font-medium rounded-md',
                        pathname.startsWith(item.href) ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      )}
                    >
                      <item.icon className={clsx('flex-shrink-0 w-6 h-6', isCollapsed ? '' : 'mr-3')} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </button>

                    {!isCollapsed && openMenus.includes(item.name) && (
                      <div className="pl-11 pr-2 mt-2 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={clsx(
                              'block px-3 py-2 text-sm rounded-md',
                              pathname === subItem.href ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                            )}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Menu sem submenu
                  <Link
                    href={item.href}
                    className={clsx(
                      'flex items-center w-full px-4 py-2 text-sm font-medium rounded-md',
                      pathname === item.href ? 'text-white bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    )}
                  >
                    <item.icon className={clsx('flex-shrink-0 w-6 h-6', isCollapsed ? '' : 'mr-3')} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:text-white hover:bg-gray-800"
            >
              <Settings className={clsx('flex-shrink-0 w-6 h-6', isCollapsed ? '' : 'mr-3')} />
              {!isCollapsed && <span>Settings</span>}
            </button>
            {!isCollapsed && <div className="text-xs text-gray-500 mt-1">Guild Manager</div>}
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className={clsx(
        'transition-all duration-300',
        isCollapsed ? 'md:pl-20' : 'md:pl-64'
      )}>
        {/* Your main content here */}
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
