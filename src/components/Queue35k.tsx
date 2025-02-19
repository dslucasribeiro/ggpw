'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, CheckCircle2, Plus, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';
import { useOwnerContext } from '@/contexts/OwnerContext';

const WEAPONS = [
  'Xuan De',
  'Rei da Montanha',
  'Punho de Pei Tou',
  'Yuanba',
  'Emperor Qin',
  'Xuan Zang',
  'Zi Ya'
] as const;

type Weapon = typeof WEAPONS[number];

interface QueueItem {
  id: number;
  ordem: number;
  player_name: string;
  weapon: Weapon | null;
  status: string;
  is_completed: boolean;
  idOwner: number;
}

interface DeliveredItem {
  id: number;
  player_name: string;
  weapon: Weapon | null;
  completed_at: string;
  idOwner: number;
}

export default function Queue35k() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [deliveredItems, setDeliveredItems] = useState<DeliveredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWeapon, setEditingWeapon] = useState<{ id: number; weapon: Weapon | null } | null>(null);
  const [editingStatus, setEditingStatus] = useState<{ id: number; status: string } | null>(null);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const { ownerId, loading: ownerLoading } = useOwnerContext();

  const loadData = useCallback(async () => {
    if (ownerLoading) return;

    try {
      // Carregar fila
      const { data: queueData, error: queueError } = await supabase
        .from('queue_35k')
        .select('*')
        .eq('idOwner', ownerId)
        .order('ordem');

      if (queueError) throw queueError;

      // Carregar entregues
      const { data: deliveredData, error: deliveredError } = await supabase
        .from('delivered_35k')
        .select('*')
        .eq('idOwner', ownerId)
        .order('completed_at', { ascending: false });

      if (deliveredError) throw deliveredError;

      setQueueItems(queueData || []);
      setDeliveredItems(deliveredData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [ownerLoading, ownerId]);

  useEffect(() => {
    if (!ownerLoading) {
      loadData();
    }
  }, [ownerLoading, loadData]);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    try {
      const newOrder = queueItems.length + 1;
      const { data, error } = await supabase
        .from('queue_35k')
        .insert([
          {
            player_name: newPlayerName.trim(),
            ordem: newOrder,
            weapon: null,
            status: '',
            is_completed: false,
            idOwner: ownerId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setQueueItems(prev => [...prev, data]);
      setNewPlayerName('');
      setAddingPlayer(false);
    } catch (error) {
      console.error('Error adding player:', error);
      await loadData();
    }
  };

  const handleWeaponSelect = async (id: number, weapon: Weapon) => {
    try {
      const { error } = await supabase
        .from('queue_35k')
        .update({ weapon })
        .eq('id', id)
        .eq('idOwner', ownerId);

      if (error) throw error;
      
      // Atualizar estado localmente para evitar reload
      setQueueItems(items => 
        items.map(item => 
          item.id === id ? { ...item, weapon } : item
        )
      );
    } catch (error) {
      console.error('Error updating weapon:', error);
    }
    setEditingWeapon(null);
  };

  const handleStatusEdit = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from('queue_35k')
        .update({ status })
        .eq('id', id)
        .eq('idOwner', ownerId);

      if (error) throw error;
      
      // Atualizar estado localmente
      setQueueItems(items => 
        items.map(item => 
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setEditingStatus(null);
  };

  const handleCompleteItem = async (item: QueueItem) => {
    try {
      // Adicionar aos entregues
      const { error: insertError } = await supabase
        .from('delivered_35k')
        .insert([
          {
            player_name: item.player_name,
            weapon: item.weapon,
            completed_at: new Date().toISOString(),
            idOwner: ownerId
          }
        ]);

      if (insertError) throw insertError;

      // Remover da fila
      const { error: deleteError } = await supabase
        .from('queue_35k')
        .delete()
        .eq('id', item.id)
        .eq('idOwner', ownerId);

      if (deleteError) throw deleteError;

      // Atualizar estados localmente
      setDeliveredItems(prev => [item, ...prev]);
      setQueueItems(prev => {
        const filtered = prev.filter(i => i.id !== item.id);
        return filtered.map((item, index) => ({
          ...item,
          ordem: index + 1
        }));
      });

      // Atualizar ordens no banco
      const updates = queueItems
        .filter(i => i.id !== item.id)
        .map((item, index) => ({
          id: item.id,
          ordem: index + 1
        }));

      if (updates.length > 0) {
        await Promise.all(
          updates.map(update =>
            supabase
              .from('queue_35k')
              .update({ ordem: update.ordem })
              .eq('id', update.id)
              .eq('idOwner', ownerId)
          )
        );
      }
    } catch (error) {
      console.error('Error completing item:', error);
      await loadData(); // Recarregar em caso de erro
    }
  };

  const handleRemovePlayer = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este player da fila?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('queue_35k')
        .delete()
        .eq('id', id)
        .eq('idOwner', ownerId);

      if (deleteError) throw deleteError;

      // Atualizar estado localmente
      setQueueItems(prev => {
        const filtered = prev.filter(i => i.id !== id);
        return filtered.map((item, index) => ({
          ...item,
          ordem: index + 1
        }));
      });

      // Atualizar ordens no banco
      const updates = queueItems
        .filter(i => i.id !== id)
        .map((item, index) => ({
          id: item.id,
          ordem: index + 1
        }));

      if (updates.length > 0) {
        await Promise.all(
          updates.map(update =>
            supabase
              .from('queue_35k')
              .update({ ordem: update.ordem })
              .eq('id', update.id)
              .eq('idOwner', ownerId)
          )
        );
      }
    } catch (error) {
      console.error('Error removing player:', error);
      await loadData(); // Recarregar em caso de erro
    }
  };

  const handleRemoveDelivered = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este item dos entregues?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('delivered_35k')
        .delete()
        .eq('id', id)
        .eq('idOwner', ownerId);

      if (deleteError) throw deleteError;

      // Atualizar estado localmente
      setDeliveredItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing delivered item:', error);
      await loadData(); // Recarregar em caso de erro
    }
  };

  if (loading) {
    return <div className="text-white">Carregando...</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6 mt-8">
      {/* Fila de Espera */}
      <div className="bg-[#0B1120] rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Fila de Espera</h2>
            <button
              onClick={() => setAddingPlayer(true)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Player
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-center">Ordem</th>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2">Arma</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {addingPlayer && (
                  <tr className="border-b border-gray-800">
                    <td className="px-4 py-2 text-center">{queueItems.length + 1}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                        placeholder="Nome do player"
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editingWeapon?.weapon || ''}
                        onChange={(e) => setEditingWeapon({ id: -1, weapon: e.target.value as Weapon })}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                      >
                        <option value="">Selecione uma arma</option>
                        {WEAPONS.map(weapon => (
                          <option key={weapon} value={weapon}>{weapon}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">Faltam intrépidas e poder</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAddPlayer}
                          className="text-green-500 hover:text-green-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingPlayer(false);
                            setNewPlayerName('');
                            setEditingWeapon(null);
                          }}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {queueItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-800">
                    <td className="px-4 py-2 text-center">{item.ordem}</td>
                    <td className="px-4 py-2">{item.player_name}</td>
                    <td className="px-4 py-2">
                      {editingWeapon?.id === item.id ? (
                        <select
                          value={editingWeapon.weapon || ''}
                          onChange={(e) => handleWeaponSelect(item.id, e.target.value as Weapon)}
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                          autoFocus
                        >
                          <option value="">Selecione uma arma</option>
                          {WEAPONS.map(weapon => (
                            <option key={weapon} value={weapon}>{weapon}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingWeapon({ id: item.id, weapon: item.weapon })}
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-800"
                        >
                          {item.weapon || 'Selecionar Arma'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingStatus?.id === item.id ? (
                        <input
                          type="text"
                          value={editingStatus.status}
                          onChange={(e) => setEditingStatus({ id: item.id, status: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleStatusEdit(item.id, editingStatus.status);
                            } else if (e.key === 'Escape') {
                              setEditingStatus(null);
                            }
                          }}
                          onBlur={() => handleStatusEdit(item.id, editingStatus.status)}
                          className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingStatus({ id: item.id, status: item.status })}
                          className="w-full text-left px-2 py-1 rounded hover:bg-gray-800"
                        >
                          {item.status}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCompleteItem(item)}
                          disabled={!item.weapon}
                          className={clsx(
                            "flex items-center justify-center w-8 h-8 rounded",
                            item.weapon 
                              ? "text-green-500 hover:text-green-400" 
                              : "text-gray-600 cursor-not-allowed"
                          )}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRemovePlayer(item.id)}
                          className="flex items-center justify-center w-8 h-8 rounded text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Entregues */}
      <div className="bg-[#0B1120] rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Entregues</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-800">
                <tr>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2">Arma</th>
                  <th className="px-4 py-2">Data Conclusão</th>
                  <th className="px-4 py-2 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {deliveredItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-800">
                    <td className="px-4 py-2">{item.player_name}</td>
                    <td className="px-4 py-2">{item.weapon}</td>
                    <td className="px-4 py-2">
                      {new Date(item.completed_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveDelivered(item.id)}
                        className="flex items-center justify-center w-8 h-8 rounded text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
