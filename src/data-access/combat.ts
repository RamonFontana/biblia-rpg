// Combates (`combats`) e participantes (`combat_participants`), mais o que o início e o fim do
// combate pedem às fichas. As funções lançam o erro do Supabase; quem chama decide o que fazer.
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/types/database.types';
import type { ConditionEntry } from '@/types/combat';
import type { CharacterSkills } from '@/features/character-creation/types';
import { toJson } from './json';

export type Combat = Tables<'combats'>;
export type CombatParticipant = Tables<'combat_participants'>;

export async function createCombat(sessionId: string): Promise<Combat> {
  const { data, error } = await supabase
    .from('combats')
    .insert({ session_id: sessionId, status: 'active', current_turn_index: 0, round_number: 1 })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to create combat', error);
    throw error;
  }
  return data;
}

export async function insertCombatParticipants(
  participants: (Omit<TablesInsert<'combat_participants'>, 'conditions'> & {
    conditions: ConditionEntry[];
  })[],
): Promise<void> {
  const { error } = await supabase
    .from('combat_participants')
    .insert(participants.map((p) => ({ ...p, conditions: toJson(p.conditions) })));

  if (error) {
    console.error('Failed to insert participants', error);
    throw error;
  }
}

/** As Condições gravadas em cada ficha, por id. */
export async function getCharacterConditions(
  characterIds: string[],
): Promise<Record<string, ConditionEntry[]>> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, conditions')
    .in('id', characterIds);
  if (error) throw error;

  const byId: Record<string, ConditionEntry[]> = {};
  for (const row of data) {
    byId[row.id] = (row.conditions as unknown as ConditionEntry[] | null) || [];
  }
  return byId;
}

export async function getCharacterSkills(
  characterIds: string[],
): Promise<{ id: string; skills: CharacterSkills }[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('id, skills')
    .in('id', characterIds);
  if (error) throw error;
  return data.map((row) => ({ id: row.id, skills: (row.skills as CharacterSkills | null) || {} }));
}

/** O combate pelo id, como o banco o guarda agora. */
export async function getCombat(combatId: string): Promise<Combat> {
  const { data, error } = await supabase.from('combats').select('*').eq('id', combatId).single();
  if (error) throw error;
  return data;
}

/** O combate da sessão no estado pedido, ou nulo. */
export async function findSessionCombat(
  sessionId: string,
  status: 'active' | 'setup',
): Promise<Combat | null> {
  const { data, error } = await supabase
    .from('combats')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', status)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listCombatParticipants(combatId: string): Promise<CombatParticipant[]> {
  const { data, error } = await supabase
    .from('combat_participants')
    .select('*')
    .eq('combat_id', combatId);
  if (error) throw error;
  return data;
}

export async function setParticipantConditions(
  participantId: string,
  conditions: ConditionEntry[],
): Promise<void> {
  const { error } = await supabase
    .from('combat_participants')
    .update({ conditions: toJson(conditions) })
    .eq('id', participantId);

  if (error) {
    console.error('Failed to update conditions', error);
    throw error;
  }
}

export async function updateCombatTurn(
  combatId: string,
  turnIndex: number,
  roundNumber: number,
): Promise<void> {
  const { error } = await supabase
    .from('combats')
    .update({ current_turn_index: turnIndex, round_number: roundNumber })
    .eq('id', combatId);

  if (error) {
    console.error('Failed to update turn', error);
    throw error;
  }
}

export async function finishCombat(combatId: string): Promise<void> {
  const { error } = await supabase
    .from('combats')
    .update({ status: 'finished' })
    .eq('id', combatId);

  if (error) {
    console.error('Failed to end combat', error);
    throw error;
  }
}

/** As fichas dos participantes, com o que o fim do combate precisa para fechar a vida delas. */
export async function getCharactersForCombatEnd(characterIds: string[]) {
  const { data, error } = await supabase
    .from('characters')
    .select('id, stats, is_dead, is_enemy')
    .in('id', characterIds);
  if (error) throw error;
  return data;
}

export async function softDeleteCharacters(characterIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ is_deleted: true })
    .in('id', characterIds);
  if (error) throw error;
}
