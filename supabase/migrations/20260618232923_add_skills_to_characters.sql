ALTER TABLE public.characters ADD COLUMN skills jsonb DEFAULT '[]'::jsonb;
