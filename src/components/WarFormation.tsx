'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

interface Player {
  id: number;
  nick: string;
  classe: string;
}

interface WarFormationRow {
  id: number;
  tw_id: number;
  table_name: string;
  position: number;
  player_id: number | null;
  status: string | null;
  player?: Player;
}

interface TeamTableProps {
  title: string;
  formations: WarFormationRow[];
  isLoading: boolean;
}

const TABLE_NAMES = ['CT 1', 'CT 2', 'COMID', 'Apoio 1', 'Apoio 2', 'Apoio 3', 'Back 1', 'Back 2'];

const TeamTable = ({ title, formations, isLoading }: TeamTableProps) => {
  return (
    <div className="bg-[#1a1b26] rounded-lg p-4">
      <h3 className="text-white mb-2">{title}</h3>
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="text-gray-400">Nick</th>
            <th className="text-gray-400">Classe</th>
            <th className="text-gray-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, index) => {
            const formation = formations.find(f => f.position === index + 1);
            return (
              <tr key={index} className="border-t border-gray-700">
                <td className="py-2 text-gray-300">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-700 h-4 w-24 rounded" />
                  ) : formation?.player?.nick || 'Adicionar player'}
                </td>
                <td className="py-2 text-gray-300">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-700 h-4 w-16 rounded" />
                  ) : formation?.player?.classe || '-'}
                </td>
                <td className="py-2 text-gray-300">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-700 h-4 w-16 rounded" />
                  ) : formation?.status || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const WarFormation = () => {
  const params = useParams();
  const twId = Number(params.id);
  
  const [formations, setFormations] = useState<WarFormationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("TW ID:", twId); // Verifique o valor do twId
    fetchFormations();
  }, [twId]);

  const fetchFormations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('war_formation')
        .select(`
          *,
          player:players (
            id,
            nick,
            classe
          )
        `)
        .eq('tw_id', twId)
        .order('position');

      if (error) {
        console.log('Supabase Error:', error.message);
        throw error;
      }

      setFormations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching formations');
    } finally {
      setIsLoading(false);
    }
  };

  const getFormationsByTable = (tableName: string) => {
    return formations.filter(f => f.table_name === tableName);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#13141f] text-white p-4">
        <div className="bg-red-500 p-4 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#13141f] text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Formação da Guerra</h2>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            <span>Gerenciar Tabelas</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TABLE_NAMES.map(tableName => (
          <TeamTable
            key={tableName}
            title={tableName}
            formations={getFormationsByTable(tableName)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default WarFormation;