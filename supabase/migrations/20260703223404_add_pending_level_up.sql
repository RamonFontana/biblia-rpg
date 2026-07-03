-- Add pending_level_up column to characters table
ALTER TABLE characters ADD COLUMN pending_level_up BOOLEAN NOT NULL DEFAULT false;
