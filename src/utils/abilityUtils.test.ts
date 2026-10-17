// CARACTERIZAÇÃO: fixa o comportamento ATUAL de filtro e recarga de habilidades.
// Decisões: ROADMAP.md, Onda 2 (bloco B): "Sábio" é alias de Sacerdote.
// Termos: CONTEXT.md (Tribo, Vocação, Caminho, Descanso Curto/Longo).
import { describe, expect, it } from 'vitest';
import { ABILITIES, type AbilityDefinition } from '../data/abilities';
import {
  calculateRechargedAbilities,
  getAbilitiesForCharacter,
  resetCombatAbilities,
} from './abilityUtils';

const ids = (list: AbilityDefinition[]) => list.map((a) => a.id);
const idOfUsage = (usage: AbilityDefinition['usageType']) => {
  const found = ABILITIES.find((a) => a.usageType === usage);
  if (!found) throw new Error(`nenhuma habilidade com usageType ${usage}`);
  return found.id;
};

describe('getAbilitiesForCharacter: filtro por nível e origem', () => {
  it('no nível 1 só aparecem as passivas de Tribo sem Caminho', () => {
    const list = getAbilitiesForCharacter('Aser', 'Guerreiro', 1);
    expect(list.length).toBe(2);
    expect(list.every((a) => a.sourceType === 'tribe' && a.minLevel === 1 && !a.path)).toBe(true);
  });

  it('não mostra habilidades de nível acima do personagem', () => {
    expect(
      getAbilitiesForCharacter('Aser', 'Guerreiro', 20, { tribe: 'A' }).every(
        (a) => a.minLevel <= 20,
      ),
    ).toBe(true);
    expect(getAbilitiesForCharacter('Aser', 'Guerreiro', 3).every((a) => a.minLevel <= 3)).toBe(
      true,
    );
  });

  it('ignora maiúsculas e acentos no nome da Tribo e da Vocação', () => {
    expect(getAbilitiesForCharacter('MANASSÉS', 'Caçador', 1).length).toBeGreaterThan(0);
    expect(ids(getAbilitiesForCharacter('Dã', 'Caçador', 1))).toEqual(
      ids(getAbilitiesForCharacter('da', 'cacador', 1)),
    );
  });

  it('Tribo desconhecida não tem habilidades de Tribo', () => {
    const list = getAbilitiesForCharacter('Atlântida', 'Guerreiro', 20, {
      tribe: 'A',
      vocation: 'A',
    });
    expect(list.some((a) => a.sourceType === 'tribe')).toBe(false);
  });

  it('GAP conhecido: a Vocação "Sábio" não tem nenhuma habilidade (decisão: alias de Sacerdote)', () => {
    const sabio = getAbilitiesForCharacter('Levi', 'Sábio', 20, { tribe: 'A', vocation: 'A' });
    expect(sabio.some((a) => a.sourceType === 'vocation')).toBe(false);
    const sacerdote = getAbilitiesForCharacter('Levi', 'Sacerdote', 20, {
      tribe: 'A',
      vocation: 'A',
    });
    expect(sacerdote.some((a) => a.sourceType === 'vocation')).toBe(true);
  });
});

describe('getAbilitiesForCharacter: Caminho A/B', () => {
  const pathAbilities = ABILITIES.filter(
    (a) => a.sourceType === 'tribe' && a.sourceId === 'aser' && a.minLevel === 4 && a.path,
  );
  const pathA = pathAbilities.find((a) => a.path === 'A')!;
  const pathB = pathAbilities.find((a) => a.path === 'B')!;

  it('habilidades de Caminho ficam ESCONDIDAS até o Caminho ser escolhido', () => {
    const list = ids(getAbilitiesForCharacter('Aser', 'Guerreiro', 4));
    expect(list).not.toContain(pathA.id);
    expect(list).not.toContain(pathB.id);
  });

  it('um Caminho em texto ("A") vale para todos os níveis', () => {
    const list = ids(getAbilitiesForCharacter('Aser', 'Guerreiro', 4, { tribe: 'A' }));
    expect(list).toContain(pathA.id);
    expect(list).not.toContain(pathB.id);
  });

  it('um Caminho por nível ({4: "B"}) vale só para aquele nível', () => {
    const list = ids(getAbilitiesForCharacter('Aser', 'Guerreiro', 4, { tribe: { 4: 'B' } }));
    expect(list).toContain(pathB.id);
    expect(list).not.toContain(pathA.id);
  });

  it('um mapa sem o nível da habilidade equivale a não ter escolhido', () => {
    const list = ids(getAbilitiesForCharacter('Aser', 'Guerreiro', 4, { tribe: { 8: 'A' } }));
    expect(list).not.toContain(pathA.id);
    expect(list).not.toContain(pathB.id);
  });

  it('o Caminho da Tribo não vale para a Vocação (e vice-versa)', () => {
    const onlyVocationChoice = ids(
      getAbilitiesForCharacter('Aser', 'Guerreiro', 4, { vocation: 'A' }),
    );
    expect(onlyVocationChoice).not.toContain(pathA.id);
  });
});

describe('calculateRechargedAbilities: o que cada descanso recarrega', () => {
  const uses = {
    [idOfUsage('short_rest')]: 1,
    [idOfUsage('long_rest')]: 1,
    [idOfUsage('combat')]: 1,
    [idOfUsage('week')]: 1,
    [idOfUsage('campaign')]: 1,
    [idOfUsage('unlimited')]: 1,
    'habilidade-que-nao-existe': 2,
  };

  it('Descanso Curto recarrega só short_rest e combat', () => {
    const result = calculateRechargedAbilities(uses, 'short_rest');
    expect(Object.keys(result).sort()).toEqual(
      [
        idOfUsage('long_rest'),
        idOfUsage('week'),
        idOfUsage('campaign'),
        idOfUsage('unlimited'),
        'habilidade-que-nao-existe',
      ].sort(),
    );
  });

  it('Descanso Longo recarrega short_rest, long_rest e combat; week e campaign não', () => {
    const result = calculateRechargedAbilities(uses, 'long_rest');
    expect(Object.keys(result).sort()).toEqual(
      [
        idOfUsage('week'),
        idOfUsage('campaign'),
        idOfUsage('unlimited'),
        'habilidade-que-nao-existe',
      ].sort(),
    );
  });

  it('recarregar apaga o contador (volta a "sem usos"), não zera', () => {
    const id = idOfUsage('short_rest');
    expect(calculateRechargedAbilities({ [id]: 3 }, 'short_rest')).toEqual({});
  });

  it('não altera o objeto recebido', () => {
    const copy = { ...uses };
    calculateRechargedAbilities(uses, 'long_rest');
    expect(uses).toEqual(copy);
  });
});

describe('resetCombatAbilities', () => {
  it('apaga só as habilidades de combate', () => {
    const combat = idOfUsage('combat');
    const shortRest = idOfUsage('short_rest');
    expect(resetCombatAbilities({ [combat]: 1, [shortRest]: 1 })).toEqual({ [shortRest]: 1 });
  });
});
