// A Fúria Desumana do Endemoniado, pelo lado do Mestre (CONTEXT.md: Fúria Desumana): lê a CON do
// inimigo, resolve o TR pelo motor e grava o PV e o estado no participante do combate.
import { getCharactersSaveSources } from '@/data-access/characters';
import { setEnemyFuriaState, setParticipantHp } from '@/data-access/combat';
import { saveModifierOf } from '@/domain/abilitySave';
import { enemySaveBonuses } from '@/domain/enemyBlock';
import {
  furiaStateAtHp,
  furiaStateOf,
  resolveFuria,
  type FuriaResolution,
} from '@/domain/furiaDesumana';
import type { MasterMark } from '@/domain/testMode';

export interface FuriaTarget {
  participantId: string;
  entityId: string;
  /** O `ability_state` do participante, como veio do banco. */
  abilityState: unknown;
}

/**
 * Resolve o TR de CON da Fúria com o d20 que o Mestre digitou ou rolou. Passou: o inimigo fica com
 * 1 PV. O PV é gravado antes do estado: se o estado falhar, o inimigo já está de pé.
 */
export async function resolveFuriaSave(
  target: FuriaTarget,
  roll: { natural: number; mark: MasterMark },
): Promise<FuriaResolution> {
  if (!Number.isInteger(roll.natural) || roll.natural < 1 || roll.natural > 20) {
    throw new Error('O d20 precisa estar entre 1 e 20');
  }
  const sources = await getCharactersSaveSources([target.entityId]).catch(
    () => ({}) as Awaited<ReturnType<typeof getCharactersSaveSources>>,
  );
  const source = sources[target.entityId];
  const resolution = resolveFuria({
    state: furiaStateOf(target.abilityState),
    conModifier: saveModifierOf(source?.attributes, 'con', enemySaveBonuses(source?.stats)),
    natural: roll.natural,
    mark: roll.mark,
  });
  if (resolution.passed) await setParticipantHp(target.participantId, resolution.hpAfter);
  await setEnemyFuriaState(target.participantId, resolution.state);
  return resolution;
}

/** O inimigo tem PV de novo: o 0 PV tratado deixa de contar, para o próximo 0 PV pedir o TR. */
export async function releaseFuria(target: FuriaTarget, hp: number): Promise<void> {
  const state = furiaStateOf(target.abilityState);
  const next = furiaStateAtHp(state, hp);
  if (next !== state) await setEnemyFuriaState(target.participantId, next);
}
