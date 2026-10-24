// Moedas (Siclos) para a tela. A carteira guarda o valor exato (os preços chegam a 0,025 SP, ver
// `src/content/items.ts`); só a exibição é arredondada. Termos: CONTEXT.md (Siclo).

/**
 * O valor em Siclos para mostrar: arredondado a 2 casas (o meio sobe) e sem zeros finais. Passa
 * por milésimos primeiro, que é a casa mais fina dos preços, para o ruído do ponto flutuante
 * (`50 - 0.1 - 0.2`) não mudar o arredondamento.
 */
export function formatSiclos(value: number | null | undefined): string {
  if (!value) return '0';
  const thousandths = Math.round(value * 1000);
  return String(Math.round(thousandths / 10) / 100);
}
