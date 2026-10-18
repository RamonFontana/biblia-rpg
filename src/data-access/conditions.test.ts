// Fixa a gravação das Condições: a lista nova sai das funções puras e vai para a tabela certa.
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
  applyConditionToCharacter,
  applyConditionToParticipant,
  removeConditionFromCharacter,
  removeConditionFromParticipant,
  setParticipantConditions,
} from './conditions';

const c = (conditionId: string, duration: number | null) => ({ conditionId, duration });
const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Condições da ficha', () => {
  it('aplicar junta a Condição à lista, grava na ficha e devolve a lista nova', async () => {
    const result = await applyConditionToCharacter('c1', [c('cego', 2)], c('sangrando', 3));
    expect(result).toEqual([c('cego', 2), c('sangrando', 3)]);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ conditions: result });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('remover tira a Condição da lista e grava na ficha', async () => {
    const result = await removeConditionFromCharacter(
      'c1',
      [c('cego', 2), c('sangrando', 3)],
      'cego',
    );
    expect(result).toEqual([c('sangrando', 3)]);
    expect(callsOf(state.calls, 'characters', 'update')[0].payload).toEqual({ conditions: result });
  });

  it('registram e lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(applyConditionToCharacter('c1', [], c('cego', 1))).rejects.toBe(failure);
    await expect(removeConditionFromCharacter('c1', [], 'cego')).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Error applying condition to character:', failure);
    expect(console.error).toHaveBeenCalledWith('Error removing condition from character:', failure);
  });
});

describe('Condições do participante', () => {
  it('aplicar e remover gravam em combat_participants', async () => {
    const applied = await applyConditionToParticipant('p1', [], c('cego', 2));
    const removed = await removeConditionFromParticipant('p1', applied, 'cego');
    expect(applied).toEqual([c('cego', 2)]);
    expect(removed).toEqual([]);
    const writes = callsOf(state.calls, 'combat_participants', 'update');
    expect(writes.map((w) => w.payload)).toEqual([{ conditions: applied }, { conditions: [] }]);
    expect(filterOf(writes[0], 'eq', 'id')).toBe('p1');
  });

  it('setParticipantConditions grava a lista como veio', async () => {
    await setParticipantConditions('p1', [c('cego', null)]);
    expect(callsOf(state.calls, 'combat_participants', 'update')[0].payload).toEqual({
      conditions: [c('cego', null)],
    });
  });

  it('registram e lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(applyConditionToParticipant('p1', [], c('cego', 1))).rejects.toBe(failure);
    await expect(removeConditionFromParticipant('p1', [], 'cego')).rejects.toBe(failure);
    await expect(setParticipantConditions('p1', [])).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Error applying condition to participant:', failure);
    expect(console.error).toHaveBeenCalledWith(
      'Error removing condition from participant:',
      failure,
    );
    expect(console.error).toHaveBeenCalledWith('Failed to update conditions', failure);
  });
});
