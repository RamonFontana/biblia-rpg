// Resistência a Condição dos itens equipados (docs/itens/armaduras.md; termos em CONTEXT.md).
// O nível de cada resistência é o nível da tabela do doc (`level` do item no conteúdo) mais
// (Qualidade - 1), no máximo 4. Entre os itens equipados vale o maior nível, Condição por
// Condição, sem somar. Nível 1: vantagem no teste de resistência; 2: metade da duração (para
// cima); 3: as duas; 4: imunidade. A vantagem é só informada: as rolagens são físicas (ADR 0001).
import { CONDITIONS } from '@/content/conditions';
import { ITEMS_DB } from '@/content/items';
import type { CharacterEquipment } from '@/types/combat';

export const MAX_RESISTANCE_LEVEL = 4;

const ITEM_BY_SLUG = new Map(ITEMS_DB.map((item) => [item.id, item]));

/** Condições a que o item do catálogo resiste (Resistência a Condição), pelo slug. */
export function getItemConditionResistances(slug: string | null | undefined): string[] {
  return (slug ? ITEM_BY_SLUG.get(slug)?.conditionResistances : undefined) ?? [];
}

/**
 * Nível de resistência do item: o da tabela do doc mais (Qualidade - 1), no máximo 4. É o mesmo
 * para todas as Condições do item; 0 se o item não resiste a nada ou não está no catálogo.
 */
export function getItemResistanceLevel(
  slug: string | null | undefined,
  quality: number | null | undefined,
): number {
  const item = slug ? ITEM_BY_SLUG.get(slug) : undefined;
  if (!item?.conditionResistances?.length) return 0;
  const qualityBonus = Math.max(0, (quality || 1) - 1);
  return Math.min(MAX_RESISTANCE_LEVEL, (item.level ?? 1) + qualityBonus);
}

export interface EquippedItem {
  slug: string;
  /** Qualidade do item (`character_items.level`). */
  quality: number;
}

/** Maior nível de resistência por Condição entre os itens equipados. */
export function getConditionResistanceLevels(equipped: EquippedItem[]): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const { slug, quality } of equipped) {
    const level = getItemResistanceLevel(slug, quality);
    for (const conditionId of getItemConditionResistances(slug)) {
      levels[conditionId] = Math.max(levels[conditionId] ?? 0, level);
    }
  }
  return levels;
}

/** "Sangrando Nv4": a resistência de cada Condição com o nível, na ordem alfabética dos nomes. */
export function describeConditionResistances(levels: Record<string, number>): string[] {
  return Object.entries(levels)
    .map(([conditionId, level]) => `${CONDITIONS[conditionId]?.name ?? conditionId} Nv${level}`)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

type ItemSlug = { slug?: string | null };

export interface InventoryItemRow {
  id?: string;
  item_id?: string;
  level?: number | null;
  /** O item aninhado como o app carrega: `character_items(*, items(slug))`. */
  items?: ItemSlug | ItemSlug[] | null;
}

/** Itens equipados (cabeça, corpo, mãos) com o slug e a Qualidade, lidos do inventário. */
export function resolveEquippedItems(
  equipment: Partial<CharacterEquipment> | null | undefined,
  inventory: InventoryItemRow[],
): EquippedItem[] {
  const slotIds = new Set(
    [equipment?.head, equipment?.body, equipment?.mainHand, equipment?.offHand].filter(Boolean),
  );

  const resolved: EquippedItem[] = [];
  for (const slotId of slotIds) {
    const row = inventory.find((i) => i.id === slotId || i.item_id === slotId);
    const slug = (Array.isArray(row?.items) ? row.items[0] : row?.items)?.slug;
    if (row && slug) resolved.push({ slug, quality: row.level || 1 });
  }
  return resolved;
}

export interface ConditionOutcome {
  /** Duração depois da resistência; nula se a condição não tem duração. */
  duration: number | null;
  immune: boolean;
  /** O alvo tem vantagem no teste de resistência (só informado). */
  advantage: boolean;
  /** A duração foi reduzida pela metade. */
  halved: boolean;
  /** Frase para o Mestre; vazia sem resistência. */
  message: string;
}

/** O que acontece com uma Condição recebida, dado o nível de resistência do alvo a ELA. */
export function applyConditionResistance(
  conditionId: string,
  duration: number | null,
  level: number,
): ConditionOutcome {
  const name = CONDITIONS[conditionId]?.name ?? conditionId;
  const none = { duration, immune: false, advantage: false, halved: false, message: '' };
  if (level <= 0) return none;

  if (level >= MAX_RESISTANCE_LEVEL) {
    return { ...none, immune: true, message: `Resistência Nv4: imune a ${name}` };
  }

  const advantage = level === 1 || level === 3;
  const halves = level === 2 || level === 3;
  const halved = halves && duration !== null;
  const finalDuration = halved ? Math.ceil(duration / 2) : duration;
  const noDuration = halves && duration === null ? 'a condição não tem duração' : '';

  let message: string;
  if (level === 1) {
    message = `Resistência Nv1: vantagem no teste de resistência contra ${name}`;
  } else if (level === 2) {
    message = halved
      ? `Resistência Nv2: duração de ${name} reduzida pela metade`
      : `Resistência Nv2: sem efeito, ${noDuration}`;
  } else {
    message = halved
      ? `Resistência Nv3: vantagem no teste contra ${name} e duração reduzida pela metade`
      : `Resistência Nv3: vantagem no teste contra ${name} (${noDuration})`;
  }

  return { duration: finalDuration, immune: false, advantage, halved, message };
}
