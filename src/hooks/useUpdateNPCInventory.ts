import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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
        const { error } = await supabase
          .from('character_items')
          .insert({
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
      const { error } = await supabase
        .from('character_items')
        .delete()
        .eq('id', characterItemId);
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

  const useItem = async (characterId: string, characterItemId: string, currentQuantity: number, itemEffects: any, currentStats: any, isPlayable: boolean) => {
    setIsUpdating(true);
    try {
      // 1. Decrease quantity or remove item
      if (currentQuantity <= 1) {
        const { error } = await supabase.from('character_items').delete().eq('id', characterItemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('character_items').update({ quantity: currentQuantity - 1 }).eq('id', characterItemId);
        if (error) throw error;
      }

      // 2. Apply effects if any
      if (itemEffects && Object.keys(itemEffects).length > 0) {
        let newStats = { ...currentStats };
        let hasChanges = false;

        if (itemEffects.heal) {
          const maxHp = newStats.pv || 10;
          const currentHp = newStats.current_pv ?? maxHp;
          newStats.current_pv = Math.min(currentHp + itemEffects.heal, maxHp);
          hasChanges = true;
        }
        
        if (itemEffects.restore_faith) {
          const maxFaith = newStats.faith || 0;
          const currentFaith = newStats.current_faith ?? maxFaith;
          newStats.current_faith = Math.min(currentFaith + itemEffects.restore_faith, maxFaith);
          hasChanges = true;
        }

        if (hasChanges) {
          const table = isPlayable ? 'characters' : 'session_npcs';
          const { error: statsError } = await supabase.from(table).update({ stats: newStats }).eq('id', characterId);
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
    useItem,
    isUpdating
  };
}
