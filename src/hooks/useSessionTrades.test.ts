// CARACTERIZAÇÃO: o hook das trocas da sessão: carrega as trocas abertas, mostra `loading` a cada
// consulta (também nas que o realtime dispara), reage ao realtime e diz quem está negociando.
// Decisões: ROADMAP.md, Onda 4, passo 7b.
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TableSubscription } from '@/data-access/realtime';
import type { TradeWithItems } from '@/types/trade';

const h = vi.hoisted(() => ({
  getActiveTradesForSession: vi.fn(),
  subscriptions: [] as unknown[],
  stopped: 0,
  subscribed: 0,
}));

vi.mock('@/data-access/trades', () => ({
  getActiveTradesForSession: h.getActiveTradesForSession,
}));
vi.mock('@/data-access/realtime', () => ({
  subscribeToTables: (_name: string, subscriptions: unknown[]) => {
    h.subscribed += 1;
    h.subscriptions = subscriptions;
    return () => {
      h.stopped += 1;
    };
  },
}));

import { useSessionTrades } from './useSessionTrades';

const trade = (over: Partial<TradeWithItems> = {}) =>
  ({
    id: 't1',
    status: 'active',
    initiator_character_id: 'c1',
    target_character_id: 'c2',
    trade_items: [],
    ...over,
  }) as TradeWithItems;

const subscription = (table: string) =>
  (h.subscriptions as TableSubscription[]).find((s) => s.table === table);

/** Uma consulta que o teste termina quando quiser. */
const deferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
};

beforeEach(() => {
  h.getActiveTradesForSession.mockReset().mockResolvedValue([trade()]);
  h.subscriptions = [];
  h.stopped = 0;
  h.subscribed = 0;
});

describe('useSessionTrades: carga', () => {
  it('começa carregando, sem trocas, e termina com as trocas da sessão', async () => {
    const { result } = renderHook(() => useSessionTrades('s1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.activeTrades).toEqual([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTrades).toEqual([trade()]);
    expect(h.getActiveTradesForSession).toHaveBeenCalledWith('s1');
    expect(h.getActiveTradesForSession).toHaveBeenCalledTimes(1);
  });

  it('sem sessão não consulta, não assina e fica carregando', async () => {
    const { result } = renderHook(() => useSessionTrades(undefined));
    await act(async () => {});
    expect(h.getActiveTradesForSession).not.toHaveBeenCalled();
    expect(h.subscribed).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  it('se a consulta falha, registra o erro, termina o carregamento e mantém as trocas', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.getActiveTradesForSession.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useSessionTrades('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeTrades).toEqual([]);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe('useSessionTrades: realtime e atualização', () => {
  it('assina as trocas da sessão e os itens das trocas', async () => {
    const { result } = renderHook(() => useSessionTrades('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(subscription('trades')?.filter).toBe('session_id=eq.s1');
    expect(subscription('trade_items')?.filter).toBeUndefined();
  });

  it('uma mudança do realtime consulta de novo, com `loading` ligado enquanto espera', async () => {
    const { result } = renderHook(() => useSessionTrades('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const next = deferred<TradeWithItems[]>();
    h.getActiveTradesForSession.mockReturnValue(next.promise);
    act(() => {
      subscription('trade_items')?.onChange({} as never);
    });
    expect(result.current.loading).toBe(true);
    await act(async () => next.resolve([trade({ id: 't2' })]));
    expect(result.current.loading).toBe(false);
    expect(result.current.activeTrades.map((t) => t.id)).toEqual(['t2']);
  });

  it('refresh consulta de novo, com `loading` ligado enquanto espera', async () => {
    const { result } = renderHook(() => useSessionTrades('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const next = deferred<TradeWithItems[]>();
    h.getActiveTradesForSession.mockReturnValue(next.promise);
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
    expect(result.current.activeTrades).toEqual([]);
  });

  it('refresh sem sessão não faz nada', async () => {
    const { result } = renderHook(() => useSessionTrades(undefined));
    await act(async () => {
      await result.current.refresh();
    });
    expect(h.getActiveTradesForSession).not.toHaveBeenCalled();
  });

  it('ao trocar de sessão, liga `loading`, consulta a nova e refaz a assinatura', async () => {
    const { result, rerender } = renderHook(({ id }) => useSessionTrades(id), {
      initialProps: { id: 's1' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const next = deferred<TradeWithItems[]>();
    h.getActiveTradesForSession.mockReturnValue(next.promise);
    rerender({ id: 's2' });
    expect(result.current.loading).toBe(true);
    expect(h.getActiveTradesForSession).toHaveBeenLastCalledWith('s2');
    expect(h.stopped).toBe(1);
    expect(subscription('trades')?.filter).toBe('session_id=eq.s2');
    await act(async () => next.resolve([trade({ id: 't9' })]));
    expect(result.current.loading).toBe(false);
    expect(result.current.activeTrades.map((t) => t.id)).toEqual(['t9']);
  });

  it('ao sair, cancela a assinatura', async () => {
    const { result, unmount } = renderHook(() => useSessionTrades('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    unmount();
    expect(h.stopped).toBe(1);
  });
});

describe('useSessionTrades: quem está negociando', () => {
  const load = async (trades: TradeWithItems[]) => {
    h.getActiveTradesForSession.mockResolvedValue(trades);
    const { result } = renderHook(() => useSessionTrades('s1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    return result.current;
  };

  it('troca ativa ou pendente marca os dois personagens', async () => {
    const hook = await load([
      trade({ id: 'a', status: 'active', initiator_character_id: 'c1', target_character_id: 'c2' }),
      trade({
        id: 'b',
        status: 'pending',
        initiator_character_id: 'c3',
        target_character_id: null,
      }),
    ]);
    expect([...hook.tradingCharacterIds].sort()).toEqual(['c1', 'c2', 'c3']);
    expect(hook.isCharacterTrading('c1')).toBe(true);
    expect(hook.isCharacterTrading('c3')).toBe(true);
  });

  it('troca concluída ou cancelada não marca ninguém', async () => {
    const hook = await load([
      trade({ id: 'a', status: 'completed' }),
      trade({ id: 'b', status: 'cancelled', initiator_character_id: 'c9' }),
    ]);
    expect(hook.tradingCharacterIds.size).toBe(0);
    expect(hook.isCharacterTrading('c1')).toBe(false);
  });

  it('personagem ausente (null, undefined, sem id) nunca está negociando', async () => {
    const hook = await load([trade({ initiator_character_id: null, target_character_id: 'c2' })]);
    expect(hook.isCharacterTrading(null)).toBe(false);
    expect(hook.isCharacterTrading(undefined)).toBe(false);
    expect(hook.isCharacterTrading('')).toBe(false);
    expect(hook.isCharacterTrading('c2')).toBe(true);
  });
});
