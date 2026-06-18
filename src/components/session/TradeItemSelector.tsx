import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';

export interface SelectableItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  price?: number | null;
  availableQuantity?: number;
}

interface TradeItemSelectorProps {
  items: SelectableItem[];
  selectedItems: { itemId: string; quantity: number }[];
  onAddItem: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  useCatalog?: boolean;
  disabled?: boolean;
}

export function TradeItemSelector({
  items,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  useCatalog = false,
  disabled = false,
}: TradeItemSelectorProps) {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return items;
    return items.filter((item) => item.name.toLowerCase().includes(term));
  }, [items, search]);

  const selectedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of selectedItems) {
      map.set(s.itemId, s.quantity);
    }
    return map;
  }, [selectedItems]);

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return '—';
    return `${price} SP`;
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Buscar item..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-stone-900 border border-stone-600 rounded-md text-stone-200 text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-500/50"
      />

      <div className="max-h-48 overflow-y-auto space-y-1 border border-stone-700 rounded-md p-2 bg-stone-900/50">
        {filteredItems.length === 0 ? (
          <p className="text-stone-500 text-sm italic text-center py-4">Nenhum item encontrado.</p>
        ) : (
          filteredItems.map((item) => {
            const selectedQty = selectedMap.get(item.id) ?? 0;
            const maxQty = useCatalog ? 999 : (item.availableQuantity ?? 0);
            const canAdd = useCatalog || maxQty > selectedQty;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2 rounded hover:bg-stone-800/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-200 text-sm font-medium truncate">{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-400 border border-stone-600 shrink-0">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  {!useCatalog && item.availableQuantity != null && (
                    <span className="text-xs text-stone-500">Disponível: {item.availableQuantity}</span>
                  )}
                </div>

                {selectedQty > 0 ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (selectedQty <= 1) onRemoveItem(item.id);
                        else onUpdateQuantity(item.id, selectedQty - 1);
                      }}
                      className="w-6 h-6 bg-stone-700 hover:bg-stone-600 rounded text-stone-300 text-sm disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm text-stone-300 font-mono">{selectedQty}</span>
                    <button
                      type="button"
                      disabled={disabled || !canAdd}
                      onClick={() => onUpdateQuantity(item.id, selectedQty + 1)}
                      className="w-6 h-6 bg-stone-700 hover:bg-stone-600 rounded text-stone-300 text-sm disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || !canAdd}
                    onClick={() => onAddItem(item.id, 1)}
                    className="h-7 text-xs border-stone-600 text-stone-300 hover:bg-stone-700 shrink-0"
                  >
                    Adicionar
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
