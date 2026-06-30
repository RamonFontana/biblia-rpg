import { conditionsService } from './conditionsService';
import type { AbilityDefinition } from '../data/abilities';
import { useCombatStore } from '../store/combatStore';
import type { ConditionEntry, CharacterEquipment } from '../types/combat';
import { supabase } from '../lib/supabase';
import { ITEMS_DB } from '../data/itemsDb';
import type { EquipmentItem } from '../features/character-creation/types';

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
    
    // Fetch target equipment to check for condition resistances
    let maxResistanceLevel = 0;
    if (target.entity_type !== 'enemy' && target.entity_id) {
      const { data: charData } = await supabase
        .from('characters')
        .select('equipment, character_items')
        .eq('id', target.entity_id)
        .single();
        
      if (charData) {
        const equipment = charData.equipment as unknown as CharacterEquipment;
        const charItems = (charData.character_items as any[]) || [];
        
        const equippedIds = [equipment?.head, equipment?.body, equipment?.mainHand, equipment?.offHand].filter(Boolean);
        
        // Map equipped IDs to actual items from ITEMS_DB
        const equippedItems = equippedIds.map(slotId => {
          // It could be a character_item uuid or directly the item id
          const invItem = charItems.find(i => i.id === slotId || i.item_id === slotId);
          const itemId = invItem?.item_id || slotId;
          return ITEMS_DB.find(i => i.id === itemId);
        }).filter(Boolean) as EquipmentItem[];
        
        // Evaluate incoming conditions against resistances
        for (const cond of ability.applyConditions) {
          for (const item of equippedItems) {
            if (item.conditionResistances?.includes(cond.conditionId)) {
              maxResistanceLevel = Math.max(maxResistanceLevel, item.level || 1);
            }
          }
        }
      }
    }
    
    for (const cond of ability.applyConditions) {
      let finalDuration = cond.duration ?? null;
      let isImmune = false;
      let toastMsg = '';

      if (maxResistanceLevel > 0) {
        if (maxResistanceLevel === 1) {
          toastMsg = `Resistência de Armadura Nv1: Vantagem no Teste contra ${cond.conditionId}`;
        } else if (maxResistanceLevel === 2) {
          finalDuration = finalDuration !== null ? Math.ceil(finalDuration / 2) : finalDuration;
          toastMsg = `Resistência de Armadura Nv2: Duração de ${cond.conditionId} reduzida pela metade`;
        } else if (maxResistanceLevel === 3) {
          finalDuration = finalDuration !== null ? Math.ceil(finalDuration / 2) : finalDuration;
          toastMsg = `Resistência de Armadura Nv3: Vantagem e duração de ${cond.conditionId} reduzida pela metade`;
        } else if (maxResistanceLevel >= 4) {
          isImmune = true;
          toastMsg = `Resistência de Armadura Nv4: Imune a ${cond.conditionId}!`;
        }
        
        // Dispatch simple global event for toast notification
        if (typeof window !== 'undefined' && toastMsg) {
          window.dispatchEvent(new CustomEvent('combat-toast', { detail: { message: toastMsg } }));
        }
      }

      if (!isImmune) {
        const newCond: ConditionEntry = { 
          conditionId: cond.conditionId, 
          duration: finalDuration 
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
  }
};
