// CARACTERIZAÇÃO: regras de munição, extraídas de useAmmunition sem alteração de comportamento.
// Recuperar munição é uma das rolagens que o app faz sozinho (ADR 0001): 50% por unidade gasta.
// O sorteio (Rng) é injetado para os testes serem determinísticos.
import type { Rng } from './rng';

/** Quantas das unidades gastas voltam: cada uma tem 50% de chance (sorteio >= 0.5). */
export function rollAmmoRecovery(spentAmount: number, rng: Rng): number {
  let recoveredCount = 0;
  for (let i = 0; i < spentAmount; i++) {
    if (rng() >= 0.5) {
      recoveredCount++;
    }
  }
  return recoveredCount;
}

/** Quantidade depois de recuperar: soma, limitada à capacidade máxima. */
export function calculateRecoveredQuantity(
  currentQuantity: number,
  recoveredCount: number,
  maxCapacity: number,
): number {
  return Math.min(currentQuantity + recoveredCount, maxCapacity);
}

/** Só gasta se houver unidades suficientes. */
export function canConsumeAmmo(currentQuantity: number, amount: number): boolean {
  return currentQuantity >= amount;
}
