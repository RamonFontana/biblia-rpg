-- RLS (Onda 3, passo 7): execute_trade.
-- Antes: SECURITY DEFINER sem search_path e sem checar quem chama, executável por anon: qualquer
-- um executava qualquer troca ativa e pronta. Agora fixa o search_path, exige que quem chama
-- participe da troca (is_trade_participant: quem iniciou, o dono do alvo ou o Mestre) e perde o
-- EXECUTE de anon. O resto do corpo não muda.

create or replace function "public"."execute_trade"("p_trade_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_trade RECORD;
  v_item RECORD;
  v_available INTEGER;
BEGIN
  -- Só quem participa da troca (quem iniciou, o dono do alvo ou o Mestre) a executa.
  IF NOT public.is_trade_participant(p_trade_id) THEN
    RAISE EXCEPTION 'Apenas quem participa da troca pode executá-la' USING ERRCODE = '42501';
  END IF;

  -- Verificar status
  SELECT * INTO v_trade FROM public.trades WHERE id = p_trade_id;
  IF v_trade.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trade não existe');
  END IF;
  IF v_trade.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trade não está ativa');
  END IF;
  IF NOT v_trade.initiator_ready OR NOT v_trade.target_ready THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ambas as partes devem estar prontas');
  END IF;

  -- Apply initiator side items (they give to target)
  FOR v_item IN
    SELECT item_id, side, quantity, level, custom_condition_resistances, weapon_effects
    FROM public.trade_items ti
    WHERE ti.trade_id = p_trade_id AND ti.side = 'initiator'
  LOOP
    IF v_trade.type = 'shop' THEN
      IF v_trade.target_character_id IS NOT NULL THEN
        INSERT INTO public.character_items (character_id, item_id, level, quantity, custom_condition_resistances, weapon_effects)
        VALUES (v_trade.target_character_id, v_item.item_id, COALESCE(v_item.level, 1), v_item.quantity, COALESCE(v_item.custom_condition_resistances, '{}'), COALESCE(v_item.weapon_effects, '[]'))
        ON CONFLICT (character_id, item_id, level)
        DO UPDATE SET 
          quantity = character_items.quantity + EXCLUDED.quantity,
          custom_condition_resistances = EXCLUDED.custom_condition_resistances,
          weapon_effects = EXCLUDED.weapon_effects;
      END IF;
    ELSE
      IF v_trade.initiator_character_id IS NOT NULL THEN
        SELECT quantity INTO v_available
        FROM public.character_items
        WHERE character_id = v_trade.initiator_character_id AND item_id = v_item.item_id AND level = COALESCE(v_item.level, 1);

        IF v_available = v_item.quantity THEN
          DELETE FROM public.character_items
          WHERE character_id = v_trade.initiator_character_id AND item_id = v_item.item_id AND level = COALESCE(v_item.level, 1);
        ELSE
          UPDATE public.character_items
          SET quantity = quantity - v_item.quantity
          WHERE character_id = v_trade.initiator_character_id AND item_id = v_item.item_id AND level = COALESCE(v_item.level, 1);
        END IF;
      END IF;

      IF v_trade.target_character_id IS NOT NULL THEN
        INSERT INTO public.character_items (character_id, item_id, level, quantity, custom_condition_resistances, weapon_effects)
        VALUES (v_trade.target_character_id, v_item.item_id, COALESCE(v_item.level, 1), v_item.quantity, COALESCE(v_item.custom_condition_resistances, '{}'), COALESCE(v_item.weapon_effects, '[]'))
        ON CONFLICT (character_id, item_id, level)
        DO UPDATE SET 
          quantity = character_items.quantity + EXCLUDED.quantity,
          custom_condition_resistances = EXCLUDED.custom_condition_resistances,
          weapon_effects = EXCLUDED.weapon_effects;
      END IF;
    END IF;
  END LOOP;

  -- Apply target side items
  FOR v_item IN
    SELECT item_id, side, quantity, level, custom_condition_resistances, weapon_effects
    FROM public.trade_items ti
    WHERE ti.trade_id = p_trade_id AND ti.side = 'target'
  LOOP
    IF v_trade.target_character_id IS NOT NULL THEN
      SELECT quantity INTO v_available
      FROM public.character_items
      WHERE character_id = v_trade.target_character_id AND item_id = v_item.item_id AND level = COALESCE(v_item.level, 1);

      IF v_available = v_item.quantity THEN
        DELETE FROM public.character_items
        WHERE character_id = v_trade.target_character_id AND item_id = v_item.item_id AND level = COALESCE(v_item.level, 1);
      ELSE
        UPDATE public.character_items
        SET quantity = quantity - v_item.quantity
        WHERE character_id = v_trade.target_character_id AND item_id = v_item.item_id AND level = COALESCE(v_item.level, 1);
      END IF;
    END IF;

    IF v_trade.type = 'npc_trade' AND v_trade.target_npc_id IS NOT NULL AND v_trade.target_character_id IS NULL THEN
      -- Simple NPC: skip debit, only credit initiator
      IF v_trade.initiator_character_id IS NOT NULL THEN
        INSERT INTO public.character_items (character_id, item_id, level, quantity, custom_condition_resistances, weapon_effects)
        VALUES (v_trade.initiator_character_id, v_item.item_id, COALESCE(v_item.level, 1), v_item.quantity, COALESCE(v_item.custom_condition_resistances, '{}'), COALESCE(v_item.weapon_effects, '[]'))
        ON CONFLICT (character_id, item_id, level)
        DO UPDATE SET 
          quantity = character_items.quantity + EXCLUDED.quantity,
          custom_condition_resistances = EXCLUDED.custom_condition_resistances,
          weapon_effects = EXCLUDED.weapon_effects;
      END IF;
    ELSIF v_trade.initiator_character_id IS NOT NULL THEN
      INSERT INTO public.character_items (character_id, item_id, level, quantity, custom_condition_resistances, weapon_effects)
      VALUES (v_trade.initiator_character_id, v_item.item_id, COALESCE(v_item.level, 1), v_item.quantity, COALESCE(v_item.custom_condition_resistances, '{}'), COALESCE(v_item.weapon_effects, '[]'))
      ON CONFLICT (character_id, item_id, level)
      DO UPDATE SET 
        quantity = character_items.quantity + EXCLUDED.quantity,
        custom_condition_resistances = EXCLUDED.custom_condition_resistances,
        weapon_effects = EXCLUDED.weapon_effects;
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

revoke execute on function public.execute_trade(uuid) from public, anon;
