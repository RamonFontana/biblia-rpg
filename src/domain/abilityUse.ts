// CARACTERIZAÇÃO: o uso das Habilidades na ficha (usos que restam, custo de Fé, gastar e restaurar),
// extraído de CharacterSheetView sem alteração de comportamento.
// Termos: CONTEXT.md (Habilidade, Fé).
import { spendFaith, type FaithStats } from './faith';

/** O que o uso precisa de uma Habilidade: a chave dos usos, o limite e o custo de Fé. */
export interface UsableAbility {
  id: string;
  maxUses?: number;
  faithCost?: number;
}

/** As `skills` de uma ficha comum: os usos gastos por Habilidade, além do resto que a ficha guarda. */
export interface AbilitySkills {
  ability_uses?: Record<string, number>;
}

export interface AbilityAvailability {
  /** Usos que restam; indefinido quando a Habilidade não tem limite. */
  remainingUses: number | undefined;
  disabled: boolean;
  /** Por que está desligada: 'Fé Insuficiente' vem antes de 'Sem Usos'. */
  reason: string;
}

export function getUsedCount(skills: AbilitySkills | null | undefined, abilityId: string): number {
  return skills?.ability_uses?.[abilityId] || 0;
}

export function getAbilityAvailability(
  ability: UsableAbility,
  skills: AbilitySkills | null | undefined,
  stats: FaithStats | null | undefined,
): AbilityAvailability {
  const used = getUsedCount(skills, ability.id);
  const remainingUses = ability.maxUses ? Math.max(0, ability.maxUses - used) : undefined;

  if (ability.faithCost && spendFaith(stats, ability.faithCost) === null) {
    return { remainingUses, disabled: true, reason: 'Fé Insuficiente' };
  }

  if (ability.maxUses && used >= ability.maxUses) {
    return { remainingUses, disabled: true, reason: 'Sem Usos' };
  }

  return { remainingUses, disabled: false, reason: '' };
}

/**
 * Gasta um uso (e a Fé, se a Habilidade custa). Devolve as `skills` novas e, quando houve custo,
 * os `stats` novos; `null` se não há Fé para o custo (nada é gasto).
 */
export function applyAbilityUse<S extends AbilitySkills, T extends FaithStats>(
  ability: UsableAbility,
  skills: S | null | undefined,
  stats: T | null | undefined,
): { skills: S; stats?: T } | null {
  const current = (skills || {}) as S;
  const abilityUses = current.ability_uses || {};

  const newSkills = {
    ...current,
    ability_uses: { ...abilityUses, [ability.id]: (abilityUses[ability.id] || 0) + 1 },
  };

  if (!ability.faithCost) return { skills: newSkills };

  const faithLeft = spendFaith(stats, ability.faithCost);
  if (faithLeft === null) return null;

  return { skills: newSkills, stats: { ...(stats || ({} as T)), current_faith: faithLeft } };
}

/** Zera os usos gastos de uma Habilidade, sem mexer nas outras. */
export function restoreAbilityUses<S extends AbilitySkills>(
  skills: S | null | undefined,
  abilityId: string,
): S {
  const current = (skills || {}) as S;
  const abilityUses = { ...(current.ability_uses || {}) };
  delete abilityUses[abilityId];

  return { ...current, ability_uses: abilityUses };
}
