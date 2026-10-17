import { describe, it, expect } from 'vitest';
import { getVocationRules } from './vocations';

describe('vocations rules', () => {
  describe('getVocationRules', () => {
    it('returns the correct rules for Guerreiro', () => {
      const rules = getVocationRules('Guerreiro');
      expect(rules).not.toBeNull();
      expect(rules?.id).toBe('Guerreiro');
      expect(rules?.maxSkills).toBe(2);
      expect(rules?.savingThrows).toContain('for');
      expect(rules?.savingThrows).toContain('con');
    });

    it('returns the correct rules for Sacerdote', () => {
      const rules = getVocationRules('Sacerdote');
      expect(rules).not.toBeNull();
      expect(rules?.maxSkills).toBe(3);
      expect(rules?.savingThrows).toContain('sab');
      expect(rules?.savingThrows).toContain('car');
    });

    it('Sábio is an alias of Sacerdote', () => {
      expect(getVocationRules('Sábio')).toEqual(getVocationRules('Sacerdote'));
    });

    it('Nobre is no longer a vocation', () => {
      expect(getVocationRules('Nobre')).toBeNull();
    });

    it('returns null for unknown or undefined vocation', () => {
      expect(getVocationRules('Desconhecido')).toBeNull();
      expect(getVocationRules(undefined)).toBeNull();
      expect(getVocationRules(null)).toBeNull();
    });
  });
});
