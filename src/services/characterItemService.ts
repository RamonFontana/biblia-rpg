import { supabase } from '@/lib/supabase';
import type { WeaponEffect } from '@/types/combat';

export async function updateWeaponEffects(characterItemId: string, effects: WeaponEffect[]) {
  const { error } = await supabase
    .from('character_items')
    .update({ weapon_effects: effects })
    .eq('id', characterItemId);

  if (error) {
    console.error('Error updating weapon effects:', error);
    throw error;
  }
}
