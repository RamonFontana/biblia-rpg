// Onde cada item se equipa, lido do conteúdo (ADR 0003) e no vocabulário que o inventário usa:
// head, body, shield, 1h e 2h. Arma de duas mãos é a que tem a propriedade two-handed ou "Duas
// mãos" na descrição.
import { ITEMS_DB } from '@/content/items';
import type { CharacterEquipment } from '@/types/combat';

/** As quatro posições vestidas, todas vazias: o que uma ficha nova grava em `equipment`. */
export const EMPTY_EQUIPMENT: CharacterEquipment = {
  head: null,
  body: null,
  mainHand: null,
  offHand: null,
};

export type EquipSlot = 'head' | 'body' | 'shield' | '1h' | '2h';

const ITEM_BY_SLUG = new Map(ITEMS_DB.map((item) => [item.id, item]));

export function getEquipSlot(slug: string | null | undefined): EquipSlot | undefined {
  const item = slug ? ITEM_BY_SLUG.get(slug) : undefined;
  if (!item) return undefined;

  if (item.type === 'Escudo') return 'shield';
  if (item.type === 'Armadura') return item.slot === 'head' ? 'head' : 'body';
  if (item.type === 'Arma') {
    const twoHanded =
      item.properties?.includes('two-handed') || /duas mãos/i.test(item.description);
    return twoHanded ? '2h' : '1h';
  }
  return undefined;
}
