// CARACTERIZAÇÃO: fixa o comportamento ATUAL da dificuldade e da perda de Fé dos Testes de sessão.
// Decisões: ROADMAP.md, Onda 2 (bloco B): perda de Fé só em Tentação, Testemunho e Pedido Egoísta.
// Termos: CONTEXT.md (Modificador de Fé, Misericórdia, Punição).
import { describe, expect, it } from 'vitest';
import {
  calculateFaithAfterFailure,
  isRegularTestApproved,
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
