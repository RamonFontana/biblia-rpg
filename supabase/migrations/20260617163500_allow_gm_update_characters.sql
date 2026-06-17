-- Allow GM to update characters of participants in their active sessions
-- This fixes the issue where GMs couldn't update player stats (PV/Faith) during sessions

CREATE POLICY "GM can update session participant characters"
  ON public.characters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM session_participants sp
      JOIN game_sessions gs ON gs.id = sp.session_id
      WHERE sp.character_id = characters.id
        AND gs.gm_id = auth.uid()
        AND gs.status = 'active'
    )
  );

-- Allow players to update their own characters during active sessions
-- The original policy blocked updates when has_participated_in_session = true
CREATE POLICY "Players can update own characters during active session"
  ON public.characters
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND has_participated_in_session = true
    AND EXISTS (
      SELECT 1
      FROM session_participants sp
      JOIN game_sessions gs ON gs.id = sp.session_id
      WHERE sp.character_id = characters.id
        AND gs.status = 'active'
    )
  );
