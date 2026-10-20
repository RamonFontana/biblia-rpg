import { Star } from 'lucide-react';
import type { Character } from '@/features/character-management/types';

/** Aparência, personalidade e história; some quando a ficha não tem nenhuma. */
export function NarrativeSection({ narrative }: { narrative: Character['narrative'] }) {
  if (!narrative || !(narrative.history || narrative.physicalDesc || narrative.personality)) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
        <Star className="w-5 h-5 text-amber-500" />
        Características
      </h3>
      <div className="space-y-4 bg-stone-900/50 p-4 rounded-xl border border-stone-800/50">
        {narrative.physicalDesc && (
          <div>
            <h4 className="text-sm font-semibold text-stone-400 mb-1">Aparência</h4>
            <p className="text-sm text-stone-300 leading-relaxed">{narrative.physicalDesc}</p>
          </div>
        )}
        {narrative.personality && (
          <div>
            <h4 className="text-sm font-semibold text-stone-400 mb-1">Personalidade</h4>
            <p className="text-sm text-stone-300 leading-relaxed">{narrative.personality}</p>
          </div>
        )}
        {narrative.history && (
          <div>
            <h4 className="text-sm font-semibold text-stone-400 mb-1">História</h4>
            <p className="text-sm text-stone-300 leading-relaxed">{narrative.history}</p>
          </div>
        )}
      </div>
    </div>
  );
}
