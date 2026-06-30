import { supabase } from '../lib/supabase';
import type { ConditionEntry } from '../types/combat';

export const conditionsService = {
  /**
   * Helper to merge a new condition into an existing array of conditions.
   * If the condition already exists, it is overwritten (duration resets).
   */
  mergeCondition(currentConditions: ConditionEntry[], newCondition: ConditionEntry): ConditionEntry[] {
    const filtered = currentConditions.filter(c => c.conditionId !== newCondition.conditionId);
    return [...filtered, newCondition];
  },

  /**
   * Helper to remove a condition from an array of conditions.
   */
  removeCondition(currentConditions: ConditionEntry[], conditionId: string): ConditionEntry[] {
    return currentConditions.filter(c => c.conditionId !== conditionId);
  },

  /**
   * Apply a condition to a character outside of combat (global).
   */
  async applyToCharacter(characterId: string, currentConditions: ConditionEntry[], newCondition: ConditionEntry): Promise<ConditionEntry[]> {
    const updated = this.mergeCondition(currentConditions, newCondition);
    const { error } = await supabase
      .from('characters')
      .update({ conditions: updated as any })
      .eq('id', characterId);

    if (error) {
      console.error('Error applying condition to character:', error);
      throw error;
    }
    return updated;
  },

  /**
   * Remove a condition from a character outside of combat (global).
   */
  async removeFromCharacter(characterId: string, currentConditions: ConditionEntry[], conditionId: string): Promise<ConditionEntry[]> {
    const updated = this.removeCondition(currentConditions, conditionId);
    const { error } = await supabase
      .from('characters')
      .update({ conditions: updated as any })
      .eq('id', characterId);

    if (error) {
      console.error('Error removing condition from character:', error);
      throw error;
    }
    return updated;
  },

  /**
   * Apply a condition to a combat participant.
   */
  async applyToCombatParticipant(participantId: string, currentConditions: ConditionEntry[], newCondition: ConditionEntry): Promise<ConditionEntry[]> {
    const updated = this.mergeCondition(currentConditions, newCondition);
    const { error } = await supabase
      .from('combat_participants')
      .update({ conditions: updated as any })
      .eq('id', participantId);

    if (error) {
      console.error('Error applying condition to participant:', error);
      throw error;
    }
    return updated;
  },

  /**
   * Remove a condition from a combat participant.
   */
  async removeFromCombatParticipant(participantId: string, currentConditions: ConditionEntry[], conditionId: string): Promise<ConditionEntry[]> {
    const updated = this.removeCondition(currentConditions, conditionId);
    const { error } = await supabase
      .from('combat_participants')
      .update({ conditions: updated as any })
      .eq('id', participantId);

    if (error) {
      console.error('Error removing condition from participant:', error);
      throw error;
    }
    return updated;
  },

  /**
   * Tick (decrement) durations for conditions that expire over turns.
   * Decrements all conditions that have a non-null duration > 0.
   * Removes conditions that reach 0 duration.
   */
  tickConditions(currentConditions: ConditionEntry[]): ConditionEntry[] {
    return currentConditions
      .map(c => {
        if (c.duration === null) return c; // permanent
        return { ...c, duration: c.duration - 1 };
      })
      .filter(c => c.duration === null || c.duration > 0);
  },

  /**
   * Remove temporary conditions (with a set duration).
   * Keeps only permanent conditions (duration === null).
   */
  cleanTemporaryConditions(currentConditions: ConditionEntry[]): ConditionEntry[] {
    return currentConditions.filter(c => c.duration === null);
  }
};
