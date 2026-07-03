-- Relax RLS policy so players can update their characters even after participating in a session
-- This is necessary to allow updating Narrative, Appearance, and History from the character sheet.
-- The frontend is responsible for preventing updates to restricted fields like stats and skills.

DROP POLICY IF EXISTS "Users can update their own characters if not in session" ON public.characters;

CREATE POLICY "Users can update their own characters"
  ON public.characters
  FOR UPDATE
  USING (auth.uid() = user_id);
