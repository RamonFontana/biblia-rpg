import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCharacterById } from '../api/characterApi';
import type { Character } from '../types';

export function CharacterDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!id) return;
      try {
        const data = await getCharacterById(id);
        if (!data) {
          setError('Personagem não encontrado');
          return;
        }
        setCharacter(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar personagem');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
        <button onClick={() => navigate('/characters')} className="mt-4 underline">Voltar para a lista</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Detalhes do Personagem</h1>
        <button onClick={() => navigate('/characters')} className="text-gray-500 hover:text-gray-700">
          Voltar
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">

        {character.has_participated_in_session && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Este personagem já participou de uma sessão e não pode mais ter seus atributos base editados aqui.
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-500">Nome</h3>
          <p className="mt-1 text-lg text-gray-900 font-semibold">{character.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tribo</h3>
            <p className="mt-1 text-md text-gray-900">{character.tribe}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Vocação</h3>
            <p className="mt-1 text-md text-gray-900">{character.vocation}</p>
          </div>
        </div>

        {/* Adicione outras áreas read-only como atributos, status etc */}
      </div>
    </div>
  );
}
