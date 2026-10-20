import { Activity } from 'lucide-react';
import { calculateModifier } from '@/domain/attributes';
import { formatModifier } from '@/features/character-management/utils/characterMath';
import type { Character } from '@/features/character-management/types';

/** Os seis atributos: o modificador em destaque e o valor embaixo (10 quando falta). */
export function AttributesGrid({ attributes }: { attributes: Character['attributes'] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
        <Activity className="w-5 h-5 text-amber-500" />
        Atributos
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'FOR', value: attributes?.for },
          { label: 'DES', value: attributes?.des },
          { label: 'CON', value: attributes?.con },
          { label: 'INT', value: attributes?.int },
          { label: 'SAB', value: attributes?.sab },
          { label: 'CAR', value: attributes?.car },
        ].map((attr) => (
          <div
            key={attr.label}
            className="bg-stone-900 border border-stone-800 rounded-lg p-3 text-center flex flex-col items-center relative"
          >
            <span className="text-stone-500 text-xs font-bold mb-1">{attr.label}</span>
            <span className="text-2xl font-bold text-stone-100">
              {formatModifier(calculateModifier(attr.value))}
            </span>
            <span className="text-[10px] text-stone-500 font-mono mt-1 px-1.5 py-0.5 bg-stone-800 rounded">
              {attr.value ?? 10}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
