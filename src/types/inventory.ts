import type { ItemEffects, WeaponEffect } from './combat';

/** O item do catálogo (`items`) como a ficha o lê; `effects` é um `jsonb` livre no banco. */
export interface InventoryCatalogItem {
  slug?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  is_consumable?: boolean | null;
  weight?: number | null;
  effects?: ItemEffects | null;
}

/**
 * Uma linha do inventário (`character_items`) com o item do catálogo aninhado, como a ficha a
 * carrega. A quantidade pode ser nula no banco, mas o app sempre a grava.
 */
export interface InventoryItem {
  id: string;
  item_id?: string;
  quantity: number;
  level: number;
  custom_condition_resistances?: string[] | null;
  weapon_effects?: WeaponEffect[] | null;
  items: InventoryCatalogItem;
}

/** A linha entregue ao usar um consumível: a lista já normalizou os efeitos (cura, lugar). */
export type ConsumableInventoryItem = InventoryItem & { items: { effects: ItemEffects } };

/**
 * Linha de inventário como o cálculo de combate a lê: de uma ficha, de um NPC ou de um inimigo da
 * sessão (`character_items(*, items(*))`), em que o item aninhado pode vir como lista.
 */
export interface CombatInventoryItem {
  id?: string;
  item_id?: string;
  quantity?: number | null;
  level?: number | null;
  custom_condition_resistances?: string[] | null;
  items?: InventoryCatalogItem | InventoryCatalogItem[] | null;
}
