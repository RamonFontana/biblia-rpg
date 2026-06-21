import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onClick: (character: Character) => void;
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <div
      className="p-4 border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-shadow bg-card"
      onClick={() => onClick(character)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{character.name}</h3>
          <p className="text-sm text-gray-600">
            {character.tribe} • {character.vocation}
          </p>
        </div>
        {character.has_participated_in_session && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Em Campanha
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="text-center p-2 bg-gray-50 rounded">
          <span className="block font-medium text-gray-500">PV</span>
          <span className="font-bold">{character.stats?.pv || 0}</span>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <span className="block font-medium text-gray-500">CA</span>
          <span className="font-bold">{character.stats?.ca || 0}</span>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <span className="block font-medium text-gray-500">Fé</span>
          <span className="font-bold">{character.stats?.faith || 0}</span>
        </div>
      </div>
    </div>
  );
}
