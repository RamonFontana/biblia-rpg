// CARACTERIZAÇÃO: fixa o comportamento ATUAL do PV e do Aumento de Atributo no level-up.
// Decisões: ROADMAP.md, Onda 2: Marco no lugar de XP; Aumento de Atributo nos níveis 4/8/12/16/19.
// Termos: CONTEXT.md (PV, Vocação, Marco).
import { describe, expect, it } from 'vitest';
import { ASI_LEVELS, calculateLevelUpHp, getHpAverage } from './levelUp';

const hp = (over: Partial<Parameters<typeof calculateLevelUpHp>[0]> = {}) =>
  calculateLevelUpHp({
    vocation: 'Guerreiro',
    currentCon: 10,
    conPointsGained: 0,
    newLevel: 2,
    ...over,
  });

describe('getHpAverage: média do dado de vida por Vocação', () => {
  it.each([
    ['Guerreiro', 6],
    ['Caçador', 6],
    ['Cacador', 6],
    ['Batedor', 5],
    ['Sacerdote', 5],
    ['Sábio', 5],
  ])('%s => %i', (vocation, average) => {
    expect(getHpAverage(vocation)).toBe(average);
  });

  it('Vocação desconhecida (inclusive Nobre) ou ausente usa 5', () => {
    expect(getHpAverage('Nobre')).toBe(5);
    expect(getHpAverage(undefined)).toBe(5);
    expect(getHpAverage('')).toBe(5);
  });
});

describe('calculateLevelUpHp: PV ganhos', () => {
  it('média da Vocação mais o modificador de CON', () => {
    expect(hp({ currentCon: 14 }).totalHpGained).toBe(6 + 2);
  });

  it('ganha no mínimo 1 PV, mesmo com CON muito baixa', () => {
    expect(hp({ vocation: 'Batedor', currentCon: 3 }).totalHpGained).toBe(1);
    expect(hp({ vocation: 'Batedor', currentCon: 3 }).hpGained).toBe(1);
  });

  it('o piso de 1 PV só dispara fora da faixa de criação (CON 1: média 5, modificador -5)', () => {
    const r = hp({ vocation: 'Batedor', currentCon: 1 });
    expect(r.finalHpGained).toBe(0);
    expect(r.totalHpGained).toBe(1);
  });

  it('o ganho do passo de PV usa o modificador antigo de CON', () => {
    const r = hp({ currentCon: 13, conPointsGained: 1, newLevel: 4 });
    expect(r.conMod).toBe(1);
    expect(r.hpGained).toBe(6 + 1);
  });
});

describe('calculateLevelUpHp: CON sobe com o Aumento de Atributo', () => {
  it('aplica o modificador novo ao nível atual e retroage aos anteriores', () => {
    // CON 13 (+1) vira 14 (+2) no nível 4: este nível ganha 6+2 e os 3 anteriores ganham +1 cada.
    const r = hp({ currentCon: 13, conPointsGained: 1, newLevel: 4 });
    expect(r.newConMod).toBe(2);
    expect(r.finalHpGained).toBe(8);
    expect(r.retroactiveHpGained).toBe(3);
    expect(r.totalHpGained).toBe(11);
  });

  it('sem mudar o modificador não há retroativo', () => {
    // CON 12 (+1) vira 13 (+1).
    const r = hp({ currentCon: 12, conPointsGained: 1, newLevel: 8 });
    expect(r.retroactiveHpGained).toBe(0);
  });

  it('dois pontos na CON (de 12 para 14) valem +1 de modificador', () => {
    const r = hp({ currentCon: 12, conPointsGained: 2, newLevel: 4 });
    expect(r.retroactiveHpGained).toBe(3);
  });

  it('BUG conhecido: o passo de PV mostra um número e o total gravado é outro', () => {
    // O jogador vê "+7 PV" (modificador antigo) e a ficha grava 11 (modificador novo + retroativo).
    const r = hp({ currentCon: 13, conPointsGained: 1, newLevel: 4 });
    expect(r.hpGained).not.toBe(r.totalHpGained);
  });
});

describe('Aumento de Atributo', () => {
  it('acontece nos níveis 4, 8, 12, 16 e 19', () => {
    expect(ASI_LEVELS).toEqual([4, 8, 12, 16, 19]);
  });
});
