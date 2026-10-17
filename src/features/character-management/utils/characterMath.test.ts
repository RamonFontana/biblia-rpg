import { describe, it, expect } from 'vitest';
import { formatModifier, SKILLS_LIST } from './characterMath';

describe('characterMath', () => {
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
