'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import { useSettings } from '@/store/settings';
import SettingsDialog from './SettingsDialog';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Players', href: '/players', icon: Users },
];

const warSubMenu = [
  { name: 'Confirmados', href: '/war/confirmed' },
  { name: 'Formação', href: '/war/formation' },
  { name: 'Estratégia', href: '/war/strategy' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWarMenuOpen, setIsWarMenuOpen] = useState(false);
  const { clanName } = useSettings();

  const isWarActive = pathname.startsWith('/war');

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
              {clanName}
            </h1>
          </div>

          {/* Red Separator Line */}
          <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-75"></div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {/* Regular Menu Items */}
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-white bg-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                  isCollapsed && 'justify-center px-2'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5" />
                {!isCollapsed && item.name}
              </Link>
            ))}

            {/* Guerra Menu with Submenu */}
            <div>
              <div
                onClick={() => !isCollapsed && setIsWarMenuOpen(!isWarMenuOpen)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer select-none',
                  isWarActive
                    ? 'text-white bg-gray-800'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800',
                  isCollapsed && 'justify-center px-2'
                )}
                role="button"
                title={isCollapsed ? 'Guerra' : undefined}
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1">Guerra</span>
                )}
              </div>

              {/* Submenu */}
              {!isCollapsed && isWarMenuOpen && (
                <div className="space-y-1 mt-0.5">
                  {warSubMenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={clsx(
                        'flex items-center text-sm rounded-lg transition-colors pl-10 py-2',
                        pathname === subItem.href
                          ? 'text-white bg-gray-800'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      )}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={clsx(
                'flex items-center text-sm text-gray-400 hover:text-white group w-full',
                isCollapsed ? 'justify-center' : 'justify-between'
              )}
            >
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <span>PW</span>
                  <span>Perfect World</span>
                </div>
              )}
              <Settings className="w-5 h-5" />
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
      <SettingsDialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
