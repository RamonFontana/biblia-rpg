import { supabase } from '@/lib/supabase';
import type { Character } from '../types';
import { syncInventoryItems } from './syncInventory';

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

export const getMyCharacters = async (): Promise<Character[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my characters:', error);
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

  // Sync inventory if equipment was updated
  if (data && updates.equipment) {
    // If vocation isn't in updates, we fallback to the character's current vocation
    const vocation = updates.vocation || data.vocation || 'Guerreiro';
    await syncInventoryItems(data.id, updates.equipment as any[], vocation);
  }

  return data as unknown as Character;
};
