// CA de quem tem ficha, calculada pelo motor (src/domain/armorClass) a partir dos atributos e do que
// está equipado. Inimigos e NPCs simples seguem com a CA que o Mestre digitou (stats.ca).
// Decisões: ROADMAP.md, Onda 3 (passo 5). Termos: CONTEXT.md (CA, Elmo, Qualidade).
import { describe, expect, it } from 'vitest';
import type { Character } from '@/features/character-management/types';
import {
  checkWeaponProficiency,
  equipItem,
  getCombatStats,
  getEquippedSlots,
  unequipSlot,
} from './equipmentUtils';

// Monta um personagem com ficha: DES nos atributos, itens no inventário e nos slots indicados.
type Slots = { head?: string; body?: string; mainHand?: string; offHand?: string };
type ItemSpec = { slug?: string; effects?: object; name?: string; level?: number; res?: string[] };
function character(des: number, slots: Slots, items: Record<string, ItemSpec>, statsCa?: number) {
  return {
    attributes: { for: 10, des, con: 10, int: 10, sab: 10, car: 10 },
    stats: { ca: statsCa },
    equipment: slots,
    character_items: Object.entries(items).map(([id, it]) => ({
      id,
      level: it.level,
      custom_condition_resistances: [],
      items: {
        slug: it.slug,
        name: it.name ?? '',
        effects: it.effects,
        condition_resistances: it.res ?? [],
      },
    })),
  };
}

describe('getCombatStats: CA de quem tem ficha vem dos atributos', () => {
  it('sem equipamento é 10 + modificador de DES', () => {
    const c = character(14, {}, {}); // DES 14 => +2
    expect(getCombatStats(c)).toMatchObject({ totalAc: 12, baseAc: 12, bonusAc: 0 });
  });

  it('mudar a DES muda a CA: o stats.ca gravado na criação não é lido', () => {
    expect(getCombatStats(character(18, {}, {}, 10)).totalAc).toBe(14);
    expect(getCombatStats(character(8, {}, {}, 99)).totalAc).toBe(9);
  });

  it('atributo ausente ou inválido vale 10 (modificador 0)', () => {
    const c = character(10, {}, {});
    (c as { attributes: unknown }).attributes = { strength: 14, dexterity: 18 };
    expect(getCombatStats(c).totalAc).toBe(10);
  });

  it('DES gravada como texto também conta', () => {
    const c = character(10, {}, {});
    (c.attributes as { des: unknown }).des = '16';
    expect(getCombatStats(c).totalAc).toBe(13);
  });
});

describe('getCombatStats: inimigos e NPCs simples usam a CA digitada', () => {
  it('inimigo usa stats.ca, mesmo com atributos', () => {
    const enemy = { ...character(18, {}, {}), is_enemy: true, stats: { ca: 15 } };
    expect(getCombatStats(enemy)).toMatchObject({ totalAc: 15, baseAc: 15 });
  });

  it('NPC simples (sem atributos) usa stats.ca', () => {
    expect(getCombatStats({ stats: { ca: 13 } }).totalAc).toBe(13);
  });

  it('CA digitada 0 ou ausente vira 10 (não 0)', () => {
    expect(getCombatStats({ stats: {} }).baseAc).toBe(10);
    expect(getCombatStats({ stats: { ca: 0 } }).baseAc).toBe(10);
    expect(getCombatStats({}).baseAc).toBe(10);
  });
});

describe('getCombatStats: armadura, escudo e elmo', () => {
  it('armadura leve soma a DES inteira', () => {
    const c = character(14, { body: 'a' }, { a: { slug: 'couro_cru' } });
    expect(getCombatStats(c)).toMatchObject({ totalAc: 13, baseAc: 12, bonusAc: 1 });
  });

  it('armadura média tem teto de +2 na DES e a pesada ignora a DES', () => {
    const media = character(18, { body: 'a' }, { a: { slug: 'cota_escamas' } }); // DES +4
    expect(getCombatStats(media).totalAc).toBe(16);
    const pesada = character(18, { body: 'a' }, { a: { slug: 'lorica' } });
    expect(getCombatStats(pesada).totalAc).toBe(16);
  });

  it('escudo na mão secundária soma +2', () => {
    const c = character(10, { offHand: 's' }, { s: { slug: 'escudo' } });
    expect(getCombatStats(c).totalAc).toBe(12);
  });

  it('arma de duas mãos nas duas mãos não dá CA', () => {
    const c = character(10, { mainHand: 'w', offHand: 'w' }, { w: { slug: 'espada_grande' } });
    expect(getCombatStats(c).totalAc).toBe(10);
  });

  it('elmo não dá CA, mas a Resistência a Condição dele continua listada', () => {
    const c = character(
      10,
      { head: 'h' },
      { h: { slug: 'elmo_bronze', res: ['atordoado', 'cego'] } },
    );
    expect(getCombatStats(c)).toMatchObject({ totalAc: 10, resistances: ['atordoado', 'cego'] });
  });

  it('elmo que caiu no slot do corpo (dado antigo) também não dá CA', () => {
    const c = character(10, { body: 'h' }, { h: { slug: 'chapeu_couro' } });
    expect(getCombatStats(c).totalAc).toBe(10);
  });

  it('corpo, cabeça e escudo juntos: só corpo e escudo entram', () => {
    const c = character(
      12,
      { head: 'h', body: 'b', offHand: 's' },
      { h: { slug: 'elmo_bronze' }, b: { slug: 'couro_batido' }, s: { slug: 'escudo' } },
    ); // DES +1: 12 + 1 + 2
    expect(getCombatStats(c).totalAc).toBe(15);
  });

  it('equipment em string JSON é interpretado', () => {
    const c = character(10, {}, { a: { slug: 'couro_cru' } });
    (c as { equipment: unknown }).equipment = JSON.stringify({ body: 'a' });
    expect(getCombatStats(c).totalAc).toBe(11);
  });
});

describe('getCombatStats: Qualidade do item (nível)', () => {
  it('cada nível acima de 1 soma +1 de CA na armadura e no escudo (ADR 0002)', () => {
    const armadura = character(10, { body: 'a' }, { a: { slug: 'couro_cru', level: 3 } });
    expect(getCombatStats(armadura).totalAc).toBe(13);
    const escudo = character(10, { offHand: 's' }, { s: { slug: 'escudo', level: 4 } });
    expect(getCombatStats(escudo).totalAc).toBe(15);
  });

  it('nível ausente vale 1', () => {
    const c = character(10, { body: 'a' }, { a: { slug: 'couro_cru' } });
    expect(getCombatStats(c).totalAc).toBe(11);
  });
});

describe('getCombatStats: a CA vem do catálogo, não dos efeitos gravados no item', () => {
  it('efeitos de CA gravados em items.effects são ignorados', () => {
    const c = character(
      10,
      { body: 'a' },
      { a: { slug: 'couro_cru', effects: { armorClass: 20, acBonus: 5, ca: 9 } } },
    );
    expect(getCombatStats(c).totalAc).toBe(11);
  });

  it('item sem slug no catálogo não dá CA', () => {
    const c = character(
      10,
      { body: 'a' },
      { a: { slug: 'coisa_estranha', effects: { armorClass: 15 } } },
    );
    expect(getCombatStats(c).totalAc).toBe(10);
  });
});

describe('getCombatStats: resistências', () => {
  it('lista as Condições do catálogo pelo slug e as personalizadas, sem repetir', () => {
    const c = character(
      10,
      { body: 'a', head: 'h' },
      {
        a: { slug: 'peitoral_bronze' }, // sangrando, envenenado
        h: { slug: 'elmo_bronze' }, // atordoado, cego
      },
    );
    c.character_items[0].custom_condition_resistances = ['Corte', 'sangrando'] as never[];
    expect(getCombatStats(c).resistances.sort()).toEqual(
      ['Corte', 'atordoado', 'cego', 'envenenado', 'sangrando'].sort(),
    );
  });

  it('o catálogo manda: a coluna condition_resistances do item não conta', () => {
    const c = character(10, { body: 'a' }, { a: { slug: 'couro_cru', res: ['cego'] } });
    expect(getCombatStats(c).resistances).toEqual([]);
  });

  it('dá o nível de resistência por Condição: tabela + Qualidade - 1, o maior entre os itens', () => {
    const c = character(
      10,
      { body: 'b', head: 'h', offHand: 's' },
      {
        b: { slug: 'lorica' }, // Nv4 vs sangrando, atordoado
        h: { slug: 'elmo_bronze' }, // Nv3 vs atordoado, cego
        s: { slug: 'escudo', level: 2 }, // Nv2 + 1 = 3 vs impedido
      },
    );
    expect(getCombatStats(c).conditionResistanceLevels).toEqual({
      sangrando: 4,
      atordoado: 4,
      cego: 3,
      impedido: 3,
    });
  });

  it('sem itens com resistência equipados o mapa é vazio, e inimigos também não têm', () => {
    expect(getCombatStats(character(10, {}, {})).conditionResistanceLevels).toEqual({});
    expect(getCombatStats({ stats: { ca: 12 }, is_enemy: true }).conditionResistanceLevels).toEqual(
      {},
    );
  });
});

describe('getCombatStats: arma', () => {
  it('a arma vem da mão principal e usa o damageDie dos efeitos', () => {
    const c = character(
      10,
      { mainHand: 'w' },
      { w: { slug: 'espada_curta', name: 'Espada Curta (Ferro)', effects: { damageDie: '1d6' } } },
    );
    expect(getCombatStats(c).weapon).toEqual({ name: 'Espada Curta (Ferro)', damageDie: '1d6' });
  });
});

describe('getCombatStats: entradas incompletas', () => {
  it('sem ficha, a CA é a de quem está sem armadura', () => {
    expect(getCombatStats(null)).toMatchObject({ totalAc: 10, baseAc: 10, bonusAc: 0 });
    expect(getCombatStats(undefined)).toMatchObject({ totalAc: 10, baseAc: 10, bonusAc: 0 });
  });

  it('equipment em texto que não é JSON vale equipamento vazio', () => {
    const c = { ...character(14, {}, {}), equipment: 'isto não é json' };
    expect(getCombatStats(c)).toMatchObject({ totalAc: 12, resistances: [], weapon: undefined });
  });

  it('equipment em texto "null" também vale equipamento vazio', () => {
    expect(getCombatStats({ ...character(14, {}, {}), equipment: 'null' }).totalAc).toBe(12);
  });

  it('o item do catálogo aninhado como lista usa o primeiro', () => {
    const c = character(10, { mainHand: 'w' }, {});
    c.character_items = [
      {
        id: 'w',
        level: 1,
        custom_condition_resistances: [],
        items: [{ name: 'Maça', effects: { damageDie: '1d6' } }],
      } as never,
    ];
    expect(getCombatStats(c).weapon).toEqual({ name: 'Maça', damageDie: '1d6' });
  });

  it('o item é achado pelo id da linha ou pelo id do item', () => {
    const c = character(10, { body: 'item-couro' }, {});
    const withItems = {
      ...c,
      character_items: [
        {
          id: 'ci-1',
          item_id: 'item-couro',
          level: 1,
          custom_condition_resistances: [],
          items: { name: 'Couro Cru', slug: 'couro_cru' },
        },
      ],
    };
    expect(getCombatStats(withItems).bonusAc).toBeGreaterThan(0);
  });

  it('a CA digitada que não é número vira 10', () => {
    const enemy = { is_enemy: true, stats: { ca: 'alta' }, character_items: [] };
    expect(getCombatStats(enemy).totalAc).toBe(10);
  });
});

describe('checkWeaponProficiency', () => {
  const martial = { effects: { weaponCategory: 'Marcial' } };

  it('sem arma não há proficiência', () => {
    expect(checkWeaponProficiency(null, 'Guerreiro')).toBe(false);
    expect(checkWeaponProficiency(undefined, 'Guerreiro')).toBe(false);
  });

  it('arma que não é marcial vale para qualquer Vocação', () => {
    expect(checkWeaponProficiency({ effects: { weaponCategory: 'Simples' } }, 'Sacerdote')).toBe(
      true,
    );
    expect(checkWeaponProficiency({}, 'Sacerdote')).toBe(true);
  });

  it('arma marcial vale para Guerreiro, Batedor e Caçador', () => {
    for (const vocation of ['Guerreiro', 'Batedor', 'Caçador']) {
      expect(checkWeaponProficiency(martial, vocation)).toBe(true);
    }
  });

  it.each(['Sacerdote', 'SACERDOTE', 'Sábio', 'sabio', 'Levita'])(
    'arma marcial não vale para %s',
    (vocation) => {
      expect(checkWeaponProficiency(martial, vocation)).toBe(false);
    },
  );

  it('a categoria marcial também vem do tipo da arma', () => {
    expect(checkWeaponProficiency({ type: 'Arma Marcial' }, 'Sacerdote')).toBe(false);
    expect(checkWeaponProficiency({ type: 'Arma Marcial' }, 'Guerreiro')).toBe(true);
  });

  it('sem Vocação, a arma marcial vale', () => {
    expect(checkWeaponProficiency(martial, '')).toBe(true);
  });
});

describe('getEquippedSlots', () => {
  it('sem equipamento gravado, todas as posições vazias', () => {
    const empty = { head: null, body: null, mainHand: null, offHand: null };
    expect(getEquippedSlots(undefined)).toEqual(empty);
    expect(getEquippedSlots(null)).toEqual(empty);
  });

  it('com as posições gravadas, devolve as próprias', () => {
    const slots = { head: 'a', body: null, mainHand: 'b', offHand: 'b' };
    expect(getEquippedSlots(slots)).toBe(slots);
  });

  // Decisão do autor (ROADMAP, passo 9c, Q12): uma lista é a lista de compras de uma ficha antiga e
  // não é equipamento vestido. Sem migração de dados, o leitor trata a lista como nada vestido.
  it('uma lista de compras (ficha antiga) vale como nada vestido', () => {
    const cart = [{ id: 'adaga', name: 'Adaga', type: 'arma' }];
    expect(getEquippedSlots(cart)).toEqual({
      head: null,
      body: null,
      mainHand: null,
      offHand: null,
    });
  });

  it('uma lista vazia também vale como nada vestido', () => {
    expect(getEquippedSlots([])).toEqual({ head: null, body: null, mainHand: null, offHand: null });
  });
});

describe('equipItem e unequipSlot sobre a ficha antiga (lista de compras)', () => {
  const cart = [{ id: 'adaga', name: 'Adaga', type: 'arma' }] as unknown as Character['equipment'];

  it('o primeiro item equipado grava só as quatro posições, sem as chaves da lista', () => {
    expect(equipItem('ci-1', { slot: 'head' }, getEquippedSlots(cart))).toEqual({
      head: 'ci-1',
      body: null,
      mainHand: null,
      offHand: null,
    });
  });

  it('equipar um escudo não tira a mão principal nem conta como arma de duas mãos', () => {
    const result = equipItem('ci-2', { slot: 'shield' }, getEquippedSlots(cart));
    expect(result).toEqual({ head: null, body: null, mainHand: null, offHand: 'ci-2' });
  });

  it('desequipar uma posição de equipamento completo a esvazia', () => {
    const slots = { head: 'a', body: 'b', mainHand: 'c', offHand: null };
    expect(unequipSlot('head', slots)).toEqual({
      head: null,
      body: 'b',
      mainHand: 'c',
      offHand: null,
    });
  });
});
