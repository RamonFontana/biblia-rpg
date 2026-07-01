-- Add custom_condition_resistances to character_items
ALTER TABLE character_items
ADD COLUMN IF NOT EXISTS custom_condition_resistances text[] DEFAULT '{}'::text[];

-- Add custom_condition_resistances to trade_items
ALTER TABLE trade_items
ADD COLUMN IF NOT EXISTS custom_condition_resistances text[] DEFAULT '{}'::text[];