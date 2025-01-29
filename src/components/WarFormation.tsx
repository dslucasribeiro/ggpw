'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, ChevronDown, Settings, GripVertical } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { useSettings } from '@/store/settings';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
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
  nick: string;
  classe: string;
  posicao: string;
  nivel: number;
}

interface FormationPlayer {
  id: number;
  tw_id: number;
  player_id: number | null;
  position: number; // 1-10
  table_name: string;
  status: string | null;
  player?: Player;
}

interface FormationTableProps {
  title: string;
  players: FormationPlayer[];
  confirmedPlayers: Player[];
  onAddPlayer: (tableId: string, position: number, playerId: number) => void;
  onRemovePlayer: (tableId: string, position: number) => void;
  onUpdateStatus: (tableId: string, position: number, status: string) => void;
  onUpdateTitle: (oldTitle: string, newTitle: string) => void;
}

const STATUS_OPTIONS = [
  'OK',
  'DESISTIU',
  'FALTOU',
  'ATRASO',
  'SUNSHINE',
  'BINLADEN',
  'VODDISEIRA',
  'SOLITUDE',
  'VAX',
  'MARTINS',
];

function FormationTable({ 
  title, 
  players, 
  confirmedPlayers,
  onAddPlayer,
  onRemovePlayer,
  onUpdateStatus,
  onUpdateTitle
}: FormationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newTitle !== title) {
      onUpdateTitle(title, newTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const getBackgroundColor = (classe: string) => {
    switch (classe?.toLowerCase()) {
      case 'arqueiro': return 'bg-green-500/20';
      case 'guerreiro': return 'bg-purple-500/20';
      case 'sacerdote': return 'bg-yellow-500/20';
      case 'barbaro': return 'bg-blue-500/20';
      case 'feiticeira': return 'bg-pink-500/20';
      case 'mago': return 'bg-red-500/20';
      default: return '';
    }
  };

  const getTextColor = (classe: string) => {
    switch (classe?.toLowerCase()) {
      case 'arqueiro': return 'text-green-400';
      case 'guerreiro': return 'text-purple-400';
      case 'sacerdote': return 'text-yellow-400';
      case 'barbaro': return 'text-blue-400';
      case 'feiticeira': return 'text-pink-400';
      case 'mago': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#0B1120] rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex-1">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              autoFocus
              className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
            />
          </form>
        ) : (
          <button 
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-medium text-white hover:text-purple-400"
          >
            {title}
          </button>
        )}
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Nick</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Classe</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Status</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, index) => {
            const player = players.find(p => p.position === index + 1);
            const playerData = player?.player;

            return (
              <tr key={index} className="border-b border-gray-800 last:border-0">
                <td className="px-4 py-2">
                  {playerData ? (
                    <span className="text-white text-sm">{playerData.nick}</span>
                  ) : (
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button className="text-sm text-gray-400 hover:text-white">
                          Adicionar player
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content 
                          className="bg-[#0B1120] rounded-lg shadow-xl border border-gray-700 w-64 p-2 z-50"
                          sideOffset={5}
                        >
                          <input
                            type="text"
                            placeholder="Buscar player..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 mb-2"
                          />
                          <div className="max-h-48 overflow-y-auto">
                            {confirmedPlayers
                              .filter(p => 
                                p.nick.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                !players.some(fp => fp.player_id === p.id)
                              )
                              .map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    onAddPlayer(title, index + 1, p.id);
                                    setSearchTerm('');
                                  }}
                                  className={clsx(
                                    "w-full text-left px-2 py-1 rounded text-sm mb-1 last:mb-0",
                                    getBackgroundColor(p.classe),
                                    "hover:bg-gray-700"
                                  )}
                                >
                                  <div className="text-white">{p.nick}</div>
                                  <div className={clsx("text-xs", getTextColor(p.classe))}>
                                    {p.classe}
                                  </div>
                                </button>
                              ))}
                          </div>
                          <Popover.Arrow className="fill-gray-700" />
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  )}
                </td>
                <td className={clsx(
                  "px-4 py-2 text-sm",
                  playerData ? getTextColor(playerData.classe) : "text-gray-400"
                )}>
                  {playerData?.classe || "-"}
                </td>
                <td className="px-4 py-2">
                  {playerData && (
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button 
                          className={clsx(
                            "text-sm px-2 py-1 rounded",
                            player?.status ? "text-white" : "text-gray-400 hover:text-white"
                          )}
                        >
                          {player?.status || "Definir status"}
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content 
                          className="bg-[#0B1120] rounded-lg shadow-xl border border-gray-700 w-48 p-2 z-50"
                          sideOffset={5}
                        >
                          <div className="space-y-1">
                            {STATUS_OPTIONS.map(status => (
                              <button
                                key={status}
                                onClick={() => onUpdateStatus(title, index + 1, status)}
                                className="w-full text-left px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                          <Popover.Arrow className="fill-gray-700" />
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  )}
                </td>
                <td className="px-4 py-2">
                  {playerData && (
                    <button
                      onClick={() => onRemovePlayer(title, index + 1)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
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
}

function SortableTableItem({ 
  title, 
  onRemove 
}: { 
  title: string;
  onRemove: (title: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: title });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center justify-between p-2 bg-gray-800 rounded mb-2',
        isDragging && 'border-2 border-blue-500'
      )}
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-blue-400">
          <GripVertical size={20} />
        </button>
        <span>{title}</span>
      </div>
      <button
        className="text-red-400 hover:text-red-300"
        onClick={() => onRemove(title)}
      >
        <X size={20} />
      </button>
    </div>
  );
}

function ManageTablesDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const { tableNames, setTableNames } = useSettings();
  const { formationPlayers } = useSettings();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = tableNames.indexOf(active.id as string);
      const newIndex = tableNames.indexOf(over.id as string);
      
      setTableNames(arrayMove(tableNames, oldIndex, newIndex));
    }
  };

  const handleAddTable = () => {
    if (!newTableName.trim()) {
      alert('Digite um nome para a tabela');
      return;
    }

    if (tableNames.includes(newTableName)) {
      alert('Uma tabela com este nome já existe');
      return;
    }

    setTableNames([...tableNames, newTableName]);
    setNewTableName('');
  };

  const handleRemoveTable = (tableName: string) => {
    const hasPlayers = formationPlayers.some(p => p.table_name === tableName);
    if (hasPlayers) {
      alert('Remova todos os jogadores desta tabela antes de excluí-la');
      return;
    }
    
    setTableNames(tableNames.filter(name => name !== tableName));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 text-gray-400 hover:text-white">
          <Settings size={20} />
          Gerenciar Tabelas
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 p-6 rounded-lg shadow-xl w-[400px] max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">
            Gerenciar Tabelas
          </Dialog.Title>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Nome da nova tabela"
              className="flex-1 bg-gray-800 rounded px-3 py-2"
            />
            <button
              onClick={handleAddTable}
              className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded"
            >
              Adicionar
            </button>
          </div>

          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tableNames}
                strategy={verticalListSortingStrategy}
              >
                {tableNames.map((name) => (
                  <SortableTableItem 
                    key={name} 
                    title={name} 
                    onRemove={handleRemoveTable}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </Dialog.Close>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded">
                Fechar
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function WarFormation() {
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    tableId: string;
    position: number;
  } | null>(null);
  const [selectedTwId, setSelectedTwId] = useState<number | null>(null);
  const [availableTWs, setAvailableTWs] = useState<{ id: number, date: string }[]>([]);
  const { tableNames } = useSettings();
  const { formationPlayers, setFormationPlayers } = useSettings();

  useEffect(() => {
    fetchAvailableTWs();
  }, []);

  useEffect(() => {
    if (selectedTwId) {
      fetchFormation(selectedTwId);
      fetchConfirmedPlayers(selectedTwId);
    } else {
      // Clear formation data when no TW is selected
      setFormationPlayers([]);
      setConfirmedPlayers([]);
      setIsLoading(false);
    }
  }, [selectedTwId]);

  const fetchAvailableTWs = async () => {
    setIsLoading(true);
    // Fetch TWs that have confirmed players
    const { data: confirmedTWs, error: confirmedError } = await supabase
      .from('confirmed_players')
      .select('tw_id');

    if (confirmedError) {
      console.error('Error fetching confirmed TWs:', confirmedError);
      setIsLoading(false);
      return;
    }

    // Get unique TW IDs from confirmed players
    const confirmedTWIds = new Set(confirmedTWs.map(tw => tw.tw_id));

    // Fetch all TWs
    const { data: allTWs, error: twError } = await supabase
      .from('territorial_wars')
      .select('id, date')
      .order('date', { ascending: false });

    if (twError) {
      console.error('Error fetching TWs:', twError);
      setIsLoading(false);
      return;
    }

    // Filter TWs that have confirmed players
    const filteredTWs = allTWs.filter(tw => confirmedTWIds.has(tw.id));

    const formattedTWs = filteredTWs.map(tw => ({
      id: tw.id,
      date: new Date(tw.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }));

    setAvailableTWs(formattedTWs);

    // Only set selected TW if we have available TWs
    if (formattedTWs.length > 0) {
      setSelectedTwId(formattedTWs[0].id);
    } else {
      setSelectedTwId(null);
    }

    setIsLoading(false);
  };

  const fetchConfirmedPlayers = async (twId: number) => {
    const { data, error } = await supabase
      .from('confirmed_players')
      .select(`
        *,
        player:players (
          id,
          nick,
          classe,
          posicao,
          nivel
        )
      `)
      .eq('tw_id', twId);

    if (error) {
      console.error('Error fetching confirmed players:', error);
      return;
    }

    const players = data.map(item => item.player);
    setConfirmedPlayers(players);
  };

  const fetchFormation = async (twId: number) => {
    setIsLoading(true);
    
    try {
      const { data: formation, error } = await supabase
        .from('war_formation')
        .select('*, player:players(*)')
        .eq('tw_id', twId);

      if (error) {
        console.error('Error fetching formation:', error);
        return;
      }

      setFormationPlayers(formation as FormationPlayer[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = async (tableId: string, position: number, playerId: number) => {
    if (!selectedTwId) {
      console.error('Nenhuma TW selecionada');
      return;
    }

    try {
      // First add to confirmed_players if not already confirmed
      const { data: existingConfirmed, error: checkError } = await supabase
        .from('confirmed_players')
        .select('id')
        .eq('tw_id', selectedTwId)
        .eq('player_id', playerId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existingConfirmed) {
        const { error: confirmError } = await supabase
          .from('confirmed_players')
          .insert([{
            tw_id: selectedTwId,
            player_id: playerId
          }]);

        if (confirmError) throw confirmError;
      }

      // Then add to war_formation
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
            classe,
            posicao,
            nivel
          )
        `)
        .single();

      if (error) throw error;

      // Update both states
      setFormationPlayers([...formationPlayers, data]);
      if (!existingConfirmed) {
        const playerData = data.player;
        setConfirmedPlayers([...confirmedPlayers, playerData]);
      }
    } catch (error) {
      console.error('Erro ao adicionar player:', error);
    }
  };

  const handleRemovePlayer = async (tableId: string, position: number) => {
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

      setFormationPlayers(formationPlayers.filter(p => 
        !(p.table_name === tableId && p.position === position && p.tw_id === selectedTwId)
      ));
    } catch (error) {
      console.error('Error removing player:', error);
    }
  };

  const handleUpdateStatus = async (tableId: string, position: number, status: string) => {
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

      setFormationPlayers(formationPlayers.map(p => {
        if (p.table_name === tableId && p.position === position && p.tw_id === selectedTwId) {
          return { ...p, status };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleUpdateTitle = async (oldTitle: string, newTitle: string) => {
    if (!newTitle.trim() || oldTitle === newTitle) return;

    try {
      // Verifica se existem jogadores na tabela antes de tentar atualizar
      const playersInTable = formationPlayers.filter(p => p.table_name === oldTitle);
      
      // Só atualiza no banco se houver jogadores na tabela
      if (playersInTable.length > 0) {
        const { error } = await supabase
          .from('war_formation')
          .update({ table_name: newTitle })
          .eq('table_name', oldTitle);

        if (error) throw error;

        // Atualiza o estado local dos jogadores
        setFormationPlayers(formationPlayers.map(p => 
          p.table_name === oldTitle ? { ...p, table_name: newTitle } : p
        ));
      }

      // Sempre atualiza os nomes das tabelas na UI
      const updatedNames = tableNames.map(name => 
        name === oldTitle ? newTitle : name
      );
      // setTableNames(updatedNames);
    } catch (error) {
      console.error('Erro ao atualizar nome da tabela:', error);
    }
  };

  const handleAddTable = () => {
    // const newTableName = prompt('Digite o nome da nova tabela');
    // if (!newTableName) return;
    // setTableNames([...tableNames, newTableName]);
  };

  const handleRemoveTable = (tableName: string) => {
    const hasPlayers = formationPlayers.some(p => p.table_name === tableName);
    if (hasPlayers) {
      alert('Remova todos os jogadores desta tabela antes de excluí-la');
      return;
    }
    
    // setTableNames(tableNames.filter(name => name !== tableName));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-200">Formação da Guerra</h2>
          {availableTWs.length > 0 ? (
            <select
              value={selectedTwId || ''}
              onChange={(e) => setSelectedTwId(Number(e.target.value))}
              className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1 text-sm"
            >
              {availableTWs.map((tw) => (
                <option key={tw.id} value={tw.id}>
                  TW {tw.date}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-400">Nenhuma TW com jogadores confirmados</span>
          )}
        </div>
        <ManageTablesDialog />
      </div>

      {selectedTwId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {tableNames.map((tableName, index) => (
            <FormationTable
              key={`${tableName}-${index}`}
              title={tableName}
              players={formationPlayers.filter(p => p.table_name === tableName)}
              confirmedPlayers={confirmedPlayers}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onUpdateStatus={handleUpdateStatus}
              onUpdateTitle={handleUpdateTitle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          Selecione uma TW para ver ou criar formações
        </div>
      )}
    </div>
  );
}
