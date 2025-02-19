'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOwnerContext } from '@/contexts/OwnerContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Player {
  id: number;
  created_at: string;
  nick: string | null;
  classe: string | null;
  nivel: number | null;
  posicao: string | null;
}

interface WarFormationRow {
  id: number;
  tw_id: number;
  player_id: number | null;
  position: number;
  table_name: string;
  status: string | null;
  player?: Player;
}

interface ConfirmedPlayer {
  id: number;
  nick: string | null;
  classe: string | null;
  nivel: number | null;
  confirmed_at: string;
}

interface TeamTableProps {
  title: string;
  formations: WarFormationRow[];
  isLoading: boolean;
  onAddPlayer: (position: number) => void;
  onUpdateStatus: (formationId: number, status: string) => void;
  onUpdateTitle: (oldTitle: string, newTitle: string) => void;
  onRemovePlayer: (formationId: number) => void;
}

interface Props {
  twId?: string;  
}

interface SortableTableItemProps {
  tableName: string;
  onRemove: (tableName: string) => void;
}

const SortableTableItem = ({ tableName, onRemove }: SortableTableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: tableName,
    data: {
      type: 'table' as const,
      value: tableName
    }
  });

  const transformString: string | undefined = transform ? CSS.Transform.toString(transform) : undefined;

  const style: React.CSSProperties = {
    transform: transformString,
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 bg-[#24283b] rounded cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-400">::</span>
        <span className="text-white">{tableName}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(tableName);
        }}
        className="text-gray-400 hover:text-red-400"
      >
        &times;
      </button>
    </div>
  );
};

export default function WarFormation({ twId: initialTwId }: Props) {
  const [warDates, setWarDates] = useState<{ id: number; date: string }[]>([]);
  const [selectedTwId, setSelectedTwId] = useState<string>();
  const [formations, setFormations] = useState<WarFormationRow[]>([]);
  const [confirmedPlayers, setConfirmedPlayers] = useState<ConfirmedPlayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tables, setTables] = useState<string[]>(['CT 1']);
  const [newTableName, setNewTableName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { ownerId } = useOwnerContext();

  const loadExistingTables = async (twId: string) => {
    try {
      const { data, error } = await supabase
        .from('war_formation')
        .select('table_name')
        .eq('tw_id', twId)
        .eq('idOwner', ownerId)
        .order('table_name');

      if (error) {
        console.error('Error loading tables:', error);
        return;
      }

      if (data) {
        // Pega os nomes únicos das tabelas
        const uniqueTables = [...new Set(data.map(row => row.table_name))];
        setTables(uniqueTables);
      }
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  useEffect(() => {
    const fetchWarDates = async () => {
      try {
        const { data, error } = await supabase
          .from('territorial_wars')
          .select('id, date')
          .eq('idOwner', ownerId)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching war dates:', error);
          return;
        }

        if (data) {
          setWarDates(data);
          
          // Encontra a data futura mais próxima
          const now = new Date();
          const futureDates = data.filter(d => new Date(d.date) > now);
          
          if (futureDates.length > 0) {
            // Se encontrou datas futuras, seleciona a mais próxima
            setSelectedTwId(String(futureDates[0].id));
            await loadExistingTables(String(futureDates[0].id));
          } else if (data.length > 0) {
            // Se não há datas futuras, seleciona a mais recente
            setSelectedTwId(String(data[data.length - 1].id));
            await loadExistingTables(String(data[data.length - 1].id));
          }
        }
      } catch (err) {
        console.error('Error fetching war dates:', err);
      }
    };

    fetchWarDates();
  }, []);

  useEffect(() => {
    if (selectedTwId) {
      loadExistingTables(selectedTwId);
    }
  }, [selectedTwId]);

  useEffect(() => {
    if (!selectedTwId) return;

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
              created_at,
              nick,
              classe,
              nivel,
              posicao
            )
          `)
          .eq('tw_id', selectedTwId)
          .eq('idOwner', ownerId)
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

    fetchFormations();
  }, [selectedTwId]);

  useEffect(() => {
    const fetchConfirmedPlayers = async () => {
      if (!selectedTwId) return;

      try {
        const { data, error } = await supabase
          .from('confirmed_players')
          .select(`
            player_id,
            confirmed_at,
            players (
              id,
              nick,
              classe,
              nivel
            )
          `)
          .eq('tw_id', selectedTwId)
          .eq('idOwner', ownerId);

        if (error) {
          console.error('Error fetching confirmed players:', error);
          return;
        }

        if (data) {
          const players: ConfirmedPlayer[] = data.map((item: any) => ({
            id: item.player_id,
            nick: item.players.nick,
            classe: item.players.classe,
            nivel: item.players.nivel,
            confirmed_at: item.confirmed_at
          }));
          setConfirmedPlayers(players);
        }
      } catch (err) {
        console.error('Error fetching confirmed players:', err);
      }
    };

    fetchConfirmedPlayers();
  }, [selectedTwId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return `TW ${date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })}`;
  };

  const getFormationsByTable = (tableName: string) => {
    return formations.filter(f => f.table_name === tableName);
  };

  const handleAddPlayer = async (playerId: number, position: number, tableName: string) => {
    if (!selectedTwId) return;

    try {
      const { error } = await supabase
        .from('war_formation')
        .upsert({
          tw_id: Number(selectedTwId),
          player_id: playerId,
          position,
          table_name: tableName,
          idOwner: ownerId
        }, {
          onConflict: 'tw_id,position,table_name'
        });

      if (error) {
        console.error('Error adding player:', error);
        throw error;
      }

      // Refresh formations after adding player
      const fetchFormations = async () => {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('war_formation')
            .select(`
              *,
              player:players (
                id,
                created_at,
                nick,
                classe,
                nivel,
                posicao
              )
            `)
            .eq('tw_id', selectedTwId)
            .eq('idOwner', ownerId)
            .order('position');

          if (error) throw error;
          setFormations(data || []);
        } catch (err) {
          console.error('Error refreshing formations:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchFormations();
    } catch (err) {
      console.error('Error adding player to formation:', err);
    }
  };

  const handleRemovePlayer = async (formationId: number) => {
    try {
      const { error } = await supabase
        .from('war_formation')
        .update({
          player_id: null,
          status: null
        })
        .eq('id', formationId)
        .eq('idOwner', ownerId);

      if (error) {
        console.error('Error removing player:', error);
        return;
      }

      setFormations(formations.map(formation => 
        formation.id === formationId 
          ? { ...formation, player_id: null, status: null, player: undefined }
          : formation
      ));
    } catch (err) {
      console.error('Error removing player:', err);
    }
  };

  const handlePlayerSelect = (player: ConfirmedPlayer) => {
    if (selectedPosition !== null && selectedTable !== null) {
      handleAddPlayer(player.id, selectedPosition, selectedTable);
      setShowPlayerModal(false);
    }
  };

  const openPlayerSelection = (position: number, tableName: string) => {
    setSelectedPosition(position);
    setSelectedTable(tableName);
    setShowPlayerModal(true);
  };

  const filteredPlayers = confirmedPlayers.filter(player => {
    // Filtra players que já estão em alguma formação
    const isAlreadyInFormation = formations.some(
      formation => formation.player_id === player.id
    );
    return !isAlreadyInFormation && (
      player.nick?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.classe?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleUpdateStatus = async (formationId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('war_formation')
        .update({ status })
        .eq('id', formationId)
        .eq('idOwner', ownerId);

      if (error) {
        console.error('Error updating status:', error);
        return;
      }

      // Atualiza o estado local
      setFormations(prev => prev.map(formation => 
        formation.id === formationId ? { ...formation, status } : formation
      ));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleTableTitleChange = async (oldTitle: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('war_formation')
        .update({ table_name: newTitle })
        .eq('tw_id', selectedTwId)
        .eq('table_name', oldTitle)
        .eq('idOwner', ownerId);

      if (error) {
        console.error('Error updating table title:', error);
        return;
      }

      // Atualiza o estado local das formações
      setFormations(prev => prev.map(formation => 
        formation.table_name === oldTitle ? { ...formation, table_name: newTitle } : formation
      ));

      // Atualiza a lista de tabelas
      setTables(prev => prev.map(name => 
        name === oldTitle ? newTitle : name
      ));

    } catch (err) {
      console.error('Error updating table title:', err);
    }
  };

  const handleAddTable = async () => {
    if (!newTableName.trim() || !selectedTwId) return;

    try {
      // Criar 10 linhas vazias para a nova tabela
      const newRows = Array.from({ length: 10 }).map((_, index) => ({
        tw_id: parseInt(selectedTwId),
        position: index + 1,
        table_name: newTableName.trim(),
        idOwner: ownerId
      }));

      const { error } = await supabase
        .from('war_formation')
        .insert(newRows);

      if (error) {
        console.error('Error adding new table:', error);
        return;
      }

      // Atualiza o estado local
      const { data: newFormations } = await supabase
        .from('war_formation')
        .select(`
          *,
          player:players (
            id,
            created_at,
            nick,
            classe,
            nivel,
            posicao
          )
        `)
        .eq('tw_id', selectedTwId)
        .eq('table_name', newTableName.trim())
        .eq('idOwner', ownerId)
        .order('position');

      if (newFormations) {
        setFormations(prev => [...prev, ...newFormations]);
        setTables(prev => [...prev, newTableName.trim()]);
        setNewTableName('');
      }
    } catch (err) {
      console.error('Error adding new table:', err);
    }
  };

  const handleRemoveTable = async (tableName: string) => {
    try {
      const { error } = await supabase
        .from('war_formation')
        .delete()
        .eq('table_name', tableName)
        .eq('tw_id', selectedTwId)
        .eq('idOwner', ownerId);

      if (error) {
        console.error('Error removing table:', error);
        return;
      }

      setTables(prev => prev.filter(t => t !== tableName));
      setFormations(prev => prev.filter(f => f.table_name !== tableName));
    } catch (err) {
      console.error('Error removing table:', err);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    if (active.id !== over.id) {
      setTables((prev) => {
        const oldIndex = prev.indexOf(String(active.id));
        const newIndex = prev.indexOf(String(over.id));

        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  if (error) {
    return (
      <div className="min-h-screen bg-[#13141f] text-white p-4">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#13141f] text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Formação da Guerra</h2>
          <select
            className="bg-[#1a1b26] text-white border border-gray-700 rounded px-3 py-1"
            value={selectedTwId || ''}
            onChange={(e) => setSelectedTwId(e.target.value)}
          >
            <option value="">Selecione uma data</option>
            {warDates.map((war) => (
              <option key={war.id} value={war.id}>
                TW {new Date(war.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  timeZone: 'UTC'
                })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTableModal(true)}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            <span>Gerenciar Tabelas</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tables.map((tableName) => (
          <TeamTable
            key={tableName}
            title={tableName}
            formations={getFormationsByTable(tableName)}
            isLoading={isLoading}
            onAddPlayer={(position) => openPlayerSelection(position, tableName)}
            onUpdateStatus={handleUpdateStatus}
            onUpdateTitle={handleTableTitleChange}
            onRemovePlayer={handleRemovePlayer}
          />
        ))}
      </div>

      {/* Player Selection Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1a1b26] rounded-lg w-[400px] shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-white font-semibold text-lg">Selecionar Player</h2>
              <button
                onClick={() => setShowPlayerModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                placeholder="Buscar player..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#24283b] text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
              />

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    className="w-full text-left p-2 hover:bg-[#24283b] rounded flex justify-between items-center group"
                  >
                    <div>
                      <span className="text-white">{player.nick}</span>
                      <span className="text-gray-400 ml-2">
                        Classe: {player.classe}
                      </span>
                    </div>
                  </button>
                ))}
                {filteredPlayers.length === 0 && (
                  <div className="text-gray-400 text-center py-4">
                    Nenhum player disponível
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowPlayerModal(false)}
                className="px-4 py-2 text-white hover:text-blue-400"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Table Management Modal */}
      {showTableModal && (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={tables.map(table => table)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-[#1a1b26] rounded-lg w-[400px] shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-white font-semibold text-lg">Gerenciar Tabelas</h2>
                  <button
                    onClick={() => setShowTableModal(false)}
                    className="text-gray-400 hover:text-white text-xl"
                  >
                    &times;
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Nome da nova tabela"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      className="flex-1 bg-[#24283b] text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddTable}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {tables.map((tableName) => (
                      <SortableTableItem key={tableName} tableName={tableName} onRemove={handleRemoveTable} />
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end">
                  <button
                    onClick={() => setShowTableModal(false)}
                    className="px-4 py-2 text-white hover:text-blue-400"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

const TeamTable = ({ title, formations, isLoading, onAddPlayer, onUpdateStatus, onUpdateTitle, onRemovePlayer }: TeamTableProps) => {
  const [editingStatus, setEditingStatus] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(title);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTitleText(title);
  };

  const handleTitleBlur = () => {
    if (isEditingTitle) {
      onUpdateTitle(title, titleText);
      setIsEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    }
  };

  const handleStatusClick = (formation: WarFormationRow) => {
    if (formation.id) {
      setEditingStatus(formation.id);
      setStatusText(formation.status || "");
    }
  };

  const handleStatusBlur = async (formationId: number) => {
    if (editingStatus === formationId) {
      await onUpdateStatus(formationId, statusText);
      setEditingStatus(null);
    }
  };

  const handleStatusKeyDown = async (e: React.KeyboardEvent, formationId: number) => {
    if (e.key === "Enter") {
      await onUpdateStatus(formationId, statusText);
      setEditingStatus(null);
    }
  };

  return (
    <div className="bg-[#1a1b26] rounded-lg p-4">
      {isEditingTitle ? (
        <input
          type="text"
          value={titleText}
          onChange={(e) => setTitleText(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="bg-[#24283b] text-white px-2 py-1 rounded w-48 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
          autoFocus
        />
      ) : (
        <h3 className="text-white mb-2 hover:text-blue-400 cursor-pointer" onClick={handleTitleClick}>
          {title}
        </h3>
      )}
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
                  ) : formation?.player ? (
                    <button
                      onClick={() => onRemovePlayer(formation.id)}
                      className="hover:text-red-400"
                    >
                      {formation.player.nick}
                    </button>
                  ) : (
                    <button
                      onClick={() => onAddPlayer(index + 1)}
                      className="hover:text-blue-400"
                    >
                      Adicionar player
                    </button>
                  )}
                </td>
                <td className="py-2 text-gray-300">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-700 h-4 w-16 rounded" />
                  ) : formation?.player?.classe || '-'}
                </td>
                <td className="py-2 text-gray-300">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-700 h-4 w-16 rounded" />
                  ) : editingStatus === formation?.id ? (
                    <input
                      type="text"
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      onBlur={() => formation.id && handleStatusBlur(formation.id)}
                      onKeyDown={(e) => formation.id && handleStatusKeyDown(e, formation.id)}
                      className="bg-[#24283b] text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => formation && handleStatusClick(formation)}
                      className="hover:text-blue-400 w-full text-left"
                    >
                      {formation?.status || '-'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};