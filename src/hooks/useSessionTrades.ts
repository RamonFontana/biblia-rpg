import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { tradeService } from '@/services/tradeService';
import type { TradeWithItems } from '@/types/trade';

export function useSessionTrades(sessionId: string | undefined) {
  const [activeTrades, setActiveTrades] = useState<TradeWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const trades = await tradeService.getActiveTradesForSession(sessionId);
      setActiveTrades(trades);
    } catch (error) {
      console.error('Error fetching session trades:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    if (!sessionId) return;

    const channelId = crypto.randomUUID();

    const tradesChannel = supabase
      .channel(`session_trades_${sessionId}_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    const itemsChannel = supabase
      .channel(`session_trade_items_${sessionId}_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_items',
        },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [sessionId, fetchTrades]);

  const tradingCharacterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const trade of activeTrades) {
      if (trade.status !== 'active' && trade.status !== 'pending') continue;
      if (trade.initiator_character_id) ids.add(trade.initiator_character_id);
      if (trade.target_character_id) ids.add(trade.target_character_id);
    }
    return ids;
  }, [activeTrades]);

  const isCharacterTrading = useCallback(
    (characterId: string | undefined | null) => {
      if (!characterId) return false;
      return tradingCharacterIds.has(characterId);
    },
    [tradingCharacterIds]
  );

  return {
    activeTrades,
    tradingCharacterIds,
    isCharacterTrading,
    loading,
    refresh: fetchTrades,
  };
}
