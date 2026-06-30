import type { CharacterEquipment, ItemEffects } from '../types/combat';
import { ITEMS_DB } from '../data/itemsDb';

export function canEquipItem(itemEffects: ItemEffects, _currentEquipment: CharacterEquipment): boolean {
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
  targetHand?: 'mainHand' | 'offHand'
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
        if (currentEquipment.mainHand === currentEquipment.offHand && currentEquipment.mainHand !== null) {
          newEquipment.mainHand = null;
        }
      } else {
        newEquipment.mainHand = characterItemId;
        if (currentEquipment.mainHand === currentEquipment.offHand && currentEquipment.mainHand !== null) {
          newEquipment.offHand = null;
        }
      }
      break;
    case 'shield':
      newEquipment.offHand = characterItemId;
      if (currentEquipment.mainHand === currentEquipment.offHand && currentEquipment.mainHand !== null) {
        newEquipment.mainHand = null;
      }
      break;
  }

  return newEquipment;
}

export function unequipSlot(
  slot: keyof CharacterEquipment,
  currentEquipment: CharacterEquipment
): CharacterEquipment {
  const newEquipment = { ...currentEquipment };

  // Handle 2h weapon unequipping from either hand
  if ((slot === 'mainHand' || slot === 'offHand') && currentEquipment.mainHand === currentEquipment.offHand && currentEquipment.mainHand !== null) {
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

export function getCombatStats(character: any) {
  const { stats, equipment, character_items: inventoryItems = [] } = character || {};
  const baseAc = Number(stats?.ca) || 10;
  let bonusAc = 0;
  let weapon: { name: string, damageDie: string } | undefined = undefined;

  // Ensure equipment is an object (sometimes JSONB can be stringified)
  let parsedEquipment = equipment;
  if (typeof equipment === 'string') {
    try {
      parsedEquipment = JSON.parse(equipment);
    } catch (e) {
      parsedEquipment = {};
    }
  }

  const getAcModifier = (invItem: any) => {
    if (!invItem) return 0;
    const itemData = Array.isArray(invItem.items) ? invItem.items[0] : invItem.items;
    let effects = itemData?.effects;
    
    // Fallback for items in DB without effects
    if (!effects || Object.keys(effects).length === 0) {
      const staticItem = ITEMS_DB.find(i => i.name === itemData?.name);
      if (staticItem?.armorClass) {
        if (staticItem.type === 'Escudo') return Number(staticItem.armorClass);
        return Math.max(0, Number(staticItem.armorClass) - 10);
      }
    }

    if (!effects) return 0;
    if (effects.acBonus !== undefined) return Number(effects.acBonus);
    if (effects.ca !== undefined) return Number(effects.ca);
    if (effects.armorClass !== undefined) return Math.max(0, Number(effects.armorClass) - 10);
    return 0;
  };

  if (parsedEquipment) {
    const findItem = (slotId: string | null | undefined) => {
      if (!slotId) return undefined;
      return inventoryItems.find((i: any) => i.id === slotId || (i.item_id && i.item_id === slotId));
    };

    const headItem = findItem(parsedEquipment.head);
    const bodyItem = findItem(parsedEquipment.body);
    const mainHandItem = findItem(parsedEquipment.mainHand);
    const offHandItem = findItem(parsedEquipment.offHand);

    const getItemAc = (invItem: any) => {
      if (!invItem) return 0;
      const baseModifier = getAcModifier(invItem);
      if (baseModifier > 0) {
        const level = invItem.level || 1;
        return baseModifier + (level - 1);
      }
      return baseModifier; 
    };

    bonusAc += getItemAc(headItem);
    bonusAc += getItemAc(bodyItem);
    bonusAc += getItemAc(mainHandItem);
    
    if (parsedEquipment.offHand !== parsedEquipment.mainHand) {
      bonusAc += getItemAc(offHandItem);
    }

    const mainHandData = Array.isArray(mainHandItem?.items) ? mainHandItem.items[0] : mainHandItem?.items;
    if (mainHandData?.effects?.damageDie) {
      weapon = {
        name: mainHandData.name,
        damageDie: mainHandData.effects.damageDie
      };
    }
  }

  const totalAc = baseAc + bonusAc;

  return { totalAc, baseAc, bonusAc, weapon };
}

