import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../src/components/Sidebar";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GGPW",
  description: "Sistema de Gerenciamento de Guild - Perfect World",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
