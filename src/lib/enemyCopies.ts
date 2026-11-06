// As cópias independentes que o formulário de inimigo cria de uma vez (ADR 0012): uma ficha por
// unidade, com o nome numerado contra os que a sessão já tem. A quantidade não vai para a ficha.
import { numberEnemyNames } from '@/domain/enemyNaming';
import type { EnemyRowInput } from '@/lib/sessionEntities';

export type EnemyFormInput = EnemyRowInput & { quantity?: number };

export function expandEnemyCopies(
  values: EnemyFormInput,
  existingNames: readonly string[],
): EnemyRowInput[] {
  const { quantity = 1, ...enemy } = values;
  return numberEnemyNames(enemy.name, quantity, existingNames).map((name) => ({
    ...structuredClone(enemy),
    name,
  }));
}
