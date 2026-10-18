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
import { syncInventoryItems } from './inventory';

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
