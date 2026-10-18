import { useState } from 'react';
import {
  addInventoryItem,
  consumeInventoryItem,
  removeInventoryItem,
  setInventoryQuantity,
} from '@/data-access/inventory';
import { getErrorMessage } from '@/lib/errorMessage';

type ConsumeInput = Parameters<typeof consumeInventoryItem>[0];

export function useUpdateNPCInventory() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Liga `isUpdating` durante a operação e devolve `{ success, error }` em vez de lançar.
  const run = async (label: string, operation: () => Promise<void>) => {
    setIsUpdating(true);
    try {
      await operation();
      return { success: true };
    } catch (error) {
      console.error(label, error);
      return { success: false, error: getErrorMessage(error, '') };
    } finally {
      setIsUpdating(false);
    }
  };

  const addItem = (characterId: string, itemId: string, quantity: number = 1) =>
    run('Error adding item:', () => addInventoryItem(characterId, itemId, quantity));

  const removeItem = (characterItemId: string) =>
    run('Error removing item:', () => removeInventoryItem(characterItemId));

  const updateQuantity = (characterItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(characterItemId);
    }
    return run('Error updating item quantity:', () =>
      setInventoryQuantity(characterItemId, quantity),
    );
  };

  const consumeItem = (
    characterId: string,
    characterItemId: string,
    currentQuantity: number,
    itemEffects: ConsumeInput['itemEffects'],
    currentStats: ConsumeInput['currentStats'],
    isPlayable: boolean,
  ) =>
    run('Error using item:', () =>
      consumeInventoryItem({
        characterId,
        characterItemId,
        currentQuantity,
        itemEffects,
        currentStats,
        isPlayable,
      }),
    );

  return {
    addItem,
    removeItem,
    updateQuantity,
    consumeItem,
    isUpdating,
  };
}
