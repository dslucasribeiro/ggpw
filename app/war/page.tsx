'use client';

import Link from 'next/link';

export default function War() {
  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      <div className="mb-6">
        <h1 className="text-xl text-white font-medium">Guerra</h1>
        <p className="text-sm text-gray-400">Gerencie as guerras do clã</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/war/confirmed"
          className="block bg-[#1A1F2E] rounded-lg p-6 hover:bg-[#242937] transition-colors"
        >
          <h2 className="text-lg text-white font-medium mb-2">Confirmados</h2>
          <p className="text-gray-400">Gerencie os players confirmados para a próxima guerra</p>
        </Link>

        <Link 
          href="/war/formation"
          className="block bg-[#1A1F2E] rounded-lg p-6 hover:bg-[#242937] transition-colors"
        >
          <h2 className="text-lg text-white font-medium mb-2">Formação</h2>
          <p className="text-gray-400">Organize as formações para a próxima guerra</p>
        </Link>
      </div>
    </div>
  );
}
