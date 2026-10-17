// CARACTERIZAÇÃO: fixa o comportamento ATUAL dos Testes de Morte.
// Decisões: ROADMAP.md, Onda 2: Morrendo continua depois do combate (o fim do combate mata hoje).
// Termos: CONTEXT.md (Teste de Morte, Morrendo, Estável, Morto).
import { describe, expect, it } from 'vitest';
import { addDeathSaveFailure, addDeathSaveSuccess, getDeathSaveOutcome } from './deathSaves';

describe('getDeathSaveOutcome: o que o d20 causa', () => {
  it('1 natural conta duas falhas', () => {
    expect(getDeathSaveOutcome(1)).toEqual({ kind: 'failure', count: 2 });
  });

  it('2 a 9 é uma falha', () => {
    for (let roll = 2; roll <= 9; roll++) {
      expect(getDeathSaveOutcome(roll)).toEqual({ kind: 'failure', count: 1 });
    }
  });

  it('10 a 19 é um sucesso', () => {
    for (let roll = 10; roll <= 19; roll++) {
      expect(getDeathSaveOutcome(roll)).toEqual({ kind: 'success' });
    }
  });

  it('20 natural devolve o personagem à consciência com 1 PV', () => {
    expect(getDeathSaveOutcome(20)).toEqual({ kind: 'revive' });
  });

  it('valores fora de 1 a 20 não fazem nada', () => {
    expect(getDeathSaveOutcome(0)).toEqual({ kind: 'none' });
    expect(getDeathSaveOutcome(21)).toEqual({ kind: 'none' });
    expect(getDeathSaveOutcome(-3)).toEqual({ kind: 'none' });
  });
});

describe('contadores de sucessos e falhas', () => {
  it('três sucessos deixam o personagem Estável', () => {
    expect(addDeathSaveSuccess(0)).toEqual({ newSuccesses: 1, isStable: false });
    expect(addDeathSaveSuccess(1)).toEqual({ newSuccesses: 2, isStable: false });
    expect(addDeathSaveSuccess(2)).toEqual({ newSuccesses: 3, isStable: true });
  });

  it('os sucessos não passam de 3', () => {
    expect(addDeathSaveSuccess(3)).toEqual({ newSuccesses: 3, isStable: true });
  });

  it('três falhas matam o personagem', () => {
    expect(addDeathSaveFailure(0)).toEqual({ newFailures: 1, isDead: false });
    expect(addDeathSaveFailure(2)).toEqual({ newFailures: 3, isDead: true });
  });

  it('duas falhas de uma vez (1 natural) com uma falha anterior matam', () => {
    expect(addDeathSaveFailure(1, 2)).toEqual({ newFailures: 3, isDead: true });
  });

  it('as falhas não passam de 3', () => {
    expect(addDeathSaveFailure(2, 2)).toEqual({ newFailures: 3, isDead: true });
    expect(addDeathSaveFailure(3)).toEqual({ newFailures: 3, isDead: true });
  });

  it('um 1 natural sozinho não mata; só com uma falha prévia', () => {
    expect(addDeathSaveFailure(0, 2).isDead).toBe(false);
  });
});
