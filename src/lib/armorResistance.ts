// CARACTERIZAÇÃO: regra de Resistência a Condição da armadura, extraída de combatEngine sem alteração.
//
// Problemas conhecidos (decisões em ROADMAP, Onda 2 bloco B e Onda 3):
// - o item equipado é procurado em ITEMS_DB pelo item_id do banco, que é UUID, enquanto o catálogo
//   usa slugs; na prática nenhum item é encontrado e a resistência nunca se aplica;
// - o catálogo guarda resistências em inglês (`bleeding`) e as condições usam português (`sangrando`);
// - o nível máximo de resistência é calculado sobre todas as condições da habilidade e depois
//   aplicado a cada uma, mesmo às que nenhum item resiste;
// - a duração é reduzida arredondando para cima.
import { ITEMS_DB } from '../data/itemsDb';
import type { CharacterEquipment } from '../types/combat';

export interface InventoryItemRow {
  id?: string;
  item_id?: string;
  level?: number | null;
  custom_condition_resistances?: string[] | null;
}

export interface EquippedItem {
  conditionResistances: string[];
  level: number;
}

/** Itens equipados (cabeça, corpo, mãos) com as resistências do catálogo e as personalizadas. */
export function resolveEquippedItems(
  equipment: Partial<CharacterEquipment> | null | undefined,
  inventory: InventoryItemRow[],
): EquippedItem[] {
  const equippedIds = [
    equipment?.head,
    equipment?.body,
    equipment?.mainHand,
    equipment?.offHand,
  ].filter(Boolean);

  const resolved: EquippedItem[] = [];
  for (const slotId of equippedIds) {
    // It could be a character_item uuid or directly the item id
    const invItem = inventory.find((i) => i.id === slotId || i.item_id === slotId);
    const itemId = invItem?.item_id || slotId;
    const dbItem = ITEMS_DB.find((i) => i.id === itemId);
    if (!dbItem) continue;

    const baseResistances = dbItem.conditionResistances || [];
    const customResistances = invItem?.custom_condition_resistances || [];
    resolved.push({
      conditionResistances: [...baseResistances, ...customResistances],
      level: invItem?.level || 1,
    });
  }
  return resolved;
}

/** Maior nível entre os itens que resistem a ALGUMA das condições recebidas (0 se nenhum). */
export function findMaxResistanceLevel(
  incomingConditionIds: string[],
  equippedItems: EquippedItem[],
): number {
  let maxResistanceLevel = 0;
  for (const conditionId of incomingConditionIds) {
    for (const item of equippedItems) {
      if (item.conditionResistances.includes(conditionId)) {
        maxResistanceLevel = Math.max(maxResistanceLevel, item.level || 1);
      }
    }
  }
  return maxResistanceLevel;
}

export interface ConditionOutcome {
  duration: number | null;
  immune: boolean;
  toast: string;
}

/** O que acontece com uma condição recebida, dado o nível máximo de resistência do alvo. */
export function applyArmorResistance(
  conditionId: string,
  duration: number | null,
  maxResistanceLevel: number,
): ConditionOutcome {
  let finalDuration = duration;
  let immune = false;
  let toast = '';

  if (maxResistanceLevel > 0) {
    if (maxResistanceLevel === 1) {
      toast = `Resistência de Armadura Nv1: Vantagem no Teste contra ${conditionId}`;
    } else if (maxResistanceLevel === 2) {
      finalDuration = finalDuration !== null ? Math.ceil(finalDuration / 2) : finalDuration;
      toast = `Resistência de Armadura Nv2: Duração de ${conditionId} reduzida pela metade`;
    } else if (maxResistanceLevel === 3) {
      finalDuration = finalDuration !== null ? Math.ceil(finalDuration / 2) : finalDuration;
      toast = `Resistência de Armadura Nv3: Vantagem e duração de ${conditionId} reduzida pela metade`;
    } else if (maxResistanceLevel >= 4) {
      immune = true;
      toast = `Resistência de Armadura Nv4: Imune a ${conditionId}!`;
    }
  }

  return { duration: finalDuration, immune, toast };
}
