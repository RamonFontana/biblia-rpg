import type { CharacterEquipment, ItemEffects } from '../types/combat';
import type { CombatInventoryItem } from '../types/inventory';
import type { Character } from '@/features/character-management/types';
import { calculateArmorClass, UNARMORED_AC, type EquippedItemRef } from '@/domain/armorClass';
import { isWeaponProficient } from '@/domain/attack';
import { calculateModifier } from '@/domain/attributes';
import { EMPTY_EQUIPMENT } from '@/domain/equipment';
import {
  getConditionResistanceLevels,
  getItemConditionResistances,
  resolveEquippedItems,
} from '@/domain/armorResistance';

/**
 * As posições vestidas da ficha, ou todas vazias. Fichas criadas antes do passo 9c do ROADMAP
 * guardam aí a lista de compras (um array), que não é equipamento vestido: vale como nada vestido.
 */
export function getEquippedSlots(equipment: Character['equipment']): CharacterEquipment {
  if (!equipment || Array.isArray(equipment)) return EMPTY_EQUIPMENT;
  return equipment as CharacterEquipment;
}

export function canEquipItem(itemEffects: ItemEffects): boolean {
  if (!itemEffects.slot) return false;

  switch (itemEffects.slot) {
    case 'head':
      return true; // We can always equip and just replace the old one
    case 'body':
      return true;
    case '1h':
      return true;
    case '2h':
      return true;
    case 'shield':
      return true;
    default:
      return false;
  }
}

export function equipItem(
  characterItemId: string,
  itemEffects: ItemEffects,
  currentEquipment: CharacterEquipment,
  targetHand?: 'mainHand' | 'offHand',
): CharacterEquipment {
  const newEquipment: CharacterEquipment = { ...currentEquipment };

  switch (itemEffects.slot) {
    case 'head':
      newEquipment.head = characterItemId;
      break;
    case 'body':
      newEquipment.body = characterItemId;
      break;
    case '2h':
      newEquipment.mainHand = characterItemId;
      newEquipment.offHand = characterItemId;
      break;
    case '1h':
      if (targetHand === 'offHand') {
        newEquipment.offHand = characterItemId;
        // If mainHand was a 2h weapon, unequipping offHand also unequips mainHand
        if (
          currentEquipment.mainHand === currentEquipment.offHand &&
          currentEquipment.mainHand !== null
        ) {
          newEquipment.mainHand = null;
        }
      } else {
        newEquipment.mainHand = characterItemId;
        if (
          currentEquipment.mainHand === currentEquipment.offHand &&
          currentEquipment.mainHand !== null
        ) {
          newEquipment.offHand = null;
        }
      }
      break;
    case 'shield':
      newEquipment.offHand = characterItemId;
      if (
        currentEquipment.mainHand === currentEquipment.offHand &&
        currentEquipment.mainHand !== null
      ) {
        newEquipment.mainHand = null;
      }
      break;
  }

  return newEquipment;
}

export function unequipSlot(
  slot: keyof CharacterEquipment,
  currentEquipment: CharacterEquipment,
): CharacterEquipment {
  const newEquipment = { ...currentEquipment };

  // Handle 2h weapon unequipping from either hand
  if (
    (slot === 'mainHand' || slot === 'offHand') &&
    currentEquipment.mainHand === currentEquipment.offHand &&
    currentEquipment.mainHand !== null
  ) {
    newEquipment.mainHand = null;
    newEquipment.offHand = null;
  } else {
    newEquipment[slot] = null;
  }

  return newEquipment;
}

/** O que a proficiência lê de uma arma: o catálogo (`effects.weaponCategory`) ou o `type` dela, e o slug. */
interface WeaponLike {
  /** O slug do item no catálogo: o Batedor usa só algumas armas marciais. */
  slug?: string | null;
  type?: string | null;
  effects?: ItemEffects | null;
}

export function checkWeaponProficiency(
  weapon: WeaponLike | null | undefined,
  vocation: string,
): boolean {
  if (!weapon) return false;

  const weaponCategory = weapon.effects?.weaponCategory?.toLowerCase() || '';
  const weaponType = weapon.type?.toLowerCase() || '';

  // A regra (o Sacerdote não usa arma marcial) é do motor; aqui só se acha a categoria.
  const category =
    weaponCategory.includes('marcial') || weaponType.includes('marcial') ? 'Marcial' : undefined;
  return isWeaponProficient(vocation, category, weapon.slug);
}

/** Modificador de DES da ficha. Atributo ausente ou inválido vale 10 (modificador 0). */
function dexModifierOf(attributes: { des?: unknown } | null | undefined): number {
  const raw = attributes?.des;
  const value = typeof raw === 'string' ? Number(raw) : raw;
  return calculateModifier(typeof value === 'number' && Number.isFinite(value) ? value : null);
}

/**
 * Inimigos e NPCs simples não têm ficha: a CA é a que o Mestre digitou (`stats.ca`). Quem tem
 * ficha (jogador e NPC jogável) tem a CA calculada.
 */
function hasSheet(
  character: CombatSource | null | undefined,
): character is CombatSource & { attributes: { des?: unknown } } {
  return (
    !character?.is_enemy && !!character?.attributes && typeof character.attributes === 'object'
  );
}

/** O que o cálculo de combate lê de uma ficha, de um NPC ou de um inimigo. */
interface CombatSource {
  stats?: unknown;
  equipment?: unknown;
  attributes?: { des?: unknown } | null;
  is_enemy?: boolean | null;
  character_items?: CombatInventoryItem[];
}

/** O `jsonb` do equipamento às vezes chega como texto. */
function parseEquipment(equipment: unknown): Partial<CharacterEquipment> | null | undefined {
  if (typeof equipment !== 'string') return equipment as Partial<CharacterEquipment> | null;
  try {
    return JSON.parse(equipment);
  } catch {
    return {};
  }
}

export function getCombatStats(character: CombatSource | null | undefined) {
  const { stats, equipment, character_items: inventoryItems = [] } = character || {};
  let resistances: string[] = [];
  let conditionResistanceLevels: Record<string, number> = {};
  let weapon: { name: string; damageDie: string } | undefined = undefined;
  let armor: { body?: EquippedItemRef; shield?: EquippedItemRef } = {};

  const parsedEquipment = parseEquipment(equipment);

  if (parsedEquipment) {
    const findItem = (slotId: string | null | undefined) => {
      if (!slotId) return undefined;
      return inventoryItems.find((i) => i.id === slotId || (i.item_id && i.item_id === slotId));
    };

    const headItem = findItem(parsedEquipment.head);
    const bodyItem = findItem(parsedEquipment.body);
    const mainHandItem = findItem(parsedEquipment.mainHand);
    const offHandItem = findItem(parsedEquipment.offHand);

    // O motor decide o que é armadura e escudo pelo catálogo; o elmo só entra nas resistências.
    const itemRef = (invItem: CombatInventoryItem | undefined): EquippedItemRef | undefined => {
      if (!invItem) return undefined;
      const itemData = Array.isArray(invItem.items) ? invItem.items[0] : invItem.items;
      return { slug: itemData?.slug, level: invItem.level };
    };
    armor = { body: itemRef(bodyItem), shield: itemRef(offHandItem) };

    // As Condições a que o item resiste vêm do catálogo pelo slug; as personalizadas do inventário
    // (tipos de dano, outro vocabulário) só se juntam para exibição.
    const getResistances = (invItem: CombatInventoryItem | undefined) => {
      if (!invItem) return [];
      const itemData = Array.isArray(invItem.items) ? invItem.items[0] : invItem.items;

      const baseResistances = getItemConditionResistances(itemData?.slug);
      const customResistances = invItem.custom_condition_resistances || [];

      return [...baseResistances, ...customResistances];
    };

    const allResistances: string[] = [];

    allResistances.push(...getResistances(headItem));

    allResistances.push(...getResistances(bodyItem));

    allResistances.push(...getResistances(mainHandItem));

    if (parsedEquipment.offHand !== parsedEquipment.mainHand) {
      allResistances.push(...getResistances(offHandItem));
    }

    resistances = [...new Set(allResistances)];
    conditionResistanceLevels = getConditionResistanceLevels(
      resolveEquippedItems(parsedEquipment, inventoryItems),
    );

    const mainHandData = Array.isArray(mainHandItem?.items)
      ? mainHandItem.items[0]
      : mainHandItem?.items;
    if (mainHandData?.effects?.damageDie) {
      weapon = {
        name: mainHandData.name,
        damageDie: mainHandData.effects.damageDie,
      };
    }
  }

  if (hasSheet(character)) {
    const { total, base, bonus } = calculateArmorClass({
      dexModifier: dexModifierOf(character.attributes),
      ...armor,
    });
    return {
      totalAc: total,
      baseAc: base,
      bonusAc: bonus,
      weapon,
      resistances,
      conditionResistanceLevels,
    };
  }

  const baseAc = Number((stats as { ca?: unknown } | null | undefined)?.ca) || UNARMORED_AC;
  return { totalAc: baseAc, baseAc, bonusAc: 0, weapon, resistances, conditionResistanceLevels };
}
