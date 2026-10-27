import { useState } from 'react';
import { updateCharacterRest } from '@/data-access/characters';
import { updateGameSession, type GameSession, type SessionNpc } from '@/data-access/sessions';
import type { Character } from '@/features/character-management/types';
import type { CharacterSkills } from '@/features/character-creation/types';
import { Button } from '@/components/ui/button';
import { Moon, Loader2 } from 'lucide-react';
import { calculateRechargedAbilities } from '@/utils/abilityUtils';
import {
  applyLongRestToStats,
  calculateFaithRecovery,
  canTakeLongRest,
  hasPriestInGroup,
} from '@/domain/rest';
import { CLOSED_SHORT_REST } from '@/domain/shortRest';
import { LongRestDialog } from './LongRestDialog';

interface SessionRestControlsProps {
  sessionId: string;
  sessionData: Pick<GameSession, 'current_day' | 'last_long_rest_day'> | null;
  playerCharacters: { character?: Character | null }[];
  npcs?: SessionNpc[];
  onRestCompleted?: () => void;
}

/** Quem descansa: os personagens dos jogadores e os NPCs com ficha, nunca os inimigos. */
function restTargets(
  playerCharacters: { character?: Character | null }[],
  npcs: SessionNpc[],
): Character[] {
  return [
    ...playerCharacters.flatMap((pc) =>
      pc.character && !pc.character.is_enemy ? [pc.character] : [],
    ),
    ...npcs.filter((npc) => !npc.is_enemy),
  ];
}

export function SessionRestControls({
  sessionId,
  sessionData,
  playerCharacters,
  npcs = [],
  onRestCompleted,
}: SessionRestControlsProps) {
  const [isResting, setIsResting] = useState(false);
  const [longRestOpen, setLongRestOpen] = useState(false);

  if (!sessionData) return null;

  const currentDay = sessionData.current_day || 1;
  const lastLongRestDay = sessionData.last_long_rest_day || 1;

  const canLongRest = canTakeLongRest(currentDay, lastLongRestDay);

  const handleLongRest = async (baseFaithRoll: number) => {
    if (!canLongRest || isResting) return;
    setIsResting(true);

    try {
      // 1. Update session tracking
      await updateGameSession(sessionId, {
        last_long_rest_day: currentDay,
        short_rests_today: 0, // Reset short rests just in case
        ...CLOSED_SHORT_REST, // o Descanso Longo fecha um Curto que esteja aberto
      });

      // 2. Check if there's a Priest for the Faith bonus
      const hasPriest = hasPriestInGroup(playerCharacters.map((pc) => pc.character?.vocation));

      const faithRecovered = calculateFaithRecovery(baseFaithRoll, hasPriest);

      // 3. Update all characters (players and npcs)
      const allCharacters = restTargets(playerCharacters, npcs);

      const updates = allCharacters.map((char) => {
        const currentStats = char.stats || {};

        // Calculate recharged abilities
        const currentSkills = (char.skills || {}) as CharacterSkills;
        const abilityUses = currentSkills.ability_uses || {};
        const newAbilityUses = calculateRechargedAbilities(abilityUses, 'long_rest');

        const newSkills = {
          ...currentSkills,
          ability_uses: newAbilityUses,
        };

        return updateCharacterRest(char.id, {
          stats: applyLongRestToStats(currentStats, faithRecovered),
          skills: newSkills,
        });
      });

      await Promise.all(updates);
      if (onRestCompleted) onRestCompleted();

      alert(
        `Descanso Longo concluído! Todos os personagens recuperaram toda a vida, habilidades e fé. O grupo recuperou ${faithRecovered} de Fé.`,
      );
    } catch (error) {
      console.error('Erro ao acionar descanso longo:', error);
      alert('Erro ao realizar descanso longo.');
      throw error;
    } finally {
      setIsResting(false);
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4 mb-6 shadow-sm">
      <h3 className="text-lg font-semibold text-stone-200 mb-3 border-b border-stone-800 pb-2">
        Controles de Descanso
      </h3>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => setLongRestOpen(true)}
          disabled={!canLongRest || isResting}
          variant="outline"
          className="bg-amber-900/20 text-amber-400 border-amber-800 hover:bg-amber-900/40 hover:text-amber-300"
          title={!canLongRest ? 'Só um Descanso Longo por dia de jogo.' : ''}
        >
          {isResting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Moon className="w-4 h-4 mr-2" />
          )}
          Descanso Longo {canLongRest ? '(Disponível)' : '(Indisponível)'}
        </Button>
      </div>
      <LongRestDialog
        isOpen={longRestOpen}
        hasPriest={hasPriestInGroup(playerCharacters.map((pc) => pc.character?.vocation))}
        onConfirm={handleLongRest}
        onClose={() => setLongRestOpen(false)}
      />
      {!canLongRest && (
        <p className="text-xs text-stone-500 mt-2">
          Descanso longo estará disponível a partir do dia {lastLongRestDay + 1}.
        </p>
      )}
    </div>
  );
}
