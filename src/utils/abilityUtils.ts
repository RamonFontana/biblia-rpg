import { ABILITIES, type AbilityDefinition } from '../data/abilities';

export function getAbilitiesForCharacter(
  tribe: string,
  vocation: string,
  level: number,
  pathChoices?: { tribe?: 'A' | 'B'; vocation?: 'A' | 'B' }
): AbilityDefinition[] {
  return ABILITIES.filter(ability => {
    // Check level requirement
    if (ability.minLevel > level) return false;

    // Filter by source
    // Normalize source string matching (e.g. "Guerreiro" vs "guerreiro")
    const normalizedTribe = tribe.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedVocation = vocation.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (ability.sourceType === 'tribe' && ability.sourceId !== normalizedTribe) return false;
    if (ability.sourceType === 'vocation' && ability.sourceId !== normalizedVocation) return false;

    // Filter by path choice if applicable
    if (ability.path) {
      const chosenPath = ability.sourceType === 'tribe' 
        ? pathChoices?.tribe 
        : pathChoices?.vocation;
      
      // If a path is required but hasn't been chosen yet or chose a different one
      if (chosenPath && chosenPath !== ability.path) {
        return false;
      }
      
      // Note: If no path is chosen yet, we currently include it to show the options, 
      // but you could choose to hide it.
      // For now, let's keep it visible so they know they have a choice, 
      // or we can hide it. If we hide it, we add:
      if (!chosenPath) return false; 
    }

    return true;
  });
}

export function calculateRechargedAbilities(
  currentAbilityUses: Record<string, number>,
  restType: 'short_rest' | 'long_rest'
): Record<string, number> {
  const newAbilityUses = { ...currentAbilityUses };
  
  for (const abilityId of Object.keys(newAbilityUses)) {
    const ability = ABILITIES.find(a => a.id === abilityId);
    if (!ability) continue;
    
    // On Long Rest, everything recharges except 'week' and 'campaign'.
    // On Short Rest, only 'short_rest' and 'combat' recharge.
    // 'combat' recharges automatically on new combats, but a rest also counts.
    
    let shouldRecharge = false;
    
    if (restType === 'long_rest') {
      if (['short_rest', 'long_rest', 'combat'].includes(ability.usageType)) {
        shouldRecharge = true;
      }
    } else if (restType === 'short_rest') {
      if (['short_rest', 'combat'].includes(ability.usageType)) {
        shouldRecharge = true;
      }
    }
    
    if (shouldRecharge) {
      delete newAbilityUses[abilityId];
    }
  }
  
  return newAbilityUses;
}

export function resetCombatAbilities(
  currentAbilityUses: Record<string, number>
): Record<string, number> {
  const newAbilityUses = { ...currentAbilityUses };
  
  for (const abilityId of Object.keys(newAbilityUses)) {
    const ability = ABILITIES.find(a => a.id === abilityId);
    if (ability && ability.usageType === 'combat') {
      delete newAbilityUses[abilityId];
    }
  }
  
  return newAbilityUses;
}
