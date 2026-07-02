-- Migration to add level and proficiencies to characters table
-- Generated as part of 046-skills-proficiency-system

ALTER TABLE public.characters
ADD COLUMN level integer NOT NULL DEFAULT 1,
ADD COLUMN proficiencies jsonb;
