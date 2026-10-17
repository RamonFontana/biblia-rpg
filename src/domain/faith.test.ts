// Fé: leitura da Fé Atual, teto 100 para todos, Fé Efetiva com Item Profano e Teste de Fé único.
// Decisões: ROADMAP.md, Onda 3 (passo 3); CONTEXT.md (Fé Atual, Fé Inicial, Fé Efetiva, Item
// Profano, Teste de Fé, Modificador de Fé).
import { describe, expect, it } from 'vitest';
import {
  FAITH_MAX,
  addFaith,
  getCurrentFaith,
  getEffectiveFaith,
  isFaithTestPassed,
  spendFaith,
  sumItemFaithPenalty,
} from '@/domain/faith';

describe('getCurrentFaith', () => {
  it('usa current_faith quando existe', () => {
    expect(getCurrentFaith({ current_faith: 40, faith: 60 })).toBe(40);
  });

  it('cai para faith (Fé Inicial gravada) quando não há current_faith', () => {
    expect(getCurrentFaith({ faith: 60 })).toBe(60);
  });

  it('current_faith igual a 0 vale 0 (não cai para faith)', () => {
    expect(getCurrentFaith({ current_faith: 0, faith: 50 })).toBe(0);
  });

  it('sem nenhuma Fé gravada, ou sem ficha, vale 0', () => {
    expect(getCurrentFaith({})).toBe(0);
    expect(getCurrentFaith(undefined)).toBe(0);
    expect(getCurrentFaith(null)).toBe(0);
    expect(getCurrentFaith({ current_faith: null, faith: null })).toBe(0);
  });
});

describe('teto de Fé', () => {
  it('é 100 para todos, qualquer que seja a Fé Inicial', () => {
    expect(FAITH_MAX).toBe(100);
    expect(addFaith({ current_faith: 50, faith: 50 }, 80)).toBe(100);
    expect(addFaith({ current_faith: 95, faith: 60 }, 3)).toBe(98);
  });

  it('não passa de 0 para baixo', () => {
    expect(addFaith({ current_faith: 3 }, -10)).toBe(0);
  });

  it('parte da Fé Inicial gravada quando não há Fé Atual', () => {
    expect(addFaith({ faith: 50 }, 4)).toBe(54);
  });
});

describe('spendFaith: custo de uma habilidade', () => {
  it('desconta o custo e devolve a Fé que sobra', () => {
    expect(spendFaith({ current_faith: 30 }, 10)).toBe(20);
  });

  it('gasta tudo quando o custo é igual à Fé', () => {
    expect(spendFaith({ current_faith: 10 }, 10)).toBe(0);
  });

  it('sem Fé suficiente, devolve null e nada é gasto', () => {
    expect(spendFaith({ current_faith: 9 }, 10)).toBeNull();
  });
});

describe('sumItemFaithPenalty: Itens Profanos', () => {
  it('soma as penalidades de Fé de todos os itens carregados', () => {
    expect(
      sumItemFaithPenalty([
        { statPenalty: { stat: 'faith', value: -10 } },
        { statPenalty: { stat: 'faith', value: -5 } },
      ]),
    ).toBe(-15);
  });

  it('ignora itens sem penalidade e penalidades de outro atributo', () => {
    expect(
      sumItemFaithPenalty([
        null,
        undefined,
        {},
        { statPenalty: { stat: 'strength', value: -3 } },
        { statPenalty: { stat: 'faith', value: -10 } },
      ]),
    ).toBe(-10);
  });

  it('sem itens, a penalidade é 0', () => {
    expect(sumItemFaithPenalty([])).toBe(0);
  });
});

describe('getEffectiveFaith', () => {
  it('é a Fé Atual somada à penalidade dos Itens Profanos', () => {
    expect(getEffectiveFaith({ current_faith: 50 }, -10)).toBe(40);
  });

  it('sem Item Profano, é a Fé Atual', () => {
    expect(getEffectiveFaith({ current_faith: 50 }, 0)).toBe(50);
  });
});

describe('isFaithTestPassed: 1d100 passa se rolou <= Fé Efetiva + Modificador de Fé', () => {
  // [Fé Efetiva, Modificador de Fé, resultado do 1d100, passa?]
  const cases: [number, number, number, boolean][] = [
    [50, 0, 50, true], // igual à Fé passa
    [50, 0, 51, false],
    [50, 0, 1, true],
    [50, 20, 70, true], // Misericórdia soma à Fé
    [50, 20, 71, false],
    [50, -20, 30, true], // Punição subtrai da Fé
    [50, -20, 31, false],
    [0, 0, 0, true], // Ruptura: só o 0 passa
    [0, 0, 1, false],
  ];

  it.each(cases)(
    'Fé Efetiva %i, modificador %i, rolou %i => passa: %s',
    (effective, modifier, rolled, passes) => {
      expect(isFaithTestPassed(rolled, modifier, effective)).toBe(passes);
    },
  );

  it('com Item Profano a Fé Efetiva menor reprova o que a Fé Atual aprovaria', () => {
    // Fé 50, Amuleto Proibido (-10), sem modificador, o jogador rolou 45: Fé Efetiva 40, falha.
    const effective = getEffectiveFaith({ current_faith: 50 }, -10);
    expect(isFaithTestPassed(45, 0, effective)).toBe(false);
    expect(isFaithTestPassed(40, 0, effective)).toBe(true);
  });
});
