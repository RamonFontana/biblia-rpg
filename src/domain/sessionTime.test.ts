// CARACTERIZAÇÃO: o relógio da Sessão. A tela que o usa é testada em pages/session/ActiveSessionPage.
import { describe, expect, it } from 'vitest';
import { advanceSessionClock, getPeriodIcon, isNewDay } from './sessionTime';

describe('advanceSessionClock', () => {
  it('Manhã vira Tarde e Tarde vira Noite, no mesmo dia, sem tocar nos Descansos', () => {
    expect(advanceSessionClock({ current_period: 'Manhã', current_day: 4 })).toStrictEqual({
      current_period: 'Tarde',
      current_day: 4,
    });
    expect(advanceSessionClock({ current_period: 'Tarde', current_day: 4 })).toStrictEqual({
      current_period: 'Noite',
      current_day: 4,
    });
  });

  it('a Noite vira Manhã do dia seguinte e zera os Descansos Curtos', () => {
    expect(advanceSessionClock({ current_period: 'Noite', current_day: 4 })).toStrictEqual({
      current_period: 'Manhã',
      current_day: 5,
      short_rests_today: 0,
    });
  });

  it('sem dia gravado conta a partir do dia 1', () => {
    expect(advanceSessionClock({ current_period: 'Manhã', current_day: null })).toMatchObject({
      current_day: 1,
    });
    expect(advanceSessionClock({ current_period: 'Noite', current_day: null })).toMatchObject({
      current_day: 2,
    });
    expect(advanceSessionClock({ current_period: 'Manhã', current_day: 0 })).toMatchObject({
      current_day: 1,
    });
  });

  it('período desconhecido ou vazio volta à Manhã no mesmo dia', () => {
    expect(advanceSessionClock({ current_period: 'Madrugada', current_day: 3 })).toStrictEqual({
      current_period: 'Manhã',
      current_day: 3,
    });
    expect(advanceSessionClock({ current_period: null, current_day: null })).toStrictEqual({
      current_period: 'Manhã',
      current_day: 1,
    });
  });
});

describe('getPeriodIcon', () => {
  it('cada período tem o seu ícone e o desconhecido usa o da Manhã', () => {
    expect(getPeriodIcon('Manhã')).toBe('🌅');
    expect(getPeriodIcon('Tarde')).toBe('☀️');
    expect(getPeriodIcon('Noite')).toBe('🌙');
    expect(getPeriodIcon('Madrugada')).toBe('🌅');
  });
});

describe('isNewDay', () => {
  it('só a virada de Noite para Manhã conta', () => {
    expect(isNewDay('Noite', 'Manhã')).toBe(true);
    expect(isNewDay('Manhã', 'Tarde')).toBe(false);
    expect(isNewDay('Tarde', 'Manhã')).toBe(false);
    expect(isNewDay('Noite', 'Tarde')).toBe(false);
    expect(isNewDay(undefined, 'Manhã')).toBe(false);
  });
});
