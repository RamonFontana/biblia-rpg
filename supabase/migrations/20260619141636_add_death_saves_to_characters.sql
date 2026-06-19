-- Migration to add death saves to characters

ALTER TABLE public.characters
ADD COLUMN death_saves_successes INTEGER NOT NULL DEFAULT 0,
ADD COLUMN death_saves_failures INTEGER NOT NULL DEFAULT 0,
ADD COLUMN is_stable BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_dead BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Notify Supabase Realtime of these changes by ensuring the table is in the publication
-- (assuming it's already there, but just in case)
-- This was likely done in a previous migration, but adding columns automatically works with existing publications.
