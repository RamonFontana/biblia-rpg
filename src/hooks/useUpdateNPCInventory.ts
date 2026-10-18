import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { applyConsumableEffects } from '@/domain/consumables';

export function useUpdateNPCInventory() {
  const [isUpdating, setIsUpdating] = useState(false);

  const addItem = async (characterId: string, itemId: string, quantity: number = 1) => {
    setIsUpdating(true);
    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from('character_items')
        .select('id, quantity')
        .eq('character_id', characterId)
        .eq('item_id', itemId)
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('character_items')
          .update({ quantity: (existing.quantity ?? 0) + quantity })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase.from('character_items').insert({
          character_id: characterId,
          item_id: itemId,
          quantity: quantity,
        });
        if (error) throw error;
      }
      return { success: true };
    } catch (error: any) {
      console.error('Error adding item:', error);
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  const removeItem = async (characterItemId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('character_items').delete().eq('id', characterItemId);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error removing item:', error);
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  const updateQuantity = async (characterItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(characterItemId);
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('character_items')
        .update({ quantity })
        .eq('id', characterItemId);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating item quantity:', error);
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  const consumeItem = async (
    characterId: string,
    characterItemId: string,
    currentQuantity: number,
    itemEffects: any,
    currentStats: any,
    isPlayable: boolean,
  ) => {
    setIsUpdating(true);
    try {
      // 1. Decrease quantity or remove item
      if (currentQuantity <= 1) {
        const { error } = await supabase.from('character_items').delete().eq('id', characterItemId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('character_items')
          .update({ quantity: currentQuantity - 1 })
          .eq('id', characterItemId);
        if (error) throw error;
      }

      // 2. Apply effects if any
      if (itemEffects && Object.keys(itemEffects).length > 0) {
        const { stats: newStats, hasChanges } = applyConsumableEffects(currentStats, itemEffects);

        if (hasChanges) {
          const table = isPlayable ? 'characters' : 'session_npcs';
          const { error: statsError } = await supabase
            .from(table)
            .update({ stats: newStats })
            .eq('id', characterId);
          if (statsError) throw statsError;
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error using item:', error);
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    addItem,
    removeItem,
    updateQuantity,
    consumeItem,
    isUpdating,
  };
}
