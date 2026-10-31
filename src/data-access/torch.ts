// A Tocha acesa (regras-base 6.7): acender gasta uma Tocha do inventário e acende na mesma
// transação (o dono ou o Mestre); só o Mestre apaga. As funções do banco guardam a regra.
import { supabase } from '@/lib/supabase';

export async function lightTorch(characterId: string): Promise<void> {
  const { error } = await supabase.rpc('light_torch', { p_character_id: characterId });
  if (error) throw error;
}

export async function extinguishTorch(characterId: string): Promise<void> {
  const { error } = await supabase.rpc('extinguish_torch', { p_character_id: characterId });
  if (error) throw error;
}
