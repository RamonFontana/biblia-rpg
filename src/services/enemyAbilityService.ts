// A Habilidade de inimigo contra personagens (Onda 5, feature 4; ADR 0007): o Mestre dispara, o TR
// chega ao celular de cada jogador pelo Teste de sessão e, quando os resultados chegam, o Mestre os
// aplica. O NPC jogável tem o TR rolado pelo Mestre (ele não tem celular). Os dados são físicos
// (ADR 0001): o jogador digita o d20 ou usa a Rolagem Virtual.
import type { EnemyAbilityEffect } from '@/content/schemas';
import {
  getCharacterOwners,
  getCharacterStats,
  getCharactersAttributes,
  updateCharacterStats,
} from '@/data-access/characters';
import {
  recordEnemyAbilityUse,
  resolveAbilityUse,
  setEnemyAbilityState,
  type CombatAbilityUse,
  type CombatParticipant,
} from '@/data-access/combat';
import {
  completeSessionTest,
  createSessionTest,
  getActiveTestsForSession,
  getTestResults,
} from '@/data-access/sessionTests';
import { abilityUseTargets, resolveAbilityEffect } from '@/domain/abilityEffect';
import { resolveAbilitySave, saveModifierOf, saveTestType } from '@/domain/abilitySave';
import {
  abilityStateKey,
  checkFaithDie,
  enemyAbilityStatus,
  describeReminder,
  enemyEffectOfUse,
  enemyEffectAsAbilityEffect,
  faithLostBy,
  rechargeSucceeds,
  resolveEnemyAbilityResults,
  stateAfterUse,
  type EnemyAbility,
  type EnemyAbilityStateMap,
  type EnemySaveResult,
} from '@/domain/enemyAbility';
import { addFaith } from '@/domain/faith';
import type { MasterMark } from '@/domain/testMode';
import { protectionOf, type AbilityResolution, type AbilitySaveRoll } from './abilityService';

/** Um personagem que a Habilidade de inimigo mira. */
export interface EnemyAbilityTarget {
  participantId: string;
  entityId: string;
  /** `player` recebe o TR no celular; `npc` (NPC jogável) tem o TR rolado pelo Mestre. */
  entityType: string;
  name: string;
  /** A marca do Mestre para este alvo no TR do jogador (Normal, Vantagem, Desvantagem). */
  mark: MasterMark;
}

export interface EnemyAbilityFiring {
  id: string;
  /** O Teste de sessão criado para os jogadores; nulo sem TR ou sem jogador entre os alvos. */
  testId: string | null;
  /** Só sem TR: o que chegou a cada alvo na hora. */
  applied: { participantId: string; name: string; messages: string[] }[];
}

const toast = (message: string) =>
  window.dispatchEvent(new CustomEvent('combat-toast', { detail: { message } }));

/**
 * O Mestre usa a Habilidade de um inimigo contra personagens. Com TR, cria o Teste de sessão dos
 * jogadores e deixa o uso pendente; sem TR, as Condições entram na hora (depois da Resistência a
 * Condição e das imunidades).
 */
export async function fireEnemyAbility(input: {
  sessionId: string;
  enemyParticipantId: string;
  ability: EnemyAbility;
  targets: EnemyAbilityTarget[];
  /** O estado de uso das Habilidades deste inimigo (`ability_state` do participante). */
  abilityState: EnemyAbilityStateMap;
}): Promise<EnemyAbilityFiring> {
  const { sessionId, enemyParticipantId, ability, targets, abilityState } = input;
  const { effect } = ability;
  if (targets.length === 0) throw new Error('Escolha ao menos um alvo');
  const key = abilityStateKey(ability);
  const status = enemyAbilityStatus(key, abilityState);
  if (!status.ready) throw new Error(status.reason);

  let testId: string | null = null;
  if (effect.save) {
    const players = targets.filter((t) => t.entityType === 'player');
    if (players.length > 0) {
      if ((await getActiveTestsForSession(sessionId)).length > 0) {
        throw new Error('Conclua o Teste ativo antes de usar a Habilidade');
      }
      const owners = await getCharacterOwners(players.map((t) => t.entityId));
      const test = await createSessionTest(
        sessionId,
        saveTestType(effect.save.attribute),
        effect.save.cd,
        players.flatMap((t) =>
          owners[t.entityId]
            ? [{ characterId: t.entityId, playerId: owners[t.entityId], masterMark: t.mark }]
            : [],
        ),
        null,
      );
      testId = test.id;
    }
  }

  const abilityEffect = enemyEffectAsAbilityEffect(effect);
  const applied: EnemyAbilityFiring['applied'] = [];
  const recordTargets = [];
  for (const target of targets) {
    // Com TR as Condições esperam os resultados; sem TR entram agora.
    const resolved =
      effect.save || !abilityEffect.apply
        ? { conditions: [], messages: [] }
        : resolveAbilityEffect(
            abilityEffect,
            await protectionOf(target.entityId, target.entityType),
          );
    recordTargets.push({ participantId: target.participantId, conditions: resolved.conditions });
    applied.push({
      participantId: target.participantId,
      name: target.name,
      messages: resolved.messages,
    });
  }

  const id = await recordEnemyAbilityUse({
    enemyParticipantId,
    abilityId: ability.id,
    abilityName: ability.name,
    targets: recordTargets,
    effect,
    ...(effect.save && { save: { attribute: effect.save.attribute, cd: effect.save.cd } }),
    ...(testId && { testId }),
  });

  // Só depois do uso gravado: a Habilidade de 1 por combate ou de Recarga fica marcada.
  const next = stateAfterUse(effect.usage);
  if (next) await setEnemyAbilityState(enemyParticipantId, { ...abilityState, [key]: next });

  for (const { name, messages } of applied) {
    for (const message of messages) toast(`${name}: ${message}`);
  }
  return { id, testId, applied };
}

/**
 * A Recarga no início do turno do inimigo: o Mestre lança o d6 (digitado ou Rolagem Virtual) e, com
 * 5 ou 6, o estado de recarga sai e a Habilidade volta. Devolve se ela voltou.
 */
export async function rechargeEnemyAbility(input: {
  participantId: string;
  abilityKey: string;
  abilityState: EnemyAbilityStateMap;
  d6: number;
}): Promise<boolean> {
  const { participantId, abilityKey, abilityState, d6 } = input;
  if (!Number.isInteger(d6) || d6 < 1 || d6 > 6) throw new Error('O d6 precisa estar entre 1 e 6');
  if (!rechargeSucceeds(d6)) return false;
  const rest = { ...abilityState };
  delete rest[abilityKey];
  await setEnemyAbilityState(participantId, rest);
  return true;
}

/**
 * O Mestre aplica os resultados de um uso pendente: lê o Teste dos jogadores (quem respondeu e foi
 * reprovado sofre o efeito; quem não respondeu fica sem efeito), calcula o TR dos NPCs jogáveis com
 * o d20 que o Mestre lançou e manda tudo à função do banco. Depois fecha o Teste dos celulares.
 */
export async function resolveEnemyAbilityUse(input: {
  use: Pick<
    CombatAbilityUse,
    'id' | 'ability_id' | 'enemy_effect' | 'cd' | 'targets' | 'test_id' | 'combat_id'
  >;
  participants: Pick<CombatParticipant, 'id' | 'entity_id' | 'entity_type'>[];
  npcRolls: AbilitySaveRoll[];
  /** O dado de Fé (1d4 ou 1d6) de cada alvo que falhou, quando a Habilidade tira Fé. */
  faithRolls?: { participantId: string; value: number }[];
}): Promise<AbilityResolution & { reminder?: string; faithLost: Record<string, number> }> {
  const { use, participants, npcRolls, faithRolls = [] } = input;
  const effect: EnemyAbilityEffect | null = enemyEffectOfUse(use);
  if (!effect) throw new Error('A Habilidade não tem efeito');

  const targets = abilityUseTargets(use.targets);
  const entityOf = (participantId: string) => participants.find((p) => p.id === participantId);
  const testResults = use.test_id ? await getTestResults(use.test_id) : [];
  const npcIds = targets.flatMap((t) => {
    const p = entityOf(t.participantId);
    return p && p.entity_type !== 'player' ? [p.entity_id] : [];
  });
  const attributes = await getCharactersAttributes(npcIds).catch(
    () => ({}) as Record<string, unknown>,
  );

  const results: EnemySaveResult[] = [];
  for (const target of targets) {
    const participant = entityOf(target.participantId);
    if (!participant) throw new Error(`O alvo ${target.name} saiu do combate`);
    const protection = await protectionOf(participant.entity_id, participant.entity_type);
    const base = { participantId: target.participantId, name: target.name, protection };

    if (participant.entity_type === 'player') {
      const row = testResults.find((r) => r.character_id === participant.entity_id);
      results.push({
        ...base,
        status: row?.status === 'submitted' ? 'submitted' : 'pending',
        isApproved: row?.is_approved ?? null,
        rollValue: row?.roll_value ?? null,
        resultValue: row?.result_value ?? null,
        appliedMode: row?.applied_mode ?? null,
      });
      continue;
    }

    // NPC jogável: o Mestre lançou o d20 dele.
    const roll = npcRolls.find((r) => r.participantId === target.participantId);
    if (effect.save && !roll) throw new Error(`Falta o dado de ${target.name}`);
    if (effect.save && roll) {
      if (!Number.isInteger(roll.natural) || roll.natural < 1 || roll.natural > 20) {
        throw new Error('O d20 precisa estar entre 1 e 20');
      }
      const save = resolveAbilitySave({
        dice: [roll.natural],
        mark: roll.mark,
        modifier: saveModifierOf(attributes[participant.entity_id], effect.save.attribute),
        cd: effect.save.cd,
      });
      results.push({
        ...base,
        status: 'submitted',
        isApproved: !save.failed,
        rollValue: save.natural,
        resultValue: save.total,
        appliedMode: save.mode,
      });
    } else {
      results.push({
        ...base,
        status: 'pending',
        isApproved: null,
        rollValue: null,
        resultValue: null,
        appliedMode: null,
      });
    }
  }

  const outcomes = resolveEnemyAbilityResults(effect, results);

  // Perda de Fé: quem falhou perde o dado que o Mestre rolou, limitado ao que tem (piso 0). Tudo é
  // conferido antes de gravar, para uma falta não deixar o uso pela metade.
  const faithLost: Record<string, number> = {};
  const faithStats: Record<string, Awaited<ReturnType<typeof getCharacterStats>>> = {};
  if (effect.faithLoss) {
    const { sides } = effect.faithLoss;
    for (const outcome of outcomes) {
      faithLost[outcome.participantId] = 0;
      if (!outcome.failed) continue;
      const roll = faithRolls.find((r) => r.participantId === outcome.participantId);
      if (!roll) throw new Error(`Falta o dado de Fé de ${outcome.name}`);
      if (checkFaithDie(roll.value, sides) !== null) {
        throw new Error(`O dado de Fé de ${outcome.name} precisa estar entre 1 e ${sides}`);
      }
      const entityId = entityOf(outcome.participantId)?.entity_id;
      if (!entityId) throw new Error(`O alvo ${outcome.name} saiu do combate`);
      faithStats[outcome.participantId] = await getCharacterStats(entityId);
      faithLost[outcome.participantId] = faithLostBy(faithStats[outcome.participantId], roll.value);
    }
  }

  const status = await resolveAbilityUse(
    use.id,
    outcomes.map(({ participantId, natural, total, failed, mode, conditions }) => ({
      participantId,
      natural,
      total,
      failed,
      mode,
      conditions,
      ...(effect.faithLoss && { faithLost: faithLost[participantId] }),
    })),
  );
  if (status === 'resolved') {
    for (const [participantId, lost] of Object.entries(faithLost)) {
      const stats = faithStats[participantId];
      const entityId = entityOf(participantId)?.entity_id;
      if (lost > 0 && stats && entityId) {
        await updateCharacterStats(entityId, {
          ...stats,
          current_faith: addFaith(stats, -lost),
        });
      }
    }
  }
  if (use.test_id) await completeSessionTest(use.test_id).catch(() => undefined);
  if (status === 'resolved') {
    for (const { name, messages } of outcomes) {
      for (const message of messages) toast(`${name}: ${message}`);
    }
    // O lembrete é do Mestre (o app não aplica a Desvantagem): o aviso aparece na tela dele e fica
    // no histórico do combate.
    const reminder = describeReminder(
      effect,
      outcomes.filter((o) => o.failed).map((o) => o.name),
    );
    if (reminder) toast(reminder);
  }
  return { status, results: outcomes, faithLost, reminder: effect.reminder };
}
