// Fixa o que a camada de fichas grava e consulta (tabela, filtros, payload) com o Supabase falso.
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
  createEnemyCharacter,
  listCampaignNpcs,
  setCharacterVisible,
  updateCharacterRest,
  updateCharacterStats,
} from './characters';

const failure = { message: 'falhou' };
const stats = { pv: 20, ca: 12, faith: 10, current_pv: 7, current_faith: 4 };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
});

describe('listCampaignNpcs', () => {
  it('lista as fichas de NPC por nome', async () => {
    state.respond = () => ({ data: [{ id: 'n1' }, { id: 'n2' }] });
    await expect(listCampaignNpcs()).resolves.toEqual([{ id: 'n1' }, { id: 'n2' }]);
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(filterOf(call, 'eq', 'is_npc')).toBe(true);
    expect(call.filters).toContainEqual(['order', 'name']);
  });

  it('devolve lista vazia sem dados e lança o erro quando falha', async () => {
    state.respond = () => ({ data: null });
    await expect(listCampaignNpcs()).resolves.toEqual([]);
    state.respond = () => ({ error: failure });
    await expect(listCampaignNpcs()).rejects.toBe(failure);
  });
});

describe('updateCharacterStats', () => {
  it('grava só as estatísticas da ficha pedida', async () => {
    await updateCharacterStats('c1', stats);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ stats });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('lança o erro ao gravar', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateCharacterStats('c1', stats)).rejects.toBe(failure);
  });
});

describe('updateCharacterRest', () => {
  it('grava estatísticas e habilidades juntas', async () => {
    const skills = { ability_uses: { golpe: 0 } };
    await updateCharacterRest('c1', { stats, skills });
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ stats, skills });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('lança o erro ao gravar', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateCharacterRest('c1', { stats, skills: {} })).rejects.toBe(failure);
  });
});

describe('setCharacterVisible', () => {
  it('grava a visibilidade da ficha pedida', async () => {
    await setCharacterVisible('c1', true);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ is_visible: true });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });
});

describe('createEnemyCharacter', () => {
  const row = {
    name: 'Soldado',
    vocation: 'Guerreiro',
    tribe: 'Inimigo',
    is_enemy: true,
    user_id: 'gm',
    stats,
    attributes: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  };

  it('insere a linha e devolve a ficha gravada', async () => {
    state.respond = () => ({ data: { id: 'c9', ...row } });
    await expect(createEnemyCharacter(row)).resolves.toEqual({ id: 'c9', ...row });
    const [call] = callsOf(state.calls, 'characters', 'insert');
    expect(call.payload).toEqual(row);
    expect(call.single).toBe(true);
  });

  it('lança o erro ao inserir', async () => {
    state.respond = () => ({ error: failure });
    await expect(createEnemyCharacter(row)).rejects.toBe(failure);
  });
});
