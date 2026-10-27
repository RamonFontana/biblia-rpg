import { ITEMS_DB } from '@/content/items';
import { ammunitionSlug, type AttackWeapon } from '@/domain/attack';
import type { ConditionEntry, WeaponEffect } from '@/types/combat';
import type { CombatInventoryItem } from '@/types/inventory';
import { getEquippedSlots } from './equipmentUtils';

/**
 * A arma da mão principal, com os dados do conteúdo (pelo slug do item do inventário). `null` é o
 * ataque desarmado: mão vazia, ficha antiga ou algo que não é arma.
 */
export function resolveMainHandWeapon(character: {
  equipment?: unknown;
  character_items?: CombatInventoryItem[];
}): { name: string; weapon: AttackWeapon; effects: WeaponEffect[] } | null {
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
      description: content.description,
    },
    effects: owned?.weapon_effects ?? [],
  };
}

/** A outra mão está livre: nada nela (a arma de duas mãos ocupa as duas). */
export function isOffHandFree(character: { equipment?: unknown }): boolean {
  return !getEquippedSlots(character.equipment as never).offHand;
}

/**
 * A munição que a arma gasta, no inventário: o item (`null` se não há), a quantidade e o nome.
 * `null` se a arma não gasta munição.
 */
export function resolveAmmunition(
  character: { character_items?: CombatInventoryItem[] },
  weapon: AttackWeapon | null,
): { characterItemId: string | null; quantity: number; name: string } | null {
  const slug = ammunitionSlug(weapon);
  if (!slug) return null;
  const content = ITEMS_DB.find((i) => i.id === slug);
  const owned = character.character_items?.find((ci) => {
    const catalog = Array.isArray(ci.items) ? ci.items[0] : ci.items;
    return catalog?.slug === slug;
  });
  return {
    characterItemId: owned?.id ?? null,
    quantity: owned?.quantity ?? 0,
    name: content?.name ?? slug,
  };
}

export interface AttackTarget {
  participantId: string;
  /** A ficha (ou NPC) do alvo e o tipo: o enemy não tem Resistência a Condição. */
  entityId: string;
  entityType: string;
  name: string;
  ac: number;
  /** Os ids das Condições do alvo (Caído, Atordoado…), que mudam a modalidade do ataque. */
  conditionIds: string[];
}

/** Os ids das Condições gravadas num participante (`conditions` é `jsonb`). */
export function conditionIdsOf(conditions: unknown): string[] {
  return Array.isArray(conditions)
    ? (conditions as ConditionEntry[]).map((c) => c.conditionId)
    : [];
}

/** Os alvos possíveis: todo participante do combate (aliado, NPC ou inimigo) menos o atacante. */
export function buildAttackTargets(
  participants: { id: string; entity_id: string; entity_type: string; conditions?: unknown }[],
  attackerParticipantId: string,
  entities: { id: string; name: string; totalAc: number }[],
): AttackTarget[] {
  return participants.flatMap((p) => {
    const entity = entities.find((e) => e.id === p.entity_id);
    return p.id === attackerParticipantId || !entity
      ? []
      : [
          {
            participantId: p.id,
            entityId: p.entity_id,
            entityType: p.entity_type,
            name: entity.name,
            ac: entity.totalAc,
            conditionIds: conditionIdsOf(p.conditions),
          },
        ];
  });
}
