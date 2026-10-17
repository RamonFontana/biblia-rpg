import { describe, it, expect } from 'vitest';
import {
  calculateModifier,
  calculateProficiency,
  formatModifier,
  SKILLS_LIST,
} from './characterMath';

describe('characterMath', () => {
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

  describe('formatModifier', () => {
    it('formats positive numbers with a plus sign', () => {
      expect(formatModifier(2)).toBe('+2');
      expect(formatModifier(0)).toBe('+0');
    });

    it('formats negative numbers correctly', () => {
      expect(formatModifier(-2)).toBe('-2');
    });
  });

  describe('SKILLS_LIST', () => {
    it('contains exactly 17 skills', () => {
      expect(SKILLS_LIST.length).toBe(17);
    });

    it('has no arcane skill (the setting has no arcane magic)', () => {
      expect(SKILLS_LIST.map((s) => s.id)).not.toContain('arcanismo');
    });
  });
});
