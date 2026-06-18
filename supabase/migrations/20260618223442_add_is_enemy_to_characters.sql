-- Migration: add_is_enemy_to_characters
-- Purpose: Add is_enemy flag to characters table for the Enemy List feature

ALTER TABLE public.characters 
ADD COLUMN is_enemy BOOLEAN NOT NULL DEFAULT false;

-- Add index since we will filter session characters by is_enemy
CREATE INDEX IF NOT EXISTS idx_characters_is_enemy ON public.characters(is_enemy);
