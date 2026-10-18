import { updateCharacterDeathState } from '@/data-access/characters';
import { characterVitalsService } from '@/data-access/vitals';
import { addDeathSaveFailure, addDeathSaveSuccess } from '@/domain/deathSaves';

export const useDeathSaves = () => {
  const addSuccess = async (characterId: string, currentSuccesses: number) => {
    const { newSuccesses, isStable } = addDeathSaveSuccess(currentSuccesses);

    await updateCharacterDeathState(characterId, {
      death_saves_successes: newSuccesses,
      is_stable: isStable,
    });
    return { newSuccesses, isStable };
  };

  const addFailure = async (characterId: string, currentFailures: number, count: number = 1) => {
    const { newFailures, isDead } = addDeathSaveFailure(currentFailures, count);

    await updateCharacterDeathState(characterId, {
      death_saves_failures: newFailures,
      is_dead: isDead,
    });
    return { newFailures, isDead };
  };

  const stabilize = async (characterId: string) => {
    await updateCharacterDeathState(characterId, {
      is_stable: true,
      death_saves_successes: 3,
    });
  };

  const killInstant = async (characterId: string) => {
    await updateCharacterDeathState(characterId, {
      is_dead: true,
      death_saves_failures: 3,
    });
  };

  const healAndAwake = async (characterId: string, participantId?: string, newHp: number = 1) => {
    await characterVitalsService.reviveWithHp(
      characterId,
      newHp,
      { death_saves_successes: 0, death_saves_failures: 0, is_stable: false },
      participantId,
    );
  };

  return {
    addSuccess,
    addFailure,
    stabilize,
    killInstant,
    healAndAwake,
  };
};
