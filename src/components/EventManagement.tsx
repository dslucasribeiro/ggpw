'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Plus, X, Trash2 } from 'lucide-react';
import { useOwnerContext } from '@/contexts/OwnerContext';

interface EventType {
  id: number;
  name: string;
  day: string | null;
  hour: string | null;
  hidden: boolean;
  idOwner: number;
}

interface EventManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onEventUpdate: () => void;
  events: EventType[];
}

interface NewEventType {
  name: string;
  day: string;
  hour: string;
}

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventName: string;
}

function DeleteConfirmation({ isOpen, onClose, onConfirm, eventName }: DeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h3>
        <p className="text-gray-300 mb-2">
          Você tem certeza que deseja excluir o evento <span className="font-semibold text-white">{eventName}</span>?
        </p>
        <p className="text-red-400 text-sm mb-6">
          Atenção: Esta ação é irreversível e pode afetar outras funcionalidades do sistema.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

const dayOptions = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
  'Sábado & Domingo'
];

export default function EventManagement({ isOpen, onClose, onEventUpdate, events }: EventManagementProps) {
  const [newEvent, setNewEvent] = useState<NewEventType>({
    name: '',
    day: dayOptions[0],
    hour: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; eventId: number; eventName: string }>({
    isOpen: false,
    eventId: 0,
    eventName: ''
  });
  const { ownerId } = useOwnerContext();

  if (!isOpen) return null;

  const handleAddEvent = async () => {
    try {
      const { error } = await supabase
        .from('event_types')
        .insert([
          { 
            ...newEvent,
            hidden: false,
            idOwner: ownerId
          }
        ]);

      if (error) throw error;

      onEventUpdate();
      setNewEvent({
        name: '',
        day: dayOptions[0],
        hour: ''
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleToggleVisibility = async (event: EventType) => {
    try {
      const { error } = await supabase
        .from('event_types')
        .update({ hidden: !event.hidden })
        .eq('id', event.id)
        .eq('idOwner', ownerId);

      if (error) throw error;

      onEventUpdate();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', eventId)
        .eq('idOwner', ownerId);

      if (error) throw error;

      onEventUpdate();
      setDeleteConfirmation({ isOpen: false, eventId: 0, eventName: '' });
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Gerenciar Eventos</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Formulário para adicionar novo evento */}
          <form onSubmit={(e) => { e.preventDefault(); handleAddEvent(); }} className="mb-8 bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-white">Adicionar Novo Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-600 text-white rounded p-2"
                  placeholder="Nome do evento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Dia</label>
                <select
                  value={newEvent.day}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, day: e.target.value }))}
                  className="w-full bg-gray-600 text-white rounded p-2"
                >
                  <option value="">Selecione o dia</option>
                  {dayOptions.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Hora</label>
                <input
                  type="time"
                  value={newEvent.hour}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, hour: e.target.value }))}
                  className="w-full bg-gray-600 text-white rounded p-2"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Evento
            </button>
          </form>

          {/* Lista de eventos existentes */}
          <div className="bg-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-600">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{event.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{event.day || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{event.hour || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleVisibility(event)}
                          className="hover:text-blue-400 transition-colors"
                          title={event.hidden ? "Mostrar evento" : "Ocultar evento"}
                        >
                          {event.hidden ? (
                            <EyeOff className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation({
                            isOpen: true,
                            eventId: event.id,
                            eventName: event.name
                          })}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Excluir evento"
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

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, eventId: 0, eventName: '' })}
        onConfirm={() => handleDeleteEvent(deleteConfirmation.eventId)}
        eventName={deleteConfirmation.eventName}
      />
    </div>
  );
}
