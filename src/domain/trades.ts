// CARACTERIZAÇÃO: as decisões de troca da tela da Sessão (qual troca é a minha, quando se pode
// abrir uma nova, o que cancelar ao sair), extraídas de ActiveSessionPage sem alteração.
// Termos: CONTEXT.md (Troca).
import type { CreateTradeParams, TradeWithItems } from '@/types/trade';

export interface TradeViewer {
  userId: string;
  isGM: boolean;
  /** A ficha do jogador nesta sessão, se ele tem uma. */
  characterId?: string;
}

/**
 * A troca ativa em que o usuário participa: como iniciador, como dono da ficha-alvo, ou o Mestre
 * numa lojinha ou numa troca com NPC. Troca pendente ainda não conta.
 */
export function findMyActiveTrade(
  trades: TradeWithItems[],
  me: TradeViewer,
): TradeWithItems | undefined {
  return trades.find((t) => {
    if (t.status !== 'active') return false;
    if (t.initiator_user_id === me.userId) return true;
    if (t.type === 'shop' && me.isGM) return true;
    if (t.type === 'npc_trade' && me.isGM) return true;
    if (me.characterId && t.target_character_id === me.characterId) return true;
    return false;
  });
}

type IsTrading = (characterId: string) => boolean;

/** Negociar com outro jogador: pendente, entre as duas fichas, se nenhuma está em outra troca. */
export function planPlayerTrade(input: {
  sessionId: string;
  userId: string;
  myCharacterId?: string;
  targetCharacterId?: string;
  isTrading: IsTrading;
}): CreateTradeParams | null {
  const { sessionId, userId, myCharacterId, targetCharacterId, isTrading } = input;
  if (!myCharacterId || !targetCharacterId) return null;
  if (isTrading(myCharacterId) || isTrading(targetCharacterId)) return null;

  return {
    sessionId,
    type: 'player_trade',
    initiatorUserId: userId,
    initiatorCharacterId: myCharacterId,
    targetCharacterId,
    status: 'pending',
  };
}

/** Lojinha: só o Mestre abre, já ativa, sem ficha do lado dele. */
export function planShopTrade(input: {
  sessionId: string;
  userId: string;
  isGM: boolean;
  targetCharacterId?: string;
  isTrading: IsTrading;
}): CreateTradeParams | null {
  const { sessionId, userId, isGM, targetCharacterId, isTrading } = input;
  if (!isGM || !targetCharacterId) return null;
  if (isTrading(targetCharacterId)) return null;

  return {
    sessionId,
    type: 'shop',
    initiatorUserId: userId,
    initiatorCharacterId: null,
    targetCharacterId,
    status: 'active',
  };
}

/** Negociar com NPC: NPC jogável é uma ficha (alvo-personagem); o simples é o NPC da sessão. */
export function planNpcTrade(input: {
  sessionId: string;
  userId: string;
  myCharacterId?: string;
  npc: { id: string; is_playable?: boolean };
  isTrading: IsTrading;
}): CreateTradeParams | null {
  const { sessionId, userId, myCharacterId, npc, isTrading } = input;
  if (!myCharacterId) return null;
  if (isTrading(myCharacterId)) return null;

  return {
    sessionId,
    type: 'npc_trade',
    initiatorUserId: userId,
    initiatorCharacterId: myCharacterId,
    status: 'pending',
    ...(npc.is_playable ? { targetCharacterId: npc.id } : { targetNpcId: npc.id }),
  };
}

/** As trocas abertas (ativas ou pendentes) que o usuário iniciou ou em que é o alvo. */
export function findTradesToCancelOnLeave(
  trades: TradeWithItems[],
  me: { userId: string; characterId?: string },
): TradeWithItems[] {
  return trades.filter(
    (t) =>
      (t.status === 'active' || t.status === 'pending') &&
      (t.initiator_user_id === me.userId || me.characterId === t.target_character_id),
  );
}
