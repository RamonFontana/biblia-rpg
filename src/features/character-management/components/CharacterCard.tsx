import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onClick: (character: Character) => void;
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <div
      className="p-4 border rounded-lg shadow-sm cursor-pointer bg-stone-900 border-amber-700/50 hover:-translate-y-1 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-300 ease-in-out"
      onClick={() => onClick(character)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-stone-200 tracking-wide">{character.name}</h3>
          <p className="text-sm text-stone-400 font-medium mt-1">
            {character.tribe} <span className="text-amber-700/70 mx-1">•</span> {character.vocation}
          </p>
        </div>
        {character.has_participated_in_session && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-200 border border-amber-700/50">
            Em Campanha
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="text-center p-2 bg-stone-950 border border-stone-800/50 rounded-md shadow-inner">
          <span className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">PV</span>
          <span className="font-bold text-stone-200">{character.stats?.pv || 0}</span>
        </div>
        <div className="text-center p-2 bg-stone-950 border border-stone-800/50 rounded-md shadow-inner">
          <span className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">CA</span>
          <span className="font-bold text-stone-200">{character.stats?.ca || 0}</span>
        </div>
        <div className="text-center p-2 bg-stone-950 border border-stone-800/50 rounded-md shadow-inner">
          <span className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Fé</span>
          <span className="font-bold text-stone-200">{character.stats?.faith || 0}</span>
        </div>
      </div>
    </div>
  );
}
