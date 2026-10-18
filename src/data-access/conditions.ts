// Gravação das Condições de uma ficha ou de um participante de combate. A lista nova sai das
// funções puras de `domain/conditions`; estas só gravam e devolvem o resultado.
import { supabase } from '@/lib/supabase';
import { mergeCondition, removeCondition } from '@/domain/conditions';
import type { ConditionEntry } from '@/types/combat';
import { toJson } from './json';

async function saveCharacterConditions(
  characterId: string,
  conditions: ConditionEntry[],
  context: string,
) {
  const { error } = await supabase
    .from('characters')
    .update({ conditions: toJson(conditions) })
    .eq('id', characterId);

  if (error) {
    console.error(context, error);
    throw error;
  }
}

async function saveParticipantConditions(
  participantId: string,
  conditions: ConditionEntry[],
  context: string,
) {
  const { error } = await supabase
    .from('combat_participants')
    .update({ conditions: toJson(conditions) })
    .eq('id', participantId);

  if (error) {
    console.error(context, error);
    throw error;
  }
}

/** Aplica uma Condição a uma ficha fora de combate (global). */
export async function applyConditionToCharacter(
  characterId: string,
  currentConditions: ConditionEntry[],
  newCondition: ConditionEntry,
): Promise<ConditionEntry[]> {
  const updated = mergeCondition(currentConditions, newCondition);
  await saveCharacterConditions(characterId, updated, 'Error applying condition to character:');
  return updated;
}

/** Tira uma Condição de uma ficha fora de combate (global). */
export async function removeConditionFromCharacter(
  characterId: string,
  currentConditions: ConditionEntry[],
  conditionId: string,
): Promise<ConditionEntry[]> {
  const updated = removeCondition(currentConditions, conditionId);
  await saveCharacterConditions(characterId, updated, 'Error removing condition from character:');
  return updated;
}

/** Aplica uma Condição a um participante do combate. */
export async function applyConditionToParticipant(
  participantId: string,
  currentConditions: ConditionEntry[],
  newCondition: ConditionEntry,
): Promise<ConditionEntry[]> {
  const updated = mergeCondition(currentConditions, newCondition);
  await saveParticipantConditions(
    participantId,
    updated,
    'Error applying condition to participant:',
  );
  return updated;
}

/** Tira uma Condição de um participante do combate. */
export async function removeConditionFromParticipant(
  participantId: string,
  currentConditions: ConditionEntry[],
  conditionId: string,
): Promise<ConditionEntry[]> {
  const updated = removeCondition(currentConditions, conditionId);
  await saveParticipantConditions(
    participantId,
    updated,
    'Error removing condition from participant:',
  );
  return updated;
}

/** Grava a lista de Condições de um participante como está. */
export async function setParticipantConditions(
  participantId: string,
  conditions: ConditionEntry[],
): Promise<void> {
  await saveParticipantConditions(participantId, conditions, 'Failed to update conditions');
}
