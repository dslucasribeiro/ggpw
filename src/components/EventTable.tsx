'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';

interface EventTableProps {
  eventTypeId: number;
  eventWeight: number;
  title: string;
}

interface EventEntry {
  id: string;
  player_name: string;
  event_date: string;
  points: number;
  event_type_id: number;
}

export default function EventTable({ eventTypeId, eventWeight, title }: EventTableProps) {
  const [players, setPlayers] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [entries, setEntries] = useState<EventEntry[]>([]);
  const [editingCell, setEditingCell] = useState<{ player: string; date: string; value: string } | null>(null);
  const [showDateInput, setShowDateInput] = useState(false);
  const [newDate, setNewDate] = useState('');

  // Load players
  useEffect(() => {
    const loadPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('nick')
        .order('nick');
      
      if (error) {
        console.error('Error loading players:', error);
        return;
      }

      setPlayers(data.map(p => p.nick).filter(Boolean));
    };

    loadPlayers();
  }, []);

  // Load entries for this event type
  useEffect(() => {
    const loadEntries = async () => {
      const { data, error } = await supabase
        .from('event_entries')
        .select('*')
        .eq('event_type_id', eventTypeId);

      if (error) {
        console.error('Error loading entries:', error);
        return;
      }

      setEntries(data);

      // Extract unique dates
      const uniqueDates = [...new Set(data.map(entry => entry.event_date))].sort();
      setDates(uniqueDates);
    };

    loadEntries();
  }, [eventTypeId]);

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove caracteres não numéricos
    value = value.replace(/\D/g, '');
    
    // Adiciona as barras
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    setNewDate(value);
  };

  const addNewDate = () => {
    setShowDateInput(true);
  };

  const handleDateSubmit = async () => {
    try {
      // Converte a data do formato DD/MM/YYYY para YYYY-MM-DD
      const [day, month, year] = newDate.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      if (!dates.includes(formattedDate)) {
        // Adicionar uma entrada vazia para cada jogador nesta data
        const promises = players.map(player => 
          supabase
            .from('event_entries')
            .insert({
              event_type_id: eventTypeId,
              player_name: player,
              event_date: formattedDate,
              points: 0
            })
        );

        await Promise.all(promises);

        // Recarregar todas as entradas
        const { data, error } = await supabase
          .from('event_entries')
          .select('*')
          .eq('event_type_id', eventTypeId);

        if (error) throw error;

        setEntries(data);
        setDates([...dates, formattedDate].sort());
      }

      setShowDateInput(false);
      setNewDate('');
    } catch (error) {
      console.error('Error submitting date:', error);
    }
  };

  const removeDate = async (dateToRemove: string) => {
    try {
      // Primeiro, deletar todas as entradas com essa data
      const { error: deleteError } = await supabase
        .from('event_entries')
        .delete()
        .eq('event_type_id', eventTypeId)
        .eq('event_date', dateToRemove);

      if (deleteError) {
        console.error('Error deleting entries:', deleteError);
        return;
      }

      // Atualizar estado local
      setDates(dates.filter(date => date !== dateToRemove));
      setEntries(entries.filter(entry => entry.event_date !== dateToRemove));
    } catch (error) {
      console.error('Error removing date:', error);
    }
  };

  const getPlayerTotal = (playerName: string) => {
    return entries
      .filter(entry => entry.player_name === playerName)
      .reduce((total, entry) => total + entry.points, 0) * eventWeight;
  };

  const getPlayerPoints = (playerName: string, date: string) => {
    const entry = entries.find(e => 
      e.player_name === playerName && 
      e.event_date === date
    );
    return entry?.points || 0;
  };

  const handlePointsChange = async (player: string, date: string, points: number) => {
    try {
      const existingEntry = entries.find(e => 
        e.player_name === player && 
        e.event_date === date &&
        e.event_type_id === eventTypeId
      );

      if (existingEntry) {
        const { error } = await supabase
          .from('event_entries')
          .update({ points })
          .eq('id', existingEntry.id)
          .eq('event_type_id', eventTypeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_entries')
          .insert({
            event_type_id: eventTypeId,
            player_name: player,
            event_date: date,
            points
          });

        if (error) throw error;
      }

      // Atualizar estado local imediatamente
      setEntries(prevEntries => {
        if (existingEntry) {
          return prevEntries.map(e => 
            e.id === existingEntry.id 
              ? { ...e, points }
              : e
          );
        } else {
          return [...prevEntries, {
            id: Date.now().toString(), // ID temporário
            event_type_id: eventTypeId,
            player_name: player,
            event_date: date,
            points
          }];
        }
      });
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const handleCellClick = (player: string, date: string) => {
    const points = getPlayerPoints(player, date);
    setEditingCell({ player, date, value: points.toString() });
  };

  const handleCellBlur = async () => {
    if (editingCell) {
      const points = parseInt(editingCell.value) || 0;
      await handlePointsChange(editingCell.player, editingCell.date, points);
      setEditingCell(null);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleCellBlur();
    }
  };

  return (
    <div className="bg-[#0B1120] rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="flex items-center gap-2">
            {showDateInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDate}
                  onChange={handleDateInputChange}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className="w-32 px-2 py-1 text-sm bg-gray-800 text-white border border-gray-700 rounded"
                />
                <button
                  onClick={handleDateSubmit}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setShowDateInput(false);
                    setNewDate('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={addNewDate}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Adicionar Data
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-800">
              <tr>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2">TOTAL</th>
                {dates.map(date => (
                  <th key={date} className="px-4 py-2 relative min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <span>{format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                      <button
                        onClick={() => removeDate(date)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player} className="border-b border-gray-800">
                  <td className="px-4 py-2">{player}</td>
                  <td className="px-4 py-2 font-semibold">
                    {getPlayerTotal(player)}
                  </td>
                  {dates.map(date => (
                    <td key={`${player}-${date}`} className="px-4 py-2">
                      {editingCell?.player === player && editingCell?.date === date ? (
                        <input
                          type="number"
                          value={editingCell.value}
                          onChange={e => setEditingCell({ ...editingCell, value: e.target.value })}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-16 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(player, date)}
                          className={clsx(
                            'w-full text-left px-2 py-1 rounded',
                            getPlayerPoints(player, date) > 0 ? 'text-white' : 'text-gray-500'
                          )}
                        >
                          {getPlayerPoints(player, date) || '-'}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
