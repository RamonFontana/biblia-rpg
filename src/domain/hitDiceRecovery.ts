// A devolução dos Dados de Vida gastos no Descanso Longo.
// Termos: CONTEXT.md (Dado de Vida, Descanso Longo). Decisão: grill de 2026-10-27 (metade dos gastos,
// arredondada para cima; o D&D 5e devolveria metade do total).

/** Quantos Dados de Vida seguem gastos depois de um Descanso Longo: devolve metade, para cima. */
export function hitDiceSpentAfterLongRest(spent: number | null | undefined): number {
  const current = Math.max(0, spent ?? 0);
  return current - Math.ceil(current / 2);
}
