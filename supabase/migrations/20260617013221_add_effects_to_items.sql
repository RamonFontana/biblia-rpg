-- Adiciona a coluna effects para lidar com efeitos de cura, restauração, etc.
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS effects JSONB DEFAULT '{}'::jsonb;
