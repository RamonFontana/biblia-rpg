ALTER TABLE game_sessions
ADD COLUMN short_rests_today integer DEFAULT 0,
ADD COLUMN last_long_rest_day integer DEFAULT 1;
