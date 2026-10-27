// Dados de Vida: o dado da Vocação e a reserva do personagem (igual ao nível).
// Termos: CONTEXT.md (Dado de Vida). Regras: docs/vocacoes/*.md, regras-base.md 6.4.
import { describe, expect, it } from 'vitest';
import { getHitDice, getHitDie, getHitDieAverage } from '@/domain/hitDice';

describe('getHitDie: o dado da Vocação', () => {
  it.each([
    ['Guerreiro', 10],
    ['Caçador', 10],
    ['Cacador', 10],
    ['guerreiro', 10],
    ['Batedor', 8],
    ['Sacerdote', 8],
    ['Sábio', 8],
  ])('%s => d%i', (vocation, die) => {
    expect(getHitDie(vocation)).toBe(die);
  });

  it('Vocação desconhecida ou ausente usa d8', () => {
    expect(getHitDie('Nobre')).toBe(8);
    expect(getHitDie(undefined)).toBe(8);
    expect(getHitDie(null)).toBe(8);
    expect(getHitDie('')).toBe(8);
  });
});

describe('getHitDieAverage: a média do dado', () => {
  it('d10 => 6 e d8 => 5', () => {
    expect(getHitDieAverage(10)).toBe(6);
    expect(getHitDieAverage(8)).toBe(5);
  });
});

describe('getHitDice: a reserva do personagem', () => {
  it('o total é o nível e os restantes descontam os gastos', () => {
    expect(getHitDice({ level: 5, spent: 2, vocation: 'Guerreiro' })).toEqual({
      die: 10,
      total: 5,
      remaining: 3,
    });
  });

  it('sem gastos, todos restam', () => {
    expect(getHitDice({ level: 1, spent: 0, vocation: 'Batedor' })).toEqual({
      die: 8,
      total: 1,
      remaining: 1,
    });
  });

  it('gasto ausente conta como 0', () => {
    expect(getHitDice({ level: 3, spent: undefined, vocation: 'Batedor' }).remaining).toBe(3);
    expect(getHitDice({ level: 3, spent: null, vocation: 'Batedor' }).remaining).toBe(3);
  });

  it('os restantes nunca ficam abaixo de 0 (gastos maiores que o nível)', () => {
    expect(getHitDice({ level: 2, spent: 5, vocation: 'Batedor' }).remaining).toBe(0);
  });

  it('nível ausente conta como 1', () => {
    expect(getHitDice({ level: undefined, spent: 0, vocation: 'Batedor' }).total).toBe(1);
  });
});
