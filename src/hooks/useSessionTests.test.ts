// CARACTERIZAÇÃO: o hook dos Testes da sessão: carrega os Testes ativos e os resultados de cada
// um, mostra `loading` a cada consulta (também nas que o realtime dispara) e reage ao realtime.
// Decisões: ROADMAP.md, Onda 4, passo 7b. Termos: CONTEXT.md (Teste).
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TableSubscription } from '@/data-access/realtime';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';

const h = vi.hoisted(() => ({
  getActiveTestsForSession: vi.fn(),
  getTestResults: vi.fn(),
  subscriptions: [] as unknown[],
  options: undefined as { onSubscribed?: () => void } | undefined,
  stopped: 0,
  subscribed: 0,
}));

vi.mock('@/data-access/sessionTests', () => ({
  getActiveTestsForSession: h.getActiveTestsForSession,
  getTestResults: h.getTestResults,
}));
vi.mock('@/data-access/realtime', () => ({
  subscribeToTables: (
    _name: string,
    subscriptions: unknown[],
    options?: { onSubscribed?: () => void },
  ) => {
    h.subscribed += 1;
    h.subscriptions = subscriptions;
    h.options = options;
    return () => {
      h.stopped += 1;
    };
  },
}));

import { useSessionTests } from './useSessionTests';

const test = (id: string) => ({ id, session_id: 's1', status: 'active' }) as SessionTest;
const resultOf = (id: string, testId: string) => ({ id, test_id: testId }) as SessionTestResult;

const subscription = (table: string) =>
  (h.subscriptions as TableSubscription[]).find((s) => s.table === table);

const deferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
};

beforeEach(() => {
  h.getActiveTestsForSession.mockReset().mockResolvedValue([test('t1'), test('t2')]);
  h.getTestResults
    .mockReset()
    .mockImplementation(async (testId: string) => [resultOf(`r-${testId}`, testId)]);
  h.subscriptions = [];
  h.options = undefined;
  h.stopped = 0;
  h.subscribed = 0;
});

describe('useSessionTests: carga', () => {
  it('começa carregando e termina com os Testes ativos e os resultados de cada um', async () => {
    const { result } = renderHook(() => useSessionTests('s1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.activeTests).toEqual([]);
    expect(result.current.testResults).toEqual({});
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTests.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(result.current.testResults).toEqual({
      t1: [resultOf('r-t1', 't1')],
      t2: [resultOf('r-t2', 't2')],
    });
    expect(h.getActiveTestsForSession).toHaveBeenCalledWith('s1');
    expect(h.getTestResults).toHaveBeenCalledTimes(2);
  });

  it('sem Testes ativos, o mapa de resultados fica vazio', async () => {
    h.getActiveTestsForSession.mockResolvedValue([]);
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTests).toEqual([]);
    expect(result.current.testResults).toEqual({});
    expect(h.getTestResults).not.toHaveBeenCalled();
  });

  it('sem sessão (id vazio) não consulta, não assina e fica carregando', async () => {
    const { result } = renderHook(() => useSessionTests(''));
    await act(async () => {});
    expect(h.getActiveTestsForSession).not.toHaveBeenCalled();
    expect(h.subscribed).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  it('se a consulta dos Testes falha, registra o erro e termina o carregamento', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.getActiveTestsForSession.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTests).toEqual([]);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('se os resultados falham, os Testes já guardados ficam e o mapa não é trocado', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.getTestResults.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTests.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(result.current.testResults).toEqual({});
    log.mockRestore();
  });
});

describe('useSessionTests: realtime e atualização', () => {
  it('assina os Testes da sessão e os resultados', async () => {
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(subscription('session_tests')?.filter).toBe('session_id=eq.s1');
    expect(subscription('session_test_results')?.filter).toBeUndefined();
  });

  it('uma mudança do realtime consulta de novo, com `loading` ligado enquanto espera', async () => {
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const next = deferred<SessionTest[]>();
    h.getActiveTestsForSession.mockReturnValue(next.promise);
    act(() => {
      subscription('session_test_results')?.onChange({} as never);
    });
    expect(result.current.loading).toBe(true);
    await act(async () => next.resolve([test('t3')]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTests.map((t) => t.id)).toEqual(['t3']);
    expect(Object.keys(result.current.testResults)).toEqual(['t3']);
  });

  it('se a consulta disparada pelo realtime falha, registra o erro e termina o carregamento', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    h.getActiveTestsForSession.mockRejectedValue(new Error('x'));
    await act(async () => {
      subscription('session_tests')?.onChange({} as never);
    });
    await waitFor(() => expect(log).toHaveBeenCalled());
    expect(result.current.loading).toBe(false);
    expect(result.current.activeTests.map((t) => t.id)).toEqual(['t1', 't2']);
    log.mockRestore();
  });

  it('refresh consulta de novo, com `loading` ligado enquanto espera', async () => {
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const next = deferred<SessionTest[]>();
    h.getActiveTestsForSession.mockReturnValue(next.promise);
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.refresh();
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      next.resolve([]);
      await done;
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.activeTests).toEqual([]);
  });

  it('ao trocar de sessão, liga `loading`, consulta a nova e refaz a assinatura', async () => {
    const { result, rerender } = renderHook(({ id }) => useSessionTests(id), {
      initialProps: { id: 's1' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const next = deferred<SessionTest[]>();
    h.getActiveTestsForSession.mockReturnValue(next.promise);
    rerender({ id: 's2' });
    expect(result.current.loading).toBe(true);
    expect(h.getActiveTestsForSession).toHaveBeenLastCalledWith('s2');
    expect(h.stopped).toBe(1);
    expect(subscription('session_tests')?.filter).toBe('session_id=eq.s2');
    await act(async () => next.resolve([]));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  // Os eventos entre a primeira consulta e a confirmação do canal se perdem (e uma reconexão
  // também perde os seus): quando o servidor confirma, o hook consulta de novo, sem ligar `loading`.
  it('consulta de novo quando o servidor confirma a assinatura, sem ligar `loading`', async () => {
    h.getActiveTestsForSession.mockResolvedValue([]);
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTests).toEqual([]);

    // O Mestre pediu um Teste antes de o canal estar no ar.
    h.getActiveTestsForSession.mockResolvedValue([test('t1')]);
    act(() => {
      h.options?.onSubscribed?.();
    });

    await waitFor(() => expect(result.current.activeTests).toEqual([test('t1')]));
    expect(result.current.testResults).toEqual({ t1: [resultOf('r-t1', 't1')] });
    expect(result.current.loading).toBe(false);
  });

  it('se a consulta da confirmação falha, registra o erro e mantém os Testes', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    h.getActiveTestsForSession.mockRejectedValue(new Error('x'));
    act(() => {
      h.options?.onSubscribed?.();
    });

    await waitFor(() => expect(log).toHaveBeenCalled());
    expect(result.current.activeTests).toEqual([test('t1'), test('t2')]);
  });

  it('ao sair, cancela a assinatura', async () => {
    const { result, unmount } = renderHook(() => useSessionTests('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    unmount();
    expect(h.stopped).toBe(1);
  });
});
