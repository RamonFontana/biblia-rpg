import { describe, expect, it } from 'vitest';
import { calculateModifier, calculateProficiency } from './attributes';

describe('calculateModifier', () => {
  it('calculates correct modifier for given attributes', () => {
    expect(calculateModifier(10)).toBe(0);
    expect(calculateModifier(12)).toBe(1);
    expect(calculateModifier(13)).toBe(1);
    expect(calculateModifier(14)).toBe(2);
    expect(calculateModifier(8)).toBe(-1);
    expect(calculateModifier(1)).toBe(-5);
  });

  it('returns 0 for undefined or null', () => {
    expect(calculateModifier(undefined)).toBe(0);
    expect(calculateModifier(null)).toBe(0);
  });
});

describe('calculateProficiency', () => {
  it('calculates correct proficiency bonus for given levels', () => {
    expect(calculateProficiency(1)).toBe(2);
    expect(calculateProficiency(4)).toBe(2);
    expect(calculateProficiency(5)).toBe(3);
    expect(calculateProficiency(8)).toBe(3);
    expect(calculateProficiency(9)).toBe(4);
    expect(calculateProficiency(12)).toBe(4);
    expect(calculateProficiency(13)).toBe(5);
    expect(calculateProficiency(16)).toBe(5);
    expect(calculateProficiency(17)).toBe(6);
    expect(calculateProficiency(20)).toBe(6);
  });

  it('defaults to 2 for missing or invalid levels', () => {
    expect(calculateProficiency()).toBe(2);
    expect(calculateProficiency(0)).toBe(2);
  });
});
