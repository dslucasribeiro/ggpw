import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { RootLayoutContent } from "@/components/RootLayoutContent";

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
          <RootLayoutContent>
            {children}
          </RootLayoutContent>
        </Providers>
      </body>
    </html>
  );
}
