import { supabase } from '@/lib/supabase';

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
    // 0. Pega os stats atuais do personagem
    const { data: char } = await supabase.from('characters').select('stats').eq('id', characterId).single();
    const stats = (char?.stats as Record<string, unknown>) || {};

    // 1. Atualiza na tabela characters os stats de death saves e o current_pv
    const { error: charError } = await supabase
      .from('characters')
      .update({
        death_saves_successes: 0,
        death_saves_failures: 0,
        is_stable: false,
        is_dead: false,
        stats: { ...stats, current_pv: newHp, status: 'Vivo' }
      })
      .eq('id', characterId);
      
    if (charError) throw charError;

    // 2. Atualiza a vida atual no combate (se estiver em combate)
    if (participantId) {
      const { error: combatError } = await supabase
        .from('combat_participants')
        .update({
          hp_current: newHp,
        })
        .eq('id', participantId);
        
      if (combatError) throw combatError;
    }
  };

  return {
    addSuccess,
    addFailure,
    stabilize,
    killInstant,
    healAndAwake,
  };
};
