'use client';

import { useOwnerContext } from '@/contexts/OwnerContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ComercioClasseProps {
  classe: string;
}

const classNames: { [key: string]: string } = {
  'wr': 'WR',
  'mg': 'MG',
  'ea': 'EA',
  'ep': 'EP',
  'wb': 'WB',
  'wf': 'WF'
};

export default function ComercioClasse({ classe }: ComercioClasseProps) {
  const { ownerId } = useOwnerContext();
  const className = classNames[classe] || classe.toUpperCase();

  return (
    <div className="container mx-auto p-4">
      <Link 
        href="/comercio"
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Comércio
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Comércio - {className}</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Funcionalidades de comércio para {className} em desenvolvimento...
        </p>
      </div>
    </div>
  );
}
