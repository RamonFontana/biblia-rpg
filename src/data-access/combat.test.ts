// Fixa o que a camada de combate pede ao Supabase (tabela, filtros, payload) com o Supabase falso.
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
  createCombat,
  finishCombat,
  findSessionCombat,
  getCharacterConditions,
  getCharacterSkills,
  getCharactersForCombatEnd,
  getCombat,
  insertCombatParticipants,
  listCombatParticipants,
  setParticipantConditions,
  softDeleteCharacters,
  updateCombatTurn,
} from './combat';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('createCombat', () => {
  it('cria o combate ativo da sessão no primeiro turno da primeira rodada', async () => {
    state.respond = () => ({ data: { id: 'combat-1' } });
    await expect(createCombat('s1')).resolves.toEqual({ id: 'combat-1' });
    const [call] = callsOf(state.calls, 'combats', 'insert');
    expect(call.payload).toEqual({
      session_id: 's1',
      status: 'active',
      current_turn_index: 0,
      round_number: 1,
    });
    expect(call.single).toBe(true);
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(createCombat('s1')).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Failed to create combat', failure);
  });
});

describe('insertCombatParticipants', () => {
  const row = {
    combat_id: 'c1',
    entity_id: 'e1',
    entity_type: 'player' as const,
    initiative: 12,
    hp_current: 9,
    conditions: [{ conditionId: 'cego', duration: 2 }],
  };

  it('insere os participantes com as Condições', async () => {
    await insertCombatParticipants([row]);
    const [call] = callsOf(state.calls, 'combat_participants', 'insert');
    expect(call.payload).toEqual([row]);
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(insertCombatParticipants([row])).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Failed to insert participants', failure);
  });
});

describe('leituras das fichas do combate', () => {
  it('getCharacterConditions devolve as Condições por ficha, com lista vazia para nulo', async () => {
    state.respond = () => ({
      data: [
        { id: 'a', conditions: [{ conditionId: 'cego', duration: null }] },
        { id: 'b', conditions: null },
      ],
    });
    await expect(getCharacterConditions(['a', 'b'])).resolves.toEqual({
      a: [{ conditionId: 'cego', duration: null }],
      b: [],
    });
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('id, conditions');
    expect(filterOf(call, 'in', 'id')).toEqual(['a', 'b']);
  });

  it('getCharacterSkills devolve as habilidades por ficha, com objeto vazio para nulo', async () => {
    state.respond = () => ({
      data: [
        { id: 'a', skills: { ability_uses: { golpe: 1 } } },
        { id: 'b', skills: null },
      ],
    });
    await expect(getCharacterSkills(['a', 'b'])).resolves.toEqual([
      { id: 'a', skills: { ability_uses: { golpe: 1 } } },
      { id: 'b', skills: {} },
    ]);
    expect(callsOf(state.calls, 'characters', 'select')[0].columns).toBe('id, skills');
  });

  it('getCharactersForCombatEnd pede o que fecha a vida de cada ficha', async () => {
    state.respond = () => ({ data: [{ id: 'a' }] });
    await expect(getCharactersForCombatEnd(['a'])).resolves.toEqual([{ id: 'a' }]);
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('id, stats, is_dead, is_enemy');
    expect(filterOf(call, 'in', 'id')).toEqual(['a']);
  });

  it('lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getCharacterConditions(['a'])).rejects.toBe(failure);
    await expect(getCharacterSkills(['a'])).rejects.toBe(failure);
    await expect(getCharactersForCombatEnd(['a'])).rejects.toBe(failure);
  });
});

describe('findSessionCombat e listCombatParticipants', () => {
  it('findSessionCombat procura o combate da sessão no estado pedido', async () => {
    state.respond = () => ({ data: { id: 'combat-1' } });
    await expect(findSessionCombat('s1', 'setup')).resolves.toEqual({ id: 'combat-1' });
    const [call] = callsOf(state.calls, 'combats', 'select');
    expect(filterOf(call, 'eq', 'session_id')).toBe('s1');
    expect(filterOf(call, 'eq', 'status')).toBe('setup');
  });

  it('devolve nulo sem combate e lança o erro do Supabase', async () => {
    state.respond = () => ({ data: null });
    await expect(findSessionCombat('s1', 'active')).resolves.toBeNull();
    state.respond = () => ({ error: failure });
    await expect(findSessionCombat('s1', 'active')).rejects.toBe(failure);
  });

  it('getCombat lê o combate pelo id e lança o erro do Supabase', async () => {
    state.respond = () => ({ data: { id: 'combat-1', current_turn_index: 2 } });
    await expect(getCombat('combat-1')).resolves.toEqual({ id: 'combat-1', current_turn_index: 2 });
    const [call] = callsOf(state.calls, 'combats', 'select');
    expect(filterOf(call, 'eq', 'id')).toBe('combat-1');
    expect(call.single).toBe(true);
    state.respond = () => ({ error: failure });
    await expect(getCombat('combat-1')).rejects.toBe(failure);
  });

  it('listCombatParticipants lista os participantes do combate', async () => {
    state.respond = () => ({ data: [{ id: 'p1' }] });
    await expect(listCombatParticipants('combat-1')).resolves.toEqual([{ id: 'p1' }]);
    expect(filterOf(callsOf(state.calls, 'combat_participants')[0], 'eq', 'combat_id')).toBe(
      'combat-1',
    );
    state.respond = () => ({ error: failure });
    await expect(listCombatParticipants('combat-1')).rejects.toBe(failure);
  });
});

describe('gravações do combate', () => {
  it('setParticipantConditions grava as Condições do participante', async () => {
    const conditions = [{ conditionId: 'cego', duration: 1 }];
    await setParticipantConditions('p1', conditions);
    const [call] = callsOf(state.calls, 'combat_participants', 'update');
    expect(call.payload).toEqual({ conditions });
    expect(filterOf(call, 'eq', 'id')).toBe('p1');
  });

  it('updateCombatTurn grava turno e rodada', async () => {
    await updateCombatTurn('combat-1', 2, 3);
    const [call] = callsOf(state.calls, 'combats', 'update');
    expect(call.payload).toEqual({ current_turn_index: 2, round_number: 3 });
    expect(filterOf(call, 'eq', 'id')).toBe('combat-1');
  });

  it('finishCombat marca o combate como finalizado', async () => {
    await finishCombat('combat-1');
    const [call] = callsOf(state.calls, 'combats', 'update');
    expect(call.payload).toEqual({ status: 'finished' });
    expect(filterOf(call, 'eq', 'id')).toBe('combat-1');
  });

  it('softDeleteCharacters marca as fichas como apagadas', async () => {
    await softDeleteCharacters(['a', 'b']);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ is_deleted: true });
    expect(filterOf(call, 'in', 'id')).toEqual(['a', 'b']);
  });

  it('as quatro lançam o erro do Supabase, e as três primeiras o registram', async () => {
    state.respond = () => ({ error: failure });
    await expect(setParticipantConditions('p1', [])).rejects.toBe(failure);
    await expect(updateCombatTurn('c', 0, 1)).rejects.toBe(failure);
    await expect(finishCombat('c')).rejects.toBe(failure);
    await expect(softDeleteCharacters(['a'])).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Failed to update conditions', failure);
    expect(console.error).toHaveBeenCalledWith('Failed to update turn', failure);
    expect(console.error).toHaveBeenCalledWith('Failed to end combat', failure);
  });
});
