// CARACTERIZAÇÃO: fixa o comportamento ATUAL da Resistência a Condição da armadura, bugs inclusos.
// Decisões: ROADMAP.md, Onda 2 (bloco B): condições em português (feito); resistência por condição
// e item achado pelo UUID do banco ficam para a Onda 3.
// Termos: CONTEXT.md (Resistência a Condição, Qualidade, Condição).
import { describe, expect, it } from 'vitest';
import { CONDITIONS } from '@/content/conditions';
import { ITEMS_DB } from '@/content/items';
import {
  applyArmorResistance,
  findMaxResistanceLevel,
  resolveEquippedItems,
  type EquippedItem,
} from '@/domain/armorResistance';

const equipment = (body: string | null) => ({ head: null, body, mainHand: null, offHand: null });
const item = (level: number, ...conditionResistances: string[]): EquippedItem => ({
  level,
  conditionResistances,
});

describe('applyArmorResistance: efeito por nível de resistência', () => {
  it('sem resistência nada muda e não há aviso', () => {
    expect(applyArmorResistance('sangrando', 3, 0)).toEqual({
      duration: 3,
      immune: false,
      toast: '',
    });
  });

  it('nível 1: só vantagem no teste (aviso), a duração não muda', () => {
    const r = applyArmorResistance('sangrando', 4, 1);
    expect(r.duration).toBe(4);
    expect(r.immune).toBe(false);
    expect(r.toast).toContain('Nv1');
  });

  it('nível 2: metade da duração', () => {
    expect(applyArmorResistance('sangrando', 4, 2).duration).toBe(2);
  });

  it('nível 3: metade da duração mais vantagem', () => {
    const r = applyArmorResistance('sangrando', 4, 3);
    expect(r.duration).toBe(2);
    expect(r.toast).toContain('Nv3');
  });

  it('nível 4 ou mais: imune', () => {
    expect(applyArmorResistance('sangrando', 4, 4).immune).toBe(true);
    expect(applyArmorResistance('sangrando', 4, 5).immune).toBe(true);
  });

  it('arredonda a duração reduzida PARA CIMA (3 vira 2, 1 continua 1)', () => {
    expect(applyArmorResistance('sangrando', 3, 2).duration).toBe(2);
    expect(applyArmorResistance('sangrando', 1, 2).duration).toBe(1);
  });

  it('condição sem duração (até ser curada) continua sem duração', () => {
    expect(applyArmorResistance('sangrando', null, 2).duration).toBeNull();
    expect(applyArmorResistance('sangrando', null, 3).duration).toBeNull();
  });
});

describe('findMaxResistanceLevel: BUG conhecido — um nível único para todas as condições', () => {
  it('pega o maior nível entre os itens que resistem a alguma condição', () => {
    const items = [item(2, 'sangrando'), item(4, 'sangrando', 'atordoado')];
    expect(findMaxResistanceLevel(['sangrando'], items)).toBe(4);
  });

  it('é 0 quando nenhum item resiste', () => {
    expect(findMaxResistanceLevel(['cego'], [item(4, 'sangrando')])).toBe(0);
  });

  it('o nível de uma condição vaza para as outras da mesma habilidade', () => {
    // O item nível 4 só resiste a sangrando, mas o nível vira o do alvo inteiro.
    const items = [item(4, 'sangrando')];
    const level = findMaxResistanceLevel(['sangrando', 'envenenado'], items);
    expect(level).toBe(4);
    // ...e por isso envenenado, que o item NÃO cobre, também recebe imunidade.
    expect(applyArmorResistance('envenenado', 3, level).immune).toBe(true);
  });

  it('item sem nível conta como nível 1', () => {
    expect(
      findMaxResistanceLevel(['sangrando'], [{ level: 0, conditionResistances: ['sangrando'] }]),
    ).toBe(1);
  });
});

describe('resolveEquippedItems', () => {
  it('só acha o item se o item_id for um slug do catálogo (ex.: lorica)', () => {
    const inventory = [{ id: 'ci-1', item_id: 'lorica', level: 4 }];
    const found = resolveEquippedItems(equipment('ci-1'), inventory);
    expect(found).toEqual([{ level: 4, conditionResistances: ['sangrando', 'atordoado'] }]);
  });

  it('BUG conhecido: com item_id UUID (o que o banco guarda de verdade) o item não é encontrado', () => {
    // character_items.item_id e items.id são UUID (migration 20260616194236); o catálogo usa slugs.
    const inventory = [{ id: 'ci-1', item_id: '7b1f0c2e-0000-4000-8000-000000000001', level: 4 }];
    expect(resolveEquippedItems(equipment('ci-1'), inventory)).toEqual([]);
  });

  it('as resistências do catálogo usam os ids em português das Condições', () => {
    const catalogResistances = new Set(ITEMS_DB.flatMap((i) => i.conditionResistances ?? []));
    const conditionIds = new Set(Object.keys(CONDITIONS));
    const unknown = [...catalogResistances].filter((r) => !conditionIds.has(r));
    expect(unknown).toEqual([]);
  });

  it('com o item achado, a resistência casa com a condição em português', () => {
    const inventory = [{ id: 'ci-1', item_id: 'lorica', level: 4 }];
    const equipped = resolveEquippedItems(equipment('ci-1'), inventory);
    expect(findMaxResistanceLevel(['sangrando'], equipped)).toBe(4);
    expect(findMaxResistanceLevel(['cego'], equipped)).toBe(0);
  });

  it('junta as resistências personalizadas do inventário', () => {
    const inventory = [
      { id: 'ci-1', item_id: 'lorica', level: 2, custom_condition_resistances: ['sangrando'] },
    ];
    const equipped = resolveEquippedItems(equipment('ci-1'), inventory);
    expect(equipped[0].conditionResistances).toEqual(['sangrando', 'atordoado', 'sangrando']);
    expect(findMaxResistanceLevel(['envenenado'], equipped)).toBe(0);
  });

  it('procura o item pelo id da linha do inventário ou diretamente pelo item_id', () => {
    expect(resolveEquippedItems(equipment('lorica'), [])).toHaveLength(1);
    expect(resolveEquippedItems(equipment('lorica'), [])[0].level).toBe(1);
  });

  it('considera os quatro slots e ignora os vazios', () => {
    const slots = { head: 'chapeu_couro', body: 'lorica', mainHand: null, offHand: 'escudo' };
    expect(resolveEquippedItems(slots, [])).toHaveLength(3);
    expect(resolveEquippedItems(null, [])).toEqual([]);
  });
});
