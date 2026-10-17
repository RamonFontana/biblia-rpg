import { supabase } from '@/lib/supabase';
import { sumItemFaithPenalty } from '@/domain/faith';
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

/**
 * Soma (negativa) das penalidades de Fé dos Itens Profanos que o personagem carrega, equipados ou
 * não. Entra na Fé Efetiva dos Testes de Fé (CONTEXT.md).
 */
export async function getItemFaithPenalty(characterId: string): Promise<number> {
  const { data, error } = await supabase
    .from('character_items')
    .select('items!inner(slug)')
    .eq('character_id', characterId);

  if (error) {
    console.error('Error reading item faith penalties:', error);
    throw error;
  }

  return sumItemFaithPenalty((data ?? []).map((row) => row.items?.slug));
}
