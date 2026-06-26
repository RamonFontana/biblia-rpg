export type TradeType = 'player_trade' | 'shop' | 'npc_trade';

export type TradeStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type TradeSide = 'initiator' | 'target';

export interface Trade {
  id: string;
  session_id: string;
  type: TradeType;
  status: TradeStatus;
  initiator_character_id: string | null;
  initiator_user_id: string;
  target_character_id: string | null;
  target_npc_id: string | null;
  initiator_coins: number;
  target_coins: number;
  initiator_ready: boolean;
  target_ready: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface TradeItemRecord {
  id: string;
  trade_id: string;
  side: TradeSide;
  item_id: string;
  quantity: number;
  level: number;
  created_at: string;
}

export interface TradeItemWithDetails extends TradeItemRecord {
  items?: {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    price?: number | null;
  };
}

export interface TradeWithItems extends Trade {
  trade_items: TradeItemWithDetails[];
}

export interface CreateTradeParams {
  sessionId: string;
  type: TradeType;
  initiatorUserId: string;
  initiatorCharacterId?: string | null;
  targetCharacterId?: string | null;
  targetNpcId?: string | null;
  status?: TradeStatus;
}
