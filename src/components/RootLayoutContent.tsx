'use client';

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || pathname === '/';

  return (
    <div className="min-h-screen flex">
      {!isLoginPage && <Sidebar />}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
