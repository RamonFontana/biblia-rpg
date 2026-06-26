-- Add level to character_items
ALTER TABLE character_items ADD COLUMN IF NOT EXISTS level integer DEFAULT 1 NOT NULL;

-- Add level to trade_items (if trades exists, otherwise this will skip or fail gracefully, but the feature requests to add it)
-- To avoid failure if trade_items doesn't exist, we can use a DO block
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_items') THEN
        ALTER TABLE trade_items ADD COLUMN IF NOT EXISTS level integer DEFAULT 1 NOT NULL;
    END IF;
END $$;
