// CARACTERIZAÇÃO: as decisões de troca da tela da Sessão. A tela é testada em
// pages/session/ActiveSessionPage.test.tsx; aqui, as regras sem React.
import { describe, expect, it } from 'vitest';
import type { TradeWithItems } from '@/types/trade';
import {
  findMyActiveTrade,
  findTradesToCancelOnLeave,
  planNpcTrade,
  planPlayerTrade,
  planShopTrade,
} from './trades';

const trade = (over: Partial<TradeWithItems> = {}): TradeWithItems => ({
  id: 't1',
  session_id: 's1',
  type: 'player_trade',
  status: 'active',
  initiator_character_id: null,
  initiator_user_id: 'u2',
  target_character_id: null,
  target_npc_id: null,
  initiator_coins: 0,
  target_coins: 0,
  initiator_ready: false,
  target_ready: false,
  created_at: '',
  completed_at: null,
  trade_items: [],
  ...over,
});
const free = () => false;

describe('findMyActiveTrade', () => {
  const me = { userId: 'u1', isGM: false, characterId: 'c1' };

  it('acha a troca em que sou o iniciador ou o dono da ficha-alvo', () => {
    expect(findMyActiveTrade([trade({ initiator_user_id: 'u1' })], me)).toBeDefined();
    expect(findMyActiveTrade([trade({ target_character_id: 'c1' })], me)).toBeDefined();
  });

  it('troca de outros, ou ainda pendente, ou cancelada, não é minha', () => {
    expect(findMyActiveTrade([trade({ target_character_id: 'c2' })], me)).toBeUndefined();
    expect(
      findMyActiveTrade([trade({ initiator_user_id: 'u1', status: 'pending' })], me),
    ).toBeUndefined();
    expect(
      findMyActiveTrade([trade({ initiator_user_id: 'u1', status: 'cancelled' })], me),
    ).toBeUndefined();
  });

  it('o Mestre vê as lojinhas e as trocas com NPC, mas não as dos jogadores', () => {
    const gm = { userId: 'gm', isGM: true };
    expect(findMyActiveTrade([trade({ type: 'shop' })], gm)).toBeDefined();
    expect(findMyActiveTrade([trade({ type: 'npc_trade' })], gm)).toBeDefined();
    expect(findMyActiveTrade([trade({ type: 'player_trade' })], gm)).toBeUndefined();
    expect(findMyActiveTrade([trade({ type: 'shop' })], me)).toBeUndefined();
  });

  it('sem ficha, uma troca sem alvo não é minha por engano', () => {
    expect(findMyActiveTrade([trade()], { userId: 'u1', isGM: false })).toBeUndefined();
  });

  it('devolve a primeira que serve', () => {
    const first = trade({ id: 'a', initiator_user_id: 'u1' });
    const second = trade({ id: 'b', initiator_user_id: 'u1' });
    expect(findMyActiveTrade([first, second], me)?.id).toBe('a');
  });
});

describe('planPlayerTrade', () => {
  const input = {
    sessionId: 's1',
    userId: 'u1',
    myCharacterId: 'c1',
    targetCharacterId: 'c2',
    isTrading: free,
  };

  it('pendente, entre as duas fichas', () => {
    expect(planPlayerTrade(input)).toStrictEqual({
      sessionId: 's1',
      type: 'player_trade',
      initiatorUserId: 'u1',
      initiatorCharacterId: 'c1',
      targetCharacterId: 'c2',
      status: 'pending',
    });
  });

  it('não planeja sem uma das fichas ou se qualquer lado já está em troca', () => {
    expect(planPlayerTrade({ ...input, myCharacterId: undefined })).toBeNull();
    expect(planPlayerTrade({ ...input, targetCharacterId: undefined })).toBeNull();
    expect(planPlayerTrade({ ...input, isTrading: (id) => id === 'c1' })).toBeNull();
    expect(planPlayerTrade({ ...input, isTrading: (id) => id === 'c2' })).toBeNull();
  });
});

describe('planShopTrade', () => {
  const input = {
    sessionId: 's1',
    userId: 'gm',
    isGM: true,
    targetCharacterId: 'c2',
    isTrading: free,
  };

  it('ativa, sem ficha do lado do Mestre', () => {
    expect(planShopTrade(input)).toStrictEqual({
      sessionId: 's1',
      type: 'shop',
      initiatorUserId: 'gm',
      initiatorCharacterId: null,
      targetCharacterId: 'c2',
      status: 'active',
    });
  });

  it('só o Mestre, com ficha-alvo livre', () => {
    expect(planShopTrade({ ...input, isGM: false })).toBeNull();
    expect(planShopTrade({ ...input, targetCharacterId: undefined })).toBeNull();
    expect(planShopTrade({ ...input, isTrading: () => true })).toBeNull();
  });
});

describe('planNpcTrade', () => {
  const input = {
    sessionId: 's1',
    userId: 'u1',
    myCharacterId: 'c1',
    npc: { id: 'n1', is_playable: false },
    isTrading: free,
  };

  it('NPC simples vai pelo NPC da sessão', () => {
    expect(planNpcTrade(input)).toStrictEqual({
      sessionId: 's1',
      type: 'npc_trade',
      initiatorUserId: 'u1',
      initiatorCharacterId: 'c1',
      status: 'pending',
      targetNpcId: 'n1',
    });
  });

  it('NPC jogável é uma ficha: vai como personagem-alvo', () => {
    expect(planNpcTrade({ ...input, npc: { id: 'n2', is_playable: true } })).toMatchObject({
      targetCharacterId: 'n2',
    });
    expect(planNpcTrade({ ...input, npc: { id: 'n2', is_playable: true } })).not.toHaveProperty(
      'targetNpcId',
    );
    expect(planNpcTrade({ ...input, npc: { id: 'n3' } })).toMatchObject({ targetNpcId: 'n3' });
  });

  it('exige ficha livre do jogador', () => {
    expect(planNpcTrade({ ...input, myCharacterId: undefined })).toBeNull();
    expect(planNpcTrade({ ...input, isTrading: () => true })).toBeNull();
  });
});

describe('findTradesToCancelOnLeave', () => {
  it('pega as abertas que o usuário iniciou ou em que é o alvo, e só elas', () => {
    const trades = [
      trade({ id: 'minha', initiator_user_id: 'u1', status: 'pending' }),
      trade({ id: 'para-mim', target_character_id: 'c1' }),
      trade({ id: 'dos-outros', target_character_id: 'c2' }),
      trade({ id: 'velha', initiator_user_id: 'u1', status: 'completed' }),
    ];
    const ids = findTradesToCancelOnLeave(trades, { userId: 'u1', characterId: 'c1' }).map(
      (t) => t.id,
    );
    expect(ids).toEqual(['minha', 'para-mim']);
  });

  it('sem ficha, só as que o usuário iniciou', () => {
    const trades = [trade({ id: 'minha', initiator_user_id: 'u1' }), trade({ id: 'x' })];
    expect(findTradesToCancelOnLeave(trades, { userId: 'u1' }).map((t) => t.id)).toEqual(['minha']);
  });
});
