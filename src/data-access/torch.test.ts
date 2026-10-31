// Fixa o que a camada da Tocha pede ao Supabase: as duas funções do banco. Usa o Supabase falso.
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

import { callsOf } from '../test/fakeSupabase';
import { extinguishTorch, lightTorch } from './torch';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
});

describe('lightTorch', () => {
  it('acende pela função do banco, que gasta uma Tocha na mesma transação', async () => {
    await lightTorch('c1');
    const [call] = callsOf(state.calls, 'light_torch', 'rpc');
    expect(call.payload).toEqual({ p_character_id: 'c1' });
  });

  it('lança o erro do banco', async () => {
    state.respond = () => ({ error: failure });
    await expect(lightTorch('c1')).rejects.toBe(failure);
  });
});

describe('extinguishTorch', () => {
  it('apaga pela função do banco', async () => {
    await extinguishTorch('c1');
    const [call] = callsOf(state.calls, 'extinguish_torch', 'rpc');
    expect(call.payload).toEqual({ p_character_id: 'c1' });
  });

  it('lança o erro do banco', async () => {
    state.respond = () => ({ error: failure });
    await expect(extinguishTorch('c1')).rejects.toBe(failure);
  });
});
