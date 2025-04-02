'use client';

import { useOwnerContext } from '@/contexts/OwnerContext';

interface ComercioProps {
  classe?: string;
}

export default function Comercio({ classe }: ComercioProps = {}) {
  const { ownerId } = useOwnerContext();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Comércio{classe ? ` - ${classe}` : ''}</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Funcionalidades de comércio em desenvolvimento...
        </p>
        {classe && (
          <p className="mt-2 text-blue-500 dark:text-blue-400">
            Filtrando por classe: {classe}
          </p>
        )}
      </div>
    </div>
  );
}
