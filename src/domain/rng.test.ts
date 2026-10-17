import { describe, expect, it } from 'vitest';
import { createSeededRng } from './rng';

describe('createSeededRng', () => {
  it('a mesma seed dá a mesma sequência', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
  });

  it('seeds diferentes dão sequências diferentes', () => {
    const a = Array.from({ length: 5 }, createSeededRng(1));
    const b = Array.from({ length: 5 }, createSeededRng(2));
    expect(a).not.toEqual(b);
  });

  it('só devolve números em [0, 1)', () => {
    const rng = createSeededRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('a sequência de uma seed conhecida não muda (reprodutibilidade dos testes)', () => {
    expect(Array.from({ length: 3 }, createSeededRng(1))).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
  });
});
