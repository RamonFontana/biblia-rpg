-- Add missing combat properties to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS condition_resistances text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS armor_class integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS damage text DEFAULT NULL;
