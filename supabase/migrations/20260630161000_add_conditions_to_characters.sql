ALTER TABLE characters ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '[]'::jsonb;
