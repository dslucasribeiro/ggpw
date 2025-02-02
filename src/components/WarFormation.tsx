import { useCallback, useEffect, useState } from 'react';
import { X, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';
import { useSettings } from '@/store/settings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos base do banco de dados
interface Player {
  id: number;
  nick: string;
  class_name: string;
  position: string;
  level: number;
}

interface WarFormation {
  id: number;
  created_at: string;
  tw_id: number;
  table_name: string;
  position: number;
  player_id: number | null;
  status: string | null;
  player?: Player;
}

// Props dos componentes
interface FormationTableProps {
  title: string;
  players: WarFormation[];
  confirmedPlayers: Player[];
  onAddPlayer: (tableId: string, position: number, playerId: number) => void;
  onRemovePlayer: (tableId: string, position: number) => void;
  onUpdateStatus: (tableId: string, position: number, status: string) => void;
  onUpdateTitle: (oldTitle: string, newTitle: string) => void;
}

interface SortableTableItemProps {
  title: string;
  onRemove: (title: string) => void;
}

interface ManageTablesDialogProps {
  formationPlayers: WarFormation[];
}

export default function WarFormation() {
  const { tableNames, setTableNames } = useSettings();
  const [formationPlayers, setFormationPlayers] = useState<WarFormation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTwId, setSelectedTwId] = useState<number | null>(null);
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
  const [territorialWars, setTerritorialWars] = useState<{ id: number; date: string }[]>([]);

  const fetchConfirmedPlayers = useCallback(async (twId: number) => {
    try {
      const { data: confirmedPlayersData, error } = await supabase
        .from('players')
        .select('id, nick, class_name, position, level')
        .in('id', (
          await supabase
            .from('confirmed_players')
            .select('player_id')
            .eq('tw_id', twId)
        ).data?.map(row => row.player_id) || []);

      if (error) throw error;

      if (confirmedPlayersData) {
        setConfirmedPlayers(confirmedPlayersData);
      }
    } catch (error) {
      console.error('Error fetching confirmed players:', error);
    }
  }, []);

  const fetchFormation = useCallback(async (twId: number) => {
    try {
      type FormationResponse = WarFormation & {
        player: Player;
      };

      const { data, error } = await supabase
        .from('war_formation')
        .select(`
          *,
          player:players (
            id,
            nick,
            class_name,
            position,
            level
          )
        `)
        .eq('tw_id', twId);

      if (error) throw error;

      if (data) {
        setFormationPlayers(data as FormationResponse[]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao carregar formação');
    }
  }, []);

  const saveFormation = useCallback(async (newFormation: WarFormation[]) => {
    try {
      const { error } = await supabase
        .from('war_formation')
        .upsert(
          newFormation.map(({ id, tw_id, player_id, position, table_name, status }) => ({
            id,
            tw_id,
            player_id,
            position,
            table_name,
            status
          }))
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error saving formation:', error);
    }
  }, []);

  const handleAddPlayer = useCallback(async (tableId: string, position: number, playerId: number) => {
    if (!selectedTwId) {
      console.error('Nenhuma TW selecionada');
      return;
    }

    try {
      type FormationResponse = WarFormation & {
        player: Player;
      };

      const { data, error } = await supabase
        .from('war_formation')
        .insert([{
          tw_id: selectedTwId,
          table_name: tableId,
          position,
          player_id: playerId,
          status: 'OK'
        }])
        .select(`
          *,
          player:players (
            id,
            nick,
            class_name,
            position,
            level
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        const newPlayer = data as FormationResponse;
        const newFormationPlayers = [...formationPlayers, newPlayer];
        setFormationPlayers(newFormationPlayers);
        
        if (!confirmedPlayers.some(p => p.id === newPlayer.player.id)) {
          setConfirmedPlayers([...confirmedPlayers, newPlayer.player]);
        }

        await saveFormation(newFormationPlayers);
      }
    } catch (error) {
      console.error('Erro ao adicionar player:', error);
    }
  }, [selectedTwId, formationPlayers, confirmedPlayers, saveFormation]);

  const handleRemovePlayer = useCallback(
    async (tableId: string, position: number) => {
      if (!selectedTwId) {
        console.error('Nenhuma TW selecionada');
        return;
      }

      try {
        const { error } = await supabase
          .from('war_formation')
          .delete()
          .eq('tw_id', selectedTwId)
          .eq('table_name', tableId)
          .eq('position', position);

        if (error) throw error;

        const newFormationPlayers = formationPlayers.filter(
          (p) => !(p.table_name === tableId && p.position === position)
        );
        setFormationPlayers(newFormationPlayers);

        await saveFormation(newFormationPlayers);
      } catch (error) {
        console.error('Error removing player:', error);
      }
    },
    [selectedTwId, formationPlayers, saveFormation]
  );

  const handleUpdateStatus = useCallback(
    async (tableId: string, position: number, status: string) => {
      if (!selectedTwId) {
        console.error('Nenhuma TW selecionada');
        return;
      }

      try {
        const { error } = await supabase
          .from('war_formation')
          .update({ status })
          .eq('tw_id', selectedTwId)
          .eq('table_name', tableId)
          .eq('position', position);

        if (error) throw error;

        const newFormationPlayers = formationPlayers.map((p) => {
          if (p.table_name === tableId && p.position === position) {
            return { ...p, status };
          }
          return p;
        });
        setFormationPlayers(newFormationPlayers);

        await saveFormation(newFormationPlayers);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    },
    [selectedTwId, formationPlayers, saveFormation]
  );

  const handleUpdateTitle = useCallback(
    async (oldTitle: string, newTitle: string) => {
      if (!newTitle.trim() || oldTitle === newTitle) return;

      try {
        const playersInTable = formationPlayers.filter((p) => p.table_name === oldTitle);

        if (playersInTable.length > 0) {
          const { error } = await supabase
            .from('war_formation')
            .update({ table_name: newTitle })
            .eq('table_name', oldTitle);

          if (error) throw error;

          setFormationPlayers(
            formationPlayers.map((p) =>
              p.table_name === oldTitle ? { ...p, table_name: newTitle } : p
            )
          );
        }

        const updatedNames = tableNames.map((name) =>
          name === oldTitle ? newTitle : name
        );
        setTableNames(updatedNames);
      } catch (error) {
        console.error('Erro ao atualizar nome da tabela:', error);
      }
    },
    [formationPlayers, tableNames, setTableNames]
  );

  const fetchAvailableTWs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('territorial_wars')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        setTerritorialWars(data);
      }
    } catch (error) {
      console.error('Error fetching TWs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableTWs();
  }, [fetchAvailableTWs]);

  useEffect(() => {
    if (selectedTwId) {
      fetchFormation(selectedTwId);
      fetchConfirmedPlayers(selectedTwId);
    } else {
      setFormationPlayers([]);
      setConfirmedPlayers([]);
      setIsLoading(false);
    }
  }, [selectedTwId, fetchFormation, fetchConfirmedPlayers]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-200">Formação da Guerra</h2>
          <select
            value={selectedTwId || ''}
            onChange={(e) => setSelectedTwId(e.target.value ? Number(e.target.value) : null)}
            className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1 text-sm"
          >
            <option value="">Sem TW selecionada</option>
            {territorialWars.map((tw) => (
              <option key={tw.id} value={tw.id}>
                TW {format(new Date(tw.date), 'dd/MM/yyyy', { locale: ptBR })}
              </option>
            ))}
          </select>
        </div>
        <ManageTablesDialog formationPlayers={formationPlayers} />
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-6">
          {tableNames.map((tableName) => (
            <FormationTable
              key={tableName}
              title={tableName}
              players={formationPlayers.filter((p) => p.table_name === tableName)}
              confirmedPlayers={confirmedPlayers}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onUpdateStatus={handleUpdateStatus}
              onUpdateTitle={handleUpdateTitle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FormationTable({
  title,
  players,
  confirmedPlayers,
  onAddPlayer,
  onRemovePlayer,
  onUpdateStatus,
  onUpdateTitle,
}: FormationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [editingStatus, setEditingStatus] = useState<{
    position: number;
    value: string;
  } | null>(null);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTitle(title, newTitle);
    setIsEditingTitle(false);
  };

  const filteredPlayers = confirmedPlayers.filter((player) =>
    player.nick.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTextColor = (className: string) => {
    switch (className.toLowerCase()) {
      case 'guerreiro':
        return 'text-red-400';
      case 'mago':
        return 'text-blue-400';
      case 'arqueiro':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-800">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded"
              autoFocus
            />
            <button
              type="submit"
              className="text-green-400 hover:text-green-300"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => setIsEditingTitle(false)}
              className="text-red-400 hover:text-red-300"
            >
              ✗
            </button>
          </form>
        ) : (
          <h3
            className="text-lg font-semibold cursor-pointer hover:text-blue-400"
            onClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h3>
        )}
      </div>

      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Pos</th>
              <th className="px-4 py-2 text-left">Nick</th>
              <th className="px-4 py-2 text-left">Classe</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, index) => {
              const position = index + 1;
              const playerData = players.find((p) => p.position === position)?.player;

              return (
                <tr key={position} className="border-t border-gray-800">
                  <td className="px-4 py-2">{position}</td>
                  <td className="px-4 py-2">
                    {playerData ? (
                      playerData.nick
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar jogador..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-gray-800 text-white px-2 py-1 rounded w-full"
                        />
                        {searchTerm && (
                          <div className="absolute z-10 w-full mt-1 bg-gray-800 rounded shadow-lg">
                            {filteredPlayers.map((player) => (
                              <div
                                key={player.id}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-700"
                                onClick={() => {
                                  onAddPlayer(title, position, player.id);
                                  setSearchTerm('');
                                }}
                              >
                                {player.nick}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td
                    className={clsx(
                      "px-4 py-2 text-sm",
                      playerData ? getTextColor(playerData.class_name) : "text-gray-400"
                    )}
                  >
                    {playerData?.class_name || "-"}
                  </td>
                  <td className="px-4 py-2">
                    {playerData && (
                      editingStatus?.position === position ? (
                        <select
                          value={editingStatus.value}
                          onChange={(e) => {
                            onUpdateStatus(title, position, e.target.value);
                            setEditingStatus(null);
                          }}
                          className="bg-gray-800 text-white px-2 py-1 rounded"
                          autoFocus
                          onBlur={() => setEditingStatus(null)}
                        >
                          <option value="OK">OK</option>
                          <option value="PENDING">Pendente</option>
                          <option value="CONFIRMED">Confirmado</option>
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-400"
                          onClick={() =>
                            setEditingStatus({
                              position,
                              value: players.find((p) => p.position === position)?.status || 'OK',
                            })
                          }
                        >
                          {players.find((p) => p.position === position)?.status || 'OK'}
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {playerData && (
                      <button
                        onClick={() => onRemovePlayer(title, position)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTableItem({ title, onRemove }: SortableTableItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-800 rounded mb-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">=</span>
        <span className="text-white">{title}</span>
      </div>
      <button
        onClick={() => onRemove(title)}
        className="text-gray-400 hover:text-red-400"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ManageTablesDialog({ formationPlayers }: ManageTablesDialogProps) {
  const { tableNames, setTableNames } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    setTableNames([...tableNames, newTableName.trim()]);
    setNewTableName('');
  };

  const handleRemoveTable = (tableName: string) => {
    const hasPlayers = formationPlayers.some((p: WarFormation) => p.table_name === tableName);
    if (hasPlayers) {
      alert('Remova todos os jogadores desta tabela antes de excluí-la');
      return;
    }

    setTableNames(tableNames.filter((name) => name !== tableName));
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <Settings size={16} />
        <span>Gerenciar Tabelas</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Gerenciar Tabelas</h2>

            <form onSubmit={handleAddTable} className="mb-4">
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Nome da nova tabela"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded"
              />
            </form>

            <div className="space-y-2">
              {tableNames.map((name) => (
                <SortableTableItem
                  key={name}
                  title={name}
                  onRemove={handleRemoveTable}
                />
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
