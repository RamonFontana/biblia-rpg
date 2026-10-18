// Fichas (`characters`) usadas pelas telas de sessão. As funções lançam o erro do Supabase.
import { supabase } from '@/lib/supabase';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import type { CharacterEquipment } from '@/types/combat';
import type { Character } from '@/features/character-management/types';
import type {
  CharacterSkills,
  CharacterStats,
  DraftCharacter,
  EnemySkill,
} from '@/features/character-creation/types';
import { getCurrentUser, getSession } from './auth';
import { syncInventoryItems } from './inventory';

export type CharacterRow = Tables<'characters'>;

/**
 * Converte a linha do banco na ficha do app. Os campos `jsonb` (`stats`, `attributes`…) chegam
 * como `Json`; o app os trata como as formas tipadas de `Character`. É a única asserção dessa
 * conversão, e quem grava as colunas é o próprio app.
 */
export function toCharacter(row: CharacterRow): Character {
  return row as unknown as Character;
}

/** Valor `jsonb` a partir de um tipo do app (interfaces não são atribuíveis a `Json`). */
function toJson(value: unknown): Json {
  return value as Json;
}

/** Todas as fichas de NPC da campanha, por nome. */
export async function listCampaignNpcs(): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_npc', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toCharacter);
}

export async function updateCharacterStats(id: string, stats: CharacterStats): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ stats: toJson(stats) })
    .eq('id', id);
  if (error) throw error;
}

/** Grava `stats` e `skills` juntos (descanso longo). */
export async function updateCharacterRest(
  id: string,
  patch: { stats: CharacterStats; skills: CharacterSkills | EnemySkill[] },
): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ stats: toJson(patch.stats), skills: toJson(patch.skills) })
    .eq('id', id);
  if (error) throw error;
}

export async function setCharacterVisible(id: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ is_visible: isVisible })
    .eq('id', id);
  if (error) throw error;
}

/** Cria a ficha de um inimigo e devolve a linha gravada. */
export async function createEnemyCharacter(row: TablesInsert<'characters'>): Promise<Character> {
  const { data, error } = await supabase.from('characters').insert(row).select().single();
  if (error) throw error;
  return toCharacter(data);
}

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

  return data.map(toCharacter);
};

export const getMyCharacters = async (): Promise<Character[]> => {
  const session = await getSession();

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

  return data.map(toCharacter);
};

export const getCharacterById = async (id: string): Promise<Character | null> => {
  const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching character:', error);
    throw error;
  }

  return toCharacter(data);
};

/** A ficha mais recente do usuário, ou nulo se ele não tem nenhuma. */
export async function findLatestCharacterOfUser(userId: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return toCharacter(data);
}

export const updateCharacter = async (
  id: string,
  updates: Partial<Character>,
): Promise<Character> => {
  // `Partial<Character>` e as colunas `jsonb` não se casam por tipo; a asserção é a mesma de `toCharacter`.
  const { data, error } = await supabase
    .from('characters')
    .update(updates as unknown as TablesUpdate<'characters'>)
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
    await syncInventoryItems(data.id, updates.equipment, vocation);
  }

  return toCharacter(data);
};

export const getActiveSessionCharacterIds = async (): Promise<Set<string>> => {
  const session = await getSession();
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

/** Grava o equipamento vestido (as quatro posições), que guarda ids de `character_items`. */
export async function updateCharacterEquipment(
  characterId: string,
  equipment: CharacterEquipment,
): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ equipment: toJson(equipment) })
    .eq('id', characterId);

  if (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
}

/** Grava a ficha criada pelo assistente e monta o inventário inicial a partir do equipamento. */
export async function saveCharacter(draft: DraftCharacter) {
  // O usuário já deve estar logado
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Usuário não autenticado. Faça login para salvar seu personagem.');
  }

  // Verificar campos obrigatórios básicos
  if (!draft.name || !draft.tribe || !draft.vocation || !draft.attributes || !draft.stats) {
    throw new Error('Ficha incompleta. Preencha todos os passos obrigatórios.');
  }

  const { data, error } = await supabase
    .from('characters')
    .insert({
      user_id: user.id,
      name: draft.name,
      tribe: draft.tribe,
      vocation: draft.vocation,
      attributes: toJson(draft.attributes),
      fortress: draft.fortress || null,
      temptation: draft.temptation || null,
      stats: toJson(draft.stats),
      proficiencies: toJson(draft.proficiencies ?? null),
      equipment: toJson(draft.equipment || []),
      coins: draft.coins || 0,
      narrative: toJson(draft.narrative ?? null),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Sync inventory to new relational tables
  if (data && draft.equipment) {
    await syncInventoryItems(data.id, draft.equipment, draft.vocation);
  }

  return data;
}
