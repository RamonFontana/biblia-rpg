// CARACTERIZAÇÃO: regras dos Testes de Morte, extraídas de DeathSavesModal e useDeathSaves sem alteração.
// Termos: CONTEXT.md (Teste de Morte, Morrendo, Estável, Morto). O 1 e o 20 naturais foram para o
// doc sem pergunta explícita; confirmar (ROADMAP, pendências).
import { getCurrentPv, type VitalsLike } from './vitalsUtils';

export type DeathSaveOutcome =
  { kind: 'failure'; count: 1 | 2 } | { kind: 'success' } | { kind: 'revive' } | { kind: 'none' };

/** O que um d20 de Teste de Morte causa. Valores fora de 1 a 20 não fazem nada. */
export function getDeathSaveOutcome(roll: number): DeathSaveOutcome {
  if (roll === 1) return { kind: 'failure', count: 2 };
  if (roll >= 2 && roll <= 9) return { kind: 'failure', count: 1 };
  if (roll >= 10 && roll <= 19) return { kind: 'success' };
  if (roll === 20) return { kind: 'revive' };
  return { kind: 'none' };
}

/** Soma um sucesso (máximo 3); com 3 o personagem fica Estável. */
export function addDeathSaveSuccess(currentSuccesses: number) {
  const newSuccesses = Math.min(currentSuccesses + 1, 3);
  return { newSuccesses, isStable: newSuccesses >= 3 };
}

/** Soma falhas (máximo 3); com 3 o personagem está Morto. */
export function addDeathSaveFailure(currentFailures: number, count: number = 1) {
  const newFailures = Math.min(currentFailures + count, 3);
  return { newFailures, isDead: newFailures >= 3 };
}

export interface DyingCandidate {
  stats?: VitalsLike | null;
  is_dead?: boolean | null;
  is_stable?: boolean | null;
  is_enemy?: boolean | null;
  is_deleted?: boolean | null;
}

/**
 * Morrendo: 0 PV e ainda fazendo Testes de Morte (nem Estável nem Morto). Inimigo com 0 PV morre,
 * então nunca está Morrendo. A sessão não encerra enquanto alguém estiver Morrendo.
 * Ficha sem PV gravado conta como viva.
 */
export function isDying(character: DyingCandidate): boolean {
  if (character.is_enemy || character.is_deleted || character.is_dead || character.is_stable) {
    return false;
  }
  return getCurrentPv(character.stats, 1) <= 0;
}
