// Fixa como o inventário inicial é gravado: cada item é procurado em `items` pelo slug do
// conteúdo (ADR 0003) e o app nunca insere em `items`. Decisões: ROADMAP.md, Onda 3 (passo 4).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
}));

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
    }),
  };
});

import { callsOf, filterOf } from '../test/fakeSupabase';
import {
  addAmmoCharges,
  addInventoryItem,
  consumeAmmo,
  consumeInventoryItem,
  consumeItemViaRpc,
  getCharacterInventory,
  getInventoryForMenu,
  getItemFaithPenalty,
  listCatalogItems,
  recoverAmmo,
  removeInventoryItem,
  setInventoryQuantity,
  syncInventoryItems,
  updateItemLevel,
  updateItemResistances,
  updateWeaponEffects,
} from './inventory';

const rowId = (slug: string) => `row-${slug}`;

/** O banco tem uma linha por slug conhecido; `missing` simula slugs sem linha. */
const world = (options: { missing?: string[]; lookupError?: boolean } = {}) => {
  state.respond = (call) => {
    if (call.table === 'items' && call.op === 'select') {
      if (options.lookupError) return { error: { message: 'boom' } };
      const slugs = filterOf(call, 'in', 'slug') as string[];
      return {
        data: slugs
          .filter((s) => !options.missing?.includes(s))
          .map((s) => ({ id: rowId(s), slug: s })),
      };
    }
    return undefined;
  };
};

const kit = [{ id: 'kit_basico', name: 'Kit', type: 'Kit' }];
const written = () =>
  callsOf(state.calls, 'character_items', 'insert')[0]?.payload as
    { character_id: string; item_id: string; quantity: number }[] | undefined;
const quantityOf = (slug: string) => written()?.find((r) => r.item_id === rowId(slug))?.quantity;

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('syncInventoryItems', () => {
  it('resolve o kit da Vocação pelo slug, numa única consulta, e grava as quantidades', async () => {
    world();
    await syncInventoryItems('char-1', kit, 'Caçador');

    const lookups = callsOf(state.calls, 'items', 'select');
    expect(lookups).toHaveLength(1);
    expect(new Set(filterOf(lookups[0], 'in', 'slug') as string[])).toEqual(
      new Set(['arco_curto', 'adaga', 'couro_cru', 'corda', 'flechas']),
    );
    expect(written()?.every((r) => r.character_id === 'char-1')).toBe(true);
    expect(quantityOf('flechas')).toBe(20);
    expect(quantityOf('arco_curto')).toBe(1);
  });

  it('o item comprado na loja é procurado pelo id do conteúdo, que é o slug', async () => {
    world();
    await syncInventoryItems(
      'char-1',
      [
        { id: 'espada_longa', name: 'Espada Longa / Khopesh', type: 'Arma' },
        { id: 'tocha', name: 'Tocha', type: 'Consumível' },
      ],
      'Guerreiro',
    );

    expect(
      written()
        ?.map((r) => r.item_id)
        .sort(),
    ).toEqual([rowId('espada_longa'), rowId('tocha')]);
  });

  it('soma a quantidade quando o mesmo item vem do kit e da compra', async () => {
    world();
    await syncInventoryItems(
      'char-1',
      [...kit, { id: 'adaga', name: 'Adaga', type: 'Arma' }],
      'Batedor',
    );

    expect(quantityOf('adaga')).toBe(3); // 2 do kit do Batedor + 1 comprada
    const asked = filterOf(callsOf(state.calls, 'items', 'select')[0], 'in', 'slug') as string[];
    expect(asked.filter((slug) => slug === 'adaga')).toHaveLength(1);
  });

  it('nunca insere em items', async () => {
    world({ missing: ['arco_curto'] });
    await syncInventoryItems('char-1', kit, 'Caçador');

    expect(callsOf(state.calls, 'items', 'insert')).toEqual([]);
  });

  it('pula o slug sem linha, avisa no console e grava o resto', async () => {
    world({ missing: ['arco_curto'] });
    await syncInventoryItems('char-1', kit, 'Caçador');

    expect(quantityOf('arco_curto')).toBeUndefined();
    expect(quantityOf('flechas')).toBe(20);
    expect(
      written()
        ?.map((r) => r.item_id)
        .sort(),
    ).toEqual(['adaga', 'corda', 'couro_cru', 'flechas'].map(rowId));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('arco_curto'));
  });

  it('não apaga o inventário quando a consulta de itens falha', async () => {
    world({ lookupError: true });
    await syncInventoryItems('char-1', kit, 'Caçador');

    expect(callsOf(state.calls, 'character_items', 'delete')).toEqual([]);
    expect(written()).toBeUndefined();
  });

  it('troca o inventário: apaga o antigo antes de gravar o novo', async () => {
    world();
    await syncInventoryItems('char-1', kit, 'Sacerdote');

    const order = state.calls.filter((c) => c.table === 'character_items').map((c) => c.op);
    expect(order).toEqual(['delete', 'insert']);
    expect(quantityOf('balsamo')).toBe(3);
  });

  it('Vocação sem kit não grava itens do kit', async () => {
    world();
    await syncInventoryItems('char-1', kit, 'Nobre');

    expect(written()).toBeUndefined();
  });
});

const failure = { message: 'falhou' };
const itemWrites = (op: 'select' | 'update' | 'insert' | 'delete') =>
  callsOf(state.calls, 'character_items', op);

describe('consultas do inventário e do catálogo', () => {
  it('listCatalogItems lista nome e categoria dos itens por nome', async () => {
    state.respond = () => ({ data: [{ id: 'i1', name: 'Adaga', category: 'arma' }] });
    await expect(listCatalogItems()).resolves.toEqual([
      { id: 'i1', name: 'Adaga', category: 'arma' },
    ]);
    const [call] = callsOf(state.calls, 'items', 'select');
    expect(call.columns).toBe('id, name, category');
    expect(call.filters).toContainEqual(['order', 'name']);
  });

  it('getCharacterInventory lê os itens do personagem com os campos que a ficha usa', async () => {
    state.respond = () => ({ data: [{ id: 'ci1' }] });
    await expect(getCharacterInventory('c1')).resolves.toEqual([{ id: 'ci1' }]);
    const [call] = itemWrites('select');
    expect(filterOf(call, 'eq', 'character_id')).toBe('c1');
    for (const column of [
      'quantity',
      'level',
      'custom_condition_resistances',
      'weapon_effects',
      'is_consumable',
      'requires_target',
      'effects',
    ]) {
      expect(call.columns).toContain(column);
    }
  });

  it('getInventoryForMenu lê só o que decide se o item pode ser usado', async () => {
    state.respond = () => ({ data: [{ id: 'ci1' }] });
    await expect(getInventoryForMenu('c1')).resolves.toEqual([{ id: 'ci1' }]);
    const [call] = itemWrites('select');
    expect(filterOf(call, 'eq', 'character_id')).toBe('c1');
    expect(call.columns).toContain('is_consumable');
    expect(call.columns).not.toContain('weapon_effects');
  });

  it('lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listCatalogItems()).rejects.toBe(failure);
    await expect(getCharacterInventory('c1')).rejects.toBe(failure);
    await expect(getInventoryForMenu('c1')).rejects.toBe(failure);
  });
});

describe('gravações num item do inventário', () => {
  it('updateItemLevel e updateItemResistances gravam a coluna certa do item pedido', async () => {
    await updateItemLevel('ci1', 3);
    await updateItemResistances('ci1', ['sangrando']);
    const [level, resistances] = itemWrites('update');
    expect(level.payload).toEqual({ level: 3 });
    expect(resistances.payload).toEqual({ custom_condition_resistances: ['sangrando'] });
    expect(filterOf(level, 'eq', 'id')).toBe('ci1');
    expect(filterOf(resistances, 'eq', 'id')).toBe('ci1');
  });

  it('updateWeaponEffects grava os efeitos e registra o erro ao lançar', async () => {
    const effects = [{ id: 'e1', trigger: 'natural_18' }] as never;
    await updateWeaponEffects('ci1', effects);
    expect(itemWrites('update')[0].payload).toEqual({ weapon_effects: effects });

    state.respond = () => ({ error: failure });
    await expect(updateWeaponEffects('ci1', effects)).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalled();
  });

  it('as três lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateItemLevel('ci1', 2)).rejects.toBe(failure);
    await expect(updateItemResistances('ci1', [])).rejects.toBe(failure);
  });

  it('removeInventoryItem apaga a linha e setInventoryQuantity grava a quantidade', async () => {
    await removeInventoryItem('ci1');
    await setInventoryQuantity('ci2', 4);
    expect(filterOf(itemWrites('delete')[0], 'eq', 'id')).toBe('ci1');
    const [update] = itemWrites('update');
    expect(update.payload).toEqual({ quantity: 4 });
    expect(filterOf(update, 'eq', 'id')).toBe('ci2');
  });

  it('removeInventoryItem e setInventoryQuantity lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(removeInventoryItem('ci1')).rejects.toBe(failure);
    await expect(setInventoryQuantity('ci1', 2)).rejects.toBe(failure);
  });
});

describe('getItemFaithPenalty', () => {
  it('soma as penalidades de Fé dos Itens Profanos que o personagem carrega', async () => {
    state.respond = () => ({
      data: [{ items: { slug: 'simbolo_proibido' } }, { items: { slug: 'espada_curta' } }],
    });
    await expect(getItemFaithPenalty('c1')).resolves.toBe(-10);
    const [call] = itemWrites('select');
    expect(call.columns).toBe('items!inner(slug)');
    expect(filterOf(call, 'eq', 'character_id')).toBe('c1');
  });

  it('é zero sem itens e lança o erro do Supabase', async () => {
    state.respond = () => ({ data: null });
    await expect(getItemFaithPenalty('c1')).resolves.toBe(0);
    state.respond = () => ({ error: failure });
    await expect(getItemFaithPenalty('c1')).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('addInventoryItem', () => {
  it('soma à linha que o personagem já tem do item', async () => {
    state.respond = (call) =>
      call.op === 'select' ? { data: { id: 'ci1', quantity: 2 } } : undefined;
    await addInventoryItem('c1', 'i1', 3);

    const [lookup] = itemWrites('select');
    expect(filterOf(lookup, 'eq', 'character_id')).toBe('c1');
    expect(filterOf(lookup, 'eq', 'item_id')).toBe('i1');
    const [update] = itemWrites('update');
    expect(update.payload).toEqual({ quantity: 5 });
    expect(filterOf(update, 'eq', 'id')).toBe('ci1');
    expect(itemWrites('insert')).toHaveLength(0);
  });

  it('trata quantidade nula como zero', async () => {
    state.respond = (call) =>
      call.op === 'select' ? { data: { id: 'ci1', quantity: null } } : undefined;
    await addInventoryItem('c1', 'i1', 3);
    expect(itemWrites('update')[0].payload).toEqual({ quantity: 3 });
  });

  it('cria a linha quando o personagem não tem o item', async () => {
    state.respond = () => ({ data: null });
    await addInventoryItem('c1', 'i1', 2);
    expect(itemWrites('insert')[0].payload).toEqual({
      character_id: 'c1',
      item_id: 'i1',
      quantity: 2,
    });
    expect(itemWrites('update')).toHaveLength(0);
  });

  it('lança o erro de gravar, nas duas formas', async () => {
    state.respond = (call) =>
      call.op === 'select' ? { data: { id: 'ci1', quantity: 1 } } : { error: failure };
    await expect(addInventoryItem('c1', 'i1', 1)).rejects.toBe(failure);

    state.respond = (call) => (call.op === 'select' ? { data: null } : { error: failure });
    await expect(addInventoryItem('c1', 'i1', 1)).rejects.toBe(failure);
  });
});

describe('consumeInventoryItem', () => {
  const stats = { pv: 20, current_pv: 5, faith: 100, current_faith: 40 };
  const input = {
    characterId: 'c1',
    characterItemId: 'ci1',
    currentQuantity: 3,
    itemEffects: { heal: 4 },
    currentStats: stats,
    isPlayable: true,
  };

  it('gasta uma unidade quando há mais de uma', async () => {
    await consumeInventoryItem({ ...input, itemEffects: undefined });
    const [update] = itemWrites('update');
    expect(update.payload).toEqual({ quantity: 2 });
    expect(filterOf(update, 'eq', 'id')).toBe('ci1');
    expect(itemWrites('delete')).toHaveLength(0);
  });

  it('remove a linha na última unidade', async () => {
    await consumeInventoryItem({ ...input, currentQuantity: 1, itemEffects: undefined });
    expect(filterOf(itemWrites('delete')[0], 'eq', 'id')).toBe('ci1');
    expect(itemWrites('update')).toHaveLength(0);
  });

  it('aplica a cura e a Fé às estatísticas da ficha', async () => {
    await consumeInventoryItem({ ...input, itemEffects: { heal: 4, restore_faith: 10 } });
    const [write] = callsOf(state.calls, 'characters', 'update');
    expect(write.payload).toEqual({ stats: { ...stats, current_pv: 9, current_faith: 50 } });
    expect(filterOf(write, 'eq', 'id')).toBe('c1');
  });

  it('grava em session_npcs quando o alvo é um NPC simples', async () => {
    await consumeInventoryItem({ ...input, isPlayable: false });
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(0);
    const [write] = callsOf(state.calls, 'session_npcs', 'update');
    expect(write.payload).toEqual({ stats: { ...stats, current_pv: 9 } });
    expect(filterOf(write, 'eq', 'id')).toBe('c1');
  });

  it('sem efeitos, ou com efeitos que não mudam nada, não grava estatísticas', async () => {
    await consumeInventoryItem({ ...input, itemEffects: undefined });
    await consumeInventoryItem({ ...input, itemEffects: {} });
    await consumeInventoryItem({ ...input, itemEffects: { heal: 0 } });
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(0);
    expect(callsOf(state.calls, 'session_npcs', 'update')).toHaveLength(0);
  });

  it('lança o erro de gastar o item sem aplicar efeitos', async () => {
    state.respond = (call) => (call.table === 'character_items' ? { error: failure } : undefined);
    await expect(consumeInventoryItem(input)).rejects.toBe(failure);
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(0);
  });

  it('lança o erro de gravar as estatísticas', async () => {
    state.respond = (call) => (call.table === 'characters' ? { error: failure } : undefined);
    await expect(consumeInventoryItem(input)).rejects.toBe(failure);
  });
});

describe('consumeItemViaRpc', () => {
  it('chama a função do banco com o id do item', async () => {
    await consumeItemViaRpc('ci1');
    const [call] = callsOf(state.calls, 'use_consumable_item', 'rpc');
    expect(call.payload).toEqual({ p_character_item_id: 'ci1' });
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(consumeItemViaRpc('ci1')).rejects.toBe(failure);
  });
});

describe('munição', () => {
  const quantity = (value: number | null) => (call: FakeCall) =>
    call.op === 'select' ? { data: { quantity: value } } : undefined;
  const written = () => itemWrites('update').map((c) => c.payload);

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('consumeAmmo', () => {
    it('gasta a quantidade pedida (uma por padrão)', async () => {
      state.respond = quantity(10);
      await expect(consumeAmmo('ci1')).resolves.toBe(true);
      await expect(consumeAmmo('ci1', 4)).resolves.toBe(true);
      expect(written()).toEqual([{ quantity: 9 }, { quantity: 6 }]);
      expect(filterOf(itemWrites('update')[0], 'eq', 'id')).toBe('ci1');
    });

    it('gasta até zerar e recusa quando falta munição', async () => {
      state.respond = quantity(2);
      await expect(consumeAmmo('ci1', 2)).resolves.toBe(true);
      expect(written()).toEqual([{ quantity: 0 }]);

      await expect(consumeAmmo('ci1', 3)).resolves.toBe(false);
      expect(written()).toHaveLength(1);
      expect(console.warn).toHaveBeenCalled();
    });

    it('trata quantidade nula como zero', async () => {
      state.respond = quantity(null);
      await expect(consumeAmmo('ci1')).resolves.toBe(false);
    });

    it('devolve false e registra a leitura quando o item não existe mais', async () => {
      vi.mocked(console.error).mockClear();
      state.respond = () => ({ data: null });
      await expect(consumeAmmo('ci1')).resolves.toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error fetching item for consumption:', null);
    });

    it('devolve false e registra quando a leitura, a gravação ou a chamada falham', async () => {
      vi.mocked(console.error).mockClear();
      state.respond = () => ({ error: failure });
      await expect(consumeAmmo('ci1')).resolves.toBe(false);

      state.respond = (call) =>
        call.op === 'update' ? { error: failure } : { data: { quantity: 5 } };
      await expect(consumeAmmo('ci1')).resolves.toBe(false);

      state.respond = () => {
        throw new Error('rede');
      };
      await expect(consumeAmmo('ci1')).resolves.toBe(false);
      expect(console.error).toHaveBeenCalledTimes(3);
    });
  });

  describe('recoverAmmo', () => {
    it('recupera as unidades sorteadas, sem passar da capacidade', async () => {
      state.respond = quantity(3);
      const rolls = [0.9, 0.1, 0.5, 0.2]; // >= 0.5 recupera: 2 de 4
      let i = 0;
      await expect(recoverAmmo('ci1', 4, 10, () => rolls[i++])).resolves.toBe(2);
      expect(written()).toEqual([{ quantity: 5 }]);

      state.respond = quantity(9);
      await expect(recoverAmmo('ci1', 4, 10, () => 0.9)).resolves.toBe(4);
      expect(written()[1]).toEqual({ quantity: 10 });
    });

    it('não consulta nem grava quando nada é recuperado', async () => {
      await expect(recoverAmmo('ci1', 3, 10, () => 0.1)).resolves.toBe(0);
      expect(state.calls).toHaveLength(0);
    });

    it('devolve 0 e registra quando a leitura ou a gravação falham', async () => {
      vi.mocked(console.error).mockClear();
      state.respond = () => ({ error: failure });
      await expect(recoverAmmo('ci1', 2, 10, () => 0.9)).resolves.toBe(0);

      state.respond = (call) =>
        call.op === 'update' ? { error: failure } : { data: { quantity: 1 } };
      await expect(recoverAmmo('ci1', 2, 10, () => 0.9)).resolves.toBe(0);

      state.respond = () => {
        throw new Error('rede');
      };
      await expect(recoverAmmo('ci1', 2, 10, () => 0.9)).resolves.toBe(0);
      expect(console.error).toHaveBeenCalledTimes(3);
    });
  });

  describe('addAmmoCharges', () => {
    it('soma a quantidade à que o item já tem', async () => {
      state.respond = quantity(7);
      await expect(addAmmoCharges('ci1', 5)).resolves.toBe(true);
      expect(written()).toEqual([{ quantity: 12 }]);
    });

    it('trata quantidade nula como zero', async () => {
      state.respond = quantity(null);
      await expect(addAmmoCharges('ci1', 5)).resolves.toBe(true);
      expect(written()).toEqual([{ quantity: 5 }]);
    });

    it('devolve false e registra quando a leitura, a gravação ou a chamada falham', async () => {
      vi.mocked(console.error).mockClear();
      state.respond = () => ({ error: failure });
      await expect(addAmmoCharges('ci1', 1)).resolves.toBe(false);

      state.respond = (call) =>
        call.op === 'update' ? { error: failure } : { data: { quantity: 1 } };
      await expect(addAmmoCharges('ci1', 1)).resolves.toBe(false);

      state.respond = () => {
        throw new Error('rede');
      };
      await expect(addAmmoCharges('ci1', 1)).resolves.toBe(false);
      expect(console.error).toHaveBeenCalledTimes(3);
    });
  });
});
