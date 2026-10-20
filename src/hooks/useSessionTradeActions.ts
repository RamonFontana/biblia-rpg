import { useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { acceptTrade, cancelTrade, createTrade } from '@/data-access/trades';
import type { SessionPlayer } from '@/data-access/sessions';
import { planNpcTrade, planPlayerTrade, planShopTrade } from '@/domain/trades';
import type { CreateTradeParams } from '@/types/trade';

interface Options {
  sessionId: string | undefined;
  user: User | null;
  isGM: boolean;
  playerCharacters: SessionPlayer[];
  isCharacterTrading: (characterId: string | undefined | null) => boolean;
  refreshTrades: () => void;
}

/**
 * Os botões de troca da sessão: negociar com jogador, abrir a lojinha, negociar com NPC, aceitar e
 * recusar. Uma falha é só registrada no console, como sempre foi.
 */
export function useSessionTradeActions({
  sessionId,
  user,
  isGM,
  playerCharacters,
  isCharacterTrading,
  refreshTrades,
}: Options) {
  const createTradeAndRefresh = useCallback(
    async (params: CreateTradeParams, errorMessage: string) => {
      try {
        await createTrade(params);
        refreshTrades();
      } catch (e) {
        console.error(errorMessage, e);
      }
    },
    [refreshTrades],
  );

  const handleNegotiate = useCallback(
    async (targetUserId: string) => {
      if (!user || !sessionId) return;
      const params = planPlayerTrade({
        sessionId,
        userId: user.id,
        myCharacterId: playerCharacters.find((pc) => pc.user_id === user.id)?.character.id,
        targetCharacterId: playerCharacters.find((pc) => pc.user_id === targetUserId)?.character.id,
        isTrading: isCharacterTrading,
      });
      if (params) await createTradeAndRefresh(params, 'Erro ao criar negociação:');
    },
    [user, sessionId, playerCharacters, isCharacterTrading, createTradeAndRefresh],
  );

  const handleShop = useCallback(
    async (targetUserId: string) => {
      if (!user || !sessionId) return;
      const params = planShopTrade({
        sessionId,
        userId: user.id,
        isGM,
        targetCharacterId: playerCharacters.find((pc) => pc.user_id === targetUserId)?.character.id,
        isTrading: isCharacterTrading,
      });
      if (params) await createTradeAndRefresh(params, 'Erro ao abrir lojinha:');
    },
    [user, sessionId, isGM, playerCharacters, isCharacterTrading, createTradeAndRefresh],
  );

  const handleNPCNegotiate = useCallback(
    async (npc: { id: string; name?: string; is_playable?: boolean }) => {
      if (!user || !sessionId) return;
      const params = planNpcTrade({
        sessionId,
        userId: user.id,
        myCharacterId: playerCharacters.find((pc) => pc.user_id === user.id)?.character.id,
        npc,
        isTrading: isCharacterTrading,
      });
      if (params) await createTradeAndRefresh(params, 'Erro ao solicitar negociação com NPC:');
    },
    [user, sessionId, playerCharacters, isCharacterTrading, createTradeAndRefresh],
  );

  const handleAcceptTrade = useCallback(
    async (tradeId: string) => {
      try {
        await acceptTrade(tradeId);
        refreshTrades();
      } catch (e) {
        console.error('Erro ao aceitar negociação:', e);
      }
    },
    [refreshTrades],
  );

  const handleRejectTrade = useCallback(
    async (tradeId: string) => {
      try {
        await cancelTrade(tradeId);
        refreshTrades();
      } catch (e) {
        console.error('Erro ao recusar negociação:', e);
      }
    },
    [refreshTrades],
  );

  return { handleNegotiate, handleShop, handleNPCNegotiate, handleAcceptTrade, handleRejectTrade };
}
