// Fixa o que a camada de mapas pede ao Supabase (tabela, filtros, payload). Usa o Supabase falso.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
  subscriptions: [] as { name: string; subscriptions: { table: string; filter?: string }[] }[],
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
  subscribeToTables: (
    name: string,
    subscriptions: { table: string; filter?: string }[],
    options?: unknown,
  ) => {
    state.subscriptions.push({ name, subscriptions });
    void options;
    return () => {};
  },
}));

import { callsOf, filterOf } from '../test/fakeSupabase';
import {
  addSessionMap,
  listSessionMaps,
  removeSessionMap,
  showSessionMap,
  subscribeToSessionMaps,
  updateSessionMap,
} from './maps';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  state.subscriptions.length = 0;
});

describe('listSessionMaps', () => {
  it('lê os mapas da sessão em ordem', async () => {
    state.respond = () => ({ data: [{ id: 'm1' }] });
    const maps = await listSessionMaps('s1');
    expect(maps).toEqual([{ id: 'm1' }]);
    const [call] = callsOf(state.calls, 'session_maps', 'select');
    expect(filterOf(call, 'eq', 'session_id')).toBe('s1');
    expect(call.filters.some((f) => f[0] === 'order' && f[1] === 'position')).toBe(true);
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listSessionMaps('s1')).rejects.toBe(failure);
  });
});

describe('addSessionMap', () => {
  it('insere o mapa com as colunas do banco', async () => {
    await addSessionMap({
      sessionId: 's1',
      libraryId: 'terreno-areia',
      name: 'Deserto',
      columns: 20,
      rows: 15,
      position: 2,
    });
    const [call] = callsOf(state.calls, 'session_maps', 'insert');
    expect(call.payload).toEqual({
      session_id: 's1',
      library_id: 'terreno-areia',
      name: 'Deserto',
      columns: 20,
      rows: 15,
      position: 2,
    });
  });

  it('lança o erro ao inserir', async () => {
    state.respond = () => ({ error: failure });
    await expect(
      addSessionMap({
        sessionId: 's1',
        libraryId: 'terreno-areia',
        name: 'x',
        columns: 20,
        rows: 15,
        position: 0,
      }),
    ).rejects.toBe(failure);
  });
});

describe('updateSessionMap e removeSessionMap', () => {
  it('altera o mapa pelo id', async () => {
    await updateSessionMap('m1', { name: 'Novo', grid_visible: false });
    const [call] = callsOf(state.calls, 'session_maps', 'update');
    expect(call.payload).toEqual({ name: 'Novo', grid_visible: false });
    expect(filterOf(call, 'eq', 'id')).toBe('m1');
  });

  it('remove o mapa pelo id', async () => {
    await removeSessionMap('m1');
    const [call] = callsOf(state.calls, 'session_maps', 'delete');
    expect(filterOf(call, 'eq', 'id')).toBe('m1');
  });
});

describe('showSessionMap', () => {
  it('grava o Mapa atual na sessão', async () => {
    await showSessionMap('s1', 'm1');
    const [call] = callsOf(state.calls, 'game_sessions', 'update');
    expect(call.payload).toEqual({ shown_map_id: 'm1' });
    expect(filterOf(call, 'eq', 'id')).toBe('s1');
  });

  it('volta à cena sem mapa com nulo', async () => {
    await showSessionMap('s1', null);
    const [call] = callsOf(state.calls, 'game_sessions', 'update');
    expect(call.payload).toEqual({ shown_map_id: null });
  });
});

describe('subscribeToSessionMaps', () => {
  it('assina session_maps filtrado pela sessão', () => {
    subscribeToSessionMaps('s1', () => {});
    const [sub] = state.subscriptions;
    expect(sub?.subscriptions).toEqual([
      expect.objectContaining({ table: 'session_maps', filter: 'session_id=eq.s1' }),
    ]);
  });
});
