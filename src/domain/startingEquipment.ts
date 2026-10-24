// CARACTERIZAÇÃO: a loja inicial da criação de personagem (carteira de 50 Siclos, compra, venda e
// Pacote Inicial), extraída de EquipmentMerchant sem alteração de comportamento.
// Conteúdo: src/content/{items,kits,proficiencies}.ts. Termos: CONTEXT.md (Vocação).
import { ITEMS_DB } from '@/content/items';
import { VOCATION_PROFICIENCIES } from '@/content/proficiencies';

/** Moedas (Siclos) com que todo personagem começa a loja. */
export const STARTING_COINS = 50;

/** `id` da linha que o Pacote Inicial ocupa na bolsa, no lugar dos itens que ele contém. */
export const STARTER_KIT_ID = 'kit_basico';

/** O que a loja precisa de um item da bolsa; o item da criação tem mais campos. */
export interface PurchasedItem {
  id: string;
  name: string;
  type: string;
  cost?: number;
  description?: string;
}

export interface Purse<T extends PurchasedItem> {
  coins: number;
  items: T[];
}

export function isStarterKit(item: PurchasedItem): boolean {
  return item.id === STARTER_KIT_ID;
}

export function hasStarterKit(items: PurchasedItem[]): boolean {
  return items.some(isStarterKit);
}

/** Moedas de um rascunho: as gravadas, ou os 50 Siclos iniciais quando não há (ou são 0). */
export function startingCoins(draftCoins: number | undefined): number {
  return draftCoins || STARTING_COINS;
}

/** A compra avulsa vale se a carteira cobre o preço e o Pacote Inicial não está na bolsa. */
export function canBuyItem(purse: Purse<PurchasedItem>, item: PurchasedItem): boolean {
  return purse.coins >= (item.cost || 0) && !hasStarterKit(purse.items);
}

/** Tira o preço da carteira e põe o item na bolsa; sem saldo, devolve a bolsa como está. */
export function buyItem<T extends PurchasedItem>(purse: Purse<T>, item: T): Purse<T> {
  const cost = item.cost || 0;
  if (purse.coins < cost) return purse;
  return { coins: purse.coins - cost, items: [...purse.items, item] };
}

/** O kit só se pega com os 50 Siclos inteiros na carteira. */
export function canBuyStarterKit(coins: number): boolean {
  return coins >= STARTING_COINS;
}

/**
 * O Pacote Inicial substitui a bolsa inteira e a carteira passa a ser só a sobra do kit (as
 * moedas que vêm dentro dele).
 */
export function buyStarterKit(kit: { name: string; leftover: number }): Purse<PurchasedItem> {
  return {
    coins: kit.leftover,
    items: [
      {
        id: STARTER_KIT_ID,
        name: kit.name,
        type: 'Kit',
        cost: STARTING_COINS,
        description: 'Pacote inicial de equipamentos.',
      },
    ],
  };
}

/**
 * Quanto a venda devolve: o `cost` gravado na linha. O Pacote Inicial sem custo gravado (rascunho
 * antigo) devolve os 50 Siclos iniciais.
 */
export function sellValue(item: PurchasedItem): number | undefined {
  return isStarterKit(item) ? kitValue(item) : item.cost;
}

function kitValue(kit: PurchasedItem): number {
  return kit.cost ?? STARTING_COINS;
}

/**
 * Vende o item da posição `index`. Vender o kit põe na carteira o custo gravado nele (a sobra do
 * kit se perde, porque ele veio no lugar da bolsa inteira); qualquer outro item soma o preço ao que
 * há na carteira.
 */
export function sellItem<T extends PurchasedItem>(purse: Purse<T>, index: number): Purse<T> {
  const item = purse.items[index];
  const items = purse.items.filter((_, i) => i !== index);
  if (!item) return { coins: purse.coins, items };
  return { coins: isStarterKit(item) ? kitValue(item) : purse.coins + (item.cost || 0), items };
}

/** Itens do catálogo que a Vocação sabe usar; Vocação desconhecida vê só a categoria "Todas". */
export function getStoreItems(vocation: string) {
  const allowed = VOCATION_PROFICIENCIES[vocation] || ['Todas'];
  return ITEMS_DB.filter((item) => allowed.includes(item.category));
}
