'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOwnerContext } from '@/contexts/OwnerContext';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

const DEFAULT_CLASSES = ['WR', 'MG', 'EA', 'EP', 'WB', 'WF'];

interface ClassCardProps {
  classe: string;
  selected: boolean;
  onClick: () => void;
}

interface Player {
  id: number;
  nick: string;
  nivel: number;
  classe: string;
  posicao: string;
}

interface Tutor {
  id: number;
  classe: string;
  player_id: number;
  idOwner: number;
}

interface TutorialContent {
  id: number;
  classe: string;
  title: string;
  description: string;
  video_url: string | null;
  order_index: number;
}

function ClassCard({ classe, selected, onClick }: ClassCardProps) {
  return (
    <button
      onClick={onClick}
      className={`${
        selected 
          ? 'bg-[#1E2330] border-2 border-blue-500' 
          : 'bg-[#151A27] hover:bg-[#1E2330]'
      } rounded-lg p-8 text-center transition-all duration-200 transform hover:scale-102`}
    >
      <h2 className="text-xl font-bold text-white mb-2">{classe}</h2>
      <p className="text-gray-400">Ver tutoria para {classe}</p>
    </button>
  );
}

function ContentCard({ content, onEdit, onDelete }: { 
  content: TutorialContent;
  onEdit: (content: TutorialContent) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-[#1A1F2E] rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-white">{content.title}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(content)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(content.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <p className="text-gray-400">{content.description}</p>
      
      {content.video_url && (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${getYoutubeId(content.video_url)}`}
            className="w-full h-full rounded"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

function ContentForm({ 
  content,
  onSave,
  onCancel 
}: { 
  content?: TutorialContent;
  onSave: (content: Partial<TutorialContent>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: content?.title || '',
    description: content?.description || '',
    video_url: content?.video_url || ''
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSave(formData);
    }} className="bg-[#1A1F2E] rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">
          Título
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 bg-[#151A27] rounded border border-gray-700 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 bg-[#151A27] rounded border border-gray-700 text-white h-32"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">
          URL do Vídeo (YouTube)
        </label>
        <input
          type="url"
          value={formData.video_url}
          onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
          className="w-full px-3 py-2 bg-[#151A27] rounded border border-gray-700 text-white"
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

function getYoutubeId(url: string) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : url.split('/').pop();
}

function TutorSelector({ 
  players,
  onSelect, 
  onCancel 
}: { 
  players: Player[];
  onSelect: (playerId: number) => void; 
  onCancel: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlayers = players.filter(player => 
    player.nick.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#1A1F2E] rounded-lg p-5 space-y-4 max-w-2xl">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">
          Buscar Jogador
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-[#151A27] rounded border border-gray-700 text-white text-sm"
          placeholder="Digite o nick do jogador..."
        />
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1.5">
        {filteredPlayers.map(player => (
          <button
            key={player.id}
            onClick={() => onSelect(player.id)}
            className="w-full text-left px-4 py-2 hover:bg-[#151A27] rounded transition-colors flex items-center text-sm group"
          >
            <span className="text-white font-medium min-w-[120px]">{player.nick}</span>
            <span className="text-gray-400 min-w-[45px] ml-6 text-left">{player.classe}</span>
            <span className="text-gray-400 min-w-[80px] text-right ml-4 text-right">Nível {player.nivel}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function Tutoria() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [contents, setContents] = useState<TutorialContent[]>([]);
  const [isEditingTutor, setIsEditingTutor] = useState(false);
  const [editingContent, setEditingContent] = useState<TutorialContent | null>(null);
  const [isAddingContent, setIsAddingContent] = useState(false);
  const { ownerId } = useOwnerContext();

  useEffect(() => {
    if (ownerId) {
      fetchPlayers();
      fetchTutors();
    }
  }, [ownerId]);

  useEffect(() => {
    if (selectedClass && ownerId) {
      fetchContents();
    }
  }, [selectedClass, ownerId]);

  async function fetchPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('idOwner', ownerId)
        .order('nick', { ascending: true });

      if (error) {
        console.error('Erro ao buscar players:', error);
        return;
      }
      
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }

  async function fetchTutors() {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('idOwner', ownerId);

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      // Não mostra erro no console se for apenas falta de dados
      setTutors([]);
    }
  }

  async function fetchContents() {
    if (!selectedClass) return;

    try {
      const { data, error } = await supabase
        .from('tutorial_contents')
        .select('*')
        .eq('classe', selectedClass)
        .eq('idOwner', ownerId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      setContents([]);
    }
  }

  const getTutorNick = (classe: string) => {
    const tutor = tutors.find(t => t.classe === classe);
    if (!tutor) return 'Não definido';
    
    const player = players.find(p => p.id === tutor.player_id);
    return player?.nick || 'Não definido';
  };

  const handleClassSelect = (classe: string) => {
    setSelectedClass(classe);
    setIsEditingTutor(false);
    setIsAddingContent(false);
    setEditingContent(null);
  };

  const handleTutorSelect = async (playerId: number) => {
    if (!selectedClass || !ownerId) return;

    try {
      const existingTutor = tutors.find(t => t.classe === selectedClass);

      if (existingTutor) {
        const { error } = await supabase
          .from('tutors')
          .update({ player_id: playerId })
          .eq('id', existingTutor.id)
          .eq('idOwner', ownerId); // Garantir que só atualiza se for o owner correto

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tutors')
          .insert({
            classe: selectedClass,
            player_id: playerId,
            idOwner: ownerId
          });

        if (error) throw error;
      }

      // Atualiza o estado local antes de buscar do servidor
      if (existingTutor) {
        setTutors(tutors.map(t => 
          t.id === existingTutor.id 
            ? { ...t, player_id: playerId }
            : t
        ));
      } else {
        // Simula o ID para o novo tutor (será atualizado no próximo fetch)
        setTutors([...tutors, {
          id: Date.now(), // ID temporário
          classe: selectedClass,
          player_id: playerId,
          idOwner: ownerId
        }]);
      }

      setIsEditingTutor(false);
      
      // Busca os dados atualizados do servidor
      await fetchTutors();
    } catch (error) {
      // Não mostra erro no console, apenas reseta o estado
      setIsEditingTutor(false);
      await fetchTutors(); // Recarrega o estado atual
    }
  };

  const handleSaveContent = async (contentData: Partial<TutorialContent>) => {
    if (!selectedClass || !ownerId) return;

    try {
      if (editingContent) {
        const { error } = await supabase
          .from('tutorial_contents')
          .update({
            title: contentData.title,
            description: contentData.description,
            video_url: contentData.video_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingContent.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tutorial_contents')
          .insert([{
            classe: selectedClass,
            title: contentData.title,
            description: contentData.description,
            video_url: contentData.video_url || null,
            order_index: contents.length,
            idOwner: ownerId
          }]);

        if (error) throw error;
      }

      fetchContents();
      setEditingContent(null);
      setIsAddingContent(false);
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleDeleteContent = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tutorial_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchContents();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Tutoria</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEFAULT_CLASSES.map((classe) => (
          <ClassCard
            key={classe}
            classe={classe}
            selected={selectedClass === classe}
            onClick={() => handleClassSelect(classe)}
          />
        ))}
      </div>

      {selectedClass && (
        <div className="mt-8 space-y-6">
          <div className="bg-[#151A27] rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Tutoria para {selectedClass}
              </h2>
              <button
                onClick={() => setIsEditingTutor(!isEditingTutor)}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                {isEditingTutor ? (
                  "Cancelar"
                ) : (
                  <>
                    <PencilIcon className="w-4 h-4" />
                    Definir Tutor
                  </>
                )}
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-400">
                Tutor da classe: <span className="text-white font-medium">{getTutorNick(selectedClass)}</span>
              </p>
              {isEditingTutor && (
                <TutorSelector 
                  players={players}
                  onSelect={handleTutorSelect}
                  onCancel={() => setIsEditingTutor(false)}
                />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Conteúdo</h2>
              {!isAddingContent && !editingContent && (
                <button
                  onClick={() => setIsAddingContent(true)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Adicionar Card</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {isAddingContent && (
                <ContentForm
                  onSave={handleSaveContent}
                  onCancel={() => setIsAddingContent(false)}
                />
              )}

              {editingContent && (
                <ContentForm
                  content={editingContent}
                  onSave={handleSaveContent}
                  onCancel={() => setEditingContent(null)}
                />
              )}

              {!isAddingContent && !editingContent && (
                <div>
                  {contents.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {contents.map((content) => (
                        <ContentCard
                          key={content.id}
                          content={content}
                          onEdit={setEditingContent}
                          onDelete={handleDeleteContent}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">Nenhum conteúdo cadastrado para esta classe</p>
                      <p className="text-sm text-gray-500">
                        Clique em "Adicionar Card" para criar o primeiro conteúdo
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
