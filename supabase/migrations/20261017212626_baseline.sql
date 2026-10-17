-- Migration-base (Onda 3, passo 1): o schema public real do projeto em 2026-10-17,
-- gerado por `supabase db dump --linked --schema public`. Substitui as 31 migrations anteriores,
-- que não recriavam o banco (a tabela characters foi criada pelo dashboard e nunca teve migration).
-- As migrations antigas continuam no histórico do git. O registro remoto foi ajustado com
-- `supabase migration repair` (antigas como reverted, esta como applied); ver docs/ROADMAP.md.
-- O dump não inclui a publicação do Realtime nem o gatilho de RLS automático; os dois estão no fim.
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."combat_entity_type" AS ENUM (
    'player',
    'npc',
    'enemy'
);


ALTER TYPE "public"."combat_entity_type" OWNER TO "postgres";


CREATE TYPE "public"."combat_status" AS ENUM (
    'setup',
    'active',
    'paused',
    'finished'
);


ALTER TYPE "public"."combat_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_kit_to_character"("p_character_id" "uuid", "p_kit_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    k_item RECORD;
BEGIN
    FOR k_item IN SELECT item_id, quantity FROM kit_items WHERE kit_id = p_kit_id LOOP
        INSERT INTO character_items (character_id, item_id, quantity)
        VALUES (p_character_id, k_item.item_id, k_item.quantity)
        ON CONFLICT (character_id, item_id) 
        DO UPDATE SET quantity = character_items.quantity + EXCLUDED.quantity;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."add_kit_to_character"("p_character_id" "uuid", "p_kit_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_session_trades"("p_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.trades
  SET status = 'cancelled', completed_at = now()
  WHERE session_id = p_session_id
    AND status IN ('pending', 'active');
END;
$$;


ALTER FUNCTION "public"."cancel_session_trades"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_game_session"("session_name" "text", "session_description" "text", "enemies" "jsonb", "npcs" "jsonb", "participant_character_ids" "uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_session_id uuid;
  char_record record;
  enemy_record record;
  npc_record record;
begin
  -- 1. Create Session
  insert into public.game_sessions (name, description, gm_id, status)
  values (session_name, session_description, auth.uid(), 'active')
  returning id into new_session_id;

  -- 2. Insert Enemies
  if jsonb_typeof(enemies) = 'array' then
    for enemy_record in select * from jsonb_to_recordset(enemies) as x(base_enemy_id text, name text, max_hp int, current_hp int) loop
      insert into public.session_enemies (session_id, base_enemy_id, name, max_hp, current_hp)
      values (new_session_id, enemy_record.base_enemy_id, enemy_record.name, enemy_record.max_hp, enemy_record.current_hp);
    end loop;
  end if;

  -- 3. Insert NPCs
  if jsonb_typeof(npcs) = 'array' then
    for npc_record in select * from jsonb_to_recordset(npcs) as x(name text, description text, stats jsonb, is_visible boolean) loop
      insert into public.session_npcs (session_id, name, description, stats, is_visible)
      values (new_session_id, npc_record.name, npc_record.description, npc_record.stats, coalesce(npc_record.is_visible, false));
    end loop;
  end if;

  -- 4. Insert Participants
  if array_length(participant_character_ids, 1) > 0 then
    for char_record in select id, user_id from public.characters where id = any(participant_character_ids) loop
      insert into public.session_participants (session_id, character_id, user_id)
      values (new_session_id, char_record.id, char_record.user_id);
    end loop;
  end if;

  return new_session_id;
end;
$$;


ALTER FUNCTION "public"."create_game_session"("session_name" "text", "session_description" "text", "enemies" "jsonb", "npcs" "jsonb", "participant_character_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_trade"("p_trade_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_trade RECORD;
  v_item RECORD;
  v_available INTEGER;
BEGIN
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


ALTER FUNCTION "public"."execute_trade"("p_trade_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_session_gm"("check_session_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return exists (
    select 1 from public.game_sessions
    where id = check_session_id and gm_id = auth.uid()
  );
end;
$$;


ALTER FUNCTION "public"."is_session_gm"("check_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_session_participant"("check_session_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return exists (
    select 1 from public.session_participants
    where session_id = check_session_id and user_id = auth.uid()
  );
end;
$$;


ALTER FUNCTION "public"."is_session_participant"("check_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_trade_participant"("check_trade_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."is_trade_participant"("check_trade_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_consumable_item"("p_character_item_id" "uuid", "p_target_character_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_quantity INTEGER;
    v_is_consumable BOOLEAN;
BEGIN
    -- Get current quantity and check if consumable
    SELECT ci.quantity, i.is_consumable 
    INTO v_quantity, v_is_consumable
    FROM character_items ci
    JOIN items i ON i.id = ci.item_id
    WHERE ci.id = p_character_item_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF NOT v_is_consumable THEN
        RETURN false;
    END IF;

    IF v_quantity > 1 THEN
        UPDATE character_items SET quantity = quantity - 1 WHERE id = p_character_item_id;
    ELSE
        DELETE FROM character_items WHERE id = p_character_item_id;
    END IF;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."use_consumable_item"("p_character_item_id" "uuid", "p_target_character_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."character_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "character_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "level" integer DEFAULT 1 NOT NULL,
    "custom_condition_resistances" "text"[] DEFAULT '{}'::"text"[],
    "weapon_effects" "jsonb"
);

ALTER TABLE ONLY "public"."character_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."character_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "tribe" "text" NOT NULL,
    "vocation" "text" NOT NULL,
    "attributes" "jsonb" NOT NULL,
    "fortress" "text",
    "temptation" "text",
    "stats" "jsonb" NOT NULL,
    "equipment" "jsonb" DEFAULT '[]'::"jsonb",
    "coins" integer DEFAULT 0,
    "narrative" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "has_participated_in_session" boolean DEFAULT false,
    "is_npc" boolean DEFAULT false,
    "is_visible" boolean DEFAULT true NOT NULL,
    "is_enemy" boolean DEFAULT false NOT NULL,
    "skills" "jsonb" DEFAULT '[]'::"jsonb",
    "death_saves_successes" integer DEFAULT 0 NOT NULL,
    "death_saves_failures" integer DEFAULT 0 NOT NULL,
    "is_stable" boolean DEFAULT false NOT NULL,
    "is_dead" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "level" integer DEFAULT 1 NOT NULL,
    "proficiencies" "jsonb",
    "pending_level_up" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."combat_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "combat_id" "uuid" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "entity_type" "public"."combat_entity_type" NOT NULL,
    "initiative" integer DEFAULT 0 NOT NULL,
    "hp_current" integer DEFAULT 0 NOT NULL,
    "conditions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_surprised" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."combat_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."combats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "status" "public"."combat_status" DEFAULT 'setup'::"public"."combat_status" NOT NULL,
    "current_turn_index" integer DEFAULT 0 NOT NULL,
    "round_number" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."combats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "gm_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_day" integer DEFAULT 1 NOT NULL,
    "current_period" "text" DEFAULT 'Manhã'::"text" NOT NULL,
    "short_rests_today" integer DEFAULT 0,
    "last_long_rest_day" integer DEFAULT 1,
    CONSTRAINT "game_sessions_current_period_check" CHECK (("current_period" = ANY (ARRAY['Manhã'::"text", 'Tarde'::"text", 'Noite'::"text"]))),
    CONSTRAINT "game_sessions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'finished'::"text"])))
);


ALTER TABLE "public"."game_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "is_consumable" boolean DEFAULT false,
    "requires_target" boolean DEFAULT false,
    "is_kit" boolean DEFAULT false,
    "weight" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "effects" "jsonb" DEFAULT '{}'::"jsonb",
    "price" integer,
    "condition_resistances" "text"[] DEFAULT '{}'::"text"[],
    "level" integer DEFAULT 1,
    "armor_class" integer DEFAULT 0,
    "damage" "text"
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kit_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "kit_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1
);


ALTER TABLE "public"."kit_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_enemies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "base_enemy_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "current_hp" integer NOT NULL,
    "max_hp" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."session_enemies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_npcs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "stats" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_visible" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."session_npcs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "character_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."session_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_test_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "test_id" "uuid" NOT NULL,
    "character_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "result_value" integer,
    "is_approved" boolean,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "roll_value" integer,
    CONSTRAINT "session_test_results_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'submitted'::"text"])))
);


ALTER TABLE "public"."session_test_results" OWNER TO "postgres";


COMMENT ON COLUMN "public"."session_test_results"."roll_value" IS 'Dado rolado pelo jogador, sem modificadores. Nulo em testes antigos.';



CREATE TABLE IF NOT EXISTS "public"."session_tests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "test_type" "text" NOT NULL,
    "difficulty" integer NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "session_tests_difficulty_check" CHECK ((("difficulty" >= '-100'::integer) AND ("difficulty" <= 100))),
    CONSTRAINT "session_tests_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."session_tests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trade_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trade_id" "uuid" NOT NULL,
    "side" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "custom_condition_resistances" "text"[] DEFAULT '{}'::"text"[],
    "weapon_effects" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "trade_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "trade_items_side_check" CHECK (("side" = ANY (ARRAY['initiator'::"text", 'target'::"text"])))
);


ALTER TABLE "public"."trade_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "initiator_character_id" "uuid",
    "initiator_user_id" "uuid" NOT NULL,
    "target_character_id" "uuid",
    "target_npc_id" "uuid",
    "initiator_coins" integer DEFAULT 0 NOT NULL,
    "target_coins" integer DEFAULT 0 NOT NULL,
    "initiator_ready" boolean DEFAULT false NOT NULL,
    "target_ready" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "trades_at_least_one_character" CHECK ((("initiator_character_id" IS NOT NULL) OR ("target_character_id" IS NOT NULL))),
    CONSTRAINT "trades_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "trades_type_check" CHECK (("type" = ANY (ARRAY['player_trade'::"text", 'shop'::"text", 'npc_trade'::"text"])))
);


ALTER TABLE "public"."trades" OWNER TO "postgres";


ALTER TABLE ONLY "public"."character_items"
    ADD CONSTRAINT "character_items_character_id_item_id_level_key" UNIQUE ("character_id", "item_id", "level");



ALTER TABLE ONLY "public"."character_items"
    ADD CONSTRAINT "character_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."combat_participants"
    ADD CONSTRAINT "combat_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."combats"
    ADD CONSTRAINT "combats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kit_items"
    ADD CONSTRAINT "kit_items_kit_id_item_id_key" UNIQUE ("kit_id", "item_id");



ALTER TABLE ONLY "public"."kit_items"
    ADD CONSTRAINT "kit_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_enemies"
    ADD CONSTRAINT "session_enemies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_npcs"
    ADD CONSTRAINT "session_npcs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_test_results"
    ADD CONSTRAINT "session_test_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_tests"
    ADD CONSTRAINT "session_tests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trade_items"
    ADD CONSTRAINT "trade_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trade_items"
    ADD CONSTRAINT "trade_items_trade_id_side_item_id_key" UNIQUE ("trade_id", "side", "item_id");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_character_items_character_id" ON "public"."character_items" USING "btree" ("character_id");



CREATE INDEX "idx_characters_is_enemy" ON "public"."characters" USING "btree" ("is_enemy");



CREATE INDEX "idx_kit_items_kit_id" ON "public"."kit_items" USING "btree" ("kit_id");



CREATE INDEX "idx_trade_items_trade_id" ON "public"."trade_items" USING "btree" ("trade_id");



CREATE INDEX "idx_trades_session_id" ON "public"."trades" USING "btree" ("session_id");



CREATE INDEX "idx_trades_status" ON "public"."trades" USING "btree" ("status");



ALTER TABLE ONLY "public"."character_items"
    ADD CONSTRAINT "character_items_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."character_items"
    ADD CONSTRAINT "character_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."combat_participants"
    ADD CONSTRAINT "combat_participants_combat_id_fkey" FOREIGN KEY ("combat_id") REFERENCES "public"."combats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."combats"
    ADD CONSTRAINT "combats_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_gm_id_fkey" FOREIGN KEY ("gm_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kit_items"
    ADD CONSTRAINT "kit_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kit_items"
    ADD CONSTRAINT "kit_items_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_enemies"
    ADD CONSTRAINT "session_enemies_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_npcs"
    ADD CONSTRAINT "session_npcs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."session_test_results"
    ADD CONSTRAINT "session_test_results_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_test_results"
    ADD CONSTRAINT "session_test_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_test_results"
    ADD CONSTRAINT "session_test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."session_tests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_tests"
    ADD CONSTRAINT "session_tests_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trade_items"
    ADD CONSTRAINT "trade_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."trade_items"
    ADD CONSTRAINT "trade_items_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_initiator_character_id_fkey" FOREIGN KEY ("initiator_character_id") REFERENCES "public"."characters"("id");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_initiator_user_id_fkey" FOREIGN KEY ("initiator_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_target_character_id_fkey" FOREIGN KEY ("target_character_id") REFERENCES "public"."characters"("id");



ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_target_npc_id_fkey" FOREIGN KEY ("target_npc_id") REFERENCES "public"."session_npcs"("id");



CREATE POLICY "Anyone can read session_test_results" ON "public"."session_test_results" FOR SELECT USING (true);



CREATE POLICY "Anyone can read session_tests" ON "public"."session_tests" FOR SELECT USING (true);



CREATE POLICY "Character items viewable by session participants" ON "public"."character_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "GM can update session participant characters" ON "public"."characters" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."session_participants" "sp"
     JOIN "public"."game_sessions" "gs" ON (("gs"."id" = "sp"."session_id")))
  WHERE (("sp"."character_id" = "characters"."id") AND ("gs"."gm_id" = "auth"."uid"()) AND ("gs"."status" = 'active'::"text")))));



CREATE POLICY "GMs can create sessions" ON "public"."game_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "gm_id"));



CREATE POLICY "GMs can manage combat participants" ON "public"."combat_participants" USING ((EXISTS ( SELECT 1
   FROM "public"."combats" "c"
  WHERE (("c"."id" = "combat_participants"."combat_id") AND "public"."is_session_gm"("c"."session_id")))));



CREATE POLICY "GMs can manage combats" ON "public"."combats" USING ("public"."is_session_gm"("session_id"));



CREATE POLICY "GMs can manage session enemies" ON "public"."session_enemies" USING ("public"."is_session_gm"("session_id"));



CREATE POLICY "GMs can manage session npcs" ON "public"."session_npcs" USING ("public"."is_session_gm"("session_id"));



CREATE POLICY "GMs can manage session participants" ON "public"."session_participants" USING ("public"."is_session_gm"("session_id"));



CREATE POLICY "GMs can update their sessions" ON "public"."game_sessions" FOR UPDATE USING (("auth"."uid"() = "gm_id"));



CREATE POLICY "Items are viewable by everyone" ON "public"."items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Kit items are viewable by everyone" ON "public"."kit_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Masters can insert session_test_results" ON "public"."session_test_results" FOR INSERT WITH CHECK (true);



CREATE POLICY "Masters can insert session_tests" ON "public"."session_tests" FOR INSERT WITH CHECK (true);



CREATE POLICY "Masters can update session_tests" ON "public"."session_tests" FOR UPDATE USING (true);



CREATE POLICY "Players can update own characters during active session" ON "public"."characters" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("has_participated_in_session" = true) AND (EXISTS ( SELECT 1
   FROM ("public"."session_participants" "sp"
     JOIN "public"."game_sessions" "gs" ON (("gs"."id" = "sp"."session_id")))
  WHERE (("sp"."character_id" = "characters"."id") AND ("gs"."status" = 'active'::"text"))))));



CREATE POLICY "Players can update their own results" ON "public"."session_test_results" FOR UPDATE USING (("auth"."uid"() = "player_id"));



CREATE POLICY "Session participants can create trades" ON "public"."trades" FOR INSERT WITH CHECK (("public"."is_session_gm"("session_id") OR "public"."is_session_participant"("session_id")));



CREATE POLICY "Session participants can view trade items" ON "public"."trade_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trades" "t"
  WHERE (("t"."id" = "trade_items"."trade_id") AND ("public"."is_session_gm"("t"."session_id") OR "public"."is_session_participant"("t"."session_id"))))));



CREATE POLICY "Session participants can view trades" ON "public"."trades" FOR SELECT USING (("public"."is_session_gm"("session_id") OR "public"."is_session_participant"("session_id")));



CREATE POLICY "Trade participants and GM can update trades" ON "public"."trades" FOR UPDATE USING ("public"."is_trade_participant"("id"));



CREATE POLICY "Trade participants can manage trade items" ON "public"."trade_items" USING ((EXISTS ( SELECT 1
   FROM "public"."trades" "t"
  WHERE (("t"."id" = "trade_items"."trade_id") AND "public"."is_trade_participant"("t"."id")))));



CREATE POLICY "Users can delete their own characters if not in session" ON "public"."characters" FOR DELETE USING ((("auth"."uid"() = "user_id") AND ("has_participated_in_session" = false)));



CREATE POLICY "Users can insert items" ON "public"."items" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert their own characters" ON "public"."characters" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can join sessions they are invited to" ON "public"."session_participants" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own character items" ON "public"."character_items" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can update their own characters" ON "public"."characters" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all characters" ON "public"."characters" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view combat participants" ON "public"."combat_participants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."combats" "c"
  WHERE (("c"."id" = "combat_participants"."combat_id") AND ("public"."is_session_gm"("c"."session_id") OR "public"."is_session_participant"("c"."session_id"))))));



CREATE POLICY "Users can view combats for their sessions" ON "public"."combats" FOR SELECT USING (("public"."is_session_gm"("session_id") OR "public"."is_session_participant"("session_id")));



CREATE POLICY "Users can view session enemies" ON "public"."session_enemies" FOR SELECT USING (("public"."is_session_gm"("session_id") OR "public"."is_session_participant"("session_id")));



CREATE POLICY "Users can view session npcs" ON "public"."session_npcs" FOR SELECT USING (("public"."is_session_gm"("session_id") OR ("public"."is_session_participant"("session_id") AND ("is_visible" = true))));



CREATE POLICY "Users can view session participants" ON "public"."session_participants" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_session_gm"("session_id") OR "public"."is_session_participant"("session_id")));



CREATE POLICY "Users can view sessions they are part of or created" ON "public"."game_sessions" FOR SELECT USING ((("auth"."uid"() = "gm_id") OR "public"."is_session_participant"("id")));



CREATE POLICY "Users can view their own characters" ON "public"."characters" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."character_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."combat_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."combats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kit_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_enemies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_npcs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_test_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_tests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trade_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_kit_to_character"("p_character_id" "uuid", "p_kit_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_kit_to_character"("p_character_id" "uuid", "p_kit_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_kit_to_character"("p_character_id" "uuid", "p_kit_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_session_trades"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_session_trades"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_session_trades"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_game_session"("session_name" "text", "session_description" "text", "enemies" "jsonb", "npcs" "jsonb", "participant_character_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_game_session"("session_name" "text", "session_description" "text", "enemies" "jsonb", "npcs" "jsonb", "participant_character_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_game_session"("session_name" "text", "session_description" "text", "enemies" "jsonb", "npcs" "jsonb", "participant_character_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_trade"("p_trade_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_trade"("p_trade_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_trade"("p_trade_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_session_gm"("check_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_session_gm"("check_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_session_gm"("check_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_session_participant"("check_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_session_participant"("check_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_session_participant"("check_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_trade_participant"("check_trade_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_trade_participant"("check_trade_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_trade_participant"("check_trade_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."use_consumable_item"("p_character_item_id" "uuid", "p_target_character_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."use_consumable_item"("p_character_item_id" "uuid", "p_target_character_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_consumable_item"("p_character_item_id" "uuid", "p_target_character_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."character_items" TO "anon";
GRANT ALL ON TABLE "public"."character_items" TO "authenticated";
GRANT ALL ON TABLE "public"."character_items" TO "service_role";



GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."combat_participants" TO "anon";
GRANT ALL ON TABLE "public"."combat_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."combat_participants" TO "service_role";



GRANT ALL ON TABLE "public"."combats" TO "anon";
GRANT ALL ON TABLE "public"."combats" TO "authenticated";
GRANT ALL ON TABLE "public"."combats" TO "service_role";



GRANT ALL ON TABLE "public"."game_sessions" TO "anon";
GRANT ALL ON TABLE "public"."game_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."kit_items" TO "anon";
GRANT ALL ON TABLE "public"."kit_items" TO "authenticated";
GRANT ALL ON TABLE "public"."kit_items" TO "service_role";



GRANT ALL ON TABLE "public"."session_enemies" TO "anon";
GRANT ALL ON TABLE "public"."session_enemies" TO "authenticated";
GRANT ALL ON TABLE "public"."session_enemies" TO "service_role";



GRANT ALL ON TABLE "public"."session_npcs" TO "anon";
GRANT ALL ON TABLE "public"."session_npcs" TO "authenticated";
GRANT ALL ON TABLE "public"."session_npcs" TO "service_role";



GRANT ALL ON TABLE "public"."session_participants" TO "anon";
GRANT ALL ON TABLE "public"."session_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."session_participants" TO "service_role";



GRANT ALL ON TABLE "public"."session_test_results" TO "anon";
GRANT ALL ON TABLE "public"."session_test_results" TO "authenticated";
GRANT ALL ON TABLE "public"."session_test_results" TO "service_role";



GRANT ALL ON TABLE "public"."session_tests" TO "anon";
GRANT ALL ON TABLE "public"."session_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."session_tests" TO "service_role";



GRANT ALL ON TABLE "public"."trade_items" TO "anon";
GRANT ALL ON TABLE "public"."trade_items" TO "authenticated";
GRANT ALL ON TABLE "public"."trade_items" TO "service_role";



GRANT ALL ON TABLE "public"."trades" TO "anon";
GRANT ALL ON TABLE "public"."trades" TO "authenticated";
GRANT ALL ON TABLE "public"."trades" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";









-- Realtime: tabelas que o app assina (pg_publication_tables em produção).
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY
    "public"."character_items",
    "public"."characters",
    "public"."combat_participants",
    "public"."combats",
    "public"."game_sessions",
    "public"."session_enemies",
    "public"."session_npcs",
    "public"."session_test_results",
    "public"."session_tests",
    "public"."trade_items",
    "public"."trades";


-- RLS automático em tabela nova (gatilho existente em produção).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'ensure_rls') THEN
    CREATE EVENT TRIGGER "ensure_rls" ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      EXECUTE FUNCTION "public"."rls_auto_enable"();
  END IF;
END
$$;
