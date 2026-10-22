// Fixa o hook que monta a mesa do Mestre: carrega o elenco, reage às mudanças do realtime e
// remenda o estado local sem nova consulta.
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TableSubscription } from '@/data-access/realtime';

const state = vi.hoisted(() => ({
  roster: undefined as unknown,
  fetchError: undefined as unknown,
  fetchCount: 0,
  hold: undefined as Promise<void> | undefined,
  subscriptions: [] as unknown[],
  stopped: 0,
}));

vi.mock('@/data-access/sessions', () => ({
  fetchSessionRoster: vi.fn(async () => {
    state.fetchCount += 1;
    await state.hold;
    if (state.fetchError) throw state.fetchError;
    return state.roster;
  }),
  groupSessionRoster: (roster: unknown) => roster,
}));

vi.mock('@/data-access/realtime', () => ({
  subscribeToTables: (_name: string, subscriptions: unknown[]) => {
    state.subscriptions = subscriptions;
    return () => {
      state.stopped += 1;
    };
  },
}));

import { useSessionCharacters } from './useSessionCharacters';

const grouped = () => ({
  players: [
    { user_id: 'u1', character: { id: 'p1', name: 'Ana', stats: { pv: 10 } }, profile: null },
  ],
  npcs: [{ id: 'n1', name: 'Mercador', is_playable: false }],
  enemies: [{ id: 'e1', name: 'Soldado', stats: { pv: 8 } }],
});

const subscription = (table: string) =>
  (state.subscriptions as TableSubscription[]).find((s) => s.table === table);

beforeEach(() => {
  state.roster = grouped();
  state.fetchError = undefined;
  state.fetchCount = 0;
  state.hold = undefined;
  state.subscriptions = [];
  state.stopped = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(console.error).mockClear();
});

describe('useSessionCharacters', () => {
  it('carrega e separa o elenco da sessão', async () => {
    const { result } = renderHook(() => useSessionCharacters('s1'));
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.playerCharacters).toEqual(grouped().players);
    expect(result.current.npcs).toEqual(grouped().npcs);
    expect(result.current.enemies).toEqual(grouped().enemies);
  });

  it('sem sessão, não consulta nem assina', () => {
    renderHook(() => useSessionCharacters(undefined));
    expect(state.fetchCount).toBe(0);
    expect(state.subscriptions).toEqual([]);
  });

  it('mantém o elenco anterior e registra o erro quando a consulta falha', async () => {
    const { result } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    state.fetchError = { message: 'sem rede' };
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.enemies).toEqual(grouped().enemies);
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching session characters:',
      state.fetchError,
    );
  });

  it('se a primeira consulta falha, registra o erro, termina o carregamento e deixa o elenco vazio', async () => {
    state.fetchError = { message: 'sem rede' };
    const { result } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.playerCharacters).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching session characters:',
      state.fetchError,
    );
  });

  it('assina as tabelas da sessão e consulta de novo a cada mudança', async () => {
    const { result } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const tables = (state.subscriptions as TableSubscription[]).map((s) => s.table);
    expect(tables).toEqual([
      'session_participants',
      'character_items',
      'characters',
      'session_npcs',
      'combats',
    ]);
    expect(subscription('session_participants')?.filter).toBe('session_id=eq.s1');
    expect(subscription('characters')?.event).toBe('UPDATE');

    const before = state.fetchCount;
    await act(async () => {
      subscription('character_items')?.onChange({} as never);
    });
    await waitFor(() => expect(state.fetchCount).toBe(before + 1));
  });

  it('só consulta de novo quando o combate termina', async () => {
    const { result } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const before = state.fetchCount;

    for (const status of ['setup', 'active', 'paused']) {
      await act(async () => {
        subscription('combats')?.onChange({ new: { status } } as never);
      });
    }
    expect(state.fetchCount).toBe(before);

    await act(async () => {
      subscription('combats')?.onChange({ new: { status: 'finished' } } as never);
    });
    await waitFor(() => expect(state.fetchCount).toBe(before + 1));
  });

  it('uma mudança do realtime liga isLoading enquanto consulta de novo', async () => {
    const { result } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let finish: () => void = () => {};
    state.hold = new Promise<void>((resolve) => (finish = resolve));
    act(() => {
      subscription('character_items')?.onChange({} as never);
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      finish();
      state.hold = undefined;
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('refresh liga isLoading enquanto consulta de novo', async () => {
    const { result } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let finish: () => void = () => {};
    state.hold = new Promise<void>((resolve) => (finish = resolve));
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.refresh();
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      finish();
      state.hold = undefined;
      await done;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('ao trocar de sessão, liga isLoading, consulta a nova e refaz as assinaturas', async () => {
    const { result, rerender } = renderHook(({ id }) => useSessionCharacters(id), {
      initialProps: { id: 's1' },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let finish: () => void = () => {};
    state.hold = new Promise<void>((resolve) => (finish = resolve));
    const before = state.fetchCount;
    rerender({ id: 's2' });
    expect(result.current.isLoading).toBe(true);
    expect(state.fetchCount).toBe(before + 1);
    expect(state.stopped).toBeGreaterThan(0);
    expect(subscription('session_participants')?.filter).toBe('session_id=eq.s2');
    await act(async () => {
      finish();
      state.hold = undefined;
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('se a consulta do realtime falha, registra o erro e termina o carregamento', async () => {
    const { result } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    state.fetchError = { message: 'sem rede' };
    await act(async () => {
      subscription('character_items')?.onChange({} as never);
    });
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(result.current.isLoading).toBe(false);
  });

  it('cancela as assinaturas ao desmontar', async () => {
    const { result, unmount } = renderHook(() => useSessionCharacters('s1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    unmount();
    expect(state.stopped).toBeGreaterThan(0);
  });

  describe('updateLocal', () => {
    const loaded = async () => {
      const hook = renderHook(() => useSessionCharacters('s1'));
      await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
      return hook.result;
    };

    it('remenda a ficha do jogador dentro do embrulho', async () => {
      const result = await loaded();
      act(() => result.current.updateLocal('player', 'p1', { stats: { pv: 10, ca: 12 } as never }));

      expect(result.current.playerCharacters[0]).toEqual({
        user_id: 'u1',
        character: { id: 'p1', name: 'Ana', stats: { pv: 10, ca: 12 } },
        profile: null,
      });
    });

    it('remenda o NPC e o inimigo pelo id', async () => {
      const result = await loaded();
      act(() => result.current.updateLocal('npc', 'n1', { is_visible: true }));
      act(() => result.current.updateLocal('enemy', 'e1', { name: 'Capitão' }));

      expect(result.current.npcs[0]).toMatchObject({ id: 'n1', is_visible: true });
      expect(result.current.enemies[0]).toMatchObject({ id: 'e1', name: 'Capitão' });
    });

    it('não mexe em nada quando o id não existe', async () => {
      const result = await loaded();
      const { playerCharacters, npcs, enemies } = result.current;

      act(() => result.current.updateLocal('player', 'nada', { name: 'X' }));
      act(() => result.current.updateLocal('npc', 'nada', { name: 'X' }));
      act(() => result.current.updateLocal('enemy', 'nada', { name: 'X' }));

      expect(result.current.playerCharacters).toBe(playerCharacters);
      expect(result.current.npcs).toBe(npcs);
      expect(result.current.enemies).toBe(enemies);
    });
  });
});
