// CARACTERIZAÇÃO: fixa o comportamento ATUAL da CA e do equipamento, inclusive o que será mudado.
// Decisões: ROADMAP.md, Onda 2 (bloco B): teto de DES por peso de armadura e CA única.
// Termos: CONTEXT.md (Qualidade, Resistência a Condição).
import { describe, expect, it } from 'vitest';
import { getCombatStats, getSlotAcBonus } from './equipmentUtils';

// Monta um personagem com itens no inventário e nos slots indicados.
type Slots = { head?: string; body?: string; mainHand?: string; offHand?: string };
function character(
  ca: number | undefined,
  slots: Slots,
  items: Record<string, { effects?: object; name?: string; level?: number; res?: string[] }>,
) {
  return {
    stats: { ca },
    equipment: slots,
    character_items: Object.entries(items).map(([id, it]) => ({
      id,
      level: it.level,
      custom_condition_resistances: [],
      items: { name: it.name, effects: it.effects, condition_resistances: it.res ?? [] },
    })),
  };
}

describe('getCombatStats: CA total', () => {
  it('sem equipamento a CA é a base gravada na ficha', () => {
    expect(getCombatStats(character(13, {}, {})).totalAc).toBe(13);
  });

  it('base 0 ou ausente vira 10 (não 0)', () => {
    expect(getCombatStats(character(undefined, {}, {})).baseAc).toBe(10);
    expect(getCombatStats(character(0, {}, {})).baseAc).toBe(10);
  });

  it('armadura soma (CA da armadura - 10)', () => {
    const c = character(10, { body: 'a' }, { a: { effects: { armorClass: 12 } } });
    expect(getCombatStats(c).bonusAc).toBe(2);
    expect(getCombatStats(c).totalAc).toBe(12);
  });

  it('escudo soma o acBonus inteiro', () => {
    const c = character(10, { offHand: 's' }, { s: { effects: { acBonus: 2 } } });
    expect(getCombatStats(c).totalAc).toBe(12);
  });

  it('cabeça, corpo e escudo somam juntos', () => {
    const c = character(
      12,
      { head: 'h', body: 'b', offHand: 's' },
      {
        h: { effects: { armorClass: 11 } },
        b: { effects: { armorClass: 14 } },
        s: { effects: { acBonus: 2 } },
      },
    );
    expect(getCombatStats(c).totalAc).toBe(12 + 1 + 4 + 2);
  });

  it('um item na mão principal e na secundária conta uma vez só', () => {
    const c = character(10, { mainHand: 's', offHand: 's' }, { s: { effects: { acBonus: 2 } } });
    expect(getCombatStats(c).totalAc).toBe(12);
  });

  it('equipment em string JSON é interpretado', () => {
    const c = { ...character(10, {}, { a: { effects: { armorClass: 12 } } }) };
    (c as { equipment: unknown }).equipment = JSON.stringify({ body: 'a' });
    expect(getCombatStats(c).totalAc).toBe(12);
  });
});

describe('getCombatStats: Qualidade do item (nível)', () => {
  it('cada nível acima de 1 soma +1 de CA (ADR 0002)', () => {
    const level3 = character(10, { body: 'a' }, { a: { level: 3, effects: { armorClass: 12 } } });
    expect(getCombatStats(level3).bonusAc).toBe(2 + 2);
  });

  it('o nível só conta quando o item já dá CA', () => {
    const c = character(10, { body: 'a' }, { a: { level: 4, effects: { armorClass: 10 } } });
    expect(getCombatStats(c).bonusAc).toBe(0);
  });

  it('nível ausente vale 1', () => {
    const c = character(10, { body: 'a' }, { a: { effects: { armorClass: 12 } } });
    expect(getCombatStats(c).bonusAc).toBe(2);
  });
});

describe('getCombatStats: de onde vem o bônus de CA do item', () => {
  it('com vários campos usa um só, na ordem acBonus, ca, armorClass', () => {
    const all = { acBonus: 1, ca: 2, armorClass: 14 };
    expect(getCombatStats(character(10, { body: 'a' }, { a: { effects: all } })).bonusAc).toBe(1);
    expect(
      getCombatStats(character(10, { body: 'a' }, { a: { effects: { ca: 2, armorClass: 14 } } }))
        .bonusAc,
    ).toBe(2);
  });

  it('item sem efeitos usa o catálogo (ITEMS_DB) pelo nome', () => {
    const couro = character(10, { body: 'a' }, { a: { name: 'Couro Cru', effects: {} } });
    expect(getCombatStats(couro).bonusAc).toBe(1); // CA 11 no catálogo
    const escudo = character(
      10,
      { offHand: 's' },
      { s: { name: 'Escudo (Madeira/Bronze)', effects: {} } },
    );
    expect(getCombatStats(escudo).bonusAc).toBe(2);
  });

  it('item desconhecido e sem efeitos não dá CA', () => {
    const c = character(10, { body: 'a' }, { a: { name: 'Coisa Estranha', effects: {} } });
    expect(getCombatStats(c).bonusAc).toBe(0);
  });
});

describe('getCombatStats: o que NÃO existe hoje (decisões do grill ainda não aplicadas)', () => {
  it('não há teto de DES: armadura média e pesada somam a DES inteira', () => {
    // Lorica (CA 16, pesada) deveria ignorar a DES; a base 14 já embute DES +4.
    const lorica = character(14, { body: 'a' }, { a: { effects: { armorClass: 16 } } });
    expect(getCombatStats(lorica).totalAc).toBe(14 + 6);
  });

  it('a CA base é a gravada na criação: mudar DES depois não recalcula', () => {
    // O código só lê stats.ca; nada aqui recebe os atributos.
    expect(getCombatStats(character(12, {}, {})).baseAc).toBe(12);
  });
});

describe('getCombatStats: resistências e arma', () => {
  it('une as resistências do item com as personalizadas, sem repetir', () => {
    const c = character(
      10,
      { body: 'a', head: 'h' },
      {
        a: { effects: { armorClass: 12 }, res: ['sangrando', 'envenenado'] },
        h: { effects: { armorClass: 11 }, res: ['sangrando'] },
      },
    );
    c.character_items[0].custom_condition_resistances = ['Corte'] as never[];
    expect(getCombatStats(c).resistances.sort()).toEqual(['Corte', 'envenenado', 'sangrando']);
  });

  it('a arma vem da mão principal e usa o damageDie dos efeitos', () => {
    const c = character(
      10,
      { mainHand: 'w' },
      { w: { name: 'Espada Curta (Ferro)', effects: { damageDie: '1d6' } } },
    );
    expect(getCombatStats(c).weapon).toEqual({ name: 'Espada Curta (Ferro)', damageDie: '1d6' });
  });
});

describe('getSlotAcBonus: fórmula do cartão de slot', () => {
  it('soma acBonus, ca e (armorClass - 10), ao contrário de getCombatStats', () => {
    const effects = { acBonus: 1, ca: 2, armorClass: 14 };
    expect(getSlotAcBonus(effects).baseCaBonus).toBe(1 + 2 + 4);
  });

  it('BUG conhecido: o slot mostra mais CA do que o total da ficha para o mesmo item', () => {
    const effects = { acBonus: 1, ca: 2, armorClass: 14 };
    const sheet = getCombatStats(character(10, { body: 'a' }, { a: { effects } })).bonusAc;
    expect(sheet).toBe(1);
    expect(getSlotAcBonus(effects).totalCaBonus).toBe(7);
  });

  it('com um único campo as duas fórmulas concordam, inclusive com Qualidade', () => {
    const effects = { armorClass: 13 };
    const sheet = getCombatStats(
      character(10, { body: 'a' }, { a: { effects, level: 3 } }),
    ).bonusAc;
    expect(getSlotAcBonus(effects, 3).totalCaBonus).toBe(sheet);
    expect(sheet).toBe(3 + 2);
  });

  it('o bônus de nível só aparece quando há CA de base', () => {
    expect(getSlotAcBonus({}, 5)).toEqual({ baseCaBonus: 0, levelBonus: 0, totalCaBonus: 0 });
  });
});
