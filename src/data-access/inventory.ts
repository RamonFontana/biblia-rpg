// Inventário (`character_items`) e catálogo (`items`). O app nunca insere em `items`: o seed
// cria as linhas (ADR 0003).
import { supabase } from '@/lib/supabase';
import { KITS_DB } from '@/content/kits';
import { canConsumeAmmo, calculateRecoveredQuantity, rollAmmoRecovery } from '@/domain/ammo';
import { applyConsumableEffects, type ConsumableEffects } from '@/domain/consumables';
import { sumItemFaithPenalty } from '@/domain/faith';
import type { Rng } from '@/domain/rng';
import type { WeaponEffect } from '@/types/combat';
import { toJson } from './json';
import type { EquipmentItem } from '@/features/character-creation/types';

/**
 * Troca o inventário do personagem pelos itens do equipamento e do kit. Cada item é procurado em
 * `items` pelo slug do conteúdo; o app não cria linhas em `items` (ADR 0003, o seed as cria).
 */
export async function syncInventoryItems(
  characterId: string,
  equipment: EquipmentItem[],
  vocation: string,
) {
  try {
    const wanted: { slug: string; quantity: number }[] = [];
    for (const eq of equipment) {
      if (eq.id === 'kit_basico') {
        for (const kitItem of KITS_DB[vocation]?.items ?? []) {
          wanted.push({ slug: kitItem.slug, quantity: kitItem.quantity ?? 1 });
        }
      } else {
        wanted.push({ slug: eq.id, quantity: 1 });
      }
    }

    const slugs = [...new Set(wanted.map((w) => w.slug))];
    const { data: rows, error: lookupError } = await supabase
      .from('items')
      .select('id, slug')
      .in('slug', slugs);
    if (lookupError) throw lookupError;

    const itemIdBySlug = new Map((rows ?? []).map((row) => [row.slug, row.id]));

    // Soma as quantidades por item (o mesmo item pode vir do kit e da compra).
    const quantityByItemId = new Map<string, number>();
    for (const { slug, quantity } of wanted) {
      const itemId = itemIdBySlug.get(slug);
      if (!itemId) {
        console.error(`Item sem linha em items (slug ${slug}); rode o seed de itens.`);
        continue;
      }
      quantityByItemId.set(itemId, (quantityByItemId.get(itemId) ?? 0) + quantity);
    }

    const { error: deleteError } = await supabase
      .from('character_items')
      .delete()
      .eq('character_id', characterId);
    if (deleteError) {
      console.error('Error deleting old character items:', deleteError);
    }

    if (quantityByItemId.size > 0) {
      const characterItems = [...quantityByItemId].map(([itemId, quantity]) => ({
        character_id: characterId,
        item_id: itemId,
        quantity,
      }));
      const { error: insertItemsError } = await supabase
        .from('character_items')
        .insert(characterItems);
      if (insertItemsError) {
        console.error('Error inserting character items:', insertItemsError, characterItems);
      }
    }
  } catch (err) {
    console.error('Error syncing inventory:', err);
  }
}

// Itens com o nome e a categoria, para o Mestre escolher o que dar a um NPC.
export async function listCatalogItems() {
  const { data, error } = await supabase.from('items').select('id, name, category').order('name');
  if (error) throw error;
  return data;
}

// O que a ficha mostra do inventário: cada item com os campos do catálogo que a tela usa.
const SHEET_INVENTORY = `
  id,
  quantity,
  level,
  custom_condition_resistances,
  weapon_effects,
  items (
    id,
    name,
    description,
    category,
    is_consumable,
    requires_target,
    weight,
    effects
  )
`;

export async function getCharacterInventory(characterId: string) {
  const { data, error } = await supabase
    .from('character_items')
    .select(SHEET_INVENTORY)
    .eq('character_id', characterId);
  if (error) throw error;
  return data;
}

export type CharacterInventoryRow = Awaited<ReturnType<typeof getCharacterInventory>>[number];

// O que o menu de ações do token mostra: só o que decide se o item pode ser usado.
export async function getInventoryForMenu(characterId: string) {
  const { data, error } = await supabase
    .from('character_items')
    .select(
      `
      id,
      quantity,
      items (
        id,
        name,
        is_consumable,
        requires_target
      )
    `,
    )
    .eq('character_id', characterId);
  if (error) throw error;
  return data;
}

export async function updateItemLevel(characterItemId: string, level: number): Promise<void> {
  const { error } = await supabase
    .from('character_items')
    .update({ level })
    .eq('id', characterItemId);
  if (error) throw error;
}

export async function updateItemResistances(
  characterItemId: string,
  resistances: string[],
): Promise<void> {
  const { error } = await supabase
    .from('character_items')
    .update({ custom_condition_resistances: resistances })
    .eq('id', characterItemId);
  if (error) throw error;
}

export async function updateWeaponEffects(
  characterItemId: string,
  effects: WeaponEffect[],
): Promise<void> {
  const { error } = await supabase
    .from('character_items')
    .update({ weapon_effects: toJson(effects) })
    .eq('id', characterItemId);

  if (error) {
    console.error('Error updating weapon effects:', error);
    throw error;
  }
}

/**
 * Soma (negativa) das penalidades de Fé dos Itens Profanos que o personagem carrega, equipados ou
 * não. Entra na Fé Efetiva dos Testes de Fé (CONTEXT.md).
 */
export async function getItemFaithPenalty(characterId: string): Promise<number> {
  const { data, error } = await supabase
    .from('character_items')
    .select('items!inner(slug)')
    .eq('character_id', characterId);

  if (error) {
    console.error('Error reading item faith penalties:', error);
    throw error;
  }

  return sumItemFaithPenalty((data ?? []).map((row) => row.items?.slug));
}

/** Dá `quantity` do item ao personagem: soma à linha que já existe ou cria uma. */
export async function addInventoryItem(
  characterId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  const { data: existing } = await supabase
    .from('character_items')
    .select('id, quantity')
    .eq('character_id', characterId)
    .eq('item_id', itemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('character_items')
      .update({ quantity: (existing.quantity ?? 0) + quantity })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('character_items').insert({
      character_id: characterId,
      item_id: itemId,
      quantity,
    });
    if (error) throw error;
  }
}

export async function removeInventoryItem(characterItemId: string): Promise<void> {
  const { error } = await supabase.from('character_items').delete().eq('id', characterItemId);
  if (error) throw error;
}

export async function setInventoryQuantity(
  characterItemId: string,
  quantity: number,
): Promise<void> {
  const { error } = await supabase
    .from('character_items')
    .update({ quantity })
    .eq('id', characterItemId);
  if (error) throw error;
}

interface ConsumeInventoryItemInput {
  characterId: string;
  characterItemId: string;
  currentQuantity: number;
  itemEffects: ConsumableEffects | null | undefined;
  currentStats: Parameters<typeof applyConsumableEffects>[0];
  /** Ficha completa (`characters`) ou NPC simples (`session_npcs`). */
  isPlayable: boolean;
}

/** Gasta uma unidade do item (remove a linha na última) e aplica os efeitos às estatísticas. */
export async function consumeInventoryItem(input: ConsumeInventoryItemInput): Promise<void> {
  const { characterId, characterItemId, currentQuantity, itemEffects, currentStats, isPlayable } =
    input;

  // 1. Decrease quantity or remove item
  if (currentQuantity <= 1) {
    await removeInventoryItem(characterItemId);
  } else {
    await setInventoryQuantity(characterItemId, currentQuantity - 1);
  }

  // 2. Apply effects if any
  if (itemEffects && Object.keys(itemEffects).length > 0) {
    const { stats: newStats, hasChanges } = applyConsumableEffects(currentStats, itemEffects);

    if (hasChanges) {
      const stats = toJson(newStats);
      const { error } = isPlayable
        ? await supabase.from('characters').update({ stats }).eq('id', characterId)
        : await supabase.from('session_npcs').update({ stats }).eq('id', characterId);
      if (error) throw error;
    }
  }
}

/** Usa um item consumível pela função do banco, que confere o dono e aplica o efeito. */
export async function consumeItemViaRpc(characterItemId: string): Promise<void> {
  const { error } = await supabase.rpc('use_consumable_item', {
    p_character_item_id: characterItemId,
  });
  if (error) throw error;
}

// Munição: cada operação lê a quantidade, aplica a regra de `domain/ammo` e grava. Devolvem
// `false` (ou 0) em vez de lançar: a tela só mostra o resultado.
async function readQuantity(characterItemId: string, context: string) {
  const { data: item, error } = await supabase
    .from('character_items')
    .select('quantity')
    .eq('id', characterItemId)
    .single();

  if (error || !item) {
    console.error(`Error fetching item ${context}:`, error);
    return null;
  }
  return item.quantity || 0;
}

export async function consumeAmmo(characterItemId: string, amount: number = 1): Promise<boolean> {
  try {
    const currentQuantity = await readQuantity(characterItemId, 'for consumption');
    if (currentQuantity === null) return false;

    if (!canConsumeAmmo(currentQuantity, amount)) {
      console.warn('Not enough quantity to consume.');
      return false;
    }

    const { error } = await supabase
      .from('character_items')
      .update({ quantity: currentQuantity - amount })
      .eq('id', characterItemId);

    if (error) {
      console.error('Error consuming item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to consume item:', error);
    return false;
  }
}

/** Recupera parte da munição gasta (regra de `domain/ammo`); devolve quantas voltaram. */
export async function recoverAmmo(
  characterItemId: string,
  spentAmount: number,
  maxCapacity: number,
  rng: Rng,
): Promise<number> {
  try {
    const recoveredCount = rollAmmoRecovery(spentAmount, rng);

    if (recoveredCount === 0) return 0;

    const currentQuantity = await readQuantity(characterItemId, 'for recovery');
    if (currentQuantity === null) return 0;

    const newQuantity = calculateRecoveredQuantity(currentQuantity, recoveredCount, maxCapacity);

    const { error } = await supabase
      .from('character_items')
      .update({ quantity: newQuantity })
      .eq('id', characterItemId);

    if (error) {
      console.error('Error recovering item:', error);
      return 0;
    }

    return recoveredCount;
  } catch (error) {
    console.error('Failed to recover item:', error);
    return 0;
  }
}

export async function addAmmoCharges(characterItemId: string, amount: number): Promise<boolean> {
  try {
    const currentQuantity = await readQuantity(characterItemId, 'to add charges');
    if (currentQuantity === null) return false;

    const { error } = await supabase
      .from('character_items')
      .update({ quantity: currentQuantity + amount })
      .eq('id', characterItemId);

    if (error) {
      console.error('Error adding charges to item:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to add charges to item:', error);
    return false;
  }
}
