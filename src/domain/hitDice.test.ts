// Dados de Vida: o dado da Vocação e a reserva do personagem (igual ao nível).
// Termos: CONTEXT.md (Dado de Vida). Regras: docs/vocacoes/*.md, regras-base.md 6.4.
import { describe, expect, it } from 'vitest';
import {
  getHitDice,
  getHitDie,
  getHitDieAverage,
  getHitDieSpendBlock,
  healWithHitDie,
  hitDieSpendBlockMessage,
  isValidHitDieRoll,
  rollHitDie,
} from '@/domain/hitDice';
import { createSeededRng } from '@/domain/rng';

describe('getHitDie: o dado da Vocação', () => {
  it.each([
    ['Guerreiro', 10],
    ['Caçador', 10],
    ['Cacador', 10],
    ['guerreiro', 10],
    ['Batedor', 8],
    ['Sacerdote', 8],
    ['Sábio', 8],
  ])('%s => d%i', (vocation, die) => {
    expect(getHitDie(vocation)).toBe(die);
  });

  it('Vocação desconhecida ou ausente usa d8', () => {
    expect(getHitDie('Nobre')).toBe(8);
    expect(getHitDie(undefined)).toBe(8);
    expect(getHitDie(null)).toBe(8);
    expect(getHitDie('')).toBe(8);
  });
});

describe('getHitDieAverage: a média do dado', () => {
  it('d10 => 6 e d8 => 5', () => {
    expect(getHitDieAverage(10)).toBe(6);
    expect(getHitDieAverage(8)).toBe(5);
  });
});

describe('getHitDice: a reserva do personagem', () => {
  it('o total é o nível e os restantes descontam os gastos', () => {
    expect(getHitDice({ level: 5, spent: 2, vocation: 'Guerreiro' })).toEqual({
      die: 10,
      total: 5,
      remaining: 3,
    });
  });

  it('sem gastos, todos restam', () => {
    expect(getHitDice({ level: 1, spent: 0, vocation: 'Batedor' })).toEqual({
      die: 8,
      total: 1,
      remaining: 1,
    });
  });

  it('gasto ausente conta como 0', () => {
    expect(getHitDice({ level: 3, spent: undefined, vocation: 'Batedor' }).remaining).toBe(3);
    expect(getHitDice({ level: 3, spent: null, vocation: 'Batedor' }).remaining).toBe(3);
  });

  it('os restantes nunca ficam abaixo de 0 (gastos maiores que o nível)', () => {
    expect(getHitDice({ level: 2, spent: 5, vocation: 'Batedor' }).remaining).toBe(0);
  });

  it('nível ausente conta como 1', () => {
    expect(getHitDice({ level: undefined, spent: 0, vocation: 'Batedor' }).total).toBe(1);
  });
});

describe('getHitDieSpendBlock: quando o personagem não pode gastar um Dado de Vida', () => {
  const ok = {
    restOpen: true,
    isDead: false,
    isDying: false,
    remaining: 2,
    currentPv: 5,
    maxPv: 10,
  };

  it('pode gastar com o descanso aberto, dado sobrando e PV abaixo do máximo', () => {
    expect(getHitDieSpendBlock(ok)).toBeNull();
  });

  it('descanso fechado bloqueia', () => {
    expect(getHitDieSpendBlock({ ...ok, restOpen: false })).toBe('closed');
  });

  it('Morto bloqueia', () => {
    expect(getHitDieSpendBlock({ ...ok, isDead: true })).toBe('dead');
  });

  it('Morrendo bloqueia: os Testes de Morte vêm antes', () => {
    expect(getHitDieSpendBlock({ ...ok, isDying: true, currentPv: 0 })).toBe('dying');
  });

  it('Estável (0 PV, mas não Morrendo) pode gastar', () => {
    expect(getHitDieSpendBlock({ ...ok, currentPv: 0 })).toBeNull();
  });

  it('sem dados restantes bloqueia', () => {
    expect(getHitDieSpendBlock({ ...ok, remaining: 0 })).toBe('none-left');
  });

  it('PV cheio bloqueia', () => {
    expect(getHitDieSpendBlock({ ...ok, currentPv: 10 })).toBe('full');
  });

  it('o descanso fechado vence os outros motivos', () => {
    expect(getHitDieSpendBlock({ ...ok, restOpen: false, remaining: 0, isDead: true })).toBe(
      'closed',
    );
  });

  it('cada motivo tem uma mensagem', () => {
    for (const block of ['closed', 'dead', 'dying', 'none-left', 'full'] as const) {
      expect(hitDieSpendBlockMessage(block).length).toBeGreaterThan(5);
    }
  });
});

describe('isValidHitDieRoll: o dado digitado cabe no dado da Vocação', () => {
  it('aceita de 1 até as faces', () => {
    expect(isValidHitDieRoll(1, 10)).toBe(true);
    expect(isValidHitDieRoll(10, 10)).toBe(true);
    expect(isValidHitDieRoll(8, 8)).toBe(true);
  });
  it('recusa 0, acima das faces e não inteiro', () => {
    expect(isValidHitDieRoll(0, 10)).toBe(false);
    expect(isValidHitDieRoll(11, 10)).toBe(false);
    expect(isValidHitDieRoll(9, 8)).toBe(false);
    expect(isValidHitDieRoll(2.5, 10)).toBe(false);
  });
});

describe('healWithHitDie: a cura de um dado', () => {
  const base = { roll: 6, conScore: 14, currentPv: 10, maxPv: 30, bloodResilience: false };

  it('cura o rolado mais o modificador de CON', () => {
    expect(healWithHitDie(base)).toEqual({ newPv: 18, healed: 8 });
  });

  it('com CON negativa cura no mínimo 1', () => {
    expect(healWithHitDie({ ...base, roll: 1, conScore: 6 })).toEqual({ newPv: 11, healed: 1 });
  });

  it('com CON 10 o modificador é 0', () => {
    expect(healWithHitDie({ ...base, conScore: 10 })).toEqual({ newPv: 16, healed: 6 });
  });

  it('não passa do PV máximo e devolve só o que curou de fato', () => {
    expect(healWithHitDie({ ...base, currentPv: 27 })).toEqual({ newPv: 30, healed: 3 });
  });

  it('Sangue Resiliente soma 1 PV', () => {
    expect(healWithHitDie({ ...base, bloodResilience: true })).toEqual({ newPv: 19, healed: 9 });
  });

  it('Sangue Resiliente soma depois do mínimo de 1', () => {
    expect(healWithHitDie({ ...base, roll: 1, conScore: 6, bloodResilience: true })).toEqual({
      newPv: 12,
      healed: 2,
    });
  });

  it('o teto vale também com Sangue Resiliente', () => {
    expect(healWithHitDie({ ...base, currentPv: 29, bloodResilience: true })).toEqual({
      newPv: 30,
      healed: 1,
    });
  });

  it('CON ausente vale 10', () => {
    expect(healWithHitDie({ ...base, conScore: null })).toEqual({ newPv: 16, healed: 6 });
  });
});

describe('rollHitDie: a Rolagem Virtual', () => {
  it('rola o dado da Vocação com a Rng injetada', () => {
    const rng = createSeededRng(7);
    for (let i = 0; i < 30; i++) {
      const roll = rollHitDie(10, rng);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(10);
    }
  });
});
