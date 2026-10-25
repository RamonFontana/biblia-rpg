// Fixa o que a camada de Testes de sessão grava e consulta (tabela, filtros, payload) com o
// Supabase falso. A regra de aprovação e a perda de Fé são testadas em services/sessionTestService.
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
  cancelSessionTest,
  completeSessionTest,
  createSessionTest,
  getActiveTestsForSession,
  getTestResults,
  saveTestResult,
} from './sessionTests';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
});

describe('createSessionTest', () => {
  it('grava o Teste ativo e um resultado pendente para cada jogador alvo', async () => {
    state.respond = (call) => (call.table === 'session_tests' ? { data: { id: 't1' } } : undefined);
    const test = await createSessionTest(
      's1',
      'Destreza',
      12,
      [
        { characterId: 'c1', playerId: 'p1' },
        { characterId: 'c2', playerId: 'p2' },
      ],
      null,
    );
    expect(test).toEqual({ id: 't1' });
    expect(callsOf(state.calls, 'session_tests', 'insert')[0].payload).toEqual({
      session_id: 's1',
      test_type: 'Destreza',
      difficulty: 12,
      faith_use: null,
      selfish_request: false,
      status: 'active',
    });
    expect(callsOf(state.calls, 'session_test_results', 'insert')[0].payload).toEqual([
      {
        test_id: 't1',
        character_id: 'c1',
        player_id: 'p1',
        status: 'pending',
        master_mark: null,
      },
      {
        test_id: 't1',
        character_id: 'c2',
        player_id: 'p2',
        status: 'pending',
        master_mark: null,
      },
    ]);
  });

  it('grava a marca de Vantagem ou Desvantagem de cada alvo; sem marca é Normal (nulo)', async () => {
    state.respond = (call) => (call.table === 'session_tests' ? { data: { id: 't1' } } : undefined);
    await createSessionTest(
      's1',
      'Força',
      12,
      [
        { characterId: 'c1', playerId: 'p1', masterMark: 'vantagem' },
        { characterId: 'c2', playerId: 'p2', masterMark: 'desvantagem' },
        { characterId: 'c3', playerId: 'p3' },
      ],
      null,
    );
    const rows = callsOf(state.calls, 'session_test_results', 'insert')[0].payload as {
      master_mark: unknown;
    }[];
    expect(rows.map((r) => r.master_mark)).toEqual(['vantagem', 'desvantagem', null]);
  });

  it('grava o uso do Teste de Fé e a marca de Pedido Egoísta', async () => {
    state.respond = (call) => (call.table === 'session_tests' ? { data: { id: 't1' } } : undefined);
    await createSessionTest('s1', 'Fé', -20, [{ characterId: 'c1', playerId: 'p1' }], {
      use: 'clamor',
      selfishRequest: true,
    });
    expect(callsOf(state.calls, 'session_tests', 'insert')[0].payload).toEqual({
      session_id: 's1',
      test_type: 'Fé',
      difficulty: -20,
      faith_use: 'clamor',
      selfish_request: true,
      status: 'active',
    });
  });

  it('se gravar o Teste falhar, não grava resultado nenhum', async () => {
    state.respond = () => ({ error: failure });
    await expect(createSessionTest('s1', 'Fé', 0, [], null)).rejects.toBe(failure);
    expect(callsOf(state.calls, 'session_test_results')).toEqual([]);
  });

  it('lança o erro ao gravar os resultados', async () => {
    state.respond = (call) =>
      call.table === 'session_test_results' ? { error: failure } : { data: { id: 't1' } };
    await expect(createSessionTest('s1', 'Fé', 0, [], null)).rejects.toBe(failure);
  });
});

describe('saveTestResult', () => {
  it('marca o resultado como enviado, com o total, o dado e a aprovação', async () => {
    await saveTestResult('r1', {
      resultValue: 15,
      rollValue: 13,
      isApproved: true,
      appliedMode: 'vantagem',
      rollValues: [13, 9],
      inspirationUsed: true,
    });
    const [call] = callsOf(state.calls, 'session_test_results', 'update');
    expect(call.payload).toMatchObject({
      result_value: 15,
      roll_value: 13,
      is_approved: true,
      applied_mode: 'vantagem',
      roll_values: [13, 9],
      inspiration_used: true,
      status: 'submitted',
    });
    expect(typeof (call.payload as { updated_at: unknown }).updated_at).toBe('string');
    expect(filterOf(call, 'eq', 'id')).toBe('r1');
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(
      saveTestResult('r1', {
        resultValue: 1,
        rollValue: null,
        isApproved: false,
        appliedMode: null,
        rollValues: null,
        inspirationUsed: false,
      }),
    ).rejects.toBe(failure);
  });
});

describe('cancelSessionTest e completeSessionTest', () => {
  it('só mudam o status do Teste dado', async () => {
    await cancelSessionTest('t1');
    await completeSessionTest('t2');
    const [cancel, complete] = callsOf(state.calls, 'session_tests', 'update');
    expect(cancel.payload).toEqual({ status: 'cancelled' });
    expect(filterOf(cancel, 'eq', 'id')).toBe('t1');
    expect(complete.payload).toEqual({ status: 'completed' });
    expect(filterOf(complete, 'eq', 'id')).toBe('t2');
  });

  it('lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(cancelSessionTest('t1')).rejects.toBe(failure);
    await expect(completeSessionTest('t1')).rejects.toBe(failure);
  });
});

describe('leituras', () => {
  it('getActiveTestsForSession lê só os Testes ativos da sessão', async () => {
    state.respond = () => ({ data: [{ id: 't1' }] });
    await expect(getActiveTestsForSession('s1')).resolves.toEqual([{ id: 't1' }]);
    const [call] = callsOf(state.calls, 'session_tests', 'select');
    expect(call.filters).toContainEqual(['eq', 'session_id', 's1']);
    expect(call.filters).toContainEqual(['eq', 'status', 'active']);
  });

  it('getTestResults lê os resultados do Teste', async () => {
    state.respond = () => ({ data: [{ id: 'r1' }] });
    await expect(getTestResults('t1')).resolves.toEqual([{ id: 'r1' }]);
    const [call] = callsOf(state.calls, 'session_test_results', 'select');
    expect(filterOf(call, 'eq', 'test_id')).toBe('t1');
  });

  it('lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getActiveTestsForSession('s1')).rejects.toBe(failure);
    await expect(getTestResults('t1')).rejects.toBe(failure);
  });
});
