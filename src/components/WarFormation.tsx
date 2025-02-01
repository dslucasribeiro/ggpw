import { useState, useEffect } from 'react';
import { X, Settings, GripVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';
import { useSettings } from '@/store/settings';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [editingStatus, setEditingStatus] = useState<{ position: number, value: string } | null>(null);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newTitle !== title) {
      onUpdateTitle(title, newTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleStatusSubmit = (position: number) => {
    if (editingStatus && editingStatus.position === position) {
      onUpdateStatus(title, position, editingStatus.value);
      setEditingStatus(null);
    }
  };

  const handleStatusKeyDown = (e: React.KeyboardEvent, position: number) => {
    if (e.key === 'Enter') {
      handleStatusSubmit(position);
    } else if (e.key === 'Escape') {
      setEditingStatus(null);
    }
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
                    <button className="text-sm text-gray-400 hover:text-white">
                      Adicionar player
                    </button>
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
                    editingStatus?.position === index + 1 ? (
                      <input
                        type="text"
                        value={editingStatus.value}
                        onChange={(e) => setEditingStatus({ position: index + 1, value: e.target.value })}
                        onBlur={() => handleStatusSubmit(index + 1)}
                        onKeyDown={(e) => handleStatusKeyDown(e, index + 1)}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => setEditingStatus({ position: index + 1, value: player?.status || '' })}
                        className={clsx(
                          'text-sm px-2 py-1 rounded',
                          player?.status ? 'text-white' : 'text-gray-400 hover:text-white'
                        )}
                      >
                        {player?.status || 'Definir status'}
                      </button>
                    )
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
  return (
    <div className="flex items-center justify-between p-2 bg-gray-800 rounded mb-2">
      <div className="flex items-center gap-2">
        <button className="cursor-grab hover:text-blue-400">
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
    <div>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <Settings size={20} />
        Gerenciar Tabelas
      </button>
      {isOpen && (
        <div>
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
            {tableNames.map((name) => (
              <SortableTableItem 
                key={name} 
                title={name} 
                onRemove={handleRemoveTable}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WarFormation() {
  const [isLoading, setIsLoading] = useState(true);
  const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
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

    try {
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

      const formattedTWs = allTWs.map(tw => ({
        id: tw.id,
        date: format(parseISO(tw.date.split('T')[0]), 'dd/MM/yyyy', { locale: ptBR })
      }));

      setAvailableTWs(formattedTWs);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
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

      if (error) throw error;

      setFormationPlayers(formation as FormationPlayer[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFormation = async (newFormation: FormationPlayer[]) => {
    if (!selectedTwId) return;

    try {
      // Deletar formação existente
      const { error: deleteError } = await supabase
        .from('war_formation')
        .delete()
        .eq('tw_id', selectedTwId);

      if (deleteError) throw deleteError;

      // Salvar nova formação
      const formationToSave = newFormation.map(player => ({
        tw_id: selectedTwId,
        table_name: player.table_name,
        position: player.position,
        player_id: player.player_id,
        status: player.status
      }));

      const { error: saveError } = await supabase
        .from('war_formation')
        .insert(formationToSave);

      if (saveError) throw saveError;
    } catch (error) {
      console.error('Erro ao salvar formação:', error);
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
      const newFormationPlayers = [...formationPlayers, data];
      setFormationPlayers(newFormationPlayers);
      if (!existingConfirmed) {
        const playerData = data.player;
        setConfirmedPlayers([...confirmedPlayers, playerData]);
      }

      // Save the formation
      await saveFormation(newFormationPlayers);
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

      const newFormationPlayers = formationPlayers.filter(p => 
        !(p.table_name === tableId && p.position === position && p.tw_id === selectedTwId)
      );
      setFormationPlayers(newFormationPlayers);

      // Save the formation
      await saveFormation(newFormationPlayers);
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

      const newFormationPlayers = formationPlayers.map(p => {
        if (p.table_name === tableId && p.position === position && p.tw_id === selectedTwId) {
          return { ...p, status };
        }
        return p;
      });
      setFormationPlayers(newFormationPlayers);

      // Save the formation
      await saveFormation(newFormationPlayers);
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
            {availableTWs.map((tw) => (
              <option key={tw.id} value={tw.id}>
                TW {tw.date}
              </option>
            ))}
          </select>
        </div>
        <ManageTablesDialog />
      </div>

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
    </div>
  );
}
