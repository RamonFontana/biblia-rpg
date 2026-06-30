import { conditionsService } from './conditionsService';
import type { AbilityDefinition } from '../data/abilities';
import { useCombatStore } from '../store/combatStore';
import type { ConditionEntry } from '../types/combat';

export const combatEngine = {
  /**
   * Executa uma habilidade em um alvo, aplicando os efeitos mecânicos automatizados
   * (como applyConditions) se existirem.
   */
  async executeAbilityOnTarget(ability: AbilityDefinition, targetParticipantId: string) {
    if (!ability.applyConditions || ability.applyConditions.length === 0) {
      return;
    }

    const store = useCombatStore.getState();
    const target = store.participants.find(p => p.id === targetParticipantId);
    
    if (!target) {
      console.warn('Target participant not found in active combat');
      return;
    }

    let currentConditions = (target.conditions as unknown as ConditionEntry[]) || [];
    
    for (const cond of ability.applyConditions) {
      const newCond: ConditionEntry = { 
        conditionId: cond.conditionId, 
        duration: cond.duration ?? null 
      };
      currentConditions = conditionsService.mergeCondition(currentConditions, newCond);
    }

    await store.updateConditions(target.id, currentConditions);
  },

  /**
   * Executa uma habilidade no próprio usuário.
   */
  async executeAbilityOnSelf(ability: AbilityDefinition, selfParticipantId: string) {
    await this.executeAbilityOnTarget(ability, selfParticipantId);
  }
};
