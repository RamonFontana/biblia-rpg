// Fé: leitura da Fé Atual, teto 100 para todos, Fé Efetiva com Item Profano e Teste de Fé único.
// Decisões: ROADMAP.md, Onda 3 (passo 3); CONTEXT.md (Fé Atual, Fé Inicial, Fé Efetiva, Item
// Profano, Teste de Fé, Modificador de Fé).
import { describe, expect, it } from 'vitest';
import {
  FAITH_MAX,
  addFaith,
  getCurrentFaith,
  getEffectiveFaith,
  getFaithState,
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

  // Decisão do autor (ROADMAP, passo 9d, Q16): o gasto passa pelo teto e pelo piso da Fé (0 a 100).
  it('uma Fé gravada acima do teto volta ao teto depois do gasto', () => {
    expect(spendFaith({ current_faith: 120 }, 10)).toBe(100);
  });

  it('o gasto nunca deixa a Fé abaixo de 0', () => {
    expect(spendFaith({ current_faith: 0 }, 0)).toBe(0);
    expect(spendFaith({ current_faith: 10 }, 10)).toBe(0);
  });
});

describe('sumItemFaithPenalty: Itens Profanos', () => {
  it('soma a penalidade de Fé dos itens do conteúdo, pelo slug', () => {
    expect(sumItemFaithPenalty(['simbolo_proibido'])).toBe(-10);
    expect(sumItemFaithPenalty(['simbolo_proibido', 'simbolo_proibido'])).toBe(-20);
  });

  it('ignora itens sem penalidade, slugs desconhecidos e valores vazios', () => {
    expect(sumItemFaithPenalty(['espada_curta', 'nao_existe', null, undefined, ''])).toBe(0);
    expect(sumItemFaithPenalty(['espada_curta', 'simbolo_proibido'])).toBe(-10);
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

describe('getFaithState', () => {
  const idAt = (faith: number) => getFaithState({ current_faith: faith }).id;

  it('classifica as fronteiras do doc: 0, 1–10, 11–30, 31–69 e 70–100', () => {
    expect(idAt(0)).toBe('ruptura');
    expect(idAt(1)).toBe('vulneravel');
    expect(idAt(10)).toBe('vulneravel');
    expect(idAt(11)).toBe('abalado');
    expect(idAt(30)).toBe('abalado');
    expect(idAt(31)).toBe('comum');
    expect(idAt(69)).toBe('comum');
    expect(idAt(70)).toBe('inabalavel');
    expect(idAt(100)).toBe('inabalavel');
  });

  it('segue a Fé Atual, caindo para a Fé Inicial gravada sem current_faith', () => {
    expect(getFaithState({ faith: 50 }).id).toBe('comum');
    expect(getFaithState({ current_faith: 5, faith: 80 }).id).toBe('vulneravel');
    expect(getFaithState(null).id).toBe('ruptura');
  });

  it('traz o nome e o efeito do doc para a dica', () => {
    expect(getFaithState({ current_faith: 80 })).toMatchObject({
      label: 'Inabalável',
      effect: expect.stringContaining('Inspiração'),
    });
    expect(getFaithState({ current_faith: 20 })).toMatchObject({
      label: 'Abalado',
      effect: expect.stringContaining('Desvantagem'),
    });
    expect(getFaithState({ current_faith: 5 })).toMatchObject({
      label: 'Vulnerável',
      effect: expect.stringContaining('Testemunho'),
    });
    expect(getFaithState({ current_faith: 0 })).toMatchObject({
      label: 'Ruptura',
      effect: expect.stringContaining('sucumbe'),
    });
    expect(getFaithState({ current_faith: 50 }).label).toBe('Comum');
  });
});
