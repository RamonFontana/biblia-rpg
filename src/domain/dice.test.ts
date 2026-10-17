import { describe, expect, it } from 'vitest';
import { rollDice, rollDie } from './dice';
import { createSeededRng } from './rng';

describe('rollDie', () => {
  it('o menor sorteio dá 1 e o maior dá a última face', () => {
    expect(rollDie(6, () => 0)).toBe(1);
    expect(rollDie(6, () => 0.999999)).toBe(6);
    expect(rollDie(20, () => 0.999999)).toBe(20);
  });

  it('divide o intervalo em faces iguais', () => {
    expect(rollDie(4, () => 0.24)).toBe(1);
    expect(rollDie(4, () => 0.25)).toBe(2);
    expect(rollDie(4, () => 0.5)).toBe(3);
    expect(rollDie(4, () => 0.75)).toBe(4);
  });

  it('com seed fixa, sai a mesma rolagem e todas as faces aparecem', () => {
    const rng = createSeededRng(123);
    const rolls = Array.from({ length: 600 }, () => rollDie(6, rng));
    expect(new Set(rolls)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    const again = createSeededRng(123);
    expect(Array.from({ length: 600 }, () => rollDie(6, again))).toEqual(rolls);
  });
});

describe('rollDice', () => {
  it('rola a quantidade pedida, na ordem dos sorteios', () => {
    const values = [0, 0.5, 0.999999];
    let i = 0;
    expect(rollDice(3, 6, () => values[i++])).toEqual([1, 4, 6]);
  });

  it('zero dados é uma lista vazia', () => {
    expect(rollDice(0, 6, () => 0.5)).toEqual([]);
  });
});
