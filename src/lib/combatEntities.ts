import { getCurrentPv } from '@/domain/vitals';
import { getCombatStats } from '@/lib/equipmentUtils';
import type { SessionCharacter, SessionNpc, SessionPlayer } from '@/data-access/sessions';

/** Quem pode entrar no combate: jogadores, NPCs jogáveis e inimigos, com PV, CA e resistências. */
export function buildCombatEntities(roster: {
  playerCharacters: SessionPlayer[];
  npcs: SessionNpc[];
  enemies: SessionCharacter[];
}) {
  const { playerCharacters, npcs, enemies } = roster;
  return [
    ...playerCharacters
      .filter((pc) => !pc.character.is_deleted && !pc.character.is_npc && !pc.character.is_enemy)
      .map((pc) => ({
        id: pc.character.id,
        name: pc.character.name || 'Jogador',
        type: 'player' as const,
        hpCurrent: getCurrentPv(pc.character.stats),
        ...getCombatStats(pc.character),
      })),
    ...npcs
      .filter((npc) => !npc.is_deleted && npc.is_playable)
      .map((npc) => ({
        id: npc.id,
        name: npc.name || 'NPC',
        type: 'npc' as const,
        hpCurrent: getCurrentPv(npc.stats),
        ...getCombatStats(npc),
      })),
    ...enemies
      .filter((enemy) => !enemy.is_deleted)
      .map((enemy) => ({
        id: enemy.id,
        name: enemy.name || 'Inimigo',
        type: 'enemy' as const,
        hpCurrent: getCurrentPv(enemy.stats),
        ...getCombatStats(enemy),
      })),
  ];
}
