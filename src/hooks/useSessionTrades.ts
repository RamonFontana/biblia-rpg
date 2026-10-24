import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeToTables } from '@/data-access/realtime';
import { uniqueChannelName } from '@/lib/channelName';
import { getActiveTradesForSession } from '@/data-access/trades';
import type { TradeWithItems } from '@/types/trade';

const logFetchError = (error: unknown) => console.error('Error fetching session trades:', error);

export function useSessionTrades(sessionId: string | undefined) {
  const [activeTrades, setActiveTrades] = useState<TradeWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  // Outra sessão recomeça o carregamento. Ajustar durante a renderização (e não num efeito) evita
  // um quadro com a sessão nova e `loading` desligado.
  const [loadedSessionId, setLoadedSessionId] = useState(sessionId);
  if (loadedSessionId !== sessionId) {
    setLoadedSessionId(sessionId);
    setLoading(true);
  }

  // Quem chama trata a falha (`logFetchError`); aqui só se garante que o carregamento termina.
  const loadTrades = useCallback(async () => {
    if (!sessionId) return;

    try {
      setActiveTrades(await getActiveTradesForSession(sessionId));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Consulta nova (realtime ou chamada de fora): liga `loading` e carrega.
  const fetchTrades = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    await loadTrades().catch(logFetchError);
  }, [sessionId, loadTrades]);

  useEffect(() => {
    loadTrades().catch(logFetchError);
  }, [loadTrades]);

  useEffect(() => {
    if (!sessionId) return;

    return subscribeToTables(
      uniqueChannelName(`session_trades_realtime_${sessionId}`),
      [
        { table: 'trades', filter: `session_id=eq.${sessionId}`, onChange: fetchTrades },
        { table: 'trade_items', onChange: fetchTrades },
      ],
      // Eventos antes da confirmação do canal (ou durante uma reconexão) se perdem: relê aqui.
      { onSubscribed: () => loadTrades().catch(logFetchError) },
    );
  }, [sessionId, fetchTrades, loadTrades]);

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
    [tradingCharacterIds],
  );

  return {
    activeTrades,
    tradingCharacterIds,
    isCharacterTrading,
    loading,
    refresh: fetchTrades,
  };
}
