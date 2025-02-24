'use client';

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { supabase } from '../lib/supabase';
import { useOwnerContext } from '@/contexts/OwnerContext';

interface Player {
  id: number;
  nick: string;
  nivel: number;
  classe: string;
  posicao: string;
  created_at: string;
  idOwner: number;
}

const CLASSES = ['WR', 'MG', 'EA', 'EP', 'WB', 'WF'] as const;
const POSICOES = ['Marechal', 'General', 'Major', 'Capitão', 'Soldado', 'Lider de PT'] as const;
const NIVEL_RANGES = [
  { min: 70, max: 80, label: '70-80' },
  { min: 80, max: 90, label: '80-90' },
  { min: 90, max: 100, label: '90-100' },
  { min: 100, max: 105, label: '100-105' },
] as const;

export function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasse, setSelectedClasse] = useState<string>('');
  const [selectedPosicao, setSelectedPosicao] = useState<string>('');
  const [selectedNivelRange, setSelectedNivelRange] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { ownerId, loading: ownerLoading } = useOwnerContext();
  const [newPlayer, setNewPlayer] = useState<Omit<Player, 'id' | 'created_at' | 'idOwner'>>({
    nick: '',
    nivel: 1,
    classe: CLASSES[0],
    posicao: POSICOES[0],
  });

  useEffect(() => {
    if (!ownerLoading && ownerId) {
      fetchPlayers();
    }
  }, [ownerLoading, ownerId]);

  async function fetchPlayers() {
    try {
      if (!ownerId) {
        console.log('ownerId não disponível ainda');
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('idOwner', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar players:', error);
        throw error;
      }
      
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.nick.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.classe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.posicao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClasse = !selectedClasse || player.classe === selectedClasse;
    const matchesPosicao = !selectedPosicao || player.posicao === selectedPosicao;
    
    const matchesNivel = !selectedNivelRange || (() => {
      const range = NIVEL_RANGES.find(r => r.label === selectedNivelRange);
      return range ? player.nivel >= range.min && player.nivel < range.max : true;
    })();

    return matchesSearch && matchesClasse && matchesPosicao && matchesNivel;
  });

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{ ...newPlayer, idOwner: ownerId }])
        .select()
        .single();

      if (error) throw error;

      setPlayers([data, ...players]);
      setIsAddModalOpen(false);
      setNewPlayer({
        nick: '',
        nivel: 1,
        classe: CLASSES[0],
        posicao: POSICOES[0],
      });
    } catch (error) {
      console.error('Error adding player:', error);
    }
  }

  async function handleDeletePlayer(id: number) {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id)
        .eq('idOwner', ownerId);

      if (error) throw error;

      setPlayers(players.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  }

  async function handleEditPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlayer) return;
    
    try {
      const { data, error } = await supabase
        .from('players')
        .update({
          nick: editingPlayer.nick,
          nivel: editingPlayer.nivel,
          classe: editingPlayer.classe,
          posicao: editingPlayer.posicao,
        })
        .eq('id', editingPlayer.id)
        .eq('idOwner', ownerId)
        .select()
        .single();

      if (error) throw error;

      setPlayers(players.map(p => p.id === editingPlayer.id ? data : p));
      setIsEditModalOpen(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error('Error editing player:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] p-6 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl text-white font-medium">Players</h1>
          <p className="text-sm text-gray-400">Gerencie os membros do seu clã</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">{filteredPlayers.length}</span>
            <span className="text-gray-400">Players</span>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span>+</span>
            <span>Novo Player</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar player por nome, classe ou posição..."
            className="w-full bg-[#1A1F2E] text-white placeholder-gray-400 rounded-lg px-4 py-2.5 pl-10"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select 
          value={selectedClasse}
          onChange={(e) => setSelectedClasse(e.target.value)}
          className="bg-[#1A1F2E] text-white px-4 py-2.5 rounded-lg w-48"
        >
          <option value="">Todas as Classes</option>
          {CLASSES.map((classe) => (
            <option key={classe} value={classe}>{classe}</option>
          ))}
        </select>
        <select 
          value={selectedPosicao}
          onChange={(e) => setSelectedPosicao(e.target.value)}
          className="bg-[#1A1F2E] text-white px-4 py-2.5 rounded-lg w-48"
        >
          <option value="">Todas as Posições</option>
          {POSICOES.map((posicao) => (
            <option key={posicao} value={posicao}>{posicao}</option>
          ))}
        </select>
        <select 
          value={selectedNivelRange}
          onChange={(e) => setSelectedNivelRange(e.target.value)}
          className="bg-[#1A1F2E] text-white px-4 py-2.5 rounded-lg w-48"
        >
          <option value="">Todos os Níveis</option>
          {NIVEL_RANGES.map((range) => (
            <option key={range.label} value={range.label}>{range.label}</option>
          ))}
        </select>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_100px_150px_150px_100px] gap-4 px-4 py-3 text-sm text-gray-400 border-b border-gray-800">
        <div>Player</div>
        <div>Level</div>
        <div>Classe</div>
        <div>Posição</div>
        <div className="text-right">Ações</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-800">
        {filteredPlayers.map((player) => (
          <div
            key={player.id}
            className="grid grid-cols-[1fr_100px_150px_150px_100px] gap-4 px-4 py-4 items-center hover:bg-[#1A1F2E] group"
          >
            <div className="text-white">{player.nick}</div>
            <div className="text-white">Lv. {player.nivel}</div>
            <div className="text-blue-400">{player.classe}</div>
            <div className="text-purple-400">{player.posicao}</div>
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={() => {
                  setEditingPlayer(player);
                  setIsEditModalOpen(true);
                }}
                className="p-2 text-gray-400 hover:text-blue-400"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeletePlayer(player.id)}
                className="p-2 text-gray-400 hover:text-red-400"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhum player encontrado</p>
        </div>
      )}

      {/* Add Player Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#1A1F2E] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-medium">Adicionar Player</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Nick</label>
                <input
                  type="text"
                  value={newPlayer.nick}
                  onChange={(e) => setNewPlayer({ ...newPlayer, nick: e.target.value })}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Nível</label>
                <input
                  type="text"
                  value={newPlayer.nivel}
                  onChange={(e) => {
                    const value = e.target.value;
                    const nivel = value === '' ? 0 : parseInt(value);
                    setNewPlayer({ ...newPlayer, nivel });
                  }}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Classe</label>
                <select
                  value={newPlayer.classe}
                  onChange={(e) => setNewPlayer({ ...newPlayer, classe: e.target.value })}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                >
                  {CLASSES.map((classe) => (
                    <option key={classe} value={classe}>{classe}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Posição</label>
                <select
                  value={newPlayer.posicao}
                  onChange={(e) => setNewPlayer({ ...newPlayer, posicao: e.target.value })}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                >
                  {POSICOES.map((posicao) => (
                    <option key={posicao} value={posicao}>{posicao}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPlayer}
                disabled={!newPlayer.nick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {isEditModalOpen && editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#1A1F2E] rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-white font-medium">Editar Player</h2>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlayer(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Nick</label>
                <input
                  type="text"
                  value={editingPlayer.nick}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, nick: e.target.value })}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Nível</label>
                <input
                  type="text"
                  value={editingPlayer.nivel}
                  onChange={(e) => {
                    const value = e.target.value;
                    const nivel = value === '' ? 0 : parseInt(value);
                    setEditingPlayer({ ...editingPlayer, nivel });
                  }}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Classe</label>
                <select
                  value={editingPlayer.classe}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, classe: e.target.value })}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                >
                  {CLASSES.map((classe) => (
                    <option key={classe} value={classe}>{classe}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Posição</label>
                <select
                  value={editingPlayer.posicao}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, posicao: e.target.value })}
                  className="w-full bg-[#0B1120] text-white px-4 py-2 rounded-lg"
                >
                  {POSICOES.map((posicao) => (
                    <option key={posicao} value={posicao}>{posicao}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPlayer(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditPlayer}
                disabled={!editingPlayer.nick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
