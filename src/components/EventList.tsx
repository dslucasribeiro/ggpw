'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings } from 'lucide-react';
import EventManagement from './EventManagement';

interface EventType {
  id: number;
  name: string;
  day: string | null;
  hour: string | null;
  hidden: boolean;
}

const dayOrder: { [key: string]: number } = {
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6,
  'Domingo': 7,
  'Sábado & Domingo': 6
};

export default function EventList() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('event_types')
        .select('id, name, day, hour, hidden')
        .order('name');

      if (error) throw error;

      const sortedEvents = (data || []).sort((a, b) => {
        if (!a.day && !b.day) return 0;
        if (!a.day) return 1;
        if (!b.day) return -1;
        return (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      });

      setEvents(sortedEvents);
    } catch (err) {
      setError('Erro ao carregar eventos');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) return <div className="p-4">Carregando eventos...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const visibleEvents = events.filter(event => !event.hidden);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lista de Eventos</h1>
        <button
          onClick={() => setIsManagementOpen(true)}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          Gerenciar Eventos
        </button>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                  Dia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {visibleEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {event.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {event.day || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {event.hour || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EventManagement
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        onEventUpdate={fetchEvents}
        events={events}
      />
    </div>
  );
}
