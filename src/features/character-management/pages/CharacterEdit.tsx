import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacterById } from '../api/characterApi';
import { WizardLayout } from '../../character-creation/components/WizardLayout';
import { useCharacterCreationStore } from '../../character-creation/store/useCharacterCreationStore';
import type { DraftCharacter } from '../../character-creation/types';

export function CharacterEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { loadDraft, reset } = useCharacterCreationStore();

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!id) return;
      try {
        const data = await getCharacterById(id);
        if (!data) {
          setError('Personagem não encontrado');
          return;
        }

        // Block edit if already participated
        if (data.has_participated_in_session) {
          navigate(`/characters/${id}`);
          return;
        }

        const draft: DraftCharacter = {
          name: data.name,
          tribe: data.tribe,
          vocation: data.vocation,
          coins: data.coins || 0,
          equipment: (data.equipment as any) || [],
          attributes: data.attributes as any,
          stats: data.stats as any,
          fortress: data.fortress || '',
          temptation: data.temptation || '',
          narrative: data.narrative as any
        };

        loadDraft(draft, id);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar personagem');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();

    return () => {
      reset();
    };
  }, [id, navigate, loadDraft, reset]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md max-w-2xl mx-auto mt-8">
        <p>{error}</p>
        <button onClick={() => navigate('/characters')} className="mt-4 underline">Voltar para a lista</button>
      </div>
    );
  }

  return <WizardLayout />;
}
