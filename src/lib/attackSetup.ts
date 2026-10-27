import { ITEMS_DB } from '@/content/items';
import type { AttackWeapon } from '@/domain/attack';
import type { CombatInventoryItem } from '@/types/inventory';
import { getEquippedSlots } from './equipmentUtils';

/**
 * A arma da mão principal, com os dados do conteúdo (pelo slug do item do inventário). `null` é o
 * ataque desarmado: mão vazia, ficha antiga ou algo que não é arma.
 */
export function resolveMainHandWeapon(character: {
  equipment?: unknown;
  character_items?: CombatInventoryItem[];
}): { name: string; weapon: AttackWeapon } | null {
  const mainHand = getEquippedSlots(character.equipment as never).mainHand;
  if (!mainHand) return null;

  const owned = character.character_items?.find((ci) => ci.id === mainHand);
  const catalog = Array.isArray(owned?.items) ? owned.items[0] : owned?.items;
  const content = ITEMS_DB.find((i) => i.type === 'Arma' && i.id === catalog?.slug);
  if (!content) return null;

  return {
    name: content.name,
    weapon: {
      id: content.id,
      damage: content.damage,
      category: content.category,
      properties: content.properties,
    },
  };
}

export interface AttackTarget {
  participantId: string;
  name: string;
  ac: number;
}

/** Os alvos possíveis: todo participante do combate (aliado, NPC ou inimigo) menos o atacante. */
export function buildAttackTargets(
  participants: { id: string; entity_id: string }[],
  attackerParticipantId: string,
  entities: { id: string; name: string; totalAc: number }[],
): AttackTarget[] {
  return participants.flatMap((p) => {
    const entity = entities.find((e) => e.id === p.entity_id);
    return p.id === attackerParticipantId || !entity
      ? []
      : [{ participantId: p.id, name: entity.name, ac: entity.totalAc }];
  });
}
