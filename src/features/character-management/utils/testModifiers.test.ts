// CARACTERIZAÇÃO: fixa o comportamento ATUAL dos modificadores de Teste e do detalhamento da rolagem.
// Decisões: ROADMAP.md, Onda 2: "Sábio" é alias de Sacerdote; rolagens entram digitadas (ADR 0001).
// Termos: CONTEXT.md (Teste, TR, Vocação).
import { describe, expect, it } from 'vitest';
import { SKILLS_LIST, getTestBreakdown, getTestModifiers } from './characterMath';

const attrs = { for: 10, des: 16, con: 12, int: 8, sab: 14, car: 10 };
const char = (over: Record<string, unknown> = {}) => ({
  attributes: attrs,
  vocation: 'Batedor',
  level: 1,
  proficiencies: { skill_proficiencies: [] as string[] },
  ...over,
});

describe('getTestModifiers: testes de atributo', () => {
  it('sem ficha, tudo zero', () => {
    expect(getTestModifiers('Força', null)).toEqual({ attrMod: 0, profBonus: 0 });
  });

  it('usa o modificador do atributo e nunca soma proficiência', () => {
    expect(getTestModifiers('Destreza', char())).toEqual({ attrMod: 3, profBonus: 0 });
    expect(getTestModifiers('Inteligência', char())).toEqual({ attrMod: -1, profBonus: 0 });
  });

  it('aceita os apelidos Vigor (CON) e Vontade (SAB)', () => {
    expect(getTestModifiers('Vigor', char()).attrMod).toBe(1);
    expect(getTestModifiers('Vontade', char()).attrMod).toBe(2);
  });

  it('atributo ausente na ficha vale modificador 0', () => {
    expect(getTestModifiers('Força', char({ attributes: {} })).attrMod).toBe(0);
  });

  it('tipos de teste desconhecidos (inclusive Fé) não têm modificador', () => {
    expect(getTestModifiers('Fé', char())).toEqual({ attrMod: 0, profBonus: 0 });
    expect(getTestModifiers('Sorte', char())).toEqual({ attrMod: 0, profBonus: 0 });
  });
});

describe('getTestModifiers: TR (teste de resistência)', () => {
  it('soma proficiência quando a Vocação tem aquele TR (Batedor: DES e INT)', () => {
    expect(getTestModifiers('Resistência (Destreza)', char())).toEqual({
      attrMod: 3,
      profBonus: 2,
    });
  });

  it('não soma proficiência nos outros TR', () => {
    expect(getTestModifiers('Resistência (Força)', char())).toEqual({ attrMod: 0, profBonus: 0 });
  });

  it('a proficiência cresce com o nível (+3 no nível 5)', () => {
    expect(getTestModifiers('Resistência (Destreza)', char({ level: 5 })).profBonus).toBe(3);
  });

  it('nível ausente vale 1', () => {
    expect(getTestModifiers('Resistência (Destreza)', char({ level: undefined })).profBonus).toBe(
      2,
    );
  });

  it('GAP conhecido: Vocação "Sábio" não tem proficiência em nenhum TR', () => {
    // Sacerdote tem SAB e CAR; o nome "Sábio" não casa com nenhuma regra de Vocação.
    expect(
      getTestModifiers('Resistência (Sabedoria)', char({ vocation: 'Sacerdote' })).profBonus,
    ).toBe(2);
    expect(getTestModifiers('Resistência (Sabedoria)', char({ vocation: 'Sábio' })).profBonus).toBe(
      0,
    );
  });
});

describe('getTestModifiers: perícias', () => {
  it('usa o atributo da perícia e soma proficiência só se o personagem for proficiente', () => {
    const proficient = char({ proficiencies: { skill_proficiencies: ['furtividade'] } });
    expect(getTestModifiers('Furtividade', proficient)).toEqual({ attrMod: 3, profBonus: 2 });
    expect(getTestModifiers('Furtividade', char())).toEqual({ attrMod: 3, profBonus: 0 });
  });

  it('cada perícia usa o atributo definido na lista', () => {
    for (const skill of SKILLS_LIST) {
      const only = { ...attrs, [skill.attribute]: 18 };
      expect(getTestModifiers(skill.name, char({ attributes: only })).attrMod).toBe(4);
    }
  });

  it('ficha sem a lista de proficiências não quebra', () => {
    expect(getTestModifiers('Furtividade', char({ proficiencies: undefined })).profBonus).toBe(0);
  });
});

describe('getTestBreakdown', () => {
  it('sem resultado, texto vazio', () => {
    expect(getTestBreakdown('Força', null, char())).toBe('');
  });

  it('Fé mostra só o d100', () => {
    expect(getTestBreakdown('Fé', 45, char())).toBe('1d100 (45)');
  });

  it('sem modificadores mostra só o d20', () => {
    expect(getTestBreakdown('Sorte', 12, char())).toBe('1d20 (12)');
  });

  it('com modificador e proficiência separa o d20 dos bônus', () => {
    const proficient = char({ proficiencies: { skill_proficiencies: ['furtividade'] } });
    expect(getTestBreakdown('Furtividade', 17, proficient)).toBe(
      '1d20 (12) + Mod (3) + Prof (2) = 17',
    );
  });

  it('modificador negativo aparece com sinal', () => {
    expect(getTestBreakdown('Inteligência', 9, char())).toBe('1d20 (10) + Mod (-1) = 9');
  });

  it('sem o dado gravado (testes antigos), reconstrói o d20 com os modificadores de AGORA', () => {
    // O jogador rolou 13 com DES 14 (+2) e o app guardou 15. Depois a DES subiu para 16 (+3).
    // Sem o dado gravado, o detalhamento mostra d20 12, um dado que nunca foi rolado.
    const sheetNow = char();
    expect(getTestBreakdown('Destreza', 15, sheetNow)).toBe('1d20 (12) + Mod (3) = 15');
  });

  describe('com o dado gravado (rollValue)', () => {
    it('mostra o dado que saiu, mesmo que a ficha tenha mudado depois', () => {
      // Rolou 13, total 15 (bônus +2 na época). A DES de agora dá +3, mas o dado é 13.
      const text = getTestBreakdown('Destreza', 15, char(), 13);
      expect(text).toContain('1d20 (13)');
      expect(text).not.toContain('1d20 (12)');
    });

    it('os bônus mostrados somam o que foi gravado', () => {
      // Bônus gravado +2; a ficha de agora diria +3: mostra o bônus real em bloco.
      expect(getTestBreakdown('Destreza', 15, char(), 13)).toBe('1d20 (13) + Bônus (2) = 15');
    });

    it('com a ficha igual à da rolagem, detalha modificador e proficiência', () => {
      const proficient = char({ proficiencies: { skill_proficiencies: ['furtividade'] } });
      expect(getTestBreakdown('Furtividade', 17, proficient, 12)).toBe(
        '1d20 (12) + Mod (3) + Prof (2) = 17',
      );
    });

    it('sem bônus mostra só o dado', () => {
      expect(getTestBreakdown('Sorte', 12, char(), 12)).toBe('1d20 (12)');
    });

    it('rollValue nulo cai para a reconstrução', () => {
      expect(getTestBreakdown('Destreza', 15, char(), null)).toBe('1d20 (12) + Mod (3) = 15');
    });

    it('Fé continua mostrando o d100', () => {
      expect(getTestBreakdown('Fé', 45, char(), 45)).toBe('1d100 (45)');
    });
  });
});
