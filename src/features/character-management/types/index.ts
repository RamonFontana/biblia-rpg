import type { DraftCharacter } from '../../character-creation/types';

export interface Character extends DraftCharacter {
  id: string;
  user_id: string;
  has_participated_in_session: boolean;
  is_npc?: boolean;
  is_enemy?: boolean;
  is_deleted?: boolean;
  is_playable?: boolean;
  is_dead?: boolean;
  is_stable?: boolean;
  death_saves_successes?: number;
  death_saves_failures?: number;
  created_at: string;
  updated_at: string;
}
