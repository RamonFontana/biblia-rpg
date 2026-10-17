// Dados do motor. Os dados da mesa são físicos (ADR 0001); estas funções servem às rolagens que o
// app faz sozinho (munição, perda de Fé, geração de atributos) e à Rolagem Virtual opcional.
import type { Rng } from './rng';

/** Um dado de `sides` faces: inteiro de 1 a `sides`. */
export function rollDie(sides: number, rng: Rng): number {
  return Math.floor(rng() * sides) + 1;
}

/** `count` dados de `sides` faces, na ordem do sorteio. */
export function rollDice(count: number, sides: number, rng: Rng): number[] {
  return Array.from({ length: count }, () => rollDie(sides, rng));
}
