// Como o app mostra as moedas (Siclos). A carteira guarda o valor exato (preços chegam a 0,025 SP);
// só a exibição é arredondada. Decisões: ROADMAP.md, Onda 4, passo 9d (Q15c).
import { describe, expect, it } from 'vitest';
import { formatSiclos } from './coins';

describe('formatSiclos', () => {
  it('um valor inteiro sai sem casas', () => {
    expect(formatSiclos(50)).toBe('50');
    expect(formatSiclos(0)).toBe('0');
  });

  it('sem valor sai 0', () => {
    expect(formatSiclos(undefined)).toBe('0');
    expect(formatSiclos(null)).toBe('0');
  });

  it('arredonda para 2 casas e tira os zeros finais', () => {
    expect(formatSiclos(49.975)).toBe('49.98');
    expect(formatSiclos(49.5)).toBe('49.5');
    expect(formatSiclos(49.95)).toBe('49.95');
    expect(formatSiclos(49.949)).toBe('49.95');
    expect(formatSiclos(49.944)).toBe('49.94');
  });

  it('o meio exato sobe', () => {
    expect(formatSiclos(0.005)).toBe('0.01');
    expect(formatSiclos(1.025)).toBe('1.03');
  });

  it('o ruído da conta em ponto flutuante não aparece', () => {
    expect(formatSiclos(50 - 0.1 - 0.2)).toBe('49.7');
    expect(formatSiclos(50 - 0.05 * 3)).toBe('49.85');
    expect(formatSiclos(0.1 + 0.2)).toBe('0.3');
  });
});
