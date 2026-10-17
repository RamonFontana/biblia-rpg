// CARACTERIZAÇÃO: fixa o comportamento ATUAL da troca de itens e moedas entre personagens, NPCs e
// lojas, com um Supabase falso que só grava as chamadas. A transferência em si acontece na função
// SQL `execute_trade`, que não é testada aqui nem no repositório.
// Decisões: ROADMAP.md, Onda 2 (bloco B): Qualidade de item de 1 a 5 (ADR 0002).
// Termos: CONTEXT.md (Qualidade).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
}));

vi.mock('../lib/supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
    }),
  };
});

import { callsOf, filterOf } from '../test/fakeSupabase';
import { tradeService } from './tradeService';

const resetFlags = { initiator_ready: false, target_ready: false };
const ops = () => state.calls.map((c) => `${c.table}:${c.op}`);

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
});

describe('createTrade', () => {
  it('começa pendente, sem moedas, e preenche só o lado que veio', async () => {
    state.respond = () => ({ data: { id: 't1' } });
    await tradeService.createTrade({
      sessionId: 's1',
      type: 'player_trade',
      initiatorUserId: 'u1',
      initiatorCharacterId: 'c1',
      targetCharacterId: 'c2',
    });
    expect(callsOf(state.calls, 'trades', 'insert')[0].payload).toEqual({
      session_id: 's1',
      type: 'player_trade',
      status: 'pending',
      initiator_user_id: 'u1',
      initiator_character_id: 'c1',
      target_character_id: 'c2',
      target_npc_id: null,
    });
  });

  it('uma loja pode nascer já ativa', async () => {
    state.respond = () => ({ data: { id: 't1' } });
    await tradeService.createTrade({
      sessionId: 's1',
      type: 'shop',
      status: 'active',
      initiatorUserId: 'u1',
      targetNpcId: 'npc1',
    });
    expect(callsOf(state.calls, 'trades', 'insert')[0].payload).toMatchObject({
      status: 'active',
      target_npc_id: 'npc1',
      initiator_character_id: null,
    });
  });
});

describe('acceptTrade e cancelTrade', () => {
  it('aceitar só vale para uma troca pendente', async () => {
    state.respond = () => ({ data: { id: 't1' } });
    await tradeService.acceptTrade('t1');
    const update = callsOf(state.calls, 'trades', 'update')[0];
    expect(update.payload).toEqual({ status: 'active' });
    expect(update.filters).toEqual([
      ['eq', 'id', 't1'],
      ['eq', 'status', 'pending'],
    ]);
  });

  it('cancelar grava o estado e a hora, qualquer que seja o estado anterior', async () => {
    await tradeService.cancelTrade('t1');
    const update = callsOf(state.calls, 'trades', 'update')[0];
    expect(update.payload).toMatchObject({ status: 'cancelled' });
    expect(typeof (update.payload as { completed_at: unknown }).completed_at).toBe('string');
    expect(update.filters).toEqual([['eq', 'id', 't1']]);
  });

  it('erros do banco são lançados', async () => {
    state.respond = () => ({ error: new Error('falhou') });
    await expect(tradeService.acceptTrade('t1')).rejects.toThrow('falhou');
    await expect(tradeService.cancelTrade('t1')).rejects.toThrow('falhou');
  });
});

describe('moedas e "pronto"', () => {
  it('mudar as moedas de um lado desmarca "pronto" dos DOIS lados', async () => {
    state.respond = () => ({ data: { id: 't1' } });
    await tradeService.updateTradeCoins('t1', 'initiator', 30);
    expect(callsOf(state.calls, 'trades', 'update')[0].payload).toEqual({
      initiator_coins: 30,
      ...resetFlags,
    });
    await tradeService.updateTradeCoins('t1', 'target', 5);
    expect(callsOf(state.calls, 'trades', 'update')[1].payload).toEqual({
      target_coins: 5,
      ...resetFlags,
    });
  });

  it('GAP conhecido: o serviço aceita moedas negativas ou fracionadas e deixa a validação ao banco', async () => {
    state.respond = () => ({ data: { id: 't1' } });
    await tradeService.updateTradeCoins('t1', 'initiator', -10);
    await tradeService.updateTradeCoins('t1', 'initiator', 2.5);
    const sent = callsOf(state.calls, 'trades', 'update').map(
      (c) => (c.payload as { initiator_coins: number }).initiator_coins,
    );
    expect(sent).toEqual([-10, 2.5]);
  });

  it('marcar "pronto" mexe só no lado de quem marcou', async () => {
    state.respond = () => ({ data: { id: 't1' } });
    await tradeService.setReady('t1', 'target', true);
    expect(callsOf(state.calls, 'trades', 'update')[0].payload).toEqual({ target_ready: true });
    await tradeService.setReady('t1', 'initiator', false);
    expect(callsOf(state.calls, 'trades', 'update')[1].payload).toEqual({
      initiator_ready: false,
    });
  });
});

describe('addTradeItem', () => {
  it('item novo entra com a quantidade pedida e desmarca "pronto"', async () => {
    state.respond = (call) =>
      call.table === 'trade_items' && call.op === 'select'
        ? { data: null }
        : call.table === 'trade_items'
          ? { data: { id: 'ti1' } }
          : undefined;
    await tradeService.addTradeItem('t1', 'initiator', 'item-a', 2);
    expect(callsOf(state.calls, 'trade_items', 'insert')[0].payload).toEqual({
      trade_id: 't1',
      side: 'initiator',
      item_id: 'item-a',
      quantity: 2,
    });
    expect(callsOf(state.calls, 'trades', 'update')[0].payload).toEqual(resetFlags);
  });

  it('o mesmo item no mesmo lado soma a quantidade em vez de criar outra linha', async () => {
    state.respond = (call) =>
      call.table === 'trade_items' && call.op === 'select'
        ? { data: { id: 'ti1', quantity: 3 } }
        : call.table === 'trade_items'
          ? { data: { id: 'ti1' } }
          : undefined;
    await tradeService.addTradeItem('t1', 'initiator', 'item-a', 2);
    expect(callsOf(state.calls, 'trade_items', 'insert')).toEqual([]);
    const update = callsOf(state.calls, 'trade_items', 'update')[0];
    expect(update.payload).toEqual({ quantity: 5 });
    expect(filterOf(update, 'eq', 'id')).toBe('ti1');
  });

  it('a busca do item existente procura por troca, lado e item', async () => {
    state.respond = () => ({ data: null });
    await tradeService.addTradeItem('t1', 'target', 'item-a', 1);
    expect(callsOf(state.calls, 'trade_items', 'select')[0].filters).toEqual([
      ['eq', 'trade_id', 't1'],
      ['eq', 'side', 'target'],
      ['eq', 'item_id', 'item-a'],
    ]);
  });

  it('GAP conhecido: não confere se o personagem tem o item nem a quantidade', async () => {
    state.respond = () => ({ data: null });
    await tradeService.addTradeItem('t1', 'initiator', 'item-a', 999);
    expect(callsOf(state.calls, 'character_items')).toEqual([]);
    expect(callsOf(state.calls, 'trade_items', 'insert')[0].payload).toMatchObject({
      quantity: 999,
    });
  });
});

describe('alterar um item da troca', () => {
  const parent = (call: FakeCall): FakeResult | undefined =>
    call.table === 'trade_items' && call.op === 'select' ? { data: { trade_id: 't9' } } : undefined;

  it('quantidade positiva atualiza a linha e desmarca "pronto" da troca dona do item', async () => {
    state.respond = parent;
    await tradeService.updateTradeItemQuantity('ti1', 4);
    expect(ops()).toEqual(['trade_items:select', 'trade_items:update', 'trades:update']);
    expect(callsOf(state.calls, 'trade_items', 'update')[0].payload).toEqual({ quantity: 4 });
    const reset = callsOf(state.calls, 'trades', 'update')[0];
    expect(reset.payload).toEqual(resetFlags);
    expect(filterOf(reset, 'eq', 'id')).toBe('t9');
  });

  it('quantidade 0 ou negativa apaga o item da troca', async () => {
    state.respond = parent;
    await tradeService.updateTradeItemQuantity('ti1', 0);
    await tradeService.updateTradeItemQuantity('ti1', -2);
    expect(callsOf(state.calls, 'trade_items', 'delete')).toHaveLength(2);
    expect(callsOf(state.calls, 'trade_items', 'update')).toEqual([]);
  });

  it('remover apaga o item e desmarca "pronto"', async () => {
    state.respond = parent;
    await tradeService.removeTradeItem('ti1');
    expect(ops()).toEqual(['trade_items:select', 'trade_items:delete', 'trades:update']);
  });

  it('a Qualidade fica entre 1 e 5', async () => {
    state.respond = parent;
    for (const level of [0, -3, 3, 7]) await tradeService.updateTradeItemLevel('ti1', level);
    const sent = callsOf(state.calls, 'trade_items', 'update').map(
      (c) => (c.payload as { level: number }).level,
    );
    expect(sent).toEqual([1, 1, 3, 5]);
  });

  it('GAP conhecido: Qualidade fracionada passa sem ser arredondada', async () => {
    state.respond = parent;
    await tradeService.updateTradeItemLevel('ti1', 2.5);
    expect(callsOf(state.calls, 'trade_items', 'update')[0].payload).toEqual({ level: 2.5 });
  });

  it('resistências e efeitos de arma personalizados também desmarcam "pronto"', async () => {
    state.respond = parent;
    await tradeService.updateTradeItemResistances('ti1', ['sangrando']);
    await tradeService.updateTradeItemWeaponEffects('ti1', [{ conditionId: 'cego' }]);
    expect(callsOf(state.calls, 'trade_items', 'update').map((c) => c.payload)).toEqual([
      { custom_condition_resistances: ['sangrando'] },
      { weapon_effects: [{ conditionId: 'cego' }] },
    ]);
    expect(callsOf(state.calls, 'trades', 'update')).toHaveLength(2);
  });

  it('se o item da troca não existir, lança antes de alterar qualquer coisa', async () => {
    state.respond = (call) =>
      call.table === 'trade_items' && call.op === 'select'
        ? { error: new Error('não achou') }
        : undefined;
    await expect(tradeService.removeTradeItem('ti1')).rejects.toThrow('não achou');
    expect(ops()).toEqual(['trade_items:select']);
  });

  it('se a alteração falhar, lança e não desmarca "pronto"', async () => {
    state.respond = (call) => {
      if (call.op === 'select') return { data: { trade_id: 't9' } };
      if (call.table === 'trade_items') return { error: new Error('falhou') };
      return undefined;
    };
    await expect(tradeService.updateTradeItemQuantity('ti1', 2)).rejects.toThrow('falhou');
    expect(callsOf(state.calls, 'trades')).toEqual([]);
  });
});

describe('executeTrade', () => {
  it('chama a função SQL e devolve o resultado dela, inclusive recusas', async () => {
    state.respond = () => ({ data: { success: false, error: 'Itens insuficientes' } });
    const result = await tradeService.executeTrade('t1');
    expect(result).toEqual({ success: false, error: 'Itens insuficientes' });
    const call = callsOf(state.calls, 'execute_trade', 'rpc')[0];
    expect(call.payload).toEqual({ p_trade_id: 't1' });
  });

  it('erro de rede ou de permissão é lançado', async () => {
    state.respond = () => ({ error: new Error('sem permissão') });
    await expect(tradeService.executeTrade('t1')).rejects.toThrow('sem permissão');
  });
});

describe('getActiveTradesForSession', () => {
  it('busca só trocas pendentes ou ativas da sessão, mais novas primeiro', async () => {
    state.respond = () => ({ data: [] });
    await tradeService.getActiveTradesForSession('s1');
    const select = callsOf(state.calls, 'trades', 'select')[0];
    expect(select.filters).toEqual([
      ['eq', 'session_id', 's1'],
      ['in', 'status', ['pending', 'active']],
      ['order', 'created_at', { ascending: false }],
    ]);
  });

  it('sem trocas, nem consulta os itens', async () => {
    state.respond = () => ({ data: [] });
    expect(await tradeService.getActiveTradesForSession('s1')).toEqual([]);
    expect(callsOf(state.calls, 'trade_items')).toEqual([]);
  });

  it('agrupa os itens na troca a que pertencem', async () => {
    state.respond = (call) =>
      call.table === 'trades'
        ? { data: [{ id: 't1' }, { id: 't2' }] }
        : {
            data: [
              { id: 'i1', trade_id: 't1' },
              { id: 'i2', trade_id: 't2' },
              { id: 'i3', trade_id: 't1' },
            ],
          };
    const result = await tradeService.getActiveTradesForSession('s1');
    expect(result.map((t) => [t.id, t.trade_items.map((i) => i.id)])).toEqual([
      ['t1', ['i1', 'i3']],
      ['t2', ['i2']],
    ]);
    expect(filterOf(callsOf(state.calls, 'trade_items', 'select')[0], 'in', 'trade_id')).toEqual([
      't1',
      't2',
    ]);
  });
});

describe('cancelSessionTrades', () => {
  it('chama a função SQL com a sessão e lança se ela falhar', async () => {
    await tradeService.cancelSessionTrades('s1');
    expect(callsOf(state.calls, 'cancel_session_trades', 'rpc')[0].payload).toEqual({
      p_session_id: 's1',
    });
    state.respond = () => ({ error: new Error('falhou') });
    await expect(tradeService.cancelSessionTrades('s1')).rejects.toThrow('falhou');
  });
});
