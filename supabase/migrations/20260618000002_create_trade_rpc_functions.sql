-- Cancel all pending/active trades for a session
CREATE OR REPLACE FUNCTION public.cancel_session_trades(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.trades
  SET status = 'cancelled', completed_at = now()
  WHERE session_id = p_session_id
    AND status IN ('pending', 'active');
END;
$$;

-- Execute a trade atomically
CREATE OR REPLACE FUNCTION public.execute_trade(p_trade_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trade RECORD;
  v_item RECORD;
  v_available INTEGER;
  v_initiator_coins INTEGER;
  v_target_coins INTEGER;
BEGIN
  SELECT * INTO v_trade FROM public.trades WHERE id = p_trade_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Negociação não encontrada');
  END IF;

  IF v_trade.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Negociação não está ativa');
  END IF;

  IF NOT v_trade.initiator_ready OR NOT v_trade.target_ready THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ambos os lados devem confirmar Pronto');
  END IF;

  -- Validate initiator side items
  IF v_trade.type != 'shop' AND v_trade.initiator_character_id IS NOT NULL THEN
    FOR v_item IN
      SELECT ti.item_id, ti.quantity
      FROM public.trade_items ti
      WHERE ti.trade_id = p_trade_id AND ti.side = 'initiator'
    LOOP
      SELECT quantity INTO v_available
      FROM public.character_items
      WHERE character_id = v_trade.initiator_character_id AND item_id = v_item.item_id;

      IF v_available IS NULL OR v_available < v_item.quantity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quantidade insuficiente de itens no lado iniciador');
      END IF;
    END LOOP;
  END IF;

  -- Validate target side items
  IF v_trade.target_character_id IS NOT NULL THEN
    FOR v_item IN
      SELECT ti.item_id, ti.quantity
      FROM public.trade_items ti
      WHERE ti.trade_id = p_trade_id AND ti.side = 'target'
    LOOP
      SELECT quantity INTO v_available
      FROM public.character_items
      WHERE character_id = v_trade.target_character_id AND item_id = v_item.item_id;

      IF v_available IS NULL OR v_available < v_item.quantity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Quantidade insuficiente de itens no lado alvo');
      END IF;
    END LOOP;
  END IF;

  -- Validate coins
  IF v_trade.type = 'shop' THEN
    IF v_trade.target_character_id IS NOT NULL AND v_trade.target_coins > 0 THEN
      SELECT COALESCE(coins, 0) INTO v_target_coins
      FROM public.characters WHERE id = v_trade.target_character_id;
      IF v_target_coins < v_trade.target_coins THEN
        RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente de SP no jogador');
      END IF;
    END IF;
  ELSE
    IF v_trade.initiator_character_id IS NOT NULL AND v_trade.initiator_coins > 0 THEN
      SELECT COALESCE(coins, 0) INTO v_initiator_coins
      FROM public.characters WHERE id = v_trade.initiator_character_id;
      IF v_initiator_coins < v_trade.initiator_coins THEN
        RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente de SP no iniciador');
      END IF;
    END IF;

    IF v_trade.target_character_id IS NOT NULL AND v_trade.target_coins > 0 THEN
      SELECT COALESCE(coins, 0) INTO v_target_coins
      FROM public.characters WHERE id = v_trade.target_character_id;
      IF v_target_coins < v_trade.target_coins THEN
        RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente de SP no alvo');
      END IF;
    END IF;
  END IF;

  -- Apply initiator side items
  FOR v_item IN
    SELECT ti.item_id, ti.quantity
    FROM public.trade_items ti
    WHERE ti.trade_id = p_trade_id AND ti.side = 'initiator'
  LOOP
    IF v_trade.type = 'shop' THEN
      IF v_trade.target_character_id IS NOT NULL THEN
        INSERT INTO public.character_items (character_id, item_id, quantity)
        VALUES (v_trade.target_character_id, v_item.item_id, v_item.quantity)
        ON CONFLICT (character_id, item_id)
        DO UPDATE SET quantity = character_items.quantity + EXCLUDED.quantity;
      END IF;
    ELSE
      IF v_trade.initiator_character_id IS NOT NULL THEN
        SELECT quantity INTO v_available
        FROM public.character_items
        WHERE character_id = v_trade.initiator_character_id AND item_id = v_item.item_id;

        IF v_available = v_item.quantity THEN
          DELETE FROM public.character_items
          WHERE character_id = v_trade.initiator_character_id AND item_id = v_item.item_id;
        ELSE
          UPDATE public.character_items
          SET quantity = quantity - v_item.quantity
          WHERE character_id = v_trade.initiator_character_id AND item_id = v_item.item_id;
        END IF;
      END IF;

      IF v_trade.target_character_id IS NOT NULL THEN
        INSERT INTO public.character_items (character_id, item_id, quantity)
        VALUES (v_trade.target_character_id, v_item.item_id, v_item.quantity)
        ON CONFLICT (character_id, item_id)
        DO UPDATE SET quantity = character_items.quantity + EXCLUDED.quantity;
      END IF;
    END IF;
  END LOOP;

  -- Apply target side items
  FOR v_item IN
    SELECT ti.item_id, ti.quantity
    FROM public.trade_items ti
    WHERE ti.trade_id = p_trade_id AND ti.side = 'target'
  LOOP
    IF v_trade.target_character_id IS NOT NULL THEN
      SELECT quantity INTO v_available
      FROM public.character_items
      WHERE character_id = v_trade.target_character_id AND item_id = v_item.item_id;

      IF v_available = v_item.quantity THEN
        DELETE FROM public.character_items
        WHERE character_id = v_trade.target_character_id AND item_id = v_item.item_id;
      ELSE
        UPDATE public.character_items
        SET quantity = quantity - v_item.quantity
        WHERE character_id = v_trade.target_character_id AND item_id = v_item.item_id;
      END IF;
    END IF;

    IF v_trade.type = 'npc_trade' AND v_trade.target_npc_id IS NOT NULL AND v_trade.target_character_id IS NULL THEN
      -- Simple NPC: skip debit, only credit initiator
      IF v_trade.initiator_character_id IS NOT NULL THEN
        INSERT INTO public.character_items (character_id, item_id, quantity)
        VALUES (v_trade.initiator_character_id, v_item.item_id, v_item.quantity)
        ON CONFLICT (character_id, item_id)
        DO UPDATE SET quantity = character_items.quantity + EXCLUDED.quantity;
      END IF;
    ELSIF v_trade.initiator_character_id IS NOT NULL THEN
      INSERT INTO public.character_items (character_id, item_id, quantity)
      VALUES (v_trade.initiator_character_id, v_item.item_id, v_item.quantity)
      ON CONFLICT (character_id, item_id)
      DO UPDATE SET quantity = character_items.quantity + EXCLUDED.quantity;
    END IF;
  END LOOP;

  -- Apply coin transfers
  IF v_trade.type = 'shop' THEN
    IF v_trade.target_character_id IS NOT NULL AND v_trade.initiator_coins > 0 THEN
      UPDATE public.characters
      SET coins = COALESCE(coins, 0) + v_trade.initiator_coins
      WHERE id = v_trade.target_character_id;
    END IF;
    IF v_trade.target_character_id IS NOT NULL AND v_trade.target_coins > 0 THEN
      UPDATE public.characters
      SET coins = COALESCE(coins, 0) - v_trade.target_coins
      WHERE id = v_trade.target_character_id;
    END IF;
  ELSE
    IF v_trade.initiator_character_id IS NOT NULL THEN
      UPDATE public.characters
      SET coins = COALESCE(coins, 0) - v_trade.initiator_coins + v_trade.target_coins
      WHERE id = v_trade.initiator_character_id;
    END IF;
    IF v_trade.target_character_id IS NOT NULL THEN
      UPDATE public.characters
      SET coins = COALESCE(coins, 0) - v_trade.target_coins + v_trade.initiator_coins
      WHERE id = v_trade.target_character_id;
    END IF;
  END IF;

  UPDATE public.trades
  SET status = 'completed', completed_at = now()
  WHERE id = p_trade_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
