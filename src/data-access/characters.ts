// Fichas (`characters`) usadas pelas telas de sessão. As funções lançam o erro do Supabase.
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import { EMPTY_EQUIPMENT } from '@/domain/equipment';
import type { CharacterEquipment } from '@/types/combat';
import type { Character } from '@/features/character-management/types';
import type {
  CharacterSkills,
  CharacterStats,
  DraftCharacter,
  EnemySkill,
} from '@/features/character-creation/types';
import { getCurrentUser, getSession } from './auth';
import { toJson } from './json';
import { subscribeToTables } from './realtime';
import { uniqueChannelName } from '@/lib/channelName';
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

/** Grava uma ficha nova (NPC jogável ou inimigo de uma sessão) e devolve o `id`. */
export async function insertCharacter(row: TablesInsert<'characters'>): Promise<string> {
  const { data, error } = await supabase.from('characters').insert(row).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function markCharactersParticipated(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ has_participated_in_session: true })
    .in('id', ids);
  if (error) throw error;
}

/** Marca que a Inspiração foi usada hoje: o dia da sessão e a sessão. O dia novo a devolve. */
export async function markInspirationUsed(
  characterId: string,
  sessionId: string,
  day: number,
): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ inspiration_used_day: day, inspiration_session_id: sessionId })
    .eq('id', characterId);
  if (error) throw error;
}

/** Dos `ids`, os que são NPC ou inimigo (nunca um jogador). */
export async function filterNpcAndEnemyIds(ids: string[]): Promise<string[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('id')
    .in('id', ids)
    .or('is_npc.eq.true,is_enemy.eq.true');
  if (error) throw error;
  return data.map((c) => c.id);
}

/** Apaga as fichas de vez (não é a exclusão lógica de `softDeleteCharacters`). */
export async function deleteCharacters(ids: string[]): Promise<void> {
  const { error } = await supabase.from('characters').delete().in('id', ids);
  if (error) throw error;
}

export async function grantPendingLevelUp(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ pending_level_up: true })
    .in('id', ids);
  if (error) throw error;
}

/** O que um Teste de sessão precisa da ficha para calcular o bônus de quem rola. */
export type CharacterTestContext = Pick<
  CharacterRow,
  | 'equipment'
  | 'level'
  | 'proficiencies'
  | 'attributes'
  | 'vocation'
  | 'inspiration_used_day'
  | 'inspiration_session_id'
> & { stats: CharacterStats | null };

export async function getCharacterTestContext(id: string): Promise<CharacterTestContext> {
  const { data, error } = await supabase
    .from('characters')
    .select(
      'stats, equipment, level, proficiencies, attributes, vocation, inspiration_used_day, inspiration_session_id',
    )
    .eq('id', id)
    .single();
  if (error) throw error;
  // `stats` é `jsonb`; quem grava é o app, com a forma de `CharacterStats`.
  return { ...data, stats: data.stats as CharacterStats | null };
}

/** Os `stats` gravados de uma ficha, ou `null` se a ficha não tem. */
export async function getCharacterStats(id: string): Promise<CharacterStats | null> {
  const { data, error } = await supabase.from('characters').select('stats').eq('id', id).single();
  if (error) throw error;
  // `stats` é `jsonb`; quem grava é o app, com a forma de `CharacterStats`.
  return data.stats as CharacterStats | null;
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
  patch: { stats: Partial<CharacterStats>; skills: CharacterSkills | EnemySkill[] },
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
      equipment: toJson(EMPTY_EQUIPMENT),
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

/**
 * Acompanha a ficha aberta: `onInventoryChange` a cada mudança nos itens do personagem e
 * `onCharacterUpdate` com a linha nova quando a ficha é atualizada. Devolve a função que cancela.
 */
export function subscribeToCharacterSheet(
  characterId: string,
  handlers: {
    onInventoryChange: () => void;
    onCharacterUpdate: (row: Partial<Character>) => void;
  },
): () => void {
  return subscribeToTables(uniqueChannelName(`character_sheet_updates_${characterId}`), [
    {
      table: 'character_items',
      filter: `character_id=eq.${characterId}`,
      onChange: () => handlers.onInventoryChange(),
    },
    {
      table: 'characters',
      event: 'UPDATE',
      filter: `id=eq.${characterId}`,
      onChange: (payload) => handlers.onCharacterUpdate(payload.new as Partial<Character>),
    },
  ]);
}

export async function updateCharacterSkills(
  id: string,
  skills: CharacterSkills | EnemySkill[],
): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ skills: toJson(skills) })
    .eq('id', id);
  if (error) throw error;
}

/** O que a Resistência a Condição precisa de uma ficha: o equipamento vestido e os itens com slug. */
export async function getCharacterResistanceSource(characterId: string) {
  const { data, error } = await supabase
    .from('characters')
    .select('equipment, character_items(*, items(slug))')
    .eq('id', characterId)
    .single();
  if (error) throw error;
  return data;
}

export type DeathState = Pick<
  CharacterRow,
  'id' | 'death_saves_successes' | 'death_saves_failures' | 'is_stable' | 'is_dead'
>;

/** Testes de morte, estabilidade e morte de uma ficha. */
export async function getCharacterDeathState(id: string): Promise<DeathState> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, death_saves_successes, death_saves_failures, is_stable, is_dead')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/** Grava os campos de morte pedidos (testes de morte, estável, morto). */
export async function updateCharacterDeathState(
  id: string,
  patch: Partial<
    Pick<DeathState, 'death_saves_successes' | 'death_saves_failures' | 'is_stable' | 'is_dead'>
  >,
): Promise<void> {
  const { error } = await supabase.from('characters').update(patch).eq('id', id);
  if (error) throw error;
}

/** Chama `onChange` com a linha nova a cada atualização da ficha. Devolve a função que cancela. */
export function subscribeToCharacterUpdates(
  id: string,
  onChange: (row: CharacterRow) => void,
): () => void {
  return subscribeToTables(uniqueChannelName(`char_death_${id}`), [
    {
      table: 'characters',
      event: 'UPDATE',
      filter: `id=eq.${id}`,
      onChange: (payload) => onChange(payload.new as CharacterRow),
    },
  ]);
}
