import { supabase } from '@/lib/supabase';
import type { SessionEnemyDraft, SessionNPCDraft } from '@/store/createSessionStore';

export interface CreateSessionPayload {
  session_name: string;
  session_description: string;
  enemies: SessionEnemyDraft[];
  npcs: SessionNPCDraft[];
  participant_character_ids: string[];
}

export const createGameSession = async (payload: CreateSessionPayload): Promise<string> => {
  const { data, error } = await supabase.rpc('create_game_session', {
    session_name: payload.session_name,
    session_description: payload.session_description,
    enemies: payload.enemies,
    npcs: payload.npcs,
    participant_character_ids: payload.participant_character_ids,
  });

  if (error) {
    console.error('Error creating session via RPC:', error);
    throw error;
  }

  return data; // Returns the new session UUID
};
