'use client';

import { useState } from 'react';

const DEFAULT_CLASSES = ['WR', 'MG', 'EA', 'EP', 'WB', 'WF'];

interface ClassCardProps {
  classe: string;
  selected: boolean;
  onClick: () => void;
}

function ClassCard({ classe, selected, onClick }: ClassCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${
        selected 
          ? 'bg-[#1E2330] border-2 border-blue-500' 
          : 'bg-[#151A27] hover:bg-[#1E2330]'
      } rounded-lg p-8 text-center transition-all duration-200 transform hover:scale-102`}
    >
      <h2 className="text-xl font-bold text-white mb-2">{classe}</h2>
      <p className="text-gray-400">Ver tutoria para {classe}</p>
    </button>
  );
}

export function Tutoria() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const handleClassSelect = (classe: string) => {
    setSelectedClass(classe);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Tutoria</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEFAULT_CLASSES.map((classe) => (
          <ClassCard
            key={classe}
            classe={classe}
            selected={selectedClass === classe}
            onClick={() => handleClassSelect(classe)}
          />
        ))}
      </div>

      {selectedClass && (
        <div className="mt-8 bg-[#151A27] rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Tutoria para {selectedClass}
          </h2>
          <p className="text-gray-400">
            Conteúdo da tutoria para a classe {selectedClass} em desenvolvimento...
          </p>
        </div>
      )}
    </div>
  );
}
