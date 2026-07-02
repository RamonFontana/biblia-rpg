
import { ShieldAlert } from 'lucide-react';
import { calculateModifier, calculateProficiency, formatModifier } from '@/features/character-management/utils/characterMath';
import { getVocationRules } from '@/features/character-management/utils/rules/vocations';

interface CharacterSavingThrowsProps {
  attributes: any;
  level: number;
  vocation: string;
}

const ATTRIBUTES = [
  { id: 'for', name: 'Força' },
  { id: 'des', name: 'Destreza' },
  { id: 'con', name: 'Constituição' },
  { id: 'int', name: 'Inteligência' },
  { id: 'sab', name: 'Sabedoria' },
  { id: 'car', name: 'Carisma' }
];

export function CharacterSavingThrows({ attributes, level, vocation }: CharacterSavingThrowsProps) {
  const rules = getVocationRules(vocation);
  const savingThrows = rules?.savingThrows || [];
  const profBonus = calculateProficiency(level);

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
        <ShieldAlert className="w-5 h-5 text-amber-500" />
        Testes de Resistência
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {ATTRIBUTES.map((attr) => {
          const isProficient = savingThrows.includes(attr.id);
          const attrValue = attributes?.[attr.id];
          const attrMod = calculateModifier(attrValue);
          const totalMod = isProficient ? attrMod + profBonus : attrMod;

          return (
            <div 
              key={attr.id} 
              className={`flex flex-col items-center justify-center p-3 rounded-lg border ${isProficient ? 'border-amber-500/50 bg-amber-500/10 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : 'border-stone-800 bg-stone-900'} `}
            >
              <div className="flex items-center gap-1 mb-1">
                <div className={`w-2 h-2 rounded-full border ${isProficient ? 'bg-amber-500 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-transparent border-stone-600'}`} />
                <span className={`text-[10px] font-bold uppercase ${isProficient ? 'text-amber-200' : 'text-stone-400'}`}>
                  {attr.name}
                </span>
              </div>
              <span className={`text-xl font-bold ${isProficient ? 'text-amber-400 drop-shadow-md' : 'text-stone-300'}`}>
                {formatModifier(totalMod)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
