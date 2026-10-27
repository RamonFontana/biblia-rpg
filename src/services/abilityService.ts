import type { AbilityDefinition } from '@/content/schemas';
import { getCharacterProtectionSource, updateCharacter } from '@/data-access/characters';
import { recordAbilityUse } from '@/data-access/combat';
import {
  abilityImmunities,
  resolveAbilityEffect,
  type TargetProtection,
} from '@/domain/abilityEffect';
import { applyAbilityUse, getAbilityAvailability } from '@/domain/abilityUse';
import { getConditionResistanceLevels, resolveEquippedItems } from '@/domain/armorResistance';
import type { AttackTarget } from '@/lib/attackSetup';
import type { CharacterEquipment, ConditionEntry } from '@/types/combat';
import type { CharacterSkills } from '@/features/character-creation/types';
import type { FaithStats } from '@/domain/faith';
import { abilitySkills, getAbilitiesForCharacter } from '@/utils/abilityUtils';

export interface AbilityUseSubmission {
  /** A Habilidade, com o efeito de combate. */
  ability: AbilityDefinition;
  userParticipantId: string;
  /** Os alvos que o jogador marcou. */
  targets: AttackTarget[];
  /** A ficha de quem usa: os usos e a Fé gastos saem dela. */
  character: { id: string; skills: unknown; stats: FaithStats | null | undefined };
}

export interface AbilityTargetResult {
  participantId: string;
  name: string;
  /** As Condições que chegaram ao alvo (vazio se anuladas). */
  conditions: ConditionEntry[];
  /** As frases de Resistência a Condição e de imunidade para o Mestre. */
  messages: string[];
}

export interface AbilityUseOutcome {
  id: string;
  results: AbilityTargetResult[];
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

  const results: AbilityTargetResult[] = [];
  for (const target of use.targets) {
    const resolved = resolveAbilityEffect(
      effect,
      await protectionOf(target.entityId, target.entityType),
    );
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
  });

  try {
    await updateCharacter(character.id, {
      skills: spent.skills,
      ...(spent.stats ? { stats: spent.stats } : {}),
    } as Parameters<typeof updateCharacter>[1]);
  } catch (error) {
    console.error('Error spending the Ability use:', error);
  }

  for (const result of results) {
    for (const message of result.messages) {
      window.dispatchEvent(
        new CustomEvent('combat-toast', { detail: { message: `${result.name}: ${message}` } }),
      );
    }
  }
  return { id, results };
}
