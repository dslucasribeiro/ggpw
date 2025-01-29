'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Players', href: '/players', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-6 w-6" />
      </button>

      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static',
          {
            '-translate-x-full': !isMobileMenuOpen,
            'translate-x-0': isMobileMenuOpen,
          }
        )}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-center h-16 bg-indigo-600">
            <h1 className="text-white text-2xl font-bold">GGPW</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors',
                    {
                      'bg-indigo-50 text-indigo-600': pathname === item.href,
                    }
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">PW</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Perfect World</p>
                <p className="text-xs text-gray-500">Guild Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
