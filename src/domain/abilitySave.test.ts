import { describe, expect, it } from 'vitest';
import { createSeededRng } from './rng';
import {
  abilityCd,
  abilityCdAttribute,
  rollAbilitySaveDice,
  resolveAbilitySave,
  saveAttributeLabel,
  saveModifierOf,
  saveReminder,
  saveTestType,
} from './abilitySave';

describe('atributo da CD da Habilidade', () => {
  it('SAB para Sacerdote, Sábio e Caçador, FOR para Guerreiro e DES para Batedor', () => {
    expect(abilityCdAttribute('Sacerdote')).toBe('sab');
    expect(abilityCdAttribute('Sábio')).toBe('sab');
    expect(abilityCdAttribute('Caçador')).toBe('sab');
    expect(abilityCdAttribute('Guerreiro')).toBe('for');
    expect(abilityCdAttribute('Batedor')).toBe('des');
  });

  it('não liga para acento nem maiúscula', () => {
    expect(abilityCdAttribute('cacador')).toBe('sab');
    expect(abilityCdAttribute('GUERREIRO')).toBe('for');
    expect(abilityCdAttribute('sabio')).toBe('sab');
  });

  it('Vocação desconhecida ou ausente usa SAB', () => {
    expect(abilityCdAttribute('Nobre')).toBe('sab');
    expect(abilityCdAttribute(null)).toBe('sab');
    expect(abilityCdAttribute(undefined)).toBe('sab');
  });
});

describe('CD da Habilidade: 8 + Proficiência + modificador do atributo da Vocação', () => {
  it('Guerreiro nível 18 com FOR 16 (+3) e Proficiência +6 dá 17', () => {
    expect(abilityCd({ vocation: 'Guerreiro', level: 18, attributes: { for: 16 } })).toBe(17);
  });

  it('Batedor nível 14 com DES 18 (+4) e Proficiência +5 dá 17', () => {
    expect(abilityCd({ vocation: 'Batedor', level: 14, attributes: { des: 18 } })).toBe(17);
  });

  it('usa o atributo da Vocação e ignora os outros', () => {
    const attributes = { for: 20, des: 20, sab: 10 };
    expect(abilityCd({ vocation: 'Sacerdote', level: 1, attributes })).toBe(10);
  });

  it('a Proficiência cresce com o nível', () => {
    const at = (level: number) =>
      abilityCd({ vocation: 'Guerreiro', level, attributes: { for: 10 } });
    expect(at(1)).toBe(10);
    expect(at(5)).toBe(11);
    expect(at(17)).toBe(14);
  });

  it('modificador negativo reduz a CD', () => {
    expect(abilityCd({ vocation: 'Guerreiro', level: 1, attributes: { for: 8 } })).toBe(9);
  });

  it('atributo ausente vale 0 de modificador', () => {
    expect(abilityCd({ vocation: 'Guerreiro', level: 1, attributes: {} })).toBe(10);
    expect(abilityCd({ vocation: 'Guerreiro', level: 1, attributes: null })).toBe(10);
  });

  it('nível ausente conta como 1', () => {
    expect(abilityCd({ vocation: 'Guerreiro', level: undefined, attributes: { for: 14 } })).toBe(
      12,
    );
  });
});

describe('TR da Habilidade: textos', () => {
  it('o rótulo do atributo e o tipo de Teste', () => {
    expect(saveAttributeLabel('sab')).toBe('Sabedoria');
    expect(saveAttributeLabel('con')).toBe('Constituição');
    expect(saveTestType('sab')).toBe('Resistência (Sabedoria)');
  });
});

describe('modificador do alvo no TR', () => {
  it('lê o atributo da ficha', () => {
    expect(saveModifierOf({ sab: 14 }, 'sab')).toBe(2);
    expect(saveModifierOf({ con: 8 }, 'con')).toBe(-1);
  });

  it('atributo ausente, ficha sem atributos ou valor inválido valem 0', () => {
    expect(saveModifierOf({ for: 16 }, 'sab')).toBe(0);
    expect(saveModifierOf(null, 'sab')).toBe(0);
    expect(saveModifierOf(undefined, 'sab')).toBe(0);
    expect(saveModifierOf({ sab: 'x' }, 'sab')).toBe(0);
  });

  it('aceita o atributo gravado como texto', () => {
    expect(saveModifierOf({ sab: '14' }, 'sab')).toBe(2);
  });
});

describe('resultado do TR por alvo', () => {
  it('passa quando o total alcança a CD', () => {
    expect(resolveAbilitySave({ dice: [10], mark: null, modifier: 3, cd: 13 })).toEqual({
      mode: 'normal',
      natural: 10,
      total: 13,
      failed: false,
    });
  });

  it('falha quando o total fica abaixo da CD', () => {
    const result = resolveAbilitySave({ dice: [9], mark: null, modifier: 3, cd: 13 });
    expect(result).toMatchObject({ total: 12, failed: true });
  });

  it('com Vantagem vale o maior dos dois dados', () => {
    const result = resolveAbilitySave({ dice: [4, 15], mark: 'vantagem', modifier: 0, cd: 12 });
    expect(result).toEqual({ mode: 'vantagem', natural: 15, total: 15, failed: false });
  });

  it('com Desvantagem vale o menor dos dois dados', () => {
    const result = resolveAbilitySave({ dice: [4, 15], mark: 'desvantagem', modifier: 0, cd: 12 });
    expect(result).toEqual({ mode: 'desvantagem', natural: 4, total: 4, failed: true });
  });

  it('sem marca do Mestre vale o primeiro dado, mesmo que sobrem outros', () => {
    expect(resolveAbilitySave({ dice: [7, 19], mark: null, modifier: 0, cd: 10 }).natural).toBe(7);
  });

  it('o 20 natural não passa sozinho e o 1 não falha sozinho (é Teste comum)', () => {
    expect(resolveAbilitySave({ dice: [20], mark: null, modifier: -5, cd: 18 }).failed).toBe(true);
    expect(resolveAbilitySave({ dice: [1], mark: null, modifier: 20, cd: 18 }).failed).toBe(false);
  });
});

describe('Rolagem Virtual do TR', () => {
  it('um d20 sem marca e dois com Vantagem ou Desvantagem', () => {
    const rng = createSeededRng(7);
    expect(rollAbilitySaveDice(null, rng)).toHaveLength(1);
    expect(rollAbilitySaveDice('vantagem', rng)).toHaveLength(2);
    expect(rollAbilitySaveDice('desvantagem', rng)).toHaveLength(2);
  });

  it('só rola de 1 a 20', () => {
    const rng = createSeededRng(3);
    for (let i = 0; i < 50; i++) {
      const [die] = rollAbilitySaveDice(null, rng);
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(20);
    }
  });
});

describe('lembrete do dado físico', () => {
  it('só aparece com Vantagem ou Desvantagem', () => {
    expect(saveReminder(null)).toBeNull();
    expect(saveReminder('vantagem')).toBe('Role dois d20 e use o maior.');
    expect(saveReminder('desvantagem')).toBe('Role dois d20 e use o menor.');
  });
});
