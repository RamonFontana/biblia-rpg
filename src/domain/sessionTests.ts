// CARACTERIZAÇÃO: regras da dificuldade e da perda de Fé dos Testes de sessão, extraídas de
// MasterTestDialog e sessionTestService sem alteração de comportamento.
// Decisões: ROADMAP.md, Onda 2 (bloco B): a perda de 1d6 só ocorre em Tentação, Testemunho e
// Pedido Egoísta (hoje toda falha de Teste de Fé perde); Modificador de Fé no lugar de dificuldade.
// Termos: CONTEXT.md (Modificador de Fé, Misericórdia, Punição, Teste de Fé).
import { rollDie } from './dice';
import type { Rng } from './rng';

export type FaithModifierType = 'mercy' | 'punishment';

/**
 * Valor gravado em `difficulty`. Para o Teste de Fé guarda o Modificador de Fé com sinal:
 * Misericórdia positivo, Punição negativo. Nos outros testes é a CD, sem alteração.
 */
export function toStoredDifficulty(
  testType: string,
  difficulty: number,
  faithModifierType: FaithModifierType,
): number {
  if (testType === 'Fé') {
    return faithModifierType === 'punishment' ? -Math.abs(difficulty) : Math.abs(difficulty);
  }
  return difficulty;
}

/** Teste comum (não Fé): passa quando o total alcança a CD. */
export function isRegularTestApproved(resultValue: number, difficulty: number): boolean {
  return resultValue >= difficulty;
}

/**
 * Fé perdida numa falha de Teste de Fé: o valor digitado pelo jogador (penalidade) ou, sem ele,
 * um 1d6 sorteado pelo app. Não deixa a Fé abaixo de 0.
 */
export function calculateFaithAfterFailure(
  currentFaith: number,
  faithPenalty: number | undefined,
  rng: Rng,
): { faithLoss: number; newFaith: number } {
  const faithLoss = faithPenalty !== undefined ? faithPenalty : rollDie(6, rng);
  return { faithLoss, newFaith: Math.max(0, currentFaith - faithLoss) };
}
