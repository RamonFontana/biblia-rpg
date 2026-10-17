import { describe, expect, it } from 'vitest';
import { canonicalVocation } from '@/domain/vocation';

describe('canonicalVocation', () => {
  it('Sábio é Sacerdote, com ou sem acento e em qualquer caixa', () => {
    expect(canonicalVocation('Sábio')).toBe('Sacerdote');
    expect(canonicalVocation('Sabio')).toBe('Sacerdote');
    expect(canonicalVocation(' sábio ')).toBe('Sacerdote');
  });

  it('as outras Vocações ficam como vieram', () => {
    expect(canonicalVocation('Guerreiro')).toBe('Guerreiro');
    expect(canonicalVocation('Sacerdote')).toBe('Sacerdote');
    expect(canonicalVocation('Caçador')).toBe('Caçador');
  });

  it('vazio ou ausente continua vazio ou ausente', () => {
    expect(canonicalVocation(undefined)).toBeUndefined();
    expect(canonicalVocation(null)).toBeNull();
    expect(canonicalVocation('')).toBe('');
  });
});
