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
  /** O dia da sessão (e a sessão) em que a Inspiração foi usada; `null` = nunca. */
  inspiration_used_day?: number | null;
  inspiration_session_id?: string | null;
  /** Quantos Dados de Vida já foram gastos; o total é o nível (`domain/hitDice`). */
  hit_dice_spent?: number;
  /** A identidade do último Descanso Curto em que as Habilidades foram recarregadas. */
  last_short_rest_recharge?: string | null;
  /** A Tocha do personagem está acesa (ilumina o pin dele no mapa). */
  torch_lit?: boolean;
  /** Falso = Oculto: o Mestre tirou o Retrato da vista dos jogadores (inimigos e NPCs jogáveis). */
  is_visible?: boolean;
  death_saves_successes?: number;
  death_saves_failures?: number;
  created_at: string;
  updated_at: string;
}
