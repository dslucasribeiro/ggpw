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

      // Carregar itens do clã e suas pontuações
      const { data: clanItems, error: clanItemsError } = await supabase
        .from('clan_items')
        .select('id, item_name, score');

      if (clanItemsError) throw clanItemsError;

      // Carregar todas as retiradas
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select(`
          player_id,
          quantity,
          item_id
        `);

      if (withdrawalsError) throw withdrawalsError;

      // Processar os dados
      const processedPlayers = await Promise.all(playersData.map(async player => {
        // Calcular pontos dos eventos
        const playerEvents = eventsData.filter(event => event.player_name === player.nick);
        const pontosAcumulados = playerEvents.reduce((total, event) => total + (event.points || 0), 0);
        
        // Calcular pontos das retiradas
        const { data: playerData } = await supabase
          .from('players')
          .select('id')
          .eq('nick', player.nick)
          .single();
        
        const playerId = playerData?.id;
        const playerWithdrawals = withdrawalsData.filter(w => w.player_id === playerId);
        
        const totalRetiradas = playerWithdrawals.reduce((total, withdrawal) => {
          const item = clanItems.find(item => item.id === withdrawal.item_id);
          if (item?.score) {
            return total + (withdrawal.quantity * item.score);
          }
          return total;
        }, 0);
        
        return {
          nick: player.nick,
          classe: player.classe || '',
          retiradas: totalRetiradas,
          pontos_acumulados: pontosAcumulados,
          pontos_restantes: pontosAcumulados - totalRetiradas
        };
      }));

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

  return (
    <div className="bg-[#0B1120] rounded-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-6">Total Geral</h2>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-white">Carregando...</div>
          ) : (
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
                    <td className="px-4 py-2">{player.retiradas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
