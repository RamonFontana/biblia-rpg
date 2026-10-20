// Trocas (`trades`, `trade_items`) entre personagens, NPCs e lojas. As funções lançam o erro do
// Supabase. A transferência em si acontece na função SQL `execute_trade`.
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';
import type { WeaponEffect } from '@/types/combat';
import type {
  CreateTradeParams,
  Trade,
  TradeItemWithDetails,
  TradeSide,
  TradeWithItems,
} from '@/types/trade';
import { toJson } from './json';

const TRADE_ITEM_SELECT = `
  id,
  trade_id,
  side,
  item_id,
  quantity,
  level,
  custom_condition_resistances,
  weapon_effects,
  created_at,
  items (
    id,
    name,
    description,
    category,
    price
  )
`;

/**
 * Converte a linha do banco no tipo do app. `type`, `status` e `side` são `text` no banco; quem
 * grava os valores é o próprio app, que usa só as uniões de `types/trade`. É a única asserção
 * dessa conversão para as trocas.
 */
function toTrade(row: Tables<'trades'>): Trade {
  return row as Trade;
}

/** O mesmo vale para o item da troca, que também traz o `jsonb` de efeitos de arma. */
function toTradeItem(row: unknown): TradeItemWithDetails {
  return row as TradeItemWithDetails;
}

async function resetReadyFlags(tradeId: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .update({ initiator_ready: false, target_ready: false })
    .eq('id', tradeId);

  if (error) throw error;
}

// Every trade-item mutation follows the same shape: look up the parent trade,
// mutate the item, then reset both sides' ready flags since the trade changed.
async function withTradeItem(tradeItemId: string, mutate: () => Promise<void>): Promise<void> {
  const { data: tradeItem, error: fetchError } = await supabase
    .from('trade_items')
    .select('trade_id')
    .eq('id', tradeItemId)
    .single();

  if (fetchError) throw fetchError;

  await mutate();
  await resetReadyFlags(tradeItem.trade_id);
}

export async function createTrade(params: CreateTradeParams): Promise<Trade> {
  const { data, error } = await supabase
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
  return toTrade(data);
}

export async function acceptTrade(tradeId: string): Promise<Trade> {
  const { data, error } = await supabase
    .from('trades')
    .update({ status: 'active' })
    .eq('id', tradeId)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) throw error;
  return toTrade(data);
}

export async function cancelTrade(tradeId: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .update({ status: 'cancelled', completed_at: new Date().toISOString() })
    .eq('id', tradeId);

  if (error) throw error;
}

export async function updateTradeCoins(
  tradeId: string,
  side: TradeSide,
  coins: number,
): Promise<Trade> {
  const reset = { initiator_ready: false, target_ready: false };
  const { data, error } = await supabase
    .from('trades')
    .update(
      side === 'initiator'
        ? { initiator_coins: coins, ...reset }
        : { target_coins: coins, ...reset },
    )
    .eq('id', tradeId)
    .select()
    .single();

  if (error) throw error;
  return toTrade(data);
}

export async function setReady(tradeId: string, side: TradeSide, ready: boolean): Promise<Trade> {
  const { data, error } = await supabase
    .from('trades')
    .update(side === 'initiator' ? { initiator_ready: ready } : { target_ready: ready })
    .eq('id', tradeId)
    .select()
    .single();

  if (error) throw error;
  return toTrade(data);
}

export async function executeTrade(tradeId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('execute_trade', { p_trade_id: tradeId });

  if (error) throw error;

  // A função SQL devolve `{ success, error? }` como `jsonb`.
  return data as { success: boolean; error?: string };
}

export async function addTradeItem(
  tradeId: string,
  side: TradeSide,
  itemId: string,
  quantity: number,
): Promise<TradeItemWithDetails> {
  const { data: existing } = await supabase
    .from('trade_items')
    .select('id, quantity')
    .eq('trade_id', tradeId)
    .eq('side', side)
    .eq('item_id', itemId)
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('trade_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select(TRADE_ITEM_SELECT)
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase
      .from('trade_items')
      .insert({ trade_id: tradeId, side, item_id: itemId, quantity })
      .select(TRADE_ITEM_SELECT)
      .single();
    if (error) throw error;
    result = data;
  }

  await resetReadyFlags(tradeId);
  return toTradeItem(result);
}

export async function updateTradeItemQuantity(
  tradeItemId: string,
  quantity: number,
): Promise<void> {
  await withTradeItem(tradeItemId, async () => {
    if (quantity <= 0) {
      const { error } = await supabase.from('trade_items').delete().eq('id', tradeItemId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('trade_items')
        .update({ quantity })
        .eq('id', tradeItemId);
      if (error) throw error;
    }
  });
}

export async function removeTradeItem(tradeItemId: string): Promise<void> {
  await withTradeItem(tradeItemId, async () => {
    const { error } = await supabase.from('trade_items').delete().eq('id', tradeItemId);
    if (error) throw error;
  });
}

export async function updateTradeItemLevel(tradeItemId: string, level: number): Promise<void> {
  const clampedLevel = Math.max(1, Math.min(5, level));
  await withTradeItem(tradeItemId, async () => {
    const { error } = await supabase
      .from('trade_items')
      .update({ level: clampedLevel })
      .eq('id', tradeItemId);
    if (error) throw error;
  });
}

export async function updateTradeItemResistances(
  tradeItemId: string,
  resistances: string[],
): Promise<void> {
  await withTradeItem(tradeItemId, async () => {
    const { error } = await supabase
      .from('trade_items')
      .update({ custom_condition_resistances: resistances })
      .eq('id', tradeItemId);
    if (error) throw error;
  });
}

export async function updateTradeItemWeaponEffects(
  tradeItemId: string,
  effects: WeaponEffect[],
): Promise<void> {
  await withTradeItem(tradeItemId, async () => {
    const { error } = await supabase
      .from('trade_items')
      .update({ weapon_effects: toJson(effects) })
      .eq('id', tradeItemId);
    if (error) throw error;
  });
}

export async function getActiveTradesForSession(sessionId: string): Promise<TradeWithItems[]> {
  const { data: rows, error } = await supabase
    .from('trades')
    .select('*')
    .eq('session_id', sessionId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const trades = rows.map(toTrade);
  const { data: items, error: itemsError } = await supabase
    .from('trade_items')
    .select(TRADE_ITEM_SELECT)
    .in(
      'trade_id',
      trades.map((t) => t.id),
    );

  if (itemsError) throw itemsError;

  const tradeItems = (items ?? []).map(toTradeItem);
  return trades.map((trade) => ({
    ...trade,
    trade_items: tradeItems.filter((item) => item.trade_id === trade.id),
  }));
}

export async function cancelSessionTrades(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_session_trades', { p_session_id: sessionId });
  if (error) throw error;
}

/** Inventário de um personagem, no formato que a tela de troca mostra. */
export async function getTradeInventory(characterId: string) {
  const { data, error } = await supabase
    .from('character_items')
    .select(
      `
        id,
        quantity,
        items (
          id,
          name,
          description,
          category,
          price
        )
      `,
    )
    .eq('character_id', characterId);

  if (error) throw error;
  return data ?? [];
}

/** Catálogo de itens que a troca pode oferecer, por nome. */
export async function listTradeableItems() {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, description, category, price')
    .order('name');

  if (error) throw error;
  return data ?? [];
}
