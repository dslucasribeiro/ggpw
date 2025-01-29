'use client';

import { ArrowTrendingUpIcon, UsersIcon, StarIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Player {
  id: number;
  nick: string;
  classe: string;
  posicao: string;
  nivel: number;
}

export default function Dashboard() {
  const [playerCount, setPlayerCount] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar contagem de players
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });
      setPlayerCount(count || 0);

      // Buscar dados dos players para os gráficos
      const { data, error } = await supabase
        .from('players')
        .select('*');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { name: 'Total de Membros', value: playerCount.toString(), icon: UsersIcon },
    { name: 'Nível da Guild', value: '15', icon: StarIcon },
    { name: 'Contribuições Semanais', value: '12.5k', icon: ArrowTrendingUpIcon },
  ];

  // Dados para o gráfico de classes
  const classData = players.reduce((acc: { name: string; quantidade: number }[], player) => {
    const existingClass = acc.find(item => item.name === player.classe);
    if (existingClass) {
      existingClass.quantidade++;
    } else {
      acc.push({ name: player.classe, quantidade: 1 });
    }
    return acc;
  }, []);

  // Dados para o gráfico de níveis
  const levelData = players.reduce((acc: { name: string; quantidade: number }[], player) => {
    const levelRange = Math.floor(player.nivel / 10) * 10;
    const rangeName = `${levelRange}-${levelRange + 9}`;
    
    const existingRange = acc.find(item => item.name === rangeName);
    if (existingRange) {
      existingRange.quantidade++;
    } else {
      acc.push({ name: rangeName, quantidade: 1 });
    }
    return acc;
  }, []).sort((a, b) => parseInt(a.name) - parseInt(b.name));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/20">
              Nova Atividade
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="bg-[#151E2F] p-6 rounded-lg border border-gray-800 hover:border-indigo-500/50 transition-colors shadow-lg"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-600/20 rounded-lg">
                    <Icon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Classes */}
          <div className="bg-[#151E2F] rounded-lg border border-gray-800 hover:border-indigo-500/50 transition-colors shadow-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-white mb-6">Players por Classe</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B1120',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#E5E7EB',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="quantidade" 
                      name="Quantidade" 
                      fill="url(#colorGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gráfico de Níveis */}
          <div className="bg-[#151E2F] rounded-lg border border-gray-800 hover:border-indigo-500/50 transition-colors shadow-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-white mb-6">Players por Nível</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0B1120',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#E5E7EB',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="quantidade" 
                      name="Quantidade" 
                      fill="url(#levelGradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
