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
