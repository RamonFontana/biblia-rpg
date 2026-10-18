// Lista de Condições de um personagem ou participante: juntar, remover, tiquear e limpar.
// Funções puras; quem grava no banco é `data-access/conditions`.
import type { ConditionEntry } from '@/types/combat';

/**
 * Junta uma Condição nova a uma lista. Se ela já existe, é substituída (a duração reinicia) e vai
 * para o fim.
 */
export function mergeCondition(
  currentConditions: ConditionEntry[],
  newCondition: ConditionEntry,
): ConditionEntry[] {
  const filtered = currentConditions.filter((c) => c.conditionId !== newCondition.conditionId);
  return [...filtered, newCondition];
}

/** Tira uma Condição da lista. */
export function removeCondition(
  currentConditions: ConditionEntry[],
  conditionId: string,
): ConditionEntry[] {
  return currentConditions.filter((c) => c.conditionId !== conditionId);
}

/**
 * Desconta uma rodada das Condições com duração e tira as que chegam a zero. As sem duração
 * (`null`, até curar) ficam como estão.
 */
export function tickConditions(currentConditions: ConditionEntry[]): ConditionEntry[] {
  return currentConditions
    .map((c) => {
      if (c.duration === null) return c; // permanent
      return { ...c, duration: c.duration - 1 };
    })
    .filter((c) => c.duration === null || c.duration > 0);
}

/** Tira as Condições temporárias (com duração) e mantém só as permanentes (`null`). */
export function cleanTemporaryConditions(currentConditions: ConditionEntry[]): ConditionEntry[] {
  return currentConditions.filter((c) => c.duration === null);
}
