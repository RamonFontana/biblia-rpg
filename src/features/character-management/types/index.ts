import type { CharacterEquipment, ConditionEntry } from '@/types/combat';
import type { DraftCharacter, EquipmentItem } from '../../character-creation/types';

export interface Character extends Omit<DraftCharacter, 'equipment'> {
  /**
   * As posições vestidas (ids de `character_items`). A ficha recém-criada ainda guarda aí a lista
   * de compras da criação (um array) até o primeiro item ser equipado; ver ROADMAP, passo 7d.
   */
  equipment?: CharacterEquipment | EquipmentItem[] | null;
  /** As Condições ativas (`characters.conditions`, `jsonb`). */
  conditions?: ConditionEntry[] | null;
  id: string;
  user_id: string;
  has_participated_in_session: boolean;
  is_npc?: boolean;
  is_enemy?: boolean;
  is_deleted?: boolean;
  is_playable?: boolean;
  is_dead?: boolean;
  is_stable?: boolean;
  pending_level_up?: boolean;
  death_saves_successes?: number;
  death_saves_failures?: number;
  created_at: string;
  updated_at: string;
}
