import { mergeCondition } from '@/domain/conditions';
import { getCharacterResistanceSource } from '@/data-access/characters';
import type { AbilityDefinition } from '@/content/schemas';
import { useCombatStore } from '../store/combatStore';
import type { ConditionEntry, CharacterEquipment, WeaponEffect } from '../types/combat';
import {
  applyConditionResistance,
  getConditionResistanceLevels,
  resolveEquippedItems,
} from '@/domain/armorResistance';

export const combatEngine = {
  /**
   * Verifica efeitos da arma (ex: Sangramento com Natural 18+) e os aplica
   */
  async checkWeaponEffects(
    weaponEffects: WeaponEffect[],
    naturalRoll: number,
    targetParticipantId: string,
  ) {
    if (naturalRoll < 18 || !weaponEffects || weaponEffects.length === 0) return;

    const applyConditions = weaponEffects.map((eff) => ({
      conditionId: eff.conditionId,
      duration: 3, // Efeitos de arma padrão duram 3 rodadas se não curados
    }));

    await this.executeAbilityOnTarget({ applyConditions }, targetParticipantId);

    // Notifica via toast
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('combat-toast', {
          detail: { message: `Efeito de Arma Ativado (Nat ${naturalRoll})!` },
        }),
      );
    }
  },

  /**
   * Executa uma habilidade em um alvo, aplicando os efeitos mecânicos automatizados
   * (como applyConditions) se existirem.
   */
  async executeAbilityOnTarget(
    ability: Pick<AbilityDefinition, 'applyConditions'>,
    targetParticipantId: string,
  ) {
    if (!ability.applyConditions || ability.applyConditions.length === 0) {
      return;
    }

    const store = useCombatStore.getState();
    const target = store.participants.find((p) => p.id === targetParticipantId);

    if (!target) {
      console.warn('Target participant not found in active combat');
      return;
    }

    let currentConditions = (target.conditions as unknown as ConditionEntry[]) || [];

    // Nível de Resistência a Condição do alvo, Condição por Condição, pelos itens equipados.
    let resistanceLevels: Record<string, number> = {};
    if (target.entity_type !== 'enemy' && target.entity_id) {
      const charData = await getCharacterResistanceSource(target.entity_id).catch(() => null);

      if (charData) {
        const equipment = charData.equipment as unknown as CharacterEquipment;
        resistanceLevels = getConditionResistanceLevels(
          resolveEquippedItems(equipment, charData.character_items),
        );
      }
    }

    for (const cond of ability.applyConditions) {
      const outcome = applyConditionResistance(
        cond.conditionId,
        cond.duration ?? null,
        resistanceLevels[cond.conditionId] ?? 0,
      );

      // Dispatch simple global event for toast notification
      if (outcome.message && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('combat-toast', { detail: { message: outcome.message } }),
        );
      }

      if (!outcome.immune) {
        const newCond: ConditionEntry = {
          conditionId: cond.conditionId,
          duration: outcome.duration,
        };
        currentConditions = mergeCondition(currentConditions, newCond);
      }
    }

    await store.updateConditions(target.id, currentConditions);
  },

  /**
   * Executa uma habilidade no próprio usuário.
   */
  async executeAbilityOnSelf(ability: AbilityDefinition, selfParticipantId: string) {
    await this.executeAbilityOnTarget(ability, selfParticipantId);
  },
};
