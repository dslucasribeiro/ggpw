import Comercio from '@/components/Comercio';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comércio | GGPW',
  description: 'Sistema de comércio para jogadores',
};

export default function ComercioPage() {
  return <Comercio />;
}
