import { supabase } from '@/lib/supabase';
import type { Character } from '../types';

export const getCharacters = async (): Promise<Character[]> => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching characters:', error);
    throw error;
  }

  return data as unknown as Character[];
};

export const getCharacterById = async (id: string): Promise<Character | null> => {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching character:', error);
    throw error;
  }

  return data as unknown as Character;
};

export const updateCharacter = async (id: string, updates: Partial<Character>): Promise<Character> => {
  const { data, error } = await supabase
    .from('characters')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating character:', error);
    throw error;
  }

  return data as unknown as Character;
};
