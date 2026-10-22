// CARACTERIZAÇÃO: o hook das sessões em que o jogador está: sem usuário não consulta; com usuário
// carrega as sessões ativas, e uma troca do objeto do usuário (mesmo com o mesmo id) consulta de
// novo, com `loading` ligado. Decisões: ROADMAP.md, Onda 4, passo 7b.
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivePlayerSession } from '@/data-access/sessions';

const h = vi.hoisted(() => ({
  listPlayerActiveSessions: vi.fn(),
  user: null as { id: string } | null,
}));

vi.mock('@/data-access/sessions', () => ({
  listPlayerActiveSessions: h.listPlayerActiveSessions,
}));
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ user: h.user }),
}));

import { useActiveSession } from './useActiveSession';

const session = (id: string) =>
  ({ session_id: id, session_name: `Sessão ${id}` }) as ActivePlayerSession;

const deferred = <T>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
};

beforeEach(() => {
  h.user = { id: 'u1' };
  h.listPlayerActiveSessions.mockReset().mockResolvedValue([session('a')]);
});

describe('useActiveSession', () => {
  it('com usuário, começa carregando e termina com as sessões ativas dele', async () => {
    const { result } = renderHook(() => useActiveSession());
    expect(result.current.loading).toBe(true);
    expect(result.current.activeSessions).toEqual([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeSessions).toEqual([session('a')]);
    expect(h.listPlayerActiveSessions).toHaveBeenCalledWith('u1');
    expect(h.listPlayerActiveSessions).toHaveBeenCalledTimes(1);
  });

  it('sem usuário não consulta, não registra erro e termina o carregamento', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.user = null;
    const { result } = renderHook(() => useActiveSession());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeSessions).toEqual([]);
    expect(h.listPlayerActiveSessions).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('se a consulta falha, registra o erro e termina o carregamento', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.listPlayerActiveSessions.mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useActiveSession());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeSessions).toEqual([]);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('um objeto de usuário novo (mesmo id) consulta de novo, com `loading` ligado', async () => {
    const { result, rerender } = renderHook(() => useActiveSession());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const next = deferred<ActivePlayerSession[]>();
    h.listPlayerActiveSessions.mockReturnValue(next.promise);
    h.user = { id: 'u1' };
    rerender();
    expect(result.current.loading).toBe(true);
    expect(h.listPlayerActiveSessions).toHaveBeenCalledTimes(2);
    await act(async () => next.resolve([session('b')]));
    expect(result.current.loading).toBe(false);
    expect(result.current.activeSessions).toEqual([session('b')]);
  });

  it('o mesmo objeto de usuário não consulta de novo', async () => {
    const { result, rerender } = renderHook(() => useActiveSession());
    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender();
    await act(async () => {});
    expect(h.listPlayerActiveSessions).toHaveBeenCalledTimes(1);
  });

  it('o usuário sair deixa de carregar e não consulta', async () => {
    const { result, rerender } = renderHook(() => useActiveSession());
    await waitFor(() => expect(result.current.loading).toBe(false));
    h.user = null;
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(h.listPlayerActiveSessions).toHaveBeenCalledTimes(1);
  });
});
