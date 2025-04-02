import { Metadata } from 'next';
import Comercio from '@/components/Comercio';

// Tipagem correta para os parâmetros de rota dinâmica no Next.js
export interface PageProps {
  params: { classe: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Comércio - ${params.classe} | GGPW`,
    description: `Itens de comércio para a classe ${params.classe}`,
  };
}

export default function ComercioClasse({ params }: PageProps) {
  return <Comercio classe={params.classe} />;
}
