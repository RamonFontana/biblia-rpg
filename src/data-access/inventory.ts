// Inventário (`character_items`) e catálogo (`items`). O app nunca insere em `items`: o seed
// cria as linhas (ADR 0003).
import { supabase } from '@/lib/supabase';
import { KITS_DB } from '@/content/kits';
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
