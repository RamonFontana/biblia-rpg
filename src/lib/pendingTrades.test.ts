// Quais pedidos de troca esperam resposta de quem e quais esperam a resposta dos outros. Termos:
// CONTEXT.md (Troca).
import { describe, expect, it } from 'vitest';
import { pendingTradesOf } from './pendingTrades';

const trade = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  status: 'pending',
  type: 'player_trade',
  initiator_user_id: 'u2',
  initiator_character_id: 'c2',
  target_character_id: 'c1',
  target_npc_id: null,
  ...over,
});
const players = [
  { user_id: 'u1', character: { id: 'c1' } },
  { user_id: 'u2', character: { id: 'c2' } },
];
const of = (trades: unknown[], userId = 'u1', isGM = false) =>
  pendingTradesOf({
    activeTrades: trades as never,
    playerCharacters: players as never,
    userId,
    isGM,
  });

describe('pendingTradesOf', () => {
  it('o pedido que chega à minha ficha espera a minha resposta', () => {
    const { forUser, fromUser } = of([trade()]);
    expect(forUser.map((t) => t.id)).toEqual(['t1']);
    expect(fromUser).toEqual([]);
  });

  it('o pedido que eu fiz espera a resposta do outro', () => {
    const { forUser, fromUser } = of([
      trade({ initiator_user_id: 'u1', target_character_id: 'c2' }),
    ]);
    expect(forUser).toEqual([]);
    expect(fromUser.map((t) => t.id)).toEqual(['t1']);
  });

  it('só o pedido pendente conta', () => {
    const { forUser, fromUser } = of([trade({ status: 'active' }), trade({ status: 'cancelled' })]);
    expect(forUser).toEqual([]);
    expect(fromUser).toEqual([]);
  });

  it('o pedido entre outros dois jogadores não é meu', () => {
    const { forUser, fromUser } = of([
      trade({ initiator_user_id: 'u3', target_character_id: 'c3' }),
    ]);
    expect(forUser).toEqual([]);
    expect(fromUser).toEqual([]);
  });

  it('a troca com NPC espera a resposta do Mestre, não a do jogador', () => {
    const npcTrade = trade({ type: 'npc_trade', target_character_id: null, target_npc_id: 'n1' });
    expect(of([npcTrade]).forUser).toEqual([]);
    expect(of([npcTrade], 'gm', true).forUser.map((t) => t.id)).toEqual(['t1']);
  });
});
