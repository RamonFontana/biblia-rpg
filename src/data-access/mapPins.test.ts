// Fixa o que a camada de pins pede ao Supabase. Usa o Supabase falso, que só registra as chamadas.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
  subscriptions: [] as { table: string; scope: { column: string; value: string } }[],
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

vi.mock('./realtime', () => ({
  subscribeToScopedRows: (
    _name: string,
    table: string,
    scope: { column: string; value: string },
  ) => {
    state.subscriptions.push({ table, scope });
    return () => {};
  },
}));

import { callsOf, filterOf } from '../test/fakeSupabase';
import { listMapPins, placePin, removePin, setPinLight, subscribeToMapPins } from './mapPins';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  state.subscriptions.length = 0;
});

describe('listMapPins', () => {
  it('lê os pins do mapa', async () => {
    state.respond = () => ({ data: [{ id: 'p1' }] });
    expect(await listMapPins('m1')).toEqual([{ id: 'p1' }]);
    const [call] = callsOf(state.calls, 'session_map_pins', 'select');
    expect(filterOf(call, 'eq', 'map_id')).toBe('m1');
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listMapPins('m1')).rejects.toBe(failure);
  });
});

describe('placePin', () => {
  it('põe a ficha no Quadrado, trocando o pin que ela já tinha no mapa', async () => {
    await placePin({ mapId: 'm1', target: { kind: 'character', id: 'c1' }, col: 3, row: 4 });
    const [call] = callsOf(state.calls, 'session_map_pins', 'upsert');
    expect(call.payload).toEqual({
      map_id: 'm1',
      character_id: 'c1',
      npc_id: null,
      col: 3,
      row: 4,
    });
    expect(call.options).toEqual({ onConflict: 'map_id,character_id' });
  });

  it('põe o NPC simples pelo npc_id', async () => {
    await placePin({ mapId: 'm1', target: { kind: 'npc', id: 'n1' }, col: 0, row: 0 });
    const [call] = callsOf(state.calls, 'session_map_pins', 'upsert');
    expect(call.payload).toEqual({
      map_id: 'm1',
      character_id: null,
      npc_id: 'n1',
      col: 0,
      row: 0,
    });
    expect(call.options).toEqual({ onConflict: 'map_id,npc_id' });
  });

  it('lança o erro ao gravar', async () => {
    state.respond = () => ({ error: failure });
    await expect(
      placePin({ mapId: 'm1', target: { kind: 'character', id: 'c1' }, col: 1, row: 1 }),
    ).rejects.toBe(failure);
  });
});

describe('setPinLight', () => {
  it('acende a luz do pin da ficha, com os raios em metros', async () => {
    await setPinLight('m1', { kind: 'character', id: 'e1' }, { brightM: 6, dimM: 6 });
    const [call] = callsOf(state.calls, 'session_map_pins', 'update');
    expect(call?.payload).toEqual({ light_bright_m: 6, light_dim_m: 6 });
    expect(filterOf(call, 'eq', 'map_id')).toBe('m1');
    expect(filterOf(call, 'eq', 'character_id')).toBe('e1');
  });

  it('nulo apaga a luz (os dois raios juntos)', async () => {
    await setPinLight('m1', { kind: 'npc', id: 'n1' }, null);
    const [call] = callsOf(state.calls, 'session_map_pins', 'update');
    expect(call?.payload).toEqual({ light_bright_m: null, light_dim_m: null });
    expect(filterOf(call, 'eq', 'npc_id')).toBe('n1');
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(
      setPinLight('m1', { kind: 'character', id: 'e1' }, { brightM: 1, dimM: 1 }),
    ).rejects.toBe(failure);
  });
});

describe('removePin', () => {
  it('devolve a ficha à Bandeja apagando o pin dela no mapa', async () => {
    await removePin('m1', { kind: 'character', id: 'c1' });
    const [call] = callsOf(state.calls, 'session_map_pins', 'delete');
    expect(filterOf(call, 'eq', 'map_id')).toBe('m1');
    expect(filterOf(call, 'eq', 'character_id')).toBe('c1');
  });

  it('devolve o NPC simples pela coluna dele', async () => {
    await removePin('m1', { kind: 'npc', id: 'n1' });
    const [call] = callsOf(state.calls, 'session_map_pins', 'delete');
    expect(filterOf(call, 'eq', 'npc_id')).toBe('n1');
  });
});

describe('subscribeToMapPins', () => {
  it('assina a tabela filtrada pelo escopo (o apagar vem de uma assinatura sem filtro, no helper)', () => {
    subscribeToMapPins('m1', () => {});
    expect(state.subscriptions[0]).toEqual({
      table: 'session_map_pins',
      scope: { column: 'map_id', value: 'm1' },
    });
  });
});
