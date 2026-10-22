import { BookOpen } from 'lucide-react';
import { SKILLS_LIST, formatModifier } from '@/features/character-management/utils/characterMath';
import { calculateModifier, calculateProficiency } from '@/domain/attributes';
import type { CharacterAttributes } from '@/features/character-creation/types';

interface CharacterSkillsListProps {
  attributes: Partial<CharacterAttributes> | null | undefined;
  level: number;
  proficiencies: string[];
}

export function CharacterSkillsList({
  attributes,
  level,
  proficiencies,
}: CharacterSkillsListProps) {
  const profBonus = calculateProficiency(level);

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
        <BookOpen className="w-5 h-5 text-amber-500" />
        Perícias
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {SKILLS_LIST.map((skill) => {
          const isProficient = proficiencies.includes(skill.id);
          const attrValue = attributes?.[skill.attribute];
          const attrMod = calculateModifier(attrValue);
          const totalMod = isProficient ? attrMod + profBonus : attrMod;

          return (
            <div
              key={skill.id}
              className={`flex items-center justify-between p-2 rounded-lg border ${isProficient ? 'border-amber-500/50 bg-amber-500/10 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : 'border-stone-800 bg-stone-900'} `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full border ${isProficient ? 'bg-amber-500 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-transparent border-stone-600'}`}
                  title={isProficient ? 'Proficiente' : 'Não Proficiente'}
                />
                <span
                  className={`text-sm ${isProficient ? 'text-amber-100 font-semibold' : 'text-stone-300'}`}
                >
                  {skill.name}
                  <span className="text-[10px] uppercase text-stone-500 ml-1">
                    ({skill.attribute})
                  </span>
                </span>
              </div>
              <span
                className={`font-bold ${isProficient ? 'text-amber-400 drop-shadow-md' : 'text-stone-400'}`}
              >
                {formatModifier(totalMod)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
