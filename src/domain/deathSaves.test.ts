// CARACTERIZAÇÃO: fixa o comportamento ATUAL dos Testes de Morte.
// Decisões: ROADMAP.md, Onda 2: Morrendo continua depois do combate; a sessão não encerra com
// alguém Morrendo (o Mestre resolve os Testes de Morte antes).
// Termos: CONTEXT.md (Teste de Morte, Morrendo, Estável, Morto).
import { describe, expect, it } from 'vitest';
import {
  addDeathSaveFailure,
  addDeathSaveSuccess,
  getDeathSaveOutcome,
  isDying,
} from '@/domain/deathSaves';

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

describe('isDying: quem impede o fim da sessão', () => {
  const char = (over: Record<string, unknown> = {}) => ({
    stats: { pv: 10, current_pv: 0 },
    is_dead: false,
    is_stable: false,
    is_enemy: false,
    is_deleted: false,
    ...over,
  });

  it('0 PV, sem estar Estável nem Morto, é Morrendo', () => {
    expect(isDying(char())).toBe(true);
    expect(isDying(char({ stats: { pv: 10, current_pv: -3 } }))).toBe(true);
  });

  it('com PV acima de 0 não está Morrendo', () => {
    expect(isDying(char({ stats: { pv: 10, current_pv: 1 } }))).toBe(false);
  });

  it('Estável ou Morto já não faz Testes de Morte', () => {
    expect(isDying(char({ is_stable: true }))).toBe(false);
    expect(isDying(char({ is_dead: true }))).toBe(false);
  });

  it('inimigo com 0 PV morre, não fica Morrendo', () => {
    expect(isDying(char({ is_enemy: true }))).toBe(false);
  });

  it('ficha apagada não conta', () => {
    expect(isDying(char({ is_deleted: true }))).toBe(false);
  });

  it('ficha sem PV gravado conta como viva', () => {
    expect(isDying(char({ stats: undefined }))).toBe(false);
    expect(isDying(char({ stats: {} }))).toBe(false);
  });
});
