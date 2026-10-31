// Fixa o que a camada das luzes do mapa pede ao Supabase. Usa o Supabase falso.
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
import {
  addMapLight,
  listMapLights,
  removeMapLight,
  subscribeToMapLights,
  updateMapLight,
} from './mapLights';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  state.subscriptions.length = 0;
});

describe('listMapLights', () => {
  it('lê as luzes do mapa', async () => {
    state.respond = () => ({ data: [{ id: 'l1' }] });
    expect(await listMapLights('m1')).toEqual([{ id: 'l1' }]);
    const [call] = callsOf(state.calls, 'session_map_lights', 'select');
    expect(filterOf(call, 'eq', 'map_id')).toBe('m1');
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listMapLights('m1')).rejects.toBe(failure);
  });
});

describe('addMapLight, updateMapLight e removeMapLight', () => {
  it('põe a luz no Quadrado com os raios em metros', async () => {
    state.respond = () => ({ data: { id: 'l-new' } });
    await addMapLight({ mapId: 'm1', col: 4, row: 5, brightM: 6, dimM: 6, label: 'Fogueira' });
    const [call] = callsOf(state.calls, 'session_map_lights', 'insert');
    expect(call?.payload).toEqual({
      map_id: 'm1',
      col: 4,
      row: 5,
      bright_m: 6,
      dim_m: 6,
      label: 'Fogueira',
    });
  });

  it('lança o erro ao inserir', async () => {
    state.respond = () => ({ error: failure });
    await expect(
      addMapLight({ mapId: 'm1', col: 1, row: 1, brightM: 3, dimM: 3, label: 'Luz' }),
    ).rejects.toBe(failure);
  });

  it('muda a luz pelo id, traduzindo os nomes das colunas', async () => {
    await updateMapLight('l1', { col: 7, row: 2, brightM: 3, dimM: 4.5, label: 'Braseiro' });
    const [call] = callsOf(state.calls, 'session_map_lights', 'update');
    expect(call?.payload).toEqual({
      col: 7,
      row: 2,
      bright_m: 3,
      dim_m: 4.5,
      label: 'Braseiro',
    });
    expect(filterOf(call, 'eq', 'id')).toBe('l1');
  });

  it('só manda o que mudou', async () => {
    await updateMapLight('l1', { col: 7, row: 2 });
    const [call] = callsOf(state.calls, 'session_map_lights', 'update');
    expect(call?.payload).toEqual({ col: 7, row: 2 });
  });

  it('tira a luz pelo id', async () => {
    await removeMapLight('l1');
    const [call] = callsOf(state.calls, 'session_map_lights', 'delete');
    expect(filterOf(call, 'eq', 'id')).toBe('l1');
  });
});

describe('subscribeToMapLights', () => {
  it('assina a tabela filtrada pelo escopo (o apagar vem de uma assinatura sem filtro, no helper)', () => {
    subscribeToMapLights('m1', () => {});
    expect(state.subscriptions[0]).toEqual({
      table: 'session_map_lights',
      scope: { column: 'map_id', value: 'm1' },
    });
  });
});
