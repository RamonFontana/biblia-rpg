import { describe, it, expect } from 'vitest';
import {
  getCurrentPv,
  getMaxPv,
  clampHp,
  applyHpDelta,
  applyDamageOrHealing,
  deriveStatusLabel,
  deriveCombatEndState,
  applyMaxPvIncrease,
} from './vitalsUtils';

describe('vitalsUtils', () => {
  describe('getCurrentPv', () => {
    it('uses current_pv when present', () => {
      expect(getCurrentPv({ current_pv: 7, current_hp: 99, pv: 99 })).toBe(7);
    });

    it('falls back to current_hp when current_pv is missing', () => {
      expect(getCurrentPv({ current_hp: 5, pv: 10 })).toBe(5);
    });

    it('falls back to pv when current_pv and current_hp are missing', () => {
      expect(getCurrentPv({ pv: 8, max_pv: 99, max_hp: 99 })).toBe(8);
    });

    it('falls back to max_pv then max_hp when higher-priority keys are missing', () => {
      expect(getCurrentPv({ max_pv: 6, max_hp: 99 })).toBe(6);
      expect(getCurrentPv({ max_hp: 4 })).toBe(4);
    });

    it('returns the fallback when every key is missing', () => {
      expect(getCurrentPv({}, 3)).toBe(3);
    });

    it('defaults fallback to 0', () => {
      expect(getCurrentPv({})).toBe(0);
    });

    it('handles null and undefined input', () => {
      expect(getCurrentPv(null, 2)).toBe(2);
      expect(getCurrentPv(undefined, 2)).toBe(2);
    });
  });

  describe('getMaxPv', () => {
    it('uses pv when present', () => {
      expect(getMaxPv({ pv: 12, max_hp: 99 })).toBe(12);
    });

    it('falls back to max_hp for a legacy-only record', () => {
      expect(getMaxPv({ max_hp: 9 })).toBe(9);
    });

    it('defaults fallback to 10 when both are missing', () => {
      expect(getMaxPv({})).toBe(10);
      expect(getMaxPv({}, 20)).toBe(20);
    });
  });

  describe('clampHp', () => {
    it('floors at 0', () => {
      expect(clampHp(-5, 10)).toBe(0);
    });

    it('ceils at max (regression test for the uncapped-healing bug)', () => {
      expect(clampHp(999, 10)).toBe(10);
    });

    it('passes through values within bounds', () => {
      expect(clampHp(5, 10)).toBe(5);
    });
  });

  describe('applyHpDelta', () => {
    it('heals and clamps at max', () => {
      expect(applyHpDelta(8, 10, 100)).toBe(10);
    });

    it('damages and clamps at 0', () => {
      expect(applyHpDelta(3, 10, -100)).toBe(0);
    });
  });

  describe('applyDamageOrHealing', () => {
    it('type "damage" matches a negated delta', () => {
      expect(applyDamageOrHealing(10, 10, 4, 'damage')).toBe(6);
    });

    it('type "healing" matches a positive delta and clamps at max (bug regression)', () => {
      expect(applyDamageOrHealing(8, 10, 999, 'healing')).toBe(10);
    });
  });

  describe('deriveStatusLabel', () => {
    it('returns Morto when hp is 0 or below', () => {
      expect(deriveStatusLabel(0)).toBe('Morto');
      expect(deriveStatusLabel(-1)).toBe('Morto');
    });

    it('returns Vivo when hp is above 0', () => {
      expect(deriveStatusLabel(1)).toBe('Vivo');
    });
  });

  describe('deriveCombatEndState', () => {
    it('a player character at 0 HP is Morrendo, not dead (death saves continue)', () => {
      expect(deriveCombatEndState(0, false, false)).toEqual({ isDead: false, status: 'Morrendo' });
    });

    it('an enemy at 0 HP is dead', () => {
      expect(deriveCombatEndState(0, false, true)).toEqual({ isDead: true, status: 'Morto' });
    });

    it('stays dead once previously dead, even if hp is now above 0 (sticky)', () => {
      expect(deriveCombatEndState(10, true, false)).toEqual({ isDead: true, status: 'Morto' });
    });

    it('stays alive when hp is above 0', () => {
      expect(deriveCombatEndState(10, false, false)).toEqual({ isDead: false, status: 'Vivo' });
      expect(deriveCombatEndState(1, false, true)).toEqual({ isDead: false, status: 'Vivo' });
    });
  });

  describe('applyMaxPvIncrease', () => {
    it('increases pv and current_pv by the same amount from canonical keys', () => {
      expect(applyMaxPvIncrease({ pv: 20, current_pv: 15 }, 5)).toEqual({ pv: 25, current_pv: 20 });
    });

    it('migrates a legacy-only record onto canonical keys on write', () => {
      expect(applyMaxPvIncrease({ max_hp: 10, current_hp: 6 }, 4)).toEqual({
        pv: 14,
        current_pv: 10,
      });
    });
  });
});
