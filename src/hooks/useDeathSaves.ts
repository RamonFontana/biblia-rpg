import { supabase } from '@/lib/supabase';
import { characterVitalsService } from '@/services/characterVitalsService';

export const useDeathSaves = () => {
  const addSuccess = async (characterId: string, currentSuccesses: number) => {
    const newSuccesses = Math.min(currentSuccesses + 1, 3);
    const isStable = newSuccesses >= 3;

    const { error } = await supabase
      .from('characters')
      .update({
        death_saves_successes: newSuccesses,
        is_stable: isStable,
      })
      .eq('id', characterId);

    if (error) throw error;
    return { newSuccesses, isStable };
  };

  const addFailure = async (characterId: string, currentFailures: number, count: number = 1) => {
    const newFailures = Math.min(currentFailures + count, 3);
    const isDead = newFailures >= 3;

    const { error } = await supabase
      .from('characters')
      .update({
        death_saves_failures: newFailures,
        is_dead: isDead,
      })
      .eq('id', characterId);

    if (error) throw error;
    return { newFailures, isDead };
  };

  const stabilize = async (characterId: string) => {
    const { error } = await supabase
      .from('characters')
      .update({
        is_stable: true,
        death_saves_successes: 3,
      })
      .eq('id', characterId);

    if (error) throw error;
  };

  const killInstant = async (characterId: string) => {
    const { error } = await supabase
      .from('characters')
      .update({
        is_dead: true,
        death_saves_failures: 3,
      })
      .eq('id', characterId);

    if (error) throw error;
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
