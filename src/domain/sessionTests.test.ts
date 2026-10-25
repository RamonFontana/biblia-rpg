// CARACTERIZAÇÃO: fixa o comportamento ATUAL da dificuldade e da perda de Fé dos Testes de sessão.
// Decisões: ROADMAP.md, Onda 2 (bloco B): perda de Fé só em Tentação, Testemunho e Pedido Egoísta.
// Termos: CONTEXT.md (Modificador de Fé, Misericórdia, Punição).
import { describe, expect, it } from 'vitest';
import {
  calculateFaithAfterFailure,
  calculateSubmittedTotal,
  checkFaithPenaltyDie,
  FAITH_USE_LABELS,
  FAITH_USES,
  failureCostsFaith,
  getTestDieSides,
  isRegularTestApproved,
  isSubmittableResult,
  rollTestDie,
  toStoredDifficulty,
} from '@/domain/sessionTests';

// Com a penalidade digitada o app não sorteia nada: um Rng que falha prova isso.
const unusedRng = () => {
  throw new Error('não deveria sortear');
};

describe('toStoredDifficulty', () => {
  it('no Teste de Fé, Misericórdia grava positivo e Punição grava negativo', () => {
    expect(toStoredDifficulty('Fé', 20, 'mercy')).toBe(20);
    expect(toStoredDifficulty('Fé', 20, 'punishment')).toBe(-20);
  });

  it('o sinal digitado é ignorado: o tipo manda', () => {
    expect(toStoredDifficulty('Fé', -20, 'mercy')).toBe(20);
    expect(toStoredDifficulty('Fé', -20, 'punishment')).toBe(-20);
  });

  it('nos outros testes é a CD, sem mudança, mesmo escolhendo Punição', () => {
    expect(toStoredDifficulty('Força', 13, 'mercy')).toBe(13);
    expect(toStoredDifficulty('Furtividade', 13, 'punishment')).toBe(13);
  });
});

describe('isRegularTestApproved', () => {
  it('passa quando o total alcança ou supera a CD', () => {
    expect(isRegularTestApproved(13, 13)).toBe(true);
    expect(isRegularTestApproved(14, 13)).toBe(true);
    expect(isRegularTestApproved(12, 13)).toBe(false);
  });
});

describe('calculateFaithAfterFailure', () => {
  it('perde o valor que o jogador digitou (o d6 da mesa)', () => {
    expect(calculateFaithAfterFailure(50, 4, unusedRng)).toEqual({ faithLoss: 4, newFaith: 46 });
  });

  it('sem valor digitado, o app sorteia 1d6', () => {
    expect(calculateFaithAfterFailure(50, undefined, () => 0)).toEqual({
      faithLoss: 1,
      newFaith: 49,
    });
    expect(calculateFaithAfterFailure(50, undefined, () => 0.999)).toEqual({
      faithLoss: 6,
      newFaith: 44,
    });
  });

  it('a Fé não fica abaixo de 0', () => {
    expect(calculateFaithAfterFailure(3, 6, unusedRng).newFaith).toBe(0);
  });

  it('um valor digitado 0 é respeitado (não sorteia)', () => {
    expect(calculateFaithAfterFailure(50, 0, () => 0.9)).toEqual({ faithLoss: 0, newFaith: 50 });
  });

  it('não valida o valor digitado: aceita acima de 6 e negativo', () => {
    expect(calculateFaithAfterFailure(50, 20, unusedRng).newFaith).toBe(30);
    expect(calculateFaithAfterFailure(50, -5, unusedRng).newFaith).toBe(55);
  });
});

describe('dado e envio do Teste do jogador', () => {
  it('o dado é d100 na Fé e d20 nos demais Testes', () => {
    expect(getTestDieSides('Fé')).toBe(100);
    expect(getTestDieSides('Destreza')).toBe(20);
    expect(getTestDieSides('Resistência (Força)')).toBe(20);
  });

  it('a Rolagem Virtual vai de 1 ao máximo do dado do Teste', () => {
    expect(rollTestDie('Destreza', () => 0)).toBe(1);
    expect(rollTestDie('Destreza', () => 0.999)).toBe(20);
    expect(rollTestDie('Fé', () => 0)).toBe(1);
    expect(rollTestDie('Fé', () => 0.5)).toBe(51);
    expect(rollTestDie('Fé', () => 0.999)).toBe(100);
  });

  it('o total soma modificador e proficiência, menos no Teste de Fé', () => {
    const modifiers = { attrMod: 3, profBonus: 2 };
    expect(calculateSubmittedTotal('Furtividade', 9, modifiers)).toBe(14);
    expect(calculateSubmittedTotal('Fé', 9, modifiers)).toBe(9);
    expect(calculateSubmittedTotal('Destreza', 9, { attrMod: -1, profBonus: 0 })).toBe(8);
  });

  it('o resultado enviado cabe de 0 a 100, com os limites incluídos', () => {
    expect(isSubmittableResult(0)).toBe(true);
    expect(isSubmittableResult(100)).toBe(true);
    expect(isSubmittableResult(-1)).toBe(false);
    expect(isSubmittableResult(101)).toBe(false);
  });

  it('o d6 da punição: vazio ou NaN é "empty", fora de 1 a 6 é "range"', () => {
    expect(checkFaithPenaltyDie('')).toBe('empty');
    expect(checkFaithPenaltyDie(NaN)).toBe('empty');
    expect(checkFaithPenaltyDie(0)).toBe('range');
    expect(checkFaithPenaltyDie(7)).toBe('range');
    expect(checkFaithPenaltyDie(1)).toBeNull();
    expect(checkFaithPenaltyDie(6)).toBeNull();
  });
});

describe('failureCostsFaith', () => {
  it('o Clamor sem Pedido Egoísta não custa Fé (silêncio divino)', () => {
    expect(failureCostsFaith('clamor', false)).toBe(false);
  });

  it('o Clamor com Pedido Egoísta custa Fé', () => {
    expect(failureCostsFaith('clamor', true)).toBe(true);
  });

  it('a Tentação e o Testemunho sempre custam Fé, com ou sem a marca', () => {
    expect(failureCostsFaith('tentacao', false)).toBe(true);
    expect(failureCostsFaith('testemunho', false)).toBe(true);
    expect(failureCostsFaith('tentacao', true)).toBe(true);
  });

  it('um Teste de Fé antigo, sem uso gravado, segue custando Fé como antes', () => {
    expect(failureCostsFaith(null, false)).toBe(true);
  });
});

describe('usos do Teste de Fé', () => {
  it('são Clamor, Tentação e Testemunho, com nome para a tela', () => {
    expect(FAITH_USES).toEqual(['clamor', 'tentacao', 'testemunho']);
    expect(FAITH_USE_LABELS).toEqual({
      clamor: 'Clamor',
      tentacao: 'Tentação',
      testemunho: 'Testemunho',
    });
  });
});
