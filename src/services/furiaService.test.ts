import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '@/test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
}));

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('@/test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
    }),
  };
});

import { callsOf } from '@/test/fakeSupabase';
import { releaseFuria, resolveFuriaSave } from './furiaService';

const target = (abilityState: unknown = null) => ({
  participantId: 'p1',
  entityId: 'e1',
  abilityState,
});
const updates = () => callsOf(state.calls, 'combat_participants', 'update');

/** A ficha do inimigo: CON 16 (+3) por padrão; o bloco pode dar um bônus de TR. */
const enemySheet =
  (stats: unknown = {}) =>
  (call: FakeCall): FakeResult | undefined => {
    if (call.table === 'characters' && call.op === 'select') {
      return { data: [{ id: 'e1', attributes: { con: 16 }, stats }] };
    }
    if (call.table === 'combat_participants' && call.op === 'select') {
      return { data: { ability_state: null } };
    }
    return undefined;
  };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = enemySheet();
});

describe('resolveFuriaSave', () => {
  it('passa com d20 + CON na CD 10: o inimigo fica com 1 PV e o uso conta', async () => {
    const result = await resolveFuriaSave(target(), { natural: 7, mark: null });
    expect(result).toMatchObject({ cd: 10, total: 10, passed: true, hpAfter: 1 });
    const writes = updates().map((u) => u.payload);
    expect(writes).toContainEqual({ hp_current: 1 });
    expect(writes).toContainEqual({ ability_state: { furia: { uses: 1, handled: false } } });
  });

  it('falha abaixo da CD: o PV não é tocado e o 0 PV fica tratado', async () => {
    const result = await resolveFuriaSave(target(), { natural: 6, mark: null });
    expect(result.passed).toBe(false);
    const writes = updates().map((u) => u.payload);
    expect(writes).not.toContainEqual({ hp_current: 1 });
    expect(writes).toContainEqual({ ability_state: { furia: { uses: 0, handled: true } } });
  });

  it('o segundo uso é CD 15', async () => {
    const result = await resolveFuriaSave(target({ furia: { uses: 1, handled: false } }), {
      natural: 11,
      mark: null,
    });
    expect(result).toMatchObject({ cd: 15, total: 14, passed: false });
  });

  it('o bônus de TR do bloco vale no lugar do modificador de CON', async () => {
    state.respond = enemySheet({ saveBonuses: { con: 5 } });
    const result = await resolveFuriaSave(target(), { natural: 5, mark: null });
    expect(result).toMatchObject({ total: 10, passed: true });
  });

  it('recusa um d20 fora de 1 a 20 sem gravar nada', async () => {
    await expect(resolveFuriaSave(target(), { natural: 21, mark: null })).rejects.toThrow('d20');
    expect(updates()).toEqual([]);
  });
});

describe('releaseFuria', () => {
  it('com PV de novo, o 0 PV tratado deixa de contar', async () => {
    await releaseFuria(target({ furia: { uses: 1, handled: true } }), 4);
    expect(updates().map((u) => u.payload)).toContainEqual({
      ability_state: { furia: { uses: 1, handled: false } },
    });
  });

  it('sem nada a liberar, não grava', async () => {
    await releaseFuria(target({ furia: { uses: 1, handled: false } }), 4);
    await releaseFuria(target({ furia: { uses: 1, handled: true } }), 0);
    expect(updates()).toEqual([]);
  });
});
