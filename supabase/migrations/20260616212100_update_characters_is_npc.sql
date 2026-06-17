-- Add is_npc flag to characters
ALTER TABLE public.characters ADD COLUMN is_npc boolean DEFAULT false;
