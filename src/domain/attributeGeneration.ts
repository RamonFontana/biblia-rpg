// CARACTERIZAÇÃO: geração de atributos, extraída de AttributeGeneration sem alteração.
// Os dois métodos oficiais (docs/regras-base.md): array padrão e 4d6 descartando o menor.
// O sorteio (Rng) é injetado para os testes serem determinísticos.
import { rollDice } from './dice';
import type { Rng } from './rng';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const ATTRIBUTE_COUNT = 6;

/** Rola 4d6 e soma os três maiores. */
export function rollAttributeScore(rng: Rng): number {
  const dice = rollDice(4, 6, rng);
  dice.sort((a, b) => b - a); // sort descending
  return dice[0] + dice[1] + dice[2]; // sum top 3
}

/** Seis valores de atributo, na ordem em que foram rolados. */
export function rollAttributeScores(rng: Rng): number[] {
  return Array.from({ length: ATTRIBUTE_COUNT }, () => rollAttributeScore(rng));
}
