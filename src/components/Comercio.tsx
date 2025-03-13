'use client';

import { useOwnerContext } from '@/contexts/OwnerContext';
import Link from 'next/link';

const classes = [
  { id: 'wr', name: 'WR', description: 'Comércio para WR' },
  { id: 'mg', name: 'MG', description: 'Comércio para MG' },
  { id: 'ea', name: 'EA', description: 'Comércio para EA' },
  { id: 'ep', name: 'EP', description: 'Comércio para EP' },
  { id: 'wb', name: 'WB', description: 'Comércio para WB' },
  { id: 'wf', name: 'WF', description: 'Comércio para WF' },
];

export default function Comercio() {
  const { ownerId } = useOwnerContext();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Comércio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classe) => (
          <Link
            key={classe.id}
            href={`/comercio/${classe.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{classe.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{classe.description}</p>
              <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">
                Ver comércio para {classe.name} →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
