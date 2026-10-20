import { Zap } from 'lucide-react';
import { getAbilityAvailability, type UsableAbility } from '@/domain/abilityUse';
import type { Character } from '@/features/character-management/types';
import { getAbilitiesForCharacter } from '@/utils/abilityUtils';
import { AbilityCard } from '../../combat/AbilityCard';

interface AbilitiesSectionProps {
  character: Character;
  isGM: boolean | undefined;
  onUse: (ability: UsableAbility) => void;
  onRestore: (ability: UsableAbility) => void;
}

/**
 * As Habilidades da tribo e da vocação no nível da ficha, com os usos que restam. Some para ficha
 * de inimigo (skills em lista) e quando não há Habilidade. O jogador vê a Habilidade desligada
 * sem Fé ou sem usos; o Mestre vê tudo liberado.
 */
export function AbilitiesSection({ character, isGM, onUse, onRestore }: AbilitiesSectionProps) {
  if (Array.isArray(character.skills) && character.skills.length > 0) return null;

  const skills = Array.isArray(character.skills) ? undefined : character.skills;
  const abilities = getAbilitiesForCharacter(
    character.tribe || '',
    character.vocation || '',
    character.level || 1,
    skills?.path_choices,
  );
  if (abilities.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
        <Zap className="w-5 h-5 text-amber-500" />
        Habilidades
      </h3>
      <div className="space-y-3">
        {abilities.map((ability, index) => {
          const { remainingUses, disabled, reason } = getAbilityAvailability(
            ability,
            skills,
            character.stats,
          );

          return (
            <AbilityCard
              key={index}
              ability={ability}
              currentUses={remainingUses}
              onUse={() => onUse(ability)}
              onRestore={() => onRestore(ability)}
              isGM={isGM}
              disabled={disabled && !isGM}
              disabledReason={disabled && !isGM ? reason : ''}
            />
          );
        })}
      </div>
    </div>
  );
}
