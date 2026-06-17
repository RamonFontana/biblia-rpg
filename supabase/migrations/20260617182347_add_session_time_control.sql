ALTER TABLE public.game_sessions
ADD COLUMN current_day integer DEFAULT 1 NOT NULL,
ADD COLUMN current_period text DEFAULT 'Manhã' NOT NULL CHECK (current_period IN ('Manhã', 'Tarde', 'Noite'));
