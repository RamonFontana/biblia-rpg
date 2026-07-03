import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type CharacterItemWithDetails = Tables<'character_items'> & {
  items: Tables<'items'>;
};

export function useAmmunition() {
  const consume = async (characterItemId: string, amount: number = 1): Promise<boolean> => {
    try {
      const { data: item, error: fetchError } = await supabase
        .from('character_items')
        .select('quantity')
        .eq('id', characterItemId)
        .single();

      if (fetchError || !item) {
        console.error('Error fetching item for consumption:', fetchError);
        return false;
      }

      const currentQuantity = item.quantity || 0;
      if (currentQuantity < amount) {
        console.warn('Not enough quantity to consume.');
        return false;
      }

      const { error: updateError } = await supabase
        .from('character_items')
        .update({ quantity: currentQuantity - amount })
        .eq('id', characterItemId);

      if (updateError) {
        console.error('Error consuming item:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to consume item:', error);
      return false;
    }
  };

  const recover = async (characterItemId: string, spentAmount: number, maxCapacity: number): Promise<number> => {
    try {
      let recoveredCount = 0;
      for (let i = 0; i < spentAmount; i++) {
        if (Math.random() >= 0.5) {
          recoveredCount++;
        }
      }

      if (recoveredCount === 0) return 0;

      const { data: item, error: fetchError } = await supabase
        .from('character_items')
        .select('quantity')
        .eq('id', characterItemId)
        .single();

      if (fetchError || !item) {
        console.error('Error fetching item for recovery:', fetchError);
        return 0;
      }

      const currentQuantity = item.quantity || 0;
      const newQuantity = Math.min(currentQuantity + recoveredCount, maxCapacity);

      const { error: updateError } = await supabase
        .from('character_items')
        .update({ quantity: newQuantity })
        .eq('id', characterItemId);

      if (updateError) {
        console.error('Error recovering item:', updateError);
        return 0;
      }

      return recoveredCount;
    } catch (error) {
      console.error('Failed to recover item:', error);
      return 0;
    }
  };

  const addCharges = async (characterItemId: string, amount: number): Promise<boolean> => {
    try {
      const { data: item, error: fetchError } = await supabase
        .from('character_items')
        .select('quantity')
        .eq('id', characterItemId)
        .single();

      if (fetchError || !item) {
        console.error('Error fetching item to add charges:', fetchError);
        return false;
      }

      const { error: updateError } = await supabase
        .from('character_items')
        .update({ quantity: (item.quantity || 0) + amount })
        .eq('id', characterItemId);

      if (updateError) {
        console.error('Error adding charges to item:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to add charges to item:', error);
      return false;
    }
  };

  return { consume, recover, addCharges };
}
