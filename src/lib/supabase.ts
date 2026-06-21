import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are missing from environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function updateCharacterEquipment(characterId: string, equipment: any) {
  const { data, error } = await supabase
    .from('characters')
    .update({ equipment })
    .eq('id', characterId)
    .select()
    .single();

  if (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
  return data;
}
