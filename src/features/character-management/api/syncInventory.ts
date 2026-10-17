import { supabase } from '@/lib/supabase';
import type { EquipmentItem } from '../../character-creation/types';

interface KitEntry {
  /** Slug do item em src/content/items.ts (o mesmo de `items.slug`). */
  slug: string;
  quantity?: number;
}

const SACERDOTE_KIT: KitEntry[] = [{ slug: 'cajado' }, { slug: 'balsamo', quantity: 3 }];

/** Itens iniciais de cada Vocação. O texto do kit exibido na criação está em src/content/kits.ts. */
export const VOCATION_KIT_ITEMS: Record<string, KitEntry[]> = {
  Guerreiro: [
    { slug: 'espada_curta' },
    { slug: 'couro_cru' },
    { slug: 'escudo' },
    { slug: 'racao', quantity: 5 },
    { slug: 'odre' },
    { slug: 'adaga' },
  ],
  Caçador: [
    { slug: 'arco_curto' },
    { slug: 'adaga' },
    { slug: 'couro_cru' },
    { slug: 'corda' },
    { slug: 'flechas', quantity: 20 },
  ],
  Batedor: [{ slug: 'adaga', quantity: 2 }, { slug: 'couro_cru' }, { slug: 'corda' }],
  Sacerdote: SACERDOTE_KIT,
  Sábio: SACERDOTE_KIT,
};

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
        for (const kitItem of VOCATION_KIT_ITEMS[vocation] ?? []) {
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
