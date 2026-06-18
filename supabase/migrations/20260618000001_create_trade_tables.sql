-- Create trades table
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('player_trade', 'shop', 'npc_trade')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  initiator_character_id UUID REFERENCES public.characters(id),
  initiator_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_character_id UUID REFERENCES public.characters(id),
  target_npc_id UUID REFERENCES public.session_npcs(id),
  initiator_coins INTEGER NOT NULL DEFAULT 0,
  target_coins INTEGER NOT NULL DEFAULT 0,
  initiator_ready BOOLEAN NOT NULL DEFAULT false,
  target_ready BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT trades_at_least_one_character CHECK (
    initiator_character_id IS NOT NULL OR target_character_id IS NOT NULL
  )
);

CREATE INDEX idx_trades_session_id ON public.trades(session_id);
CREATE INDEX idx_trades_status ON public.trades(status);

-- Create trade_items table
CREATE TABLE public.trade_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('initiator', 'target')),
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_id, side, item_id)
);

CREATE INDEX idx_trade_items_trade_id ON public.trade_items(trade_id);

-- Helper: check if user is involved in a trade
CREATE OR REPLACE FUNCTION public.is_trade_participant(check_trade_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_trade RECORD;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = check_trade_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_trade.initiator_user_id = auth.uid() THEN
    RETURN true;
  END IF;

  IF public.is_session_gm(v_trade.session_id) THEN
    RETURN true;
  END IF;

  IF v_trade.target_character_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.characters
    WHERE id = v_trade.target_character_id AND user_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for trades
CREATE POLICY "Session participants can view trades"
  ON public.trades FOR SELECT
  USING (
    public.is_session_gm(session_id) OR public.is_session_participant(session_id)
  );

CREATE POLICY "Session participants can create trades"
  ON public.trades FOR INSERT
  WITH CHECK (
    public.is_session_gm(session_id) OR public.is_session_participant(session_id)
  );

CREATE POLICY "Trade participants and GM can update trades"
  ON public.trades FOR UPDATE
  USING (public.is_trade_participant(id));

-- RLS policies for trade_items
CREATE POLICY "Session participants can view trade items"
  ON public.trade_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_items.trade_id
      AND (public.is_session_gm(t.session_id) OR public.is_session_participant(t.session_id))
    )
  );

CREATE POLICY "Trade participants can manage trade items"
  ON public.trade_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trades t
      WHERE t.id = trade_items.trade_id
      AND public.is_trade_participant(t.id)
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_items;
