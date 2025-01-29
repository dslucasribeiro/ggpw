'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';

interface Player {
  nick: string;
  classe: string;
  pontos_restantes: number;
  pontos_acumulados: number;
  retiradas: number;
}

export default function TotalTable() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ player: string; value: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('nick');

      if (playersError) throw playersError;

      // Carregar todos os eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from('event_entries')
        .select('*');

      if (eventsError) throw eventsError;

      // Processar os dados
      const processedPlayers = playersData.map(player => {
        const playerEvents = eventsData.filter(event => event.player_name === player.nick);
        const pontosAcumulados = playerEvents.reduce((total, event) => total + (event.points || 0), 0);
        
        return {
          nick: player.nick,
          classe: player.classe || '',
          retiradas: 0, // Valor inicial, será editável manualmente
          pontos_acumulados: pontosAcumulados,
          pontos_restantes: pontosAcumulados // Será atualizado quando as retiradas forem editadas
        };
      });

      setPlayers(processedPlayers);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClasseColor = (classe: string) => {
    const colors: { [key: string]: string } = {
      'WR': 'bg-red-600',
      'WB': 'bg-orange-600',
      'WF': 'bg-blue-600',
      'EA': 'bg-green-600',
      'EP': 'bg-purple-600',
      'MG': 'bg-yellow-600'
    };
    return colors[classe] || 'bg-gray-600';
  };

  const handleRetiradaClick = (player: string, currentValue: number) => {
    setEditingCell({ player, value: currentValue.toString() });
  };

  const handleRetiradaChange = (value: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value });
    }
  };

  const handleRetiradaBlur = () => {
    if (editingCell) {
      const retirada = parseInt(editingCell.value) || 0;
      setPlayers(players.map(player => {
        if (player.nick === editingCell.player) {
          return {
            ...player,
            retiradas: retirada,
            pontos_restantes: player.pontos_acumulados - retirada
          };
        }
        return player;
      }));
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRetiradaBlur();
    }
  };

  if (loading) {
    return <div className="text-white">Carregando...</div>;
  }

  return (
    <div className="bg-[#0B1120] rounded-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-6">Total Geral</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-800">
              <tr>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2">Classe</th>
                <th className="px-4 py-2">Pontos Restantes</th>
                <th className="px-4 py-2">Pontos Acumulados</th>
                <th className="px-4 py-2">Retiradas</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.nick} className="border-b border-gray-800">
                  <td className="px-4 py-2">{player.nick}</td>
                  <td className="px-4 py-2">
                    <span className={clsx(
                      'px-2 py-1 rounded text-white text-xs',
                      getClasseColor(player.classe)
                    )}>
                      {player.classe}
                    </span>
                  </td>
                  <td className="px-4 py-2">{player.pontos_restantes}</td>
                  <td className="px-4 py-2">{player.pontos_acumulados}</td>
                  <td className="px-4 py-2">
                    {editingCell?.player === player.nick ? (
                      <input
                        type="number"
                        value={editingCell.value}
                        onChange={(e) => handleRetiradaChange(e.target.value)}
                        onBlur={handleRetiradaBlur}
                        onKeyDown={handleKeyDown}
                        className="w-20 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => handleRetiradaClick(player.nick, player.retiradas)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-800"
                      >
                        {player.retiradas}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
