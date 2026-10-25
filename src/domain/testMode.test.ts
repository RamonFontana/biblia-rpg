// Vantagem e Desvantagem nos Testes: a modalidade (marca do Mestre, Desvantagens automáticas,
// Inspiração, anulação), o dado que vale (invertido no Teste de Fé, que passa com o menor), a
// Rolagem Virtual de dois dados e o lembrete do dado físico. Termos: CONTEXT.md (Vantagem,
// Desvantagem, Estado de Fé, Inspiração, Fortaleza). Regras: docs/regras-base.md, 4.2.
import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/domain/rng';
import {
  pickCountingDie,
  physicalDieReminder,
  resolveTestMode,
  rollTestDice,
  type TestModeInput,
} from '@/domain/testMode';

const base: TestModeInput = {
  testType: 'Força',
  masterMark: null,
  hasStealthDisadvantage: false,
  faithState: 'comum',
  inspirationUsed: false,
};
const mode = (over: Partial<TestModeInput>) => resolveTestMode({ ...base, ...over });

describe('resolveTestMode: de onde vem a modalidade', () => {
  it('sem nada, o Teste é normal', () => {
    expect(mode({})).toEqual({ mode: 'normal', advantages: [], disadvantages: [] });
  });

  it('a marca do Mestre dá Vantagem ou Desvantagem', () => {
    expect(mode({ masterMark: 'vantagem' })).toMatchObject({
      mode: 'vantagem',
      advantages: ['Mestre'],
    });
    expect(mode({ masterMark: 'desvantagem' })).toMatchObject({
      mode: 'desvantagem',
      disadvantages: ['Mestre'],
    });
  });

  it('a Inspiração usada dá Vantagem', () => {
    expect(mode({ inspirationUsed: true })).toMatchObject({
      mode: 'vantagem',
      advantages: ['Inspiração'],
    });
  });

  it('a armadura que atrapalha a furtividade dá Desvantagem só no Teste de Destreza', () => {
    expect(mode({ hasStealthDisadvantage: true, testType: 'Destreza' })).toMatchObject({
      mode: 'desvantagem',
      disadvantages: ['Armadura pesada (furtividade)'],
    });
    expect(mode({ hasStealthDisadvantage: true, testType: 'Força' }).mode).toBe('normal');
    expect(mode({ hasStealthDisadvantage: true, testType: 'Fé' }).mode).toBe('normal');
  });

  it('o Abalado dá Desvantagem só nos TRs de Sabedoria e Carisma', () => {
    for (const testType of ['Resistência (Sabedoria)', 'Resistência (Carisma)']) {
      expect(mode({ faithState: 'abalado', testType })).toMatchObject({
        mode: 'desvantagem',
        disadvantages: ['Abalado (Fé)'],
      });
    }
    for (const testType of ['Sabedoria', 'Resistência (Força)', 'Fé', 'Furtividade']) {
      expect(mode({ faithState: 'abalado', testType }).mode).toBe('normal');
    }
  });

  it('os outros Estados de Fé não dão Desvantagem no TR', () => {
    for (const faithState of ['inabalavel', 'comum', 'vulneravel', 'ruptura'] as const) {
      expect(mode({ faithState, testType: 'Resistência (Sabedoria)' }).mode).toBe('normal');
    }
  });
});

describe('resolveTestMode: anulação', () => {
  it('Vantagem e Desvantagem no mesmo Teste se anulam', () => {
    const result = mode({
      masterMark: 'vantagem',
      hasStealthDisadvantage: true,
      testType: 'Destreza',
    });
    expect(result.mode).toBe('normal');
    expect(result.advantages).toEqual(['Mestre']);
    expect(result.disadvantages).toEqual(['Armadura pesada (furtividade)']);
  });

  it('a Inspiração anula uma Desvantagem', () => {
    expect(
      mode({ inspirationUsed: true, faithState: 'abalado', testType: 'Resistência (Carisma)' })
        .mode,
    ).toBe('normal');
  });

  it('várias Desvantagens não empilham: continua uma Desvantagem só', () => {
    expect(
      mode({
        masterMark: 'desvantagem',
        faithState: 'abalado',
        testType: 'Resistência (Sabedoria)',
      }),
    ).toMatchObject({
      mode: 'desvantagem',
      disadvantages: ['Mestre', 'Abalado (Fé)'],
    });
  });

  it('várias Vantagens também não empilham', () => {
    expect(mode({ masterMark: 'vantagem', inspirationUsed: true }).mode).toBe('vantagem');
  });
});

describe('pickCountingDie: o dado que vale', () => {
  it('normal: o único dado', () => {
    expect(pickCountingDie('normal', 'Força', [14])).toBe(14);
  });

  it('no d20, a Vantagem fica com o maior e a Desvantagem com o menor', () => {
    expect(pickCountingDie('vantagem', 'Força', [14, 7])).toBe(14);
    expect(pickCountingDie('desvantagem', 'Força', [14, 7])).toBe(7);
  });

  it('no Teste de Fé o sentido inverte: a Vantagem fica com o menor e a Desvantagem com o maior', () => {
    expect(pickCountingDie('vantagem', 'Fé', [64, 31])).toBe(31);
    expect(pickCountingDie('desvantagem', 'Fé', [64, 31])).toBe(64);
  });

  it('dados iguais valem o mesmo', () => {
    expect(pickCountingDie('vantagem', 'Fé', [40, 40])).toBe(40);
  });
});

describe('rollTestDice: a Rolagem Virtual', () => {
  it('normal rola um dado só', () => {
    expect(rollTestDice('Força', 'normal', createSeededRng(1))).toHaveLength(1);
  });

  it('com Vantagem ou Desvantagem rola dois dados', () => {
    expect(rollTestDice('Força', 'vantagem', createSeededRng(1))).toHaveLength(2);
    expect(rollTestDice('Fé', 'desvantagem', createSeededRng(1))).toHaveLength(2);
  });

  it('d20 nos Testes comuns e d100 no Teste de Fé', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const die of rollTestDice('Força', 'vantagem', createSeededRng(seed))) {
        expect(die).toBeGreaterThanOrEqual(1);
        expect(die).toBeLessThanOrEqual(20);
      }
    }
    const faith = Array.from({ length: 40 }, (_, i) =>
      rollTestDice('Fé', 'vantagem', createSeededRng(i + 1)),
    ).flat();
    expect(Math.max(...faith)).toBeGreaterThan(20);
    expect(Math.max(...faith)).toBeLessThanOrEqual(100);
  });

  it('usa só a Rng injetada (mesma semente, mesmos dados)', () => {
    expect(rollTestDice('Fé', 'vantagem', createSeededRng(7))).toEqual(
      rollTestDice('Fé', 'vantagem', createSeededRng(7)),
    );
  });
});

describe('physicalDieReminder: o lembrete do dado físico', () => {
  it('normal não tem lembrete', () => {
    expect(physicalDieReminder('Força', 'normal')).toBeNull();
    expect(physicalDieReminder('Fé', 'normal')).toBeNull();
  });

  it('d20: Vantagem usa o maior, Desvantagem o menor', () => {
    expect(physicalDieReminder('Força', 'vantagem')).toBe('Role dois d20 e use o maior.');
    expect(physicalDieReminder('Força', 'desvantagem')).toBe('Role dois d20 e use o menor.');
  });

  it('Teste de Fé: Vantagem usa o menor d100, Desvantagem o maior', () => {
    expect(physicalDieReminder('Fé', 'vantagem')).toBe('Role dois d100 e use o menor.');
    expect(physicalDieReminder('Fé', 'desvantagem')).toBe('Role dois d100 e use o maior.');
  });
});
