// Combates (`combats`) e participantes (`combat_participants`), mais o que o início e o fim do
// combate pedem às fichas. As funções lançam o erro do Supabase; quem chama decide o que fazer.
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/types/database.types';
import type { EnemyAbilityEffect } from '@/content/schemas';
import type { TestMode } from '@/domain/testMode';
import type { ConditionEntry } from '@/types/combat';
import type { CharacterSkills } from '@/features/character-creation/types';
import { toJson } from './json';

export type Combat = Tables<'combats'>;
export type CombatParticipant = Tables<'combat_participants'>;
export type CombatAttack = Tables<'combat_attacks'>;
export type CombatAbilityUse = Tables<'combat_ability_uses'>;

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

/** O Mestre grava o estado de uso das Habilidades de um inimigo (usada, em recarga). */
export async function setEnemyAbilityState(
  participantId: string,
  abilityState: Record<string, 'used' | 'recharging'>,
): Promise<void> {
  const { error } = await supabase
    .from('combat_participants')
    .update({ ability_state: toJson(abilityState) })
    .eq('id', participantId);
  if (error) throw error;
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

/** O resultado de um ataque, já calculado pelo motor, que a função do banco confere e grava. */
export interface AttackRecord {
  attackerParticipantId: string;
  targetParticipantId: string;
  naturalRoll: number;
  total: number;
  targetAc: number;
  hit: boolean;
  critical: boolean;
  fumble: boolean;
  damage: number;
  /** A modalidade que valeu (Condições e Inspiração). */
  appliedMode: TestMode;
  /** Os dois d20 da Rolagem Virtual com Vantagem ou Desvantagem; nulo nos demais casos. */
  rolls: number[] | null;
  inspirationUsed: boolean;
  /** O efeito de arma disparou (natural 18 ou mais no acerto). */
  weaponEffectTriggered: boolean;
  /** As Condições que chegam ao alvo depois da Resistência a Condição (vazio se anulado). */
  weaponConditions: ConditionEntry[];
}

/**
 * Aplica o ataque pela função do banco (ADR 0005): ela confere que o chamador é o dono do atacante
 * e que é o turno dele, tira o dano do PV do alvo e registra o ataque. Devolve o id do registro.
 */
export async function applyAttack(attack: AttackRecord): Promise<string> {
  const { data, error } = await supabase.rpc('apply_attack', {
    p_attacker_participant_id: attack.attackerParticipantId,
    p_target_participant_id: attack.targetParticipantId,
    p_natural_roll: attack.naturalRoll,
    p_total: attack.total,
    p_target_ac: attack.targetAc,
    p_hit: attack.hit,
    p_critical: attack.critical,
    p_fumble: attack.fumble,
    p_damage: attack.damage,
    p_applied_mode: attack.appliedMode,
    p_rolls: attack.rolls ?? undefined,
    p_inspiration_used: attack.inspirationUsed,
    p_weapon_effect_triggered: attack.weaponEffectTriggered,
    p_conditions: toJson(attack.weaponConditions),
  });
  if (error) throw error;
  return data;
}

/** Os últimos ataques do combate, do mais novo para o mais antigo. */
export async function listCombatAttacks(combatId: string, limit: number): Promise<CombatAttack[]> {
  const { data, error } = await supabase
    .from('combat_attacks')
    .select('*')
    .eq('combat_id', combatId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export interface AbilityUseRecord {
  userParticipantId: string;
  abilityId: string;
  abilityName: string;
  actionType: string;
  /** Por alvo: as Condições que chegam depois da Resistência a Condição e das imunidades. */
  targets: {
    participantId: string;
    conditions: ConditionEntry[];
    /** As Condições que saem do alvo (Habilidade que remove): aplicadas na hora, sem TR. */
    remove?: string[];
  }[];
  /** O TR dos alvos: o uso fica pendente até o Mestre lançar (as Condições não entram agora). */
  save?: { attribute: string; cd: number };
}

/**
 * Registra o uso de uma Habilidade pela função do banco (ADR 0007): ela confere que o chamador é o
 * dono do usuário, o combate ativo e o turno (Ação e Ação Bônus), aplica as Condições nos alvos e
 * grava o uso. Devolve o id do registro.
 */
export async function recordAbilityUse(use: AbilityUseRecord): Promise<string> {
  const { data, error } = await supabase.rpc('record_ability_use', {
    p_user_participant_id: use.userParticipantId,
    p_ability_id: use.abilityId,
    p_ability_name: use.abilityName,
    p_action_type: use.actionType,
    p_targets: toJson(use.targets),
    ...(use.save && { p_save: toJson(use.save) }),
  });
  if (error) throw error;
  return data;
}

export interface EnemyAbilityUseRecord {
  enemyParticipantId: string;
  /** O id da biblioteca ou `enemy-custom`. */
  abilityId: string;
  abilityName: string;
  /** Por alvo (personagens): as Condições que chegam já, sem TR. Com TR a lista vai vazia. */
  targets: { participantId: string; conditions: ConditionEntry[] }[];
  /** O TR dos alvos: o uso fica pendente até o Mestre aplicar os resultados. */
  save?: { attribute: string; cd: number };
  /** O Teste de sessão que leva o TR aos celulares dos jogadores. */
  testId?: string;
  /** O efeito como foi aplicado (a resolução e a perda de Fé leem daqui). */
  effect: EnemyAbilityEffect;
}

/**
 * O Mestre usa a Habilidade de um inimigo contra personagens pela função do banco (ADR 0007): ela
 * confere o Mestre, o combate ativo e os alvos, aplica as Condições (sem TR) e grava o uso.
 */
export async function recordEnemyAbilityUse(use: EnemyAbilityUseRecord): Promise<string> {
  const { data, error } = await supabase.rpc('record_enemy_ability_use', {
    p_enemy_participant_id: use.enemyParticipantId,
    p_ability_id: use.abilityId,
    p_ability_name: use.abilityName,
    p_targets: toJson(use.targets),
    p_effect: toJson(use.effect),
    ...(use.save && { p_save: toJson(use.save) }),
    ...(use.testId && { p_test_id: use.testId }),
  });
  if (error) throw error;
  return data;
}

/** O resultado do TR de um alvo, já calculado pelo motor (`failed` decide se as Condições entram). */
export interface AbilitySaveOutcome {
  participantId: string;
  /** Nulo quando o alvo não respondeu o TR (Habilidade de inimigo): ele fica sem efeito. */
  natural: number | null;
  total: number | null;
  failed: boolean;
  mode: string;
  conditions: ConditionEntry[];
  /** Só nas Habilidades de inimigo que tiram Fé: a Fé que este alvo perdeu (0 se passou). */
  faithLost?: number;
}

/**
 * O Mestre resolve um uso pendente pela função do banco (ADR 0007): aplica as Condições de quem
 * falhou. Devolve `resolved`, ou `expired` se o combate já acabou (o uso cai sem efeito).
 */
export async function resolveAbilityUse(
  useId: string,
  results: AbilitySaveOutcome[],
): Promise<'resolved' | 'expired'> {
  const { data, error } = await supabase.rpc('resolve_ability_use', {
    p_use_id: useId,
    p_results: toJson(results),
  });
  if (error) throw error;
  return data as 'resolved' | 'expired';
}

/** Os últimos usos de Habilidade do combate, do mais novo para o mais antigo. */
export async function listCombatAbilityUses(
  combatId: string,
  limit: number,
): Promise<CombatAbilityUse[]> {
  const { data, error } = await supabase
    .from('combat_ability_uses')
    .select('*')
    .eq('combat_id', combatId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
