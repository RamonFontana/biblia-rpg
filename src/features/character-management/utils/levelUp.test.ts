// CARACTERIZAÇÃO: fixa o comportamento ATUAL do PV e do Aumento de Atributo no level-up.
// Decisões: ROADMAP.md, Onda 2: Marco no lugar de XP; Aumento de Atributo nos níveis 4/8/12/16/19.
// Termos: CONTEXT.md (PV, Vocação, Marco).
import { describe, expect, it } from 'vitest';
import {
  ASI_LEVELS,
  MAX_LEVEL,
  calculateLevelUpHp,
  canGrantLevelUp,
  getCharacterLevel,
  getHpAverage,
  getLevelUpSteps,
} from './levelUp';

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
  });

  it('o piso de 1 PV só dispara fora da faixa de criação (CON 1: média 5, modificador -5)', () => {
    const r = hp({ vocation: 'Batedor', currentCon: 1 });
    expect(r.finalHpGained).toBe(0);
    expect(r.totalHpGained).toBe(1);
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

  it('o total é a soma do que a tela mostra: média + modificador novo + retroativo', () => {
    const r = hp({ currentCon: 13, conPointsGained: 1, newLevel: 4 });
    expect(r.hpAverage + r.newConMod + r.retroactiveHpGained).toBe(r.totalHpGained);
  });
});

describe('getLevelUpSteps: o passo de PV mostra o ganho final', () => {
  const all = { hasTribeChoice: true, hasVocationChoice: true, hasAsi: true };

  it('o passo de PV vem depois da escolha de atributo e antes do resumo', () => {
    const steps = getLevelUpSteps(all);
    expect(steps).toEqual(['tribe', 'vocation', 'asi', 'hp', 'summary']);
    expect(steps.indexOf('hp')).toBeGreaterThan(steps.indexOf('asi'));
  });

  it('sem escolhas, só PV e resumo', () => {
    expect(
      getLevelUpSteps({ hasTribeChoice: false, hasVocationChoice: false, hasAsi: false }),
    ).toEqual(['hp', 'summary']);
  });

  it('só inclui os passos que o nível pede', () => {
    expect(getLevelUpSteps({ ...all, hasTribeChoice: false, hasVocationChoice: false })).toEqual([
      'asi',
      'hp',
      'summary',
    ]);
  });
});

describe('Aumento de Atributo', () => {
  it('acontece nos níveis 4, 8, 12, 16 e 19', () => {
    expect(ASI_LEVELS).toEqual([4, 8, 12, 16, 19]);
  });
});

describe('getCharacterLevel', () => {
  it('usa a coluna level', () => {
    expect(getCharacterLevel({ level: 5, stats: { level: 3 } })).toBe(5);
  });

  it('nas fichas antigas cai para stats.level', () => {
    expect(getCharacterLevel({ level: null, stats: { level: 3 } })).toBe(3);
    expect(getCharacterLevel({ stats: { level: 7 } })).toBe(7);
  });

  it('sem nenhum dos dois é nível 1', () => {
    expect(getCharacterLevel({})).toBe(1);
    expect(getCharacterLevel({ level: 0, stats: null })).toBe(1);
  });
});

describe('canGrantLevelUp: teto de nível', () => {
  it('o nível máximo é 20', () => {
    expect(MAX_LEVEL).toBe(20);
  });

  it('permite até o nível 19 e bloqueia no 20', () => {
    expect(canGrantLevelUp({ level: 19 })).toBe(true);
    expect(canGrantLevelUp({ level: 20 })).toBe(false);
    expect(canGrantLevelUp({ level: 21 })).toBe(false);
  });

  it('GAP conhecido: a trava existe só na tela de encerramento, nenhuma regra impede o salto no banco', () => {
    // O LevelUpWizard calcula getCharacterLevel + 1 sem checar o teto.
    expect(getCharacterLevel({ level: 20 }) + 1).toBe(21);
  });
});
