'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface WithdrawalItem {
  player_id: number;
  player_nick: string;
  perola4: number;
  perola5: number;
  perola6: number;
  perola7: number;
  intrepida: number;
  pedra_magica: number;
  pedra_afiada: number;
  pedra_amarela: number;
  pedra_vermelha: number;
  arma_7_sabios: number;
}

interface Withdrawal {
  player_id: number;
  quantity: number;
  item_id: number;
}

interface WithdrawalValues {
  perola4?: number;
  perola5?: number;
  perola6?: number;
  perola7?: number;
  intrepida?: number;
  pedra_magica?: number;
  pedra_afiada?: number;
  pedra_amarela?: number;
  pedra_vermelha?: number;
  arma_7_sabios?: number;
}

interface Player {
  id: number;
  nick: string;
}

export default function Withdrawals() {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{playerId: number, column: string} | null>(null);

  const getColumnName = (itemId: string): keyof WithdrawalValues | null => {
    const itemMap: { [key: string]: keyof WithdrawalValues } = {
      '1': 'perola4',
      '2': 'perola5',
      '3': 'perola6',
      '4': 'perola7',
      '5': 'intrepida',
      '6': 'pedra_magica',
      '7': 'pedra_afiada',
      '8': 'pedra_amarela',
      '9': 'pedra_vermelha',
      '10': 'arma_7_sabios'
    };
    
    return itemMap[itemId] || null;
  };

  const getItemName = (columnName: string): string => {
    const nameMap: { [key: string]: string } = {
      'perola4': 'Pérola 4',
      'perola5': 'Pérola 5',
      'perola6': 'Pérola 6',
      'perola7': 'Pérola 7',
      'intrepida': 'Intrépida',
      'pedra_magica': 'Pedra Mágica nv7',
      'pedra_afiada': 'Pedra Afiada nv7',
      'pedra_amarela': 'Pedra Amarela nv7',
      'pedra_vermelha': 'Pedra Vermelha nv7',
      'arma_7_sabios': 'Arma 7 Sábios'
    };
    return nameMap[columnName] || columnName;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Carregar jogadores
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, nick')
        .order('nick');

      if (playersError) throw playersError;

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
      const processedItems = playersData.map((player: Player) => {
        const playerWithdrawals = withdrawalsData.filter((w: Withdrawal) => w.player_id === player.id);

        const withdrawalValues: WithdrawalValues = playerWithdrawals.reduce((acc: WithdrawalValues, curr: Withdrawal) => {
          const columnName = getColumnName(curr.item_id.toString());
          if (columnName) {
            acc[columnName] = (acc[columnName] || 0) + curr.quantity;
          }
          return acc;
        }, {});

        return {
          player_id: player.id,
          player_nick: player.nick,
          perola4: withdrawalValues.perola4 || 0,
          perola5: withdrawalValues.perola5 || 0,
          perola6: withdrawalValues.perola6 || 0,
          perola7: withdrawalValues.perola7 || 0,
          intrepida: withdrawalValues.intrepida || 0,
          pedra_magica: withdrawalValues.pedra_magica || 0,
          pedra_afiada: withdrawalValues.pedra_afiada || 0,
          pedra_amarela: withdrawalValues.pedra_amarela || 0,
          pedra_vermelha: withdrawalValues.pedra_vermelha || 0,
          arma_7_sabios: withdrawalValues.arma_7_sabios || 0,
        };
      });

      setItems(processedItems);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCellClick = (playerId: number, column: string) => {
    setEditingCell({ playerId, column });
  };

  const handleCellBlur = async (playerId: number, column: string, value: string) => {
    const quantity = parseInt(value) || 0;
    
    try {
      // Para a coluna Arma 7 Sábios, apenas atualizar o estado local
      if (column === 'arma_7_sabios') {
        setItems(items.map(item => 
          item.player_id === playerId 
            ? { ...item, [column]: quantity }
            : item
        ));
        setEditingCell(null);
        return;
      }

      // Para outros itens, atualizar no banco
      const itemName = getItemName(column);
      const item = await supabase
        .from('clan_items')
        .select('id')
        .eq('item_name', itemName)
        .single();
      
      if (!item.data?.id) {
        console.error('Item ID not found for:', itemName);
        return;
      }
      
      const itemId = item.data.id;
      
      // Primeiro, tente atualizar se já existe
      const { data: existingData, error: selectError } = await supabase
        .from('withdrawals')
        .select('id')
        .eq('player_id', playerId)
        .eq('item_id', itemId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      if (existingData?.id) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('withdrawals')
          .update({ quantity })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from('withdrawals')
          .insert({
            player_id: playerId,
            item_id: itemId,
            quantity: quantity
          });

        if (insertError) throw insertError;
      }

      // Atualizar estado local
      setItems(items.map(item => 
        item.player_id === playerId 
          ? { ...item, [column]: quantity }
          : item
      ));
    } catch (error) {
      console.error('Error updating withdrawal:', error);
    }

    setEditingCell(null);
  };

  if (loading) {
    return <div className="text-white text-sm">Carregando...</div>;
  }

  const columns = [
    { key: 'perola4', label: 'Pérola 4' },
    { key: 'perola5', label: 'Pérola 5' },
    { key: 'perola6', label: 'Pérola 6' },
    { key: 'perola7', label: 'Pérola 7' },
    { key: 'intrepida', label: 'Intrépida' },
    { key: 'pedra_magica', label: 'Pedra Mágica nv7' },
    { key: 'pedra_afiada', label: 'Pedra Afiada nv7' },
    { key: 'pedra_amarela', label: 'Pedra Amarela nv7' },
    { key: 'pedra_vermelha', label: 'Pedra Vermelha nv7' },
    { key: 'arma_7_sabios', label: 'Arma 7 Sábios' }
  ];

  return (
    <div className="bg-[#0B1120] text-white p-6">
      <h1 className="text-xl font-semibold mb-6 px-3">Retiradas</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[#1E293B]">
              <th className="py-2 px-3">PLAYERS</th>
              {columns.map(col => (
                <th key={col.key} className="py-2 px-3 text-center">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr 
                key={item.player_id} 
                className="border-t border-[#1E293B] hover:bg-[#1E293B] transition-colors"
              >
                <td className="py-2 px-3">{item.player_nick}</td>
                {columns.map(col => (
                  <td 
                    key={col.key} 
                    className="py-2 px-3 cursor-pointer text-center"
                    onClick={() => handleCellClick(item.player_id, col.key)}
                  >
                    {editingCell?.playerId === item.player_id && editingCell?.column === col.key ? (
                      <input
                        type="number"
                        defaultValue={item[col.key as keyof WithdrawalItem] as number}
                        className="w-14 px-1 py-0.5 bg-[#2D3B4E] border border-[#1E293B] rounded text-white text-sm text-center"
                        onBlur={(e) => handleCellBlur(item.player_id, col.key, e.target.value)}
                        autoFocus
                        min="0"
                      />
                    ) : (
                      item[col.key as keyof WithdrawalItem] || 0
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
