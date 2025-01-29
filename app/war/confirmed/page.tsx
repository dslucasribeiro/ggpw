'use client';

import TerritorialWar from '@/components/TerritorialWar';

export default function WarConfirmed() {
  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      <div className="mb-6">
        <h1 className="text-xl text-white font-medium">Confirmados para Guerra</h1>
        <p className="text-sm text-gray-400">Gerencie os players confirmados para a próxima guerra</p>
      </div>
      <TerritorialWar />
    </div>
  );
}
