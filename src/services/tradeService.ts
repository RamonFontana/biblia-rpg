import { supabase } from '@/lib/supabase';
import type {
  CreateTradeParams,
  Trade,
  TradeItemWithDetails,
  TradeSide,
  TradeWithItems,
} from '@/types/trade';

const TRADE_ITEM_SELECT = `
  id,
  trade_id,
  side,
  item_id,
  quantity,
  level,
  created_at,
  items (
    id,
    name,
    description,
    category,
    price
  )
`;

async function resetReadyFlags(tradeId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('trades')
    .update({ initiator_ready: false, target_ready: false })
    .eq('id', tradeId);

  if (error) throw error;
}

export const tradeService = {
  async createTrade(params: CreateTradeParams): Promise<Trade> {
    const { data, error } = await (supabase as any)
      .from('trades')
      .insert({
        session_id: params.sessionId,
        type: params.type,
        status: params.status ?? 'pending',
        initiator_user_id: params.initiatorUserId,
        initiator_character_id: params.initiatorCharacterId ?? null,
        target_character_id: params.targetCharacterId ?? null,
        target_npc_id: params.targetNpcId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async acceptTrade(tradeId: string): Promise<Trade> {
    const { data, error } = await (supabase as any)
      .from('trades')
      .update({ status: 'active' })
      .eq('id', tradeId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancelTrade(tradeId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('trades')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', tradeId);

    if (error) throw error;
  },

  async updateTradeCoins(tradeId: string, side: TradeSide, coins: number): Promise<Trade> {
    const field = side === 'initiator' ? 'initiator_coins' : 'target_coins';
    const { data, error } = await (supabase as any)
      .from('trades')
      .update({ [field]: coins, initiator_ready: false, target_ready: false })
      .eq('id', tradeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setReady(tradeId: string, side: TradeSide, ready: boolean): Promise<Trade> {
    const field = side === 'initiator' ? 'initiator_ready' : 'target_ready';
    const { data, error } = await (supabase as any)
      .from('trades')
      .update({ [field]: ready })
      .eq('id', tradeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async executeTrade(tradeId: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await (supabase as any).rpc('execute_trade', { p_trade_id: tradeId });

    if (error) throw error;

    const result = data as { success: boolean; error?: string };
    return result;
  },

  async addTradeItem(
    tradeId: string,
    side: TradeSide,
    itemId: string,
    quantity: number
  ): Promise<TradeItemWithDetails> {
    const { data: existing } = await (supabase as any)
      .from('trade_items')
      .select('id, quantity')
      .eq('trade_id', tradeId)
      .eq('side', side)
      .eq('item_id', itemId)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await (supabase as any)
        .from('trade_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select(TRADE_ITEM_SELECT)
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await (supabase as any)
        .from('trade_items')
        .insert({ trade_id: tradeId, side, item_id: itemId, quantity })
        .select(TRADE_ITEM_SELECT)
        .single();
      if (error) throw error;
      result = data;
    }

    await resetReadyFlags(tradeId);
    return result;
  },

  async updateTradeItemQuantity(tradeItemId: string, quantity: number): Promise<void> {
    const { data: tradeItem, error: fetchError } = await (supabase as any)
      .from('trade_items')
      .select('trade_id')
      .eq('id', tradeItemId)
      .single();

    if (fetchError) throw fetchError;

    if (quantity <= 0) {
      const { error } = await (supabase as any)
        .from('trade_items')
        .delete()
        .eq('id', tradeItemId);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any)
        .from('trade_items')
        .update({ quantity })
        .eq('id', tradeItemId);
      if (error) throw error;
    }

    await resetReadyFlags(tradeItem.trade_id);
  },

  async removeTradeItem(tradeItemId: string): Promise<void> {
    const { data: tradeItem, error: fetchError } = await (supabase as any)
      .from('trade_items')
      .select('trade_id')
      .eq('id', tradeItemId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await (supabase as any)
      .from('trade_items')
      .delete()
      .eq('id', tradeItemId);

    if (error) throw error;
    await resetReadyFlags(tradeItem.trade_id);
  },

  async updateTradeItemLevel(tradeItemId: string, level: number): Promise<void> {
    const { data: tradeItem, error: fetchError } = await (supabase as any)
      .from('trade_items')
      .select('trade_id')
      .eq('id', tradeItemId)
      .single();

    if (fetchError) throw fetchError;

    const clampedLevel = Math.max(1, Math.min(5, level));
    const { error } = await (supabase as any)
      .from('trade_items')
      .update({ level: clampedLevel })
      .eq('id', tradeItemId);

    if (error) throw error;
    await resetReadyFlags(tradeItem.trade_id);
  },

  async getActiveTradesForSession(sessionId: string): Promise<TradeWithItems[]> {
    const { data: trades, error } = await (supabase as any)
      .from('trades')
      .select('*')
      .eq('session_id', sessionId)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!trades || trades.length === 0) return [];

    const tradeIds = trades.map((t: Trade) => t.id);
    const { data: items, error: itemsError } = await (supabase as any)
      .from('trade_items')
      .select(TRADE_ITEM_SELECT)
      .in('trade_id', tradeIds);

    if (itemsError) throw itemsError;

    return trades.map((trade: Trade) => ({
      ...trade,
      trade_items: (items ?? []).filter((item: TradeItemWithDetails) => item.trade_id === trade.id),
    }));
  },

  async cancelSessionTrades(sessionId: string): Promise<void> {
    const { error } = await (supabase as any).rpc('cancel_session_trades', { p_session_id: sessionId });
    if (error) throw error;
  },

  async getCharacterInventory(characterId: string) {
    const { data, error } = await (supabase as any)
      .from('character_items')
      .select(`
        id,
        quantity,
        items (
          id,
          name,
          description,
          category,
          price
        )
      `)
      .eq('character_id', characterId);

    if (error) throw error;
    return data ?? [];
  },

  async getAllItems() {
    const { data, error } = await (supabase as any)
      .from('items')
      .select('id, name, description, category, price')
      .order('name');

    if (error) throw error;
    return data ?? [];
  },
};
