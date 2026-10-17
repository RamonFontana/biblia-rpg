import { conditionsService } from './conditionsService';
import type { AbilityDefinition } from '../data/abilities';
import { useCombatStore } from '../store/combatStore';
import type { ConditionEntry, CharacterEquipment, WeaponEffect } from '../types/combat';
import { supabase } from '../lib/supabase';
import {
  applyArmorResistance,
  findMaxResistanceLevel,
  resolveEquippedItems,
} from '../lib/armorResistance';

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

    await this.executeAbilityOnTarget({ applyConditions } as any, targetParticipantId);

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
  async executeAbilityOnTarget(ability: AbilityDefinition, targetParticipantId: string) {
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

    // Fetch target equipment to check for condition resistances
    let maxResistanceLevel = 0;
    if (target.entity_type !== 'enemy' && target.entity_id) {
      const { data: charData } = await supabase
        .from('characters')
        .select('equipment, character_items(*)')
        .eq('id', target.entity_id)
        .single();

      if (charData) {
        const equipment = charData.equipment as unknown as CharacterEquipment;
        const charItems = (charData.character_items as any[]) || [];

        const equippedItemsData = resolveEquippedItems(equipment, charItems);

        // Evaluate incoming conditions against resistances
        maxResistanceLevel = findMaxResistanceLevel(
          ability.applyConditions.map((c) => c.conditionId),
          equippedItemsData,
        );
      }
    }

    for (const cond of ability.applyConditions) {
      const {
        duration: finalDuration,
        immune: isImmune,
        toast: toastMsg,
      } = applyArmorResistance(cond.conditionId, cond.duration ?? null, maxResistanceLevel);

      // Dispatch simple global event for toast notification
      if (maxResistanceLevel > 0 && typeof window !== 'undefined' && toastMsg) {
        window.dispatchEvent(new CustomEvent('combat-toast', { detail: { message: toastMsg } }));
      }

      if (!isImmune) {
        const newCond: ConditionEntry = {
          conditionId: cond.conditionId,
          duration: finalDuration,
        };
        currentConditions = conditionsService.mergeCondition(currentConditions, newCond);
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
