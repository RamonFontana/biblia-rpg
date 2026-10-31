// Fixa o que a camada dos mapas do Mestre pede ao Supabase. Usa o Supabase falso.
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
  createMasterMap,
  getMasterMapImage,
  listMasterMaps,
  removeMasterMap,
  renameMasterMap,
} from './masterMaps';

const failure = { message: 'falhou' };
const input = {
  name: 'Cerco de Jericó',
  columns: 20,
  rows: 15,
  image: 'data:image/webp;base64,AAAA',
};

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
});

describe('listMasterMaps', () => {
  it('lê só os mapas do dono, do mais novo ao mais velho', async () => {
    state.respond = () => ({ data: [{ id: 'mm1' }] });
    expect(await listMasterMaps('gm-1')).toEqual([{ id: 'mm1' }]);
    const [call] = callsOf(state.calls, 'master_maps', 'select');
    expect(filterOf(call, 'eq', 'owner_id')).toBe('gm-1');
    expect(call.filters.some((f) => f[0] === 'order' && f[1] === 'created_at')).toBe(true);
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listMasterMaps('gm-1')).rejects.toBe(failure);
  });
});

describe('createMasterMap', () => {
  const respond = (call: FakeCall): FakeResult | undefined =>
    call.table === 'master_maps' && call.op === 'insert'
      ? { data: { id: 'mm-new', name: input.name } }
      : undefined;

  it('grava o mapa e, depois, a imagem dele em tabela à parte', async () => {
    state.respond = respond;
    const map = await createMasterMap(input);
    expect(map).toMatchObject({ id: 'mm-new' });
    const [mapInsert] = callsOf(state.calls, 'master_maps', 'insert');
    expect(mapInsert?.payload).toEqual({ name: 'Cerco de Jericó', columns: 20, rows: 15 });
    const [imageInsert] = callsOf(state.calls, 'master_map_images', 'insert');
    expect(imageInsert?.payload).toEqual({ map_id: 'mm-new', image: input.image });
    expect(state.calls.map((c) => `${c.table}:${c.op}`)).toEqual([
      'master_maps:insert',
      'master_map_images:insert',
    ]);
  });

  it('a imagem não vai junto com o mapa (a lista não a carrega)', async () => {
    state.respond = respond;
    await createMasterMap(input);
    const [mapInsert] = callsOf(state.calls, 'master_maps', 'insert');
    expect(JSON.stringify(mapInsert?.payload)).not.toContain('base64');
  });

  it('se a imagem falha, desfaz o mapa e lança o erro', async () => {
    state.respond = (call) =>
      call.table === 'master_map_images' ? { error: failure } : respond(call);
    await expect(createMasterMap(input)).rejects.toBe(failure);
    const [del] = callsOf(state.calls, 'master_maps', 'delete');
    expect(filterOf(del, 'eq', 'id')).toBe('mm-new');
  });

  it('se o mapa falha, nem tenta a imagem', async () => {
    state.respond = () => ({ error: failure });
    await expect(createMasterMap(input)).rejects.toBe(failure);
    expect(callsOf(state.calls, 'master_map_images', 'insert')).toEqual([]);
  });
});

describe('getMasterMapImage', () => {
  it('lê a imagem do mapa por id', async () => {
    state.respond = () => ({ data: { image: 'data:image/webp;base64,AAAA' } });
    expect(await getMasterMapImage('mm1')).toBe('data:image/webp;base64,AAAA');
    const [call] = callsOf(state.calls, 'master_map_images', 'select');
    expect(filterOf(call, 'eq', 'map_id')).toBe('mm1');
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getMasterMapImage('mm1')).rejects.toBe(failure);
  });
});

describe('renameMasterMap e removeMasterMap', () => {
  it('renomeia pelo id', async () => {
    await renameMasterMap('mm1', 'Novo nome');
    const [call] = callsOf(state.calls, 'master_maps', 'update');
    expect(call.payload).toEqual({ name: 'Novo nome' });
    expect(filterOf(call, 'eq', 'id')).toBe('mm1');
  });

  it('apaga pelo id', async () => {
    await removeMasterMap('mm1');
    const [call] = callsOf(state.calls, 'master_maps', 'delete');
    expect(filterOf(call, 'eq', 'id')).toBe('mm1');
  });

  it('apagar um mapa em uso devolve o erro 23503 de quem chamou', async () => {
    state.respond = () => ({ error: { code: '23503', message: 'em uso' } });
    await expect(removeMasterMap('mm1')).rejects.toMatchObject({ code: '23503' });
  });
});
