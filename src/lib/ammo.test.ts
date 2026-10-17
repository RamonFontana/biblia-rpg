// CARACTERIZAÇÃO: fixa o comportamento ATUAL da munição.
// Termos: CONTEXT.md. Decisão: a recuperação de munição segue automática, 50% por unidade (ADR 0001).
import { describe, expect, it } from 'vitest';
import { calculateRecoveredQuantity, canConsumeAmmo, rollAmmoRecovery } from './ammo';

// Sorteio determinístico: devolve os valores em ordem.
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++];
};

describe('rollAmmoRecovery', () => {
  it('cada unidade volta se o sorteio for 0.5 ou mais', () => {
    expect(rollAmmoRecovery(4, sequence(0.5, 0.49, 0.99, 0))).toBe(2);
  });

  it('o limiar é inclusivo em 0.5 e exclusivo logo abaixo', () => {
    expect(rollAmmoRecovery(1, sequence(0.5))).toBe(1);
    expect(rollAmmoRecovery(1, sequence(0.4999))).toBe(0);
  });

  it('sorteia uma vez por unidade gasta', () => {
    let calls = 0;
    rollAmmoRecovery(7, () => {
      calls++;
      return 0;
    });
    expect(calls).toBe(7);
  });

  it('nada gasto, nada recuperado e nenhum sorteio', () => {
    let calls = 0;
    expect(
      rollAmmoRecovery(0, () => {
        calls++;
        return 1;
      }),
    ).toBe(0);
    expect(calls).toBe(0);
  });

  it('usa Math.random quando nenhum sorteio é informado', () => {
    const result = rollAmmoRecovery(1000);
    expect(result).toBeGreaterThan(400);
    expect(result).toBeLessThan(600);
  });
});

describe('calculateRecoveredQuantity', () => {
  it('soma o recuperado', () => {
    expect(calculateRecoveredQuantity(5, 3, 20)).toBe(8);
  });

  it('não passa da capacidade máxima', () => {
    expect(calculateRecoveredQuantity(19, 3, 20)).toBe(20);
  });

  it('BUG conhecido: com capacidade menor que o estoque, recuperar REDUZ a quantidade', () => {
    expect(calculateRecoveredQuantity(30, 1, 20)).toBe(20);
  });
});

describe('canConsumeAmmo', () => {
  it('permite gastar até a quantidade que existe', () => {
    expect(canConsumeAmmo(3, 3)).toBe(true);
    expect(canConsumeAmmo(3, 1)).toBe(true);
  });

  it('não permite gastar mais do que existe', () => {
    expect(canConsumeAmmo(2, 3)).toBe(false);
    expect(canConsumeAmmo(0, 1)).toBe(false);
  });
});
