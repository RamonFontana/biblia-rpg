// Cria um inimigo no meio da sessão: a ficha (a mesma linha do assistente, `buildEnemyRow`) e o
// vínculo com a sessão. Sem usuário logado não grava nada.
import { getCurrentUser } from '@/data-access/auth';
import { createEnemyCharacter } from '@/data-access/characters';
import { addSessionParticipant } from '@/data-access/sessions';
import type { Character } from '@/features/character-management/types';
import { buildEnemyRow, type EnemyRowInput } from '@/lib/sessionEntities';

export async function createSessionEnemy(
  sessionId: string,
  values: EnemyRowInput,
): Promise<Character | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const enemy = await createEnemyCharacter(buildEnemyRow(values, user.id));
  await addSessionParticipant({ sessionId, characterId: enemy.id, userId: user.id });
  return enemy;
}

/** Cria as fichas em ordem e as põe na sessão; sem usuário logado não cria nenhuma. */
export async function createSessionEnemies(
  sessionId: string,
  copies: EnemyRowInput[],
): Promise<Character[]> {
  const created: Character[] = [];
  for (const copy of copies) {
    const enemy = await createSessionEnemy(sessionId, copy);
    if (!enemy) break;
    created.push(enemy);
  }
  return created;
}
