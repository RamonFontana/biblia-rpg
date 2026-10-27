import { ABILITIES } from '@/content/abilities';
import type { AbilityDefinition } from '@/content/schemas';
import {
  getCharacterProtectionSource,
  getCharactersAttributes,
  updateCharacter,
} from '@/data-access/characters';
import {
  recordAbilityUse,
  resolveAbilityUse,
  type AbilitySaveOutcome,
  type CombatAbilityUse,
  type CombatParticipant,
} from '@/data-access/combat';
import {
  abilityImmunities,
  abilityUseTargets,
  hasRemoval,
  removalBlock,
  resolveAbilityEffect,
  resolveAbilityRemoval,
  type RemovalChoices,
  type TargetProtection,
} from '@/domain/abilityEffect';
import {
  abilityCd,
  resolveAbilitySave,
  saveModifierOf,
  type SaveAttribute,
} from '@/domain/abilitySave';
import { applyAbilityUse, getAbilityAvailability } from '@/domain/abilityUse';
import { getConditionResistanceLevels, resolveEquippedItems } from '@/domain/armorResistance';
import type { AttackTarget } from '@/lib/attackSetup';
import type { CharacterEquipment, ConditionEntry } from '@/types/combat';
import type { CharacterSkills } from '@/features/character-creation/types';
import type { FaithStats } from '@/domain/faith';
import type { MasterMark } from '@/domain/testMode';
import { abilitySkills, getAbilitiesForCharacter } from '@/utils/abilityUtils';

export interface AbilityUseSubmission {
  /** A Habilidade, com o efeito de combate. */
  ability: AbilityDefinition;
  userParticipantId: string;
  /** Os alvos que o jogador marcou. */
  targets: AttackTarget[];
  /** Só nas Habilidades que tiram Condição: a que o jogador escolheu tirar de cada alvo. */
  removals?: RemovalChoices;
  /**
   * A ficha de quem usa: os usos e a Fé gastos saem dela; a Vocação, o nível e os atributos dão a
   * CD da Habilidade quando ela impõe um TR.
   */
  character: {
    id: string;
    skills: unknown;
    stats: FaithStats | null | undefined;
    vocation?: string | null;
    level?: number | string | null;
    attributes?: unknown;
  };
}

export interface AbilityTargetResult {
  participantId: string;
  name: string;
  /** As Condições que chegaram ao alvo (vazio se anuladas). */
  conditions: ConditionEntry[];
  /** Só nas Habilidades que tiram Condição: as que saíram do alvo. */
  removed?: string[];
  /** As frases de Resistência a Condição e de imunidade (ou "não tinha…") para o Mestre. */
  messages: string[];
}

export interface AbilityUseOutcome {
  id: string;
  results: AbilityTargetResult[];
  /** Só nos usos com TR: a CD e o atributo do TR que o Mestre vai lançar. As Condições esperam. */
  pending?: { cd: number; attribute: SaveAttribute };
}

/** As skills de uma ficha comum (`jsonb` no banco), ou nada se for a lista de um inimigo. */
function skillsOf(skills: unknown) {
  return abilitySkills({ skills: (skills as CharacterSkills | null) ?? undefined });
}

const NO_PROTECTION: TargetProtection = { resistanceLevels: {}, immuneConditionIds: [] };

/**
 * O que protege o alvo de uma Condição: a Resistência a Condição dos itens equipados e a imunidade
 * das Habilidades passivas desbloqueadas. O inimigo não tem ficha; falhar ao ler a ficha deixa o
 * alvo sem proteção (o uso não pode travar por isso).
 */
async function protectionOf(entityId: string, entityType: string): Promise<TargetProtection> {
  if (entityType === 'enemy') return NO_PROTECTION;
  const source = await getCharacterProtectionSource(entityId).catch(() => null);
  if (!source) return NO_PROTECTION;

  const resistanceLevels = getConditionResistanceLevels(
    resolveEquippedItems(source.equipment as unknown as CharacterEquipment, source.character_items),
  );
  const abilities =
    source.tribe && source.vocation
      ? getAbilitiesForCharacter(
          source.tribe,
          source.vocation,
          Number(source.level) || 1,
          skillsOf(source.skills)?.path_choices,
        )
      : [];
  return { resistanceLevels, immuneConditionIds: abilityImmunities(abilities.map((a) => a.id)) };
}

/** Grava o uso e a Fé gastos na ficha. Falhar aqui não desfaz o efeito já registrado (só o loga). */
async function spendAbilityUse(
  characterId: string,
  spent: { skills: unknown; stats?: unknown },
): Promise<void> {
  try {
    await updateCharacter(characterId, {
      skills: spent.skills,
      ...(spent.stats ? { stats: spent.stats } : {}),
    } as Parameters<typeof updateCharacter>[1]);
  } catch (error) {
    console.error('Error spending the Ability use:', error);
  }
}

/**
 * Usa a Habilidade (ADR 0007): calcula as Condições de cada alvo, manda à função do banco e só
 * então gasta o uso e a Fé na ficha. Se o banco recusa (turno, combate), nada é gasto; se gravar o
 * gasto falha depois do registro, o efeito fica (o pior caso é o uso não ser cobrado).
 */
export async function submitAbilityUse(use: AbilityUseSubmission): Promise<AbilityUseOutcome> {
  const { ability, character } = use;
  const effect = ability.combatEffect;
  if (!effect) throw new Error(`${ability.name} não tem efeito de combate`);

  const skills = skillsOf(character.skills);
  const availability = getAbilityAvailability(ability, skills, character.stats);
  if (availability.disabled) throw new Error(availability.reason);
  const spent = applyAbilityUse(ability, skills, character.stats);
  if (!spent) throw new Error('Fé Insuficiente');

  // Com TR as Condições esperam o Mestre lançar os testes: a proteção de cada alvo é lida na hora
  // de resolver (`resolveAbilityUseRolls`).
  const pending = effect.save
    ? {
        attribute: effect.save.attribute,
        cd: abilityCd({
          vocation: character.vocation,
          level: Number(character.level) || 1,
          attributes: character.attributes,
        }),
      }
    : undefined;

  // Tirar Condição de aliado: sem TR, sem Resistência a Condição e sem ler a proteção do alvo.
  if (hasRemoval(effect)) {
    const removalTargets = use.targets.map((t) => ({
      participantId: t.participantId,
      name: t.name,
      conditionIds: t.conditionIds,
    }));
    const choices = use.removals ?? {};
    const block = removalBlock(effect, removalTargets, choices);
    if (block) throw new Error(block);
    const removals = resolveAbilityRemoval(effect, removalTargets, choices);

    const id = await recordAbilityUse({
      userParticipantId: use.userParticipantId,
      abilityId: ability.id,
      abilityName: ability.name,
      actionType: ability.actionType,
      targets: removals.map(({ participantId, removed }) => ({
        participantId,
        conditions: [],
        remove: removed,
      })),
    });
    await spendAbilityUse(character.id, spent);
    return {
      id,
      results: removals.map(({ participantId, name, removed, messages }) => ({
        participantId,
        name,
        conditions: [],
        removed,
        messages,
      })),
    };
  }

  const results: AbilityTargetResult[] = [];
  for (const target of use.targets) {
    const resolved = pending
      ? { conditions: [], messages: [] }
      : resolveAbilityEffect(effect, await protectionOf(target.entityId, target.entityType));
    results.push({
      participantId: target.participantId,
      name: target.name,
      conditions: resolved.conditions,
      messages: resolved.messages,
    });
  }

  const id = await recordAbilityUse({
    userParticipantId: use.userParticipantId,
    abilityId: ability.id,
    abilityName: ability.name,
    actionType: ability.actionType,
    targets: results.map(({ participantId, conditions }) => ({ participantId, conditions })),
    ...(pending && { save: pending }),
  });

  await spendAbilityUse(character.id, spent);

  for (const result of results) {
    for (const message of result.messages) {
      window.dispatchEvent(
        new CustomEvent('combat-toast', { detail: { message: `${result.name}: ${message}` } }),
      );
    }
  }
  return { id, results, ...(pending && { pending }) };
}

/** O d20 que o Mestre lançou (ou a Rolagem Virtual sorteou) para um alvo de um uso pendente. */
export interface AbilitySaveRoll {
  participantId: string;
  /** O dado que vale (com Vantagem ou Desvantagem, o maior ou o menor dos dois). */
  natural: number;
  mark: MasterMark;
}

export interface AbilityResolution {
  status: 'resolved' | 'expired';
  results: (AbilitySaveOutcome & { name: string; messages: string[] })[];
}

/**
 * O Mestre resolve o TR de um uso pendente (ADR 0007): soma o modificador do atributo de cada alvo
 * ao d20, compara com a CD, calcula as Condições de quem falhou (depois da Resistência a Condição e
 * das imunidades) e manda tudo à função do banco. Se o combate já acabou, o uso expira sem efeito.
 */
export async function resolveAbilityUseRolls(input: {
  use: Pick<CombatAbilityUse, 'id' | 'ability_id' | 'cd' | 'targets'>;
  participants: Pick<CombatParticipant, 'id' | 'entity_id' | 'entity_type'>[];
  rolls: AbilitySaveRoll[];
}): Promise<AbilityResolution> {
  const { use, participants, rolls } = input;
  const effect = ABILITIES.find((a) => a.id === use.ability_id)?.combatEffect;
  if (!effect?.save || use.cd === null) throw new Error('A Habilidade não tem TR');

  const targets = abilityUseTargets(use.targets);
  for (const roll of rolls) {
    if (!Number.isInteger(roll.natural) || roll.natural < 1 || roll.natural > 20) {
      throw new Error('O d20 precisa estar entre 1 e 20');
    }
  }
  const rollOf = (participantId: string) => rolls.find((r) => r.participantId === participantId);
  for (const target of targets) {
    if (!rollOf(target.participantId)) throw new Error(`Falta o dado de ${target.name}`);
  }

  const entityOf = (participantId: string) => participants.find((p) => p.id === participantId);
  const entityIds = targets.flatMap((t) => entityOf(t.participantId)?.entity_id ?? []);
  const attributesById = await getCharactersAttributes(entityIds).catch(
    () => ({}) as Record<string, unknown>,
  );

  const results: AbilityResolution['results'] = [];
  for (const target of targets) {
    const roll = rollOf(target.participantId)!;
    const participant = entityOf(target.participantId);
    const save = resolveAbilitySave({
      dice: [roll.natural],
      mark: roll.mark,
      modifier: saveModifierOf(
        participant ? attributesById[participant.entity_id] : null,
        effect.save.attribute,
      ),
      cd: use.cd,
    });
    const applied = save.failed
      ? resolveAbilityEffect(
          effect,
          participant
            ? await protectionOf(participant.entity_id, participant.entity_type)
            : NO_PROTECTION,
        )
      : { conditions: [], messages: [] };
    results.push({
      participantId: target.participantId,
      name: target.name,
      natural: save.natural,
      total: save.total,
      failed: save.failed,
      mode: save.mode,
      conditions: applied.conditions,
      messages: applied.messages,
    });
  }

  const status = await resolveAbilityUse(
    use.id,
    results.map(({ participantId, natural, total, failed, mode, conditions }) => ({
      participantId,
      natural,
      total,
      failed,
      mode,
      conditions,
    })),
  );
  if (status === 'resolved') {
    for (const result of results) {
      for (const message of result.messages) {
        window.dispatchEvent(
          new CustomEvent('combat-toast', { detail: { message: `${result.name}: ${message}` } }),
        );
      }
    }
  }
  return { status, results };
}
