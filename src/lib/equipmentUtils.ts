import type { CharacterEquipment, ItemEffects } from '../types/combat';

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

  const getAcModifier = (effects: any) => {
    if (!effects) return 0;
    if (effects.acBonus !== undefined) return Number(effects.acBonus);
    if (effects.ca !== undefined) return Number(effects.ca);
    if (effects.armorClass !== undefined) return Math.max(0, Number(effects.armorClass) - 10);
    return 0;
  };

  if (equipment) {
    const headItem = inventoryItems.find((i: any) => i.id === equipment.head);
    const bodyItem = inventoryItems.find((i: any) => i.id === equipment.body);
    const mainHandItem = inventoryItems.find((i: any) => i.id === equipment.mainHand);
    const offHandItem = inventoryItems.find((i: any) => i.id === equipment.offHand);

    bonusAc += getAcModifier(headItem?.items?.effects);
    bonusAc += getAcModifier(bodyItem?.items?.effects);
    bonusAc += getAcModifier(mainHandItem?.items?.effects);
    
    if (equipment.offHand !== equipment.mainHand) {
      bonusAc += getAcModifier(offHandItem?.items?.effects);
    }

    if (mainHandItem?.items?.effects?.damageDie) {
      weapon = {
        name: mainHandItem.items.name,
        damageDie: mainHandItem.items.effects.damageDie
      };
    }
  }

  const totalAc = baseAc + bonusAc;

  return { totalAc, weapon };
}

