import type { DraftCharacter } from '../../character-creation/types';

export interface Character extends DraftCharacter {
  id: string;
  user_id: string;
  has_participated_in_session: boolean;
  is_npc?: boolean;
  created_at: string;
  updated_at: string;
}
