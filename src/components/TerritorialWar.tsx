'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X } from 'lucide-react';
import { format, parseISO, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMask } from '@react-input/mask';
import { usePathname } from 'next/navigation';
import ConfirmedPlayers from './ConfirmedPlayers';
import WarStrategy from './WarStrategy';
import { useOwnerContext } from '@/contexts/OwnerContext';

interface TW {
  id: number;
  date: string;
  idOwner: number;
}

export default function TerritorialWar() {
  const [isAddingTW, setIsAddingTW] = useState(false);
  const [selectedTW, setSelectedTW] = useState<TW | null>(null);
  const [territorialWars, setTerritorialWars] = useState<TW[]>([]);
  const [newTWDate, setNewTWDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { ownerId, loading: ownerLoading } = useOwnerContext();

  const inputRef = useMask({ mask: '99/99/9999', replacement: { 9: /\d/ } });

  // Buscar TWs
  useEffect(() => {
    if (!ownerLoading) {
      fetchTWs();
    }
  }, [ownerLoading]);

  async function fetchTWs() {
    if (ownerLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('territorial_wars')
        .select('*')
        .eq('idOwner', ownerId)
        .order('date', { ascending: true });

      if (error) throw error;

      // Converter as datas para o formato local
      const formattedData = data?.map(tw => ({
        ...tw,
        date: tw.date.split('T')[0] // Remove a parte do tempo para evitar problemas de fuso horário
      }));

      setTerritorialWars(formattedData || []);
      if (formattedData && formattedData.length > 0) {
        setSelectedTW(formattedData[formattedData.length - 1]);
      }
    } catch (error) {
      console.error('Erro ao carregar TWs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddTW = async () => {
    if (!newTWDate || ownerLoading) return;

    try {
      // Converter a data do formato DD/MM/YYYY para YYYY-MM-DD
      const parsedDate = parse(newTWDate, 'dd/MM/yyyy', new Date());
      const formattedDate = format(parsedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('territorial_wars')
        .insert([{ 
          date: formattedDate,
          idOwner: ownerId
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista de TWs
      setTerritorialWars(prev => [...prev, { 
        ...data, 
        date: data.date.split('T')[0]
      }]);
      
      setNewTWDate('');
      setIsAddingTW(false);
    } catch (error) {
      console.error('Erro ao adicionar TW:', error);
    }
  };

  const handleDeleteTW = async (id: number) => {
    if (ownerLoading) return;

    try {
      const { error } = await supabase
        .from('territorial_wars')
        .delete()
        .eq('id', id)
        .eq('idOwner', ownerId);

      if (error) throw error;

      // Atualizar a lista de TWs
      setTerritorialWars(prev => prev.filter(tw => tw.id !== id));
      if (selectedTW?.id === id) {
        setSelectedTW(null);
      }
    } catch (error) {
      console.error('Erro ao deletar TW:', error);
    }
  };

  const handleConfirmedPlayersUpdate = () => {
    // Recarregar os dados da TW se necessário
    async function loadTWs() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('territorial_wars')
          .select('*')
          .eq('idOwner', ownerId)
          .order('date', { ascending: true });

        if (error) throw error;

        // Converter as datas para o formato local
        const formattedData = data?.map(tw => ({
          ...tw,
          date: tw.date.split('T')[0] // Remove a parte do tempo para evitar problemas de fuso horário
        }));

        setTerritorialWars(formattedData || []);
        if (formattedData && formattedData.length > 0) {
          setSelectedTW(formattedData[formattedData.length - 1]);
        }
      } catch (error) {
        console.error('Erro ao carregar TWs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTWs();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Territorial War</h1>
        <button
          onClick={() => setIsAddingTW(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova TW
        </button>
      </div>

      {/* Lista de TWs */}
      <div className="mb-8">
        <div className="flex gap-2 flex-wrap">
          {territorialWars.map((tw) => (
            <div
              key={tw.id}
              className={`
                relative group px-4 py-2 rounded-lg cursor-pointer transition-colors
                ${selectedTW?.id === tw.id ? 
                  'bg-purple-600 text-white' : 
                  'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}
              `}
              onClick={() => setSelectedTW(tw)}
            >
              {format(parseISO(tw.date), 'dd/MM/yyyy', { locale: ptBR })}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTW(tw.id);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all hidden group-hover:flex"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {isLoading && <div className="text-gray-400">Carregando...</div>}
          {!isLoading && territorialWars.length === 0 && (
            <div className="text-gray-400">Nenhuma TW cadastrada</div>
          )}
        </div>
      </div>

      {/* Modal Adicionar TW */}
      {isAddingTW && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1120] rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Nova Territorial War</h2>
              <button
                onClick={() => setIsAddingTW(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Data da TW
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={newTWDate}
                  onChange={(e) => setNewTWDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddingTW(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTW}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Componentes baseados na rota */}
      {selectedTW && (
        <div className="w-full">
          {pathname === '/war/confirmed' && (
            <ConfirmedPlayers 
              twId={selectedTW.id} 
              twDate={selectedTW.date}
              onUpdate={handleConfirmedPlayersUpdate}
            />
          )}
          {pathname === '/war/strategy' && <WarStrategy />}
        </div>
      )}

      {!selectedTW && !isLoading && (
        <div className="text-center text-gray-400 py-12">
          Selecione ou crie uma TW para continuar
        </div>
      )}
    </div>
  );
}
