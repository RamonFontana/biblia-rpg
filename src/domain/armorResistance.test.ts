// Resistência a Condição dos itens equipados (docs/itens/armaduras.md, CONTEXT.md). O nível de
// cada resistência é o nível da tabela do doc mais (Qualidade - 1), no máximo 4, e vale o maior
// nível entre os itens equipados, Condição por Condição. Nível 1: vantagem no teste; 2: metade da
// duração (para cima); 3: as duas; 4: imunidade. Decisões: ROADMAP.md, Onda 3 (passo 6).
import { describe, expect, it } from 'vitest';
import { CONDITIONS } from '@/content/conditions';
import { ITEMS_DB } from '@/content/items';
import {
  applyConditionResistance,
  getConditionResistanceLevels,
  getItemResistanceLevel,
  resolveEquippedItems,
} from '@/domain/armorResistance';

const slots = (over: Partial<Record<'head' | 'body' | 'mainHand' | 'offHand', string | null>>) => ({
  head: null,
  body: null,
  mainHand: null,
  offHand: null,
  ...over,
});
const row = (id: string, slug: string, level?: number) => ({
  id,
  item_id: `item-${slug}`,
  level,
  items: { slug },
});

describe('getItemResistanceLevel: nível da tabela + (Qualidade - 1), no máximo 4', () => {
  it('com Qualidade 1 vale o nível da tabela do doc', () => {
    expect(getItemResistanceLevel('lorica', 1)).toBe(4);
    expect(getItemResistanceLevel('elmo_bronze', 1)).toBe(3);
    expect(getItemResistanceLevel('escudo', 1)).toBe(2);
    expect(getItemResistanceLevel('chapeu_couro', 1)).toBe(1);
  });

  it('cada nível de Qualidade acima de 1 soma 1', () => {
    expect(getItemResistanceLevel('escudo', 2)).toBe(3);
    expect(getItemResistanceLevel('escudo', 3)).toBe(4);
    expect(getItemResistanceLevel('chapeu_couro', 3)).toBe(3);
  });

  it('nunca passa de 4 (imunidade)', () => {
    expect(getItemResistanceLevel('lorica', 5)).toBe(4);
    expect(getItemResistanceLevel('escudo', 5)).toBe(4);
  });

  it('Qualidade ausente, nula ou 0 vale 1', () => {
    expect(getItemResistanceLevel('escudo', undefined)).toBe(2);
    expect(getItemResistanceLevel('escudo', null)).toBe(2);
    expect(getItemResistanceLevel('escudo', 0)).toBe(2);
  });

  it('item sem resistência ou fora do catálogo tem nível 0', () => {
    expect(getItemResistanceLevel('couro_cru', 3)).toBe(0);
    expect(getItemResistanceLevel('espada_curta', 1)).toBe(0);
    expect(getItemResistanceLevel('nao_existe', 1)).toBe(0);
    expect(getItemResistanceLevel(null, 1)).toBe(0);
  });
});

describe('getConditionResistanceLevels: o maior nível por Condição', () => {
  it('cada Condição recebe o nível do item que resiste a ELA, sem vazar para as outras', () => {
    // A Lorica (Nv4) resiste a sangrando e atordoado; nada protege de envenenado.
    const levels = getConditionResistanceLevels([{ slug: 'lorica', quality: 1 }]);
    expect(levels).toEqual({ sangrando: 4, atordoado: 4 });
    expect(levels.envenenado).toBeUndefined();
  });

  it('entre itens que resistem à mesma Condição vale o maior nível, sem somar', () => {
    const levels = getConditionResistanceLevels([
      { slug: 'peitoral_bronze', quality: 1 }, // Nv3 vs sangrando, envenenado
      { slug: 'tunica', quality: 1 }, // Nv1 vs envenenado
    ]);
    expect(levels).toEqual({ sangrando: 3, envenenado: 3 });
  });

  it('itens diferentes cobrem Condições diferentes', () => {
    const levels = getConditionResistanceLevels([
      { slug: 'elmo_bronze', quality: 1 }, // Nv3 vs atordoado, cego
      { slug: 'escudo', quality: 1 }, // Nv2 vs impedido
    ]);
    expect(levels).toEqual({ atordoado: 3, cego: 3, impedido: 2 });
  });

  it('a Qualidade de um item não melhora a resistência de outro', () => {
    const levels = getConditionResistanceLevels([
      { slug: 'escudo', quality: 3 },
      { slug: 'chapeu_couro', quality: 1 },
    ]);
    expect(levels).toEqual({ impedido: 4, cego: 1 });
  });

  it('sem itens equipados não há resistência', () => {
    expect(getConditionResistanceLevels([])).toEqual({});
  });
});

describe('resolveEquippedItems: o item equipado é achado pelo slug', () => {
  it('lê o slug do item aninhado na linha do inventário e a Qualidade da linha', () => {
    const inventory = [row('ci-1', 'lorica', 3)];
    expect(resolveEquippedItems(slots({ body: 'ci-1' }), inventory)).toEqual([
      { slug: 'lorica', quality: 3 },
    ]);
  });

  it('aceita o item aninhado como lista', () => {
    const inventory = [{ id: 'ci-1', level: 2, items: [{ slug: 'escudo' }] }];
    expect(resolveEquippedItems(slots({ offHand: 'ci-1' }), inventory)).toEqual([
      { slug: 'escudo', quality: 2 },
    ]);
  });

  it('Qualidade ausente vale 1', () => {
    const inventory = [row('ci-1', 'escudo')];
    expect(resolveEquippedItems(slots({ offHand: 'ci-1' }), inventory)[0].quality).toBe(1);
  });

  it('considera os quatro slots e ignora os vazios', () => {
    const inventory = [
      row('h', 'chapeu_couro'),
      row('b', 'lorica'),
      row('s', 'escudo'),
      row('w', 'espada_curta'),
    ];
    const found = resolveEquippedItems(
      slots({ head: 'h', body: 'b', offHand: 's', mainHand: 'w' }),
      inventory,
    );
    expect(found.map((i) => i.slug).sort()).toEqual(
      ['chapeu_couro', 'escudo', 'espada_curta', 'lorica'].sort(),
    );
    expect(resolveEquippedItems(null, inventory)).toEqual([]);
    expect(resolveEquippedItems(slots({}), inventory)).toEqual([]);
  });

  it('arma de duas mãos (mesmo id nas duas mãos) conta uma vez', () => {
    const inventory = [row('w', 'espada_grande')];
    expect(resolveEquippedItems(slots({ mainHand: 'w', offHand: 'w' }), inventory)).toHaveLength(1);
  });

  it('ignora o slot que aponta para item que não está no inventário ou sem slug', () => {
    const inventory = [{ id: 'ci-2', level: 1, items: null }];
    expect(resolveEquippedItems(slots({ body: 'sumiu', head: 'ci-2' }), inventory)).toEqual([]);
  });
});

describe('applyConditionResistance: efeito do nível sobre a Condição recebida', () => {
  it('sem resistência nada muda e não há mensagem', () => {
    expect(applyConditionResistance('sangrando', 3, 0)).toEqual({
      duration: 3,
      immune: false,
      advantage: false,
      halved: false,
      message: '',
    });
  });

  it('nível 1: vantagem no teste, duração igual', () => {
    const r = applyConditionResistance('sangrando', 4, 1);
    expect(r).toMatchObject({ duration: 4, immune: false, advantage: true, halved: false });
    expect(r.message).toBe('Resistência Nv1: vantagem no teste de resistência contra Sangrando');
  });

  it('nível 2: metade da duração, sem vantagem', () => {
    const r = applyConditionResistance('sangrando', 4, 2);
    expect(r).toMatchObject({ duration: 2, immune: false, advantage: false, halved: true });
    expect(r.message).toBe('Resistência Nv2: duração de Sangrando reduzida pela metade');
  });

  it('nível 3: vantagem e metade da duração', () => {
    const r = applyConditionResistance('sangrando', 4, 3);
    expect(r).toMatchObject({ duration: 2, immune: false, advantage: true, halved: true });
    expect(r.message).toContain('Nv3');
  });

  it('nível 4 ou mais: imune', () => {
    const r = applyConditionResistance('sangrando', 4, 4);
    expect(r).toMatchObject({ immune: true, advantage: false, halved: false });
    expect(r.message).toBe('Resistência Nv4: imune a Sangrando');
    expect(applyConditionResistance('sangrando', 4, 5).immune).toBe(true);
  });

  it('arredonda a duração reduzida PARA CIMA (3 vira 2, 1 continua 1)', () => {
    expect(applyConditionResistance('sangrando', 3, 2).duration).toBe(2);
    expect(applyConditionResistance('sangrando', 1, 2).duration).toBe(1);
    expect(applyConditionResistance('sangrando', 5, 3).duration).toBe(3);
  });

  it('condição sem duração (até ser curada) continua sem duração e a mensagem diz isso', () => {
    const nv2 = applyConditionResistance('sangrando', null, 2);
    expect(nv2.duration).toBeNull();
    expect(nv2.halved).toBe(false);
    expect(nv2.message).toBe('Resistência Nv2: sem efeito, a condição não tem duração');
    const nv3 = applyConditionResistance('sangrando', null, 3);
    expect(nv3).toMatchObject({ duration: null, advantage: true, halved: false });
    expect(nv3.message).toContain('não tem duração');
  });

  it('usa o nome da Condição e cai no id se ela não existir', () => {
    expect(applyConditionResistance('amedrontado', 2, 4).message).toContain('Amedrontado');
    expect(applyConditionResistance('coisa_nova', 2, 4).message).toContain('coisa_nova');
  });
});

describe('catálogo', () => {
  it('as resistências dos itens usam os ids em português das Condições', () => {
    const catalogResistances = new Set(ITEMS_DB.flatMap((i) => i.conditionResistances ?? []));
    const conditionIds = new Set(Object.keys(CONDITIONS));
    const unknown = [...catalogResistances].filter((r) => !conditionIds.has(r));
    expect(unknown).toEqual([]);
  });

  it('todo item que resiste a uma Condição tem nível de resistência entre 1 e 4 no conteúdo', () => {
    for (const item of ITEMS_DB.filter((i) => i.conditionResistances?.length)) {
      expect(item.level ?? 1, item.id).toBeGreaterThanOrEqual(1);
      expect(item.level ?? 1, item.id).toBeLessThanOrEqual(4);
    }
  });
});
