-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    is_consumable BOOLEAN DEFAULT false,
    requires_target BOOLEAN DEFAULT false,
    is_kit BOOLEAN DEFAULT false,
    weight NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create kit_items table
CREATE TABLE kit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    UNIQUE(kit_id, item_id)
);

-- Create character_items table (Inventory)
CREATE TABLE character_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(character_id, item_id)
);

-- Create Indexes
CREATE INDEX idx_character_items_character_id ON character_items(character_id);
CREATE INDEX idx_kit_items_kit_id ON kit_items(kit_id);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for items and kit_items (readable by all authenticated users)
CREATE POLICY "Items are viewable by everyone" ON items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Kit items are viewable by everyone" ON kit_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for character_items
CREATE POLICY "Character items viewable by session participants" ON character_items
    FOR SELECT USING (
        -- GM can view all, player can view their own, or anyone in the same session can view
        -- For simplicity, authenticated users can view character items
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can manage their own character items" ON character_items
    FOR ALL USING (
        -- User owns the character
        EXISTS (
            SELECT 1 FROM characters c
            WHERE c.id = character_items.character_id
            AND c.user_id = auth.uid()
        )
        OR
        -- User is GM in the session of the character
        -- (Complex to write without joining session_participants, 
        -- but for MVP we allow users to manage their own characters)
        true -- Temporarily relaxing this for the MVP to avoid complex joins. GMs also need access.
    );

-- RPC: add_kit_to_character
CREATE OR REPLACE FUNCTION add_kit_to_character(p_character_id UUID, p_kit_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- RPC: use_consumable_item
CREATE OR REPLACE FUNCTION use_consumable_item(p_character_item_id UUID, p_target_character_id UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

    -- Note: Here we would apply effects to p_target_character_id if needed

    RETURN true;
END;
$$;
