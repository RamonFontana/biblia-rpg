// Quem aparece como Retrato no Palco do jogador (CONTEXT.md: Palco, Retrato): o grupo, os NPCs
// visíveis e, em combate, os inimigos que estão nele. No combate o PV e as Condições saem do
// participante, porque a ficha só recebe o PV no fim do combate.
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import type { SessionCharacter, SessionNpc, SessionPlayer } from '@/data-access/sessions';
import type { ConditionEntry } from '@/types/combat';

export type RetratoKind = 'player' | 'npc' | 'enemy';

export interface Retrato {
  /** O id da ficha (ou do NPC): é o `entity_id` do combate. */
  id: string;
  kind: RetratoKind;
  name: string;
  imageUrl?: string;
  pv: number;
  pvMax: number;
  /** A 0 PV ou menos. */
  down: boolean;
  conditions: ConditionEntry[];
  /** É o personagem de quem está olhando. */
  isMe: boolean;
  /** Só do grupo: de quem é o personagem (para Negociar). */
  userId?: string;
  /** Só dos NPCs: a linha inteira, que o Negociar devolve. */
  npc?: SessionNpc;
  /** Só em combate: o participante dele. */
  participantId?: string;
}

interface CombatSlice {
  id: string;
  entity_id: string;
  hp_current: number;
  conditions: unknown;
}

interface BuildInput {
  playerCharacters: SessionPlayer[];
  npcs: SessionNpc[];
  enemies: SessionCharacter[];
  myCharacterId: string | undefined;
  hasActiveCombat: boolean;
  participants: CombatSlice[];
}

const asConditions = (value: unknown): ConditionEntry[] =>
  Array.isArray(value) ? (value as ConditionEntry[]) : [];

export function buildRetratos({
  playerCharacters,
  npcs,
  enemies,
  myCharacterId,
  hasActiveCombat,
  participants,
}: BuildInput): Retrato[] {
  const participantOf = (entityId: string) =>
    hasActiveCombat ? participants.find((p) => p.entity_id === entityId) : undefined;

  const make = (
    character: SessionCharacter,
    kind: RetratoKind,
    fallbackName: string,
    extra: Partial<Retrato> = {},
  ): Retrato => {
    const participant = participantOf(character.id);
    const pv = participant ? participant.hp_current : getCurrentPv(character.stats);
    return {
      id: character.id,
      kind,
      name: character.name || fallbackName,
      imageUrl: character.narrative?.imageUrl,
      pv,
      pvMax: getMaxPv(character.stats),
      down: pv <= 0,
      conditions: asConditions(participant ? participant.conditions : character.conditions),
      isMe: character.id === myCharacterId,
      participantId: participant?.id,
      ...extra,
    };
  };

  const group = playerCharacters
    .filter((pc) => !pc.character.is_deleted && !pc.character.is_npc && !pc.character.is_enemy)
    .map((pc) => make(pc.character, 'player', 'Jogador', { userId: pc.user_id }))
    .sort((a, b) => Number(b.isMe) - Number(a.isMe));

  const visibleNpcs = npcs
    .filter((npc) => !npc.is_deleted && npc.is_visible)
    .map((npc) => make(npc, 'npc', 'NPC', { npc }));

  const inCombat = hasActiveCombat
    ? enemies
        .filter((enemy) => !enemy.is_deleted && participantOf(enemy.id))
        .map((enemy) => make(enemy, 'enemy', 'Inimigo'))
    : [];

  return [...group, ...visibleNpcs, ...inCombat];
}
