// Tocha (regras-base 6.7; CONTEXT.md, Fonte de luz): acende como Ação Livre, sem ocupar a mão, gasta
// uma Tocha do inventário e ilumina 6 m de Luz plena e mais 6 m de Penumbra em volta do pin do
// personagem. Apaga no Descanso Curto, no Descanso Longo ou quando o Mestre apaga; o avanço de
// período não a apaga e o jogador não apaga a própria.
import type { CombatInventoryItem } from '@/types/inventory';

/** O slug da Tocha no conteúdo (`src/content/items.ts`). */
export const TORCH_SLUG = 'tocha';

/** A luz de uma Tocha acesa: 6 m de Luz plena e mais 6 m de Penumbra. */
export const TORCH_LIGHT = { brightM: 6, dimM: 6 } as const;

export const isTorchItem = (slug: string | null | undefined): boolean => slug === TORCH_SLUG;

export type TorchBlock = 'dead' | 'lit' | 'none';

/** Por que a Tocha não pode ser acesa agora, ou `null`. Acender não depende de turno nem de Pederneira. */
export function getTorchBlock({
  lit,
  isDead,
  quantity,
}: {
  lit: boolean;
  isDead: boolean;
  quantity: number;
}): TorchBlock | null {
  if (isDead) return 'dead';
  if (lit) return 'lit';
  if (quantity <= 0) return 'none';
  return null;
}

const BLOCK_MESSAGE: Record<TorchBlock, string> = {
  dead: 'Personagem morto',
  lit: 'A Tocha já está acesa',
  none: 'Sem Tocha no inventário',
};
export const torchBlockMessage = (block: TorchBlock): string => BLOCK_MESSAGE[block];

/** A quantidade de Tochas no inventário. */
export function torchQuantity(items: readonly CombatInventoryItem[] | undefined): number {
  return (items ?? []).reduce((sum, entry) => {
    const catalog = Array.isArray(entry.items) ? entry.items[0] : entry.items;
    return isTorchItem(catalog?.slug) ? sum + (entry.quantity ?? 0) : sum;
  }, 0);
}
