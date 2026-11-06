import { describe, expect, it } from 'vitest';
import {
  furtivoReminder,
  furtivoStateOf,
  hasFurtivo,
  withFurtivoUsed,
  FURTIVO_REMINDER,
} from './furtivo';

const skills = [{ name: 'Ataque Furtivo' }];

describe('hasFurtivo', () => {
  it('reconhece a passiva pelo nome, sem acento nem caixa', () => {
    expect(hasFurtivo(skills)).toBe(true);
    expect(hasFurtivo([{ name: 'ataque furtivo' }])).toBe(true);
  });
  it('não confunde o Ataque Furtivo de Emboscada nem lista inválida', () => {
    expect(hasFurtivo([{ name: 'Ataque Furtivo de Emboscada' }])).toBe(false);
    expect(hasFurtivo(undefined)).toBe(false);
    expect(hasFurtivo([{ name: 'Formação em Parede' }])).toBe(false);
  });
});

describe('furtivoStateOf / withFurtivoUsed', () => {
  it('sem estado, nunca foi usado', () => {
    expect(furtivoStateOf(null)).toEqual({ usedRound: null });
    expect(furtivoStateOf({ furtivo: { usedRound: 'x' } })).toEqual({ usedRound: null });
  });
  it('grava a rodada do uso e preserva o resto do ability_state', () => {
    const next = withFurtivoUsed({ 'enemy-x': 'used', furia: { uses: 1, handled: false } }, 3);
    expect(next).toEqual({
      'enemy-x': 'used',
      furia: { uses: 1, handled: false },
      furtivo: { usedRound: 3 },
    });
    expect(furtivoStateOf(next)).toEqual({ usedRound: 3 });
  });
});

describe('furtivoReminder', () => {
  const base = { skills, hp: 5, isCurrentTurn: true, round: 2, state: { usedRound: null } };
  it('disponível no turno do inimigo', () => {
    expect(furtivoReminder(base)).toEqual({ text: FURTIVO_REMINDER, used: false });
  });
  it('travado depois do "usei", na mesma rodada', () => {
    expect(furtivoReminder({ ...base, state: { usedRound: 2 } })).toEqual({
      text: FURTIVO_REMINDER,
      used: true,
    });
  });
  it('liberado no próximo turno dele (outra rodada)', () => {
    expect(furtivoReminder({ ...base, round: 3, state: { usedRound: 2 } })?.used).toBe(false);
  });
  it('sem lembrete fora do turno, sem a passiva ou a 0 PV', () => {
    expect(furtivoReminder({ ...base, isCurrentTurn: false })).toBeNull();
    expect(furtivoReminder({ ...base, skills: [] })).toBeNull();
    expect(furtivoReminder({ ...base, hp: 0 })).toBeNull();
  });
});
