// Descanso Longo e sessão nova devolvem Dados de Vida gastos (CONTEXT.md: Dado de Vida).
import { describe, expect, it } from 'vitest';
import { hitDiceSpentAfterLongRest } from '@/domain/hitDiceRecovery';

describe('Descanso Longo: devolve metade dos Dados de Vida gastos, arredondada para cima', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 1],
    [4, 2],
    [5, 2],
  ])('com %i gastos, ficam %i gastos', (spent, expected) => {
    expect(hitDiceSpentAfterLongRest(spent)).toBe(expected);
  });

  it('gasto ausente, nulo ou negativo vale 0', () => {
    expect(hitDiceSpentAfterLongRest(undefined)).toBe(0);
    expect(hitDiceSpentAfterLongRest(null)).toBe(0);
    expect(hitDiceSpentAfterLongRest(-3)).toBe(0);
  });

  it('com muitos gastos, devolve a metade do que foi gasto, não do total', () => {
    expect(hitDiceSpentAfterLongRest(10)).toBe(5);
    expect(hitDiceSpentAfterLongRest(7)).toBe(3);
  });
});
