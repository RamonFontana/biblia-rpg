import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCharacters } from '../api/characterApi';
import type { Character } from '../types';
import { CharacterCard } from '../components/CharacterCard';

export function CharacterList() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const data = await getMyCharacters();
        setCharacters(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar personagens');
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  const handleCharacterClick = (character: Character) => {
    if (character.has_participated_in_session) {
      navigate(`/characters/${character.id}`);
    } else {
      navigate(`/characters/${character.id}/edit`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meus Personagens</h1>
        <button
          onClick={() => navigate('/create-character')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Novo Personagem
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum personagem</h3>
          <p className="mt-1 text-sm text-gray-500">Comece criando um novo personagem para sua jornada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onClick={handleCharacterClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
