import { supabase } from '@/lib/supabase';
import type { Character } from '../types';
import { syncInventoryItems } from './syncInventory';

// Shared by every "active, playable characters" query — excludes NPCs, enemies,
// soft-deleted, and dead rows. `.is_npc.is.null` etc. cover legacy rows where the
// boolean flag was never explicitly set to false.
function withActiveCharacterFilters<T extends { or: (filters: string) => T }>(query: T): T {
  return query
    .or('is_npc.eq.false,is_npc.is.null')
    .or('is_enemy.eq.false,is_enemy.is.null')
    .or('is_deleted.eq.false,is_deleted.is.null')
    .or('is_dead.eq.false,is_dead.is.null');
}

// A CA do cartão é calculada a partir do que o personagem tem equipado, então a lista traz o
// inventário junto.
const CHARACTER_WITH_ITEMS = '*, character_items(*, items(*))';

export const getCharacters = async (): Promise<Character[]> => {
  const { data, error } = await withActiveCharacterFilters(
    supabase.from('characters').select(CHARACTER_WITH_ITEMS),
  ).order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching characters:', error);
    throw error;
  }

  return data as unknown as Character[];
};

export const getMyCharacters = async (): Promise<Character[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await withActiveCharacterFilters(
    supabase.from('characters').select(CHARACTER_WITH_ITEMS).eq('user_id', session.user.id),
  ).order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my characters:', error);
    throw error;
  }

  return data as unknown as Character[];
};

export const getCharacterById = async (id: string): Promise<Character | null> => {
  const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching character:', error);
    throw error;
  }

  return data as unknown as Character;
};

export const updateCharacter = async (
  id: string,
  updates: Partial<Character>,
): Promise<Character> => {
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

export const getActiveSessionCharacterIds = async (): Promise<Set<string>> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return new Set();

  const { data, error } = await supabase
    .from('session_participants')
    .select('character_id, game_sessions!inner(status)')
    .eq('game_sessions.status', 'active')
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error fetching active session characters:', error);
    return new Set();
  }

  return new Set(data.map((d) => d.character_id));
};
