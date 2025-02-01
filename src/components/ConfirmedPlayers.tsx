'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Player {
  id: number;
  nick: string;
  classe: string;
  posicao: string;
  nivel: number;
}

interface ConfirmedPlayer extends Player {
  confirmed_at: string;
}

interface ConfirmedPlayersProps {
  twId: number;
  twDate: string;
}

export default function ConfirmedPlayers({ twId, twDate }: ConfirmedPlayersProps) {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [confirmedPlayers, setConfirmedPlayers] = useState<ConfirmedPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ConfirmedPlayer;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Buscar players disponíveis e confirmados
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Buscar todos os players
        const { data: allPlayers, error: playersError } = await supabase
          .from('players')
          .select('*')
          .order('nick');

        if (playersError) {
          console.error('Erro ao buscar players:', playersError);
          throw playersError;
        }

        // Buscar players confirmados para esta TW
        const { data: confirmed, error: confirmedError } = await supabase
          .from('confirmed_players')
          .select('*, players!confirmed_players_player_id_fkey(*)')
          .eq('tw_id', twId);

        if (confirmedError) {
          console.error('Erro ao buscar confirmados:', confirmedError);
          throw confirmedError;
        }

        // Formatar players confirmados
        const confirmedPlayersData = confirmed.map((cp: { player_id: string, players: Player }) => ({
          ...cp.players
        }));

        // Filtrar players disponíveis (não confirmados)
        const confirmedIds = new Set(confirmedPlayersData.map((p: ConfirmedPlayer) => p.id));
        const availablePlayersData = allPlayers.filter((p: Player) => !confirmedIds.has(p.id));

        setAvailablePlayers(availablePlayersData);
        setConfirmedPlayers(confirmedPlayersData);
      } catch (error) {
        console.error('Erro ao carregar players:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (twId) {
      fetchData();
    }
  }, [twId]);

  // Confirmar player
  const handleConfirmPlayer = async (player: Player) => {
    try {
      const { error } = await supabase
        .from('confirmed_players')
        .insert([{ 
          player_id: player.id,
          tw_id: twId,
          confirmed_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setConfirmedPlayers([...confirmedPlayers, { ...player, confirmed_at: new Date().toISOString() }]);
      setAvailablePlayers(availablePlayers.filter(p => p.id !== player.id));
      setIsAddingPlayer(false);
    } catch (error) {
      console.error('Erro ao confirmar player:', error);
    }
  };

  // Remover confirmação
  const handleRemoveConfirmation = async (playerId: number) => {
    try {
      const { error } = await supabase
        .from('confirmed_players')
        .delete()
        .eq('player_id', playerId)
        .eq('tw_id', twId);

      if (error) throw error;

      const removedPlayer = confirmedPlayers.find(p => p.id === playerId);
      if (removedPlayer) {
        const { confirmed_at, ...playerData } = removedPlayer;
        setAvailablePlayers([...availablePlayers, playerData]);
        setConfirmedPlayers(confirmedPlayers.filter(p => p.id !== playerId));
      }
    } catch (error) {
      console.error('Erro ao remover confirmação:', error);
    }
  };

  // Ordenação
  const handleSort = (key: keyof ConfirmedPlayer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPlayers = [...confirmedPlayers].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Usar parseISO em vez de new Date para evitar problemas de fuso horário
  const formattedDate = format(parseISO(twDate), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Players Confirmados</h2>
          <p className="text-sm text-gray-400">
            TW do dia {formattedDate}
          </p>
        </div>
        <button
          onClick={() => setIsAddingPlayer(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Player
        </button>
      </div>

      {/* Modal de Adicionar Player */}
      {isAddingPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1120] rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Selecionar Player</h2>
              <button
                onClick={() => setIsAddingPlayer(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Pesquisa */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar player por nick..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availablePlayers
                .filter(player => 
                  player.nick.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <div className="text-white font-medium">{player.nick}</div>
                    <div className="text-sm text-gray-400">
                      {player.classe} • {player.posicao} • Nível {player.nivel || 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleConfirmPlayer(player)}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              ))}
              {availablePlayers
                .filter(player => 
                  player.nick.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  {searchTerm 
                    ? 'Nenhum player encontrado com este nick' 
                    : 'Não há players disponíveis para confirmar'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Players Confirmados */}
      <div className="bg-[#0B1120] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-800/50"
                onClick={() => handleSort('nick')}
              >
                <div className="flex items-center gap-2">
                  Nick
                  {sortConfig?.key === 'nick' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-800/50"
                onClick={() => handleSort('classe')}
              >
                <div className="flex items-center gap-2">
                  Classe
                  {sortConfig?.key === 'classe' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-800/50"
                onClick={() => handleSort('posicao')}
              >
                <div className="flex items-center gap-2">
                  Posição
                  {sortConfig?.key === 'posicao' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-800/50"
                onClick={() => handleSort('nivel')}
              >
                <div className="flex items-center gap-2">
                  Nível
                  {sortConfig?.key === 'nivel' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id} className="border-b border-gray-800 last:border-0">
                <td className="px-6 py-4 text-white">{player.nick}</td>
                <td className="px-6 py-4 text-gray-400">{player.classe}</td>
                <td className="px-6 py-4 text-gray-400">{player.posicao}</td>
                <td className="px-6 py-4 text-gray-400">Nível {player.nivel || 'N/A'}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleRemoveConfirmation(player.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {confirmedPlayers.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Nenhum player confirmado ainda
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
