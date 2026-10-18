import type { CharacterEquipment, ItemEffects } from '../types/combat';
import { calculateArmorClass, UNARMORED_AC, type EquippedItemRef } from '@/domain/armorClass';
import { calculateModifier } from '@/domain/attributes';

export function canEquipItem(
  itemEffects: ItemEffects,
  _currentEquipment: CharacterEquipment,
): boolean {
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

export function checkWeaponProficiency(weapon: any, vocation: string): boolean {
  if (!weapon) return false;

  const weaponCategory = weapon.effects?.weaponCategory?.toLowerCase() || '';
  const weaponType = weapon.type?.toLowerCase() || '';

  const isMartial = weaponCategory.includes('marcial') || weaponType.includes('marcial');

  if (isMartial) {
    const v = vocation?.toLowerCase() || '';
    if (['sacerdote', 'sábio', 'sabio', 'levita'].includes(v)) {
      return false;
    }
  }
  return true;
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
function hasSheet(character: { attributes?: unknown; is_enemy?: boolean | null } | null) {
  return (
    !character?.is_enemy && !!character?.attributes && typeof character.attributes === 'object'
  );
}

export function getCombatStats(character: any) {
  const { stats, equipment, character_items: inventoryItems = [] } = character || {};
  let resistances: string[] = [];
  let weapon: { name: string; damageDie: string } | undefined = undefined;
  let armor: { body?: EquippedItemRef; shield?: EquippedItemRef } = {};

  // Ensure equipment is an object (sometimes JSONB can be stringified)
  let parsedEquipment = equipment;
  if (typeof equipment === 'string') {
    try {
      parsedEquipment = JSON.parse(equipment);
    } catch (e) {
      parsedEquipment = {};
    }
  }

  if (parsedEquipment) {
    const findItem = (slotId: string | null | undefined) => {
      if (!slotId) return undefined;
      return inventoryItems.find(
        (i: any) => i.id === slotId || (i.item_id && i.item_id === slotId),
      );
    };

    const headItem = findItem(parsedEquipment.head);
    const bodyItem = findItem(parsedEquipment.body);
    const mainHandItem = findItem(parsedEquipment.mainHand);
    const offHandItem = findItem(parsedEquipment.offHand);

    // O motor decide o que é armadura e escudo pelo catálogo; o elmo só entra nas resistências.
    const itemRef = (invItem: any): EquippedItemRef | undefined => {
      if (!invItem) return undefined;
      const itemData = Array.isArray(invItem.items) ? invItem.items[0] : invItem.items;
      return { slug: itemData?.slug, level: invItem.level };
    };
    armor = { body: itemRef(bodyItem), shield: itemRef(offHandItem) };

    const getResistances = (invItem: any) => {
      if (!invItem) return [];
      const itemData = Array.isArray(invItem.items) ? invItem.items[0] : invItem.items;

      const baseResistances = itemData?.condition_resistances || [];
      const customResistances = invItem.custom_condition_resistances || [];

      return [...baseResistances, ...customResistances];
    };

    let allResistances: string[] = [];

    allResistances.push(...getResistances(headItem));

    allResistances.push(...getResistances(bodyItem));

    allResistances.push(...getResistances(mainHandItem));

    if (parsedEquipment.offHand !== parsedEquipment.mainHand) {
      allResistances.push(...getResistances(offHandItem));
    }

    resistances = [...new Set(allResistances)];

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
    return { totalAc: total, baseAc: base, bonusAc: bonus, weapon, resistances };
  }

  const baseAc = Number(stats?.ca) || UNARMORED_AC;
  return { totalAc: baseAc, baseAc, bonusAc: 0, weapon, resistances };
}
