// CARACTERIZAÇÃO: a janela de troca: quem controla cada lado, o título por tipo, a execução
// automática quando os dois lados estão prontos e o que acontece se ela falha, e o cancelamento.
// Os dois lados (TradeSide) são stubs que desenham as props. Decisões: ROADMAP.md, Onda 4,
// passo 7a. Termos: CONTEXT.md (Troca).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({
  cancelTrade: vi.fn(),
  executeTrade: vi.fn(),
  setReady: vi.fn(),
}));

vi.mock('@/data-access/trades', () => ({
  cancelTrade: h.cancelTrade,
  executeTrade: h.executeTrade,
  setReady: h.setReady,
}));
vi.mock('./TradeSide', async () => ({
  TradeSide: (await import('@/test/stubs')).makeStub('TradeSide', (props) => String(props.side)),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import type { Character } from '@/features/character-management/types';
import type { TradeWithItems } from '@/types/trade';
import { TradeDialog } from './TradeDialog';

const onClose = vi.fn();
const onTradeUpdated = vi.fn();

// A janela executa a troca por uma mutation do react-query, que pede o provider.
let queryClient = new QueryClient();
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient = new QueryClient();
  clearStubs();
  Object.values(h).forEach((fn) => fn.mockReset());
  h.cancelTrade.mockResolvedValue(undefined);
  h.setReady.mockResolvedValue(undefined);
  onClose.mockReset();
  onTradeUpdated.mockReset();
});
afterEach(cleanup);

const trade = (over: Partial<TradeWithItems> = {}): TradeWithItems => ({
  id: 't1',
  session_id: 's1',
  type: 'player_trade',
  status: 'active',
  initiator_character_id: 'c-eli',
  initiator_user_id: 'u-eli',
  target_character_id: 'c-ana',
  target_npc_id: null,
  initiator_coins: 3,
  target_coins: 7,
  initiator_ready: false,
  target_ready: false,
  created_at: '',
  completed_at: null,
  trade_items: [],
  ...over,
});
const player = (userId: string, id: string, name: string, coins: number) => ({
  user_id: userId,
  character: { id, name, coins } as Character,
});
const players = [player('u-eli', 'c-eli', 'Eli', 10), player('u-ana', 'c-ana', 'Ana', 20)];

const show = (
  t: TradeWithItems,
  props: { currentUserId?: string; isGM?: boolean; npcName?: string } = {},
) =>
  render(
    <TradeDialog
      trade={t}
      isOpen
      currentUserId={props.currentUserId ?? 'u-eli'}
      isGM={props.isGM ?? false}
      playerCharacters={players}
      npcName={props.npcName}
      onClose={onClose}
      onTradeUpdated={onTradeUpdated}
    />,
    { wrapper },
  );
const side = (name: 'initiator' | 'target') =>
  stubProps('TradeSide', name) as Record<string, unknown>;

describe('TradeDialog: título e rótulos', () => {
  it.each([
    ['player_trade', 'Negociação'],
    ['shop', 'Lojinha do Mestre'],
    ['npc_trade', 'Negociação com NPC'],
  ] as const)('o tipo %s se chama "%s"', (type, title) => {
    show(trade({ type }));
    expect(screen.getByText(title)).toBeTruthy();
  });

  it('troca entre jogadores: os rótulos são os nomes das fichas', () => {
    show(trade());
    expect(screen.getByText('Eli ↔ Ana')).toBeTruthy();
    expect(side('initiator').label).toBe('Eli');
    expect(side('target').label).toBe('Ana');
  });

  it('lojinha: o iniciador é o Mestre', () => {
    show(trade({ type: 'shop', initiator_character_id: null }));
    expect(side('initiator').label).toBe('Mestre (Lojinha)');
  });

  it('troca com NPC sem ficha-alvo usa o nome do NPC, ou "NPC"', () => {
    const npc = trade({ type: 'npc_trade', target_character_id: null, target_npc_id: 'n1' });
    const { unmount } = show(npc, { npcName: 'Mercador' });
    expect(side('target').label).toBe('Mercador');
    unmount();
    clearStubs();
    show(npc);
    expect(side('target').label).toBe('NPC');
  });

  it('sem ficha encontrada, os rótulos caem em "Iniciador" e "Alvo"', () => {
    show(trade({ initiator_character_id: 'x', target_character_id: 'y' }));
    expect(side('initiator').label).toBe('Iniciador');
    expect(side('target').label).toBe('Alvo');
  });
});

describe('TradeDialog: o que cada lado recebe', () => {
  it('passa moedas, prontidão e o saldo da ficha, cruzando a prontidão do outro', () => {
    show(trade({ initiator_ready: true }));
    expect(side('initiator')).toMatchObject({
      coins: 3,
      isReady: true,
      otherSideReady: false,
      characterId: 'c-eli',
      characterCoins: 10,
    });
    expect(side('target')).toMatchObject({
      coins: 7,
      isReady: false,
      otherSideReady: true,
      characterId: 'c-ana',
      characterCoins: 20,
    });
  });

  it('troca entre jogadores: cada um edita só o próprio lado', () => {
    show(trade(), { currentUserId: 'u-eli' });
    expect(side('initiator').canEdit).toBe(true);
    expect(side('target').canEdit).toBe(false);
    cleanup();
    clearStubs();
    show(trade(), { currentUserId: 'u-ana' });
    expect(side('initiator').canEdit).toBe(false);
    expect(side('target').canEdit).toBe(true);
  });

  it('só se edita com a troca ativa', () => {
    show(trade({ status: 'pending' }));
    expect(side('initiator').canEdit).toBe(false);
  });

  it('lojinha: o Mestre edita o lado do iniciador, o jogador o dele, e o catálogo vale só no lado do Mestre', () => {
    const shop = trade({ type: 'shop', initiator_character_id: null });
    show(shop, { currentUserId: 'u-gm', isGM: true });
    expect(side('initiator')).toMatchObject({
      canEdit: true,
      useCatalog: true,
      skipBalanceCheck: true,
    });
    expect(side('target')).toMatchObject({ canEdit: false, useCatalog: false });
    cleanup();
    clearStubs();
    show(shop, { currentUserId: 'u-ana' });
    expect(side('initiator').canEdit).toBe(false);
    expect(side('target').canEdit).toBe(true);
  });

  it('troca com NPC sem ficha: o Mestre edita o lado do NPC, que usa o catálogo', () => {
    const t = trade({ type: 'npc_trade', target_character_id: null, target_npc_id: 'n1' });
    show(t, { currentUserId: 'u-gm', isGM: true });
    expect(side('target')).toMatchObject({
      canEdit: true,
      useCatalog: true,
      skipBalanceCheck: true,
    });
  });

  it('troca com NPC vista por jogador: o lado do NPC não usa o catálogo', () => {
    const t = trade({ type: 'npc_trade', target_character_id: null, target_npc_id: 'n1' });
    show(t, { currentUserId: 'u-eli', isGM: false });
    expect(side('target')).toMatchObject({ canEdit: false, useCatalog: false });
  });
});

describe('TradeDialog: execução automática', () => {
  const ready = (over: Partial<TradeWithItems> = {}) =>
    trade({ initiator_ready: true, target_ready: true, ...over });

  /** Uma chamada que o teste resolve quando quiser. */
  const deferred = () => {
    let resolve: (value: unknown) => void = () => {};
    let reject: (reason: unknown) => void = () => {};
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

  /**
   * Os dois prontos: a execução começa. Em seguida a troca "chega atualizada" (como depois do
   * recarregamento da sessão), para a execução não recomeçar; só então a chamada termina.
   */
  const executeThenRefresh = async (
    settle: (call: ReturnType<typeof deferred>) => void,
    refreshed: TradeWithItems = trade({ status: 'completed' }),
  ) => {
    const call = deferred();
    h.executeTrade.mockReturnValue(call.promise);
    const view = show(ready());
    await waitFor(() => expect(h.executeTrade).toHaveBeenCalledTimes(1));
    view.rerender(
      <TradeDialog
        trade={refreshed}
        isOpen
        currentUserId="u-eli"
        isGM={false}
        playerCharacters={players}
        onClose={onClose}
        onTradeUpdated={onTradeUpdated}
      />,
    );
    await act(async () => settle(call));
    return view;
  };

  it('com os dois prontos e a troca ativa, executa pelo id da troca', async () => {
    await executeThenRefresh((call) => call.resolve({ success: true }));
    expect(h.executeTrade).toHaveBeenCalledTimes(1);
    expect(h.executeTrade).toHaveBeenCalledWith('t1');
  });

  it('ao dar certo, atualiza e fecha, sem mexer na prontidão', async () => {
    await executeThenRefresh((call) => call.resolve({ success: true }));
    expect(onTradeUpdated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(h.setReady).not.toHaveBeenCalled();
  });

  it('mostra "Executando transação..." enquanto espera', async () => {
    const call = deferred();
    h.executeTrade.mockReturnValue(call.promise);
    show(ready());
    expect(await screen.findByText('Executando transação...')).toBeTruthy();
    call.resolve({ success: true });
  });

  it('o aviso some quando a execução termina', async () => {
    await executeThenRefresh((call) => call.resolve({ success: true }));
    await waitFor(() => expect(screen.queryByText('Executando transação...')).toBeNull());
  });

  it.each([
    ['só o iniciador pronto', trade({ initiator_ready: true })],
    ['só o alvo pronto', trade({ target_ready: true })],
    ['ninguém pronto', trade()],
    ['os dois prontos, mas a troca ainda pendente', ready({ status: 'pending' })],
    ['os dois prontos, mas a troca já concluída', ready({ status: 'completed' })],
  ])('%s: não executa', async (_name, t) => {
    h.executeTrade.mockResolvedValue({ success: true });
    show(t);
    await act(async () => {});
    expect(h.executeTrade).not.toHaveBeenCalled();
  });

  it('se o servidor recusa, mostra o erro, desmarca os dois lados e atualiza sem fechar', async () => {
    await executeThenRefresh(
      (call) => call.resolve({ success: false, error: 'Saldo insuficiente.' }),
      trade(),
    );
    expect(screen.getByText('Saldo insuficiente.')).toBeTruthy();
    expect(h.setReady).toHaveBeenCalledWith('t1', 'initiator', false);
    expect(h.setReady).toHaveBeenCalledWith('t1', 'target', false);
    expect(onTradeUpdated).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('recusa sem texto usa a mensagem padrão', async () => {
    await executeThenRefresh((call) => call.resolve({ success: false }), trade());
    expect(screen.getByText('Erro ao executar a transação.')).toBeTruthy();
  });

  it('se a chamada lança, mostra a mensagem do erro e não fecha', async () => {
    await executeThenRefresh((call) => call.reject(new Error('rede caiu')), trade());
    expect(screen.getByText('rede caiu')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(onTradeUpdated).not.toHaveBeenCalled();
  });

  it('erro lançado sem texto usa a mensagem padrão', async () => {
    await executeThenRefresh((call) => call.reject('x'), trade());
    expect(screen.getByText('Erro ao executar a transação.')).toBeTruthy();
  });

  it('erro lançado como objeto do Supabase (sem ser Error) mostra o texto dele', async () => {
    await executeThenRefresh((call) => call.reject({ message: 'permissão negada' }), trade());
    expect(screen.getByText('permissão negada')).toBeTruthy();
  });

  // O fim da execução devolve `executing` a `false` com as props ainda mostrando os dois prontos
  // (a troca só chega atualizada depois do realtime). A chamada demora um instante, como a rede (a
  // mutation só mostra "executando" se ela durar mais que um ciclo do navegador). Executar de novo
  // ali faria o servidor responder "Trade não está ativa" e a recusa desmarcaria os dois lados de
  // uma troca já concluída.
  const afterAWhile = <T,>(value: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value), 20));
  const settled = () => new Promise((resolve) => setTimeout(resolve, 80));

  it('com as props ainda mostrando os dois prontos, executa uma vez só', async () => {
    h.executeTrade.mockReturnValue(afterAWhile({ success: true }));
    show(ready());
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await act(settled);
    expect(h.executeTrade).toHaveBeenCalledTimes(1);
    expect(h.setReady).not.toHaveBeenCalled();
  });

  it('o erro de uma recusa continua na tela enquanto as props mostram os dois prontos', async () => {
    h.executeTrade.mockReturnValue(afterAWhile({ success: false, error: 'Saldo insuficiente.' }));
    show(ready());
    await waitFor(() => expect(h.setReady).toHaveBeenCalledWith('t1', 'target', false));
    await act(settled);
    expect(h.executeTrade).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Saldo insuficiente.')).toBeTruthy();
  });

  it('desmarcada a prontidão e marcada de novo, executa outra vez', async () => {
    h.executeTrade.mockResolvedValue({ success: false, error: 'Saldo insuficiente.' });
    const view = show(ready());
    await waitFor(() => expect(h.executeTrade).toHaveBeenCalledTimes(1));
    const rerender = (t: TradeWithItems) =>
      view.rerender(
        <TradeDialog
          trade={t}
          isOpen
          currentUserId="u-eli"
          isGM={false}
          playerCharacters={players}
          onClose={onClose}
          onTradeUpdated={onTradeUpdated}
        />,
      );
    rerender(trade());
    rerender(ready());
    await waitFor(() => expect(h.executeTrade).toHaveBeenCalledTimes(2));
  });
});

describe('TradeDialog: pronto e cancelar', () => {
  it('marcar pronto grava o lado e atualiza', async () => {
    show(trade());
    await act(async () => (side('target').onReady as (ready: boolean) => void)(true));
    expect(h.setReady).toHaveBeenCalledWith('t1', 'target', true);
    expect(onTradeUpdated).toHaveBeenCalledTimes(1);
  });

  it('se gravar o pronto falha, registra o erro e não atualiza', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.setReady.mockRejectedValue(new Error('x'));
    show(trade());
    await act(async () => (side('initiator').onReady as (ready: boolean) => void)(true));
    expect(log).toHaveBeenCalled();
    expect(onTradeUpdated).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('Cancelar cancela a troca, atualiza e fecha', async () => {
    show(trade());
    await act(async () => screen.getByRole('button', { name: 'Cancelar' }).click());
    expect(h.cancelTrade).toHaveBeenCalledWith('t1');
    expect(onTradeUpdated).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se o cancelamento falha, registra o erro e não fecha', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.cancelTrade.mockRejectedValue(new Error('x'));
    show(trade());
    await act(async () => screen.getByRole('button', { name: 'Cancelar' }).click());
    expect(log).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
