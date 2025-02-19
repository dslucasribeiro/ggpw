'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOwnerContext } from '@/contexts/OwnerContext';

interface ClanItem {
  id: number;
  item_name: string;
  quantity: number;
  score: number | null;
  idOwner: number;
}

interface NewItem {
  item_name: string;
  quantity: number;
  score: number | null;
  idOwner: number;
}

export default function ClanItems() {
  const [items, setItems] = useState<ClanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<NewItem | null>(null);
  const [editingItem, setEditingItem] = useState<ClanItem | null>(null);
  const { ownerId, loading: ownerLoading } = useOwnerContext();

  useEffect(() => {
    if (!ownerLoading) {
      loadItems();
    }
  }, [ownerLoading]);

  const loadItems = async () => {
    if (ownerLoading) return;
    
    try {
      const { data, error } = await supabase
        .from('clan_items')
        .select('*')
        .eq('idOwner', ownerId)
        .order('item_name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewItem({ 
      item_name: '', 
      quantity: 0, 
      score: null,
      idOwner: ownerId
    });
  };

  const handleSaveNewItem = async () => {
    if (!newItem?.item_name) return;

    try {
      const { error } = await supabase
        .from('clan_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      await loadItems();
      setNewItem(null);
    } catch (error) {
      console.error('Error saving new item:', error);
    }
  };

  const handleUpdateItem = async (item: ClanItem) => {
    try {
      const { error } = await supabase
        .from('clan_items')
        .update({
          item_name: item.item_name,
          quantity: item.quantity,
          score: item.score
        })
        .eq('id', item.id)
        .eq('idOwner', ownerId);

      if (error) throw error;

      await loadItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('clan_items')
        .delete()
        .eq('id', id)
        .eq('idOwner', ownerId);

      if (error) throw error;

      await loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (loading) {
    return <div className="text-white">Carregando...</div>;
  }

  return (
    <div className="bg-[#0B1120] text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Itens disponíveis</h1>
        <button
          onClick={handleAddItem}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[#1E293B]">
              <th className="py-2 px-3">ITEM</th>
              <th className="py-2 px-3">QUANTIDADE</th>
              <th className="py-2 px-3">PONTUAÇÃO</th>
              <th className="py-2 px-3">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {newItem && (
              <tr className="border-t border-[#1E293B] hover:bg-[#1E293B] transition-colors">
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={newItem.item_name}
                    onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                    placeholder="Nome do item"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    value={newItem.score ?? ''}
                    onChange={e => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value);
                      setNewItem({ ...newItem, score: value });
                    }}
                    className="w-24 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNewItem}
                      className="text-green-500 hover:text-green-400"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setNewItem(null)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="border-t border-[#1E293B] hover:bg-[#1E293B] transition-colors">
                <td className="py-2 px-3">
                  {editingItem?.id === item.id ? (
                    <input
                      type="text"
                      value={editingItem.item_name}
                      onChange={e => setEditingItem({ ...editingItem, item_name: e.target.value })}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                    />
                  ) : (
                    item.item_name
                  )}
                </td>
                <td className="py-2 px-3">
                  {editingItem?.id === item.id ? (
                    <input
                      type="number"
                      value={editingItem.quantity}
                      onChange={e => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                      className="w-24 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td className="py-2 px-3">
                  {editingItem?.id === item.id ? (
                    <input
                      type="number"
                      value={editingItem.score ?? ''}
                      onChange={e => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        setEditingItem({ ...editingItem, score: value });
                      }}
                      className="w-24 bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
                    />
                  ) : (
                    item.score || '-'
                  )}
                </td>
                <td className="py-2 px-3">
                  <div className="flex gap-2">
                    {editingItem?.id === item.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateItem(editingItem)}
                          className="text-green-500 hover:text-green-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-500 hover:text-blue-400"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
