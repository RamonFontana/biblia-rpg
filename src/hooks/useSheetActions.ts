import { useState } from 'react';
import type { Character } from '@/features/character-management/types';
import { updateCharacter, updateCharacterEquipment } from '@/data-access/characters';
import {
  updateItemLevel,
  updateItemResistances,
  updateWeaponEffects,
} from '@/data-access/inventory';
import { applyAbilityUse, restoreAbilityUses, type UsableAbility } from '@/domain/abilityUse';
import { equipItem, unequipSlot } from '@/lib/equipmentUtils';
import { useAmmunition } from '@/hooks/useAmmunition';
import type { CharacterEquipment, ItemEffects, WeaponEffect } from '@/types/combat';

const EMPTY_EQUIPMENT: CharacterEquipment = {
  head: null,
  body: null,
  mainHand: null,
  offHand: null,
};

interface Options {
  character: Character | null;
  setCharacter: (character: Character) => void;
  isGM: boolean | undefined;
  /** O inventário está ocupado com outra ação (consumir, remover…): usar Habilidade espera. */
  isInventoryBusy: boolean;
}

/**
 * Tudo que a ficha grava a partir de um clique: equipar, desequipar, Qualidade, resistências e
 * efeitos dos itens, munição, usar e restaurar Habilidade. Uma falha é só registrada no console.
 * `isEquipping` fica ligado enquanto uma ação do inventário roda.
 */
export function useSheetActions({ character, setCharacter, isGM, isInventoryBusy }: Options) {
  const [isEquipping, setIsEquipping] = useState(false);
  const { consume, recover, addCharges } = useAmmunition();

  /** Roda `action` com `isEquipping` ligado; erro vai para o console com `label`. */
  const busy = async (label: string, action: () => Promise<unknown>) => {
    setIsEquipping(true);
    try {
      await action();
    } catch (err) {
      console.error(label, err);
    } finally {
      setIsEquipping(false);
    }
  };

  const handleConsumeAmmunition = (characterItemId: string) =>
    busy('Error consuming ammunition:', () => consume(characterItemId, 1));

  const handleRecoverAmmunition = (
    characterItemId: string,
    spentAmount: number,
    maxCapacity: number,
  ) =>
    busy('Error recovering ammunition:', () => recover(characterItemId, spentAmount, maxCapacity));

  const handleAddAmmunitionCharges = (characterItemId: string, amount: number) =>
    busy('Error adding charges:', () => addCharges(characterItemId, amount));

  const handleEquip = async (
    characterItemId: string,
    itemEffects: ItemEffects,
    targetHand?: 'mainHand' | 'offHand',
  ) => {
    if (!character) return;
    await busy('Error equipping item:', async () => {
      const currentEquipment: CharacterEquipment = character.equipment || EMPTY_EQUIPMENT;
      const newEquipment = equipItem(characterItemId, itemEffects, currentEquipment, targetHand);
      await updateCharacterEquipment(character.id, newEquipment);
      setCharacter({ ...character, equipment: newEquipment });
    });
  };

  const handleUnequip = async (slot: 'head' | 'body' | 'mainHand' | 'offHand') => {
    if (!character) return;
    await busy('Error unequipping item:', async () => {
      const currentEquipment: CharacterEquipment = character.equipment || EMPTY_EQUIPMENT;
      const newEquipment = unequipSlot(slot, currentEquipment);
      await updateCharacterEquipment(character.id, newEquipment);
      setCharacter({ ...character, equipment: newEquipment });
    });
  };

  // O listener em tempo real pega a mudança no banco e atualiza a tela.
  const handleUpdateItemLevel = (characterItemId: string, newLevel: number) =>
    busy('Error updating item level:', () => updateItemLevel(characterItemId, newLevel));

  const handleUpdateItemResistances = (characterItemId: string, newResistances: string[]) =>
    busy('Error updating item resistances:', () =>
      updateItemResistances(characterItemId, newResistances),
    );

  const handleUpdateWeaponEffects = (characterItemId: string, newEffects: WeaponEffect[]) =>
    busy('Error updating weapon effects:', () => updateWeaponEffects(characterItemId, newEffects));

  const handleUseAbility = async (ability: UsableAbility) => {
    if (!character || isInventoryBusy) return;

    try {
      const used = applyAbilityUse(ability, abilitySkills(character), character.stats);
      if (!used) return;

      await updateCharacter(character.id, {
        skills: used.skills,
        ...(used.stats ? { stats: used.stats } : {}),
      });
    } catch (error) {
      console.error('Failed to use ability:', error);
    }
  };

  const handleRestoreAbility = async (ability: UsableAbility) => {
    if (!character || !isGM || isInventoryBusy) return;

    try {
      await updateCharacter(character.id, {
        skills: restoreAbilityUses(abilitySkills(character), ability.id),
      });
    } catch (error) {
      console.error('Failed to restore ability:', error);
    }
  };

  return {
    isEquipping,
    handleConsumeAmmunition,
    handleRecoverAmmunition,
    handleAddAmmunitionCharges,
    handleEquip,
    handleUnequip,
    handleUpdateItemLevel,
    handleUpdateItemResistances,
    handleUpdateWeaponEffects,
    handleUseAbility,
    handleRestoreAbility,
  };
}

/** As skills de uma ficha comum; a lista de Habilidades de um inimigo não tem registro de usos. */
function abilitySkills(character: Character) {
  return Array.isArray(character.skills) ? undefined : character.skills;
}
