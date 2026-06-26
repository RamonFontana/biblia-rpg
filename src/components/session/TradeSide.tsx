import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TradeItemSelector, type SelectableItem } from './TradeItemSelector';
import type { TradeItemWithDetails, TradeSide } from '@/types/trade';
import { tradeService } from '@/services/tradeService';

interface TradeSideProps {
  label: string;
  side: TradeSide;
  tradeId: string;
  coins: number;
  tradeItems: TradeItemWithDetails[];
  isReady: boolean;
  otherSideReady: boolean;
  canEdit: boolean;
  isGM?: boolean;
  useCatalog?: boolean;
  skipBalanceCheck?: boolean;
  characterId?: string | null;
  characterCoins?: number;
  onCoinsChange: (coins: number) => void;
  onReady: (ready: boolean) => void;
  onItemsChanged: () => void;
}

export function TradeSide({
  label,
  side,
  tradeId,
  coins,
  tradeItems,
  isReady,
  otherSideReady,
  canEdit,
  isGM = false,
  useCatalog = false,
  skipBalanceCheck = false,
  characterId,
  characterCoins = 0,
  onCoinsChange,
  onReady,
  onItemsChanged,
}: TradeSideProps) {
  const [inventoryItems, setInventoryItems] = useState<SelectableItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<SelectableItem[]>([]);
  const [coinsInput, setCoinsInput] = useState(String(coins));
  const [error, setError] = useState<string | null>(null);
  const [isSavingCoins, setIsSavingCoins] = useState(false);
  const coinsSaveRef = useRef<Promise<number | null> | null>(null);

  useEffect(() => {
    setCoinsInput(String(coins));
  }, [coins]);

  useEffect(() => {
    if (useCatalog) {
      tradeService.getAllItems().then((items) => {
        setCatalogItems(
          (items as SelectableItem[]).map((i) => ({
            ...i,
            availableQuantity: 999,
          }))
        );
      });
    } else if (characterId) {
      tradeService.getCharacterInventory(characterId).then((data) => {
        setInventoryItems(
          data.map((row: any) => ({
            id: row.items.id,
            name: row.items.name,
            description: row.items.description,
            category: row.items.category,
            price: row.items.price,
            availableQuantity: row.quantity,
          }))
        );
      });
    }
  }, [useCatalog, characterId]);

  const sideItems = tradeItems.filter((ti) => ti.side === side);
  const selectedItems = sideItems.map((ti) => ({ itemId: ti.item_id, quantity: ti.quantity }));

  const availableItems = useCatalog ? catalogItems : inventoryItems;

  const handleAddItem = async (itemId: string, quantity: number) => {
    if (!canEdit) return;
    try {
      await tradeService.addTradeItem(tradeId, side, itemId, quantity);
      onItemsChanged();
    } catch (e) {
      console.error('Erro ao adicionar item:', e);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!canEdit) return;
    const tradeItem = sideItems.find((ti) => ti.item_id === itemId);
    if (!tradeItem) return;
    try {
      await tradeService.removeTradeItem(tradeItem.id);
      onItemsChanged();
    } catch (e) {
      console.error('Erro ao remover item:', e);
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (!canEdit) return;
    const tradeItem = sideItems.find((ti) => ti.item_id === itemId);
    if (!tradeItem) return;
    try {
      await tradeService.updateTradeItemQuantity(tradeItem.id, quantity);
      onItemsChanged();
    } catch (e) {
      console.error('Erro ao atualizar quantidade:', e);
    }
  };

  const commitCoinsChange = async (): Promise<number | null> => {
    if (!canEdit) return coins;
    if (coinsSaveRef.current) return coinsSaveRef.current;

    const savePromise = (async () => {
      const value = Math.max(0, parseInt(coinsInput, 10) || 0);
      setCoinsInput(String(value));
      if (value !== coins) {
        try {
          setIsSavingCoins(true);
          await tradeService.updateTradeCoins(tradeId, side, value);
          onCoinsChange(value);
          onItemsChanged();
        } catch (e) {
          console.error('Erro ao atualizar SP:', e);
          setError('Não foi possível salvar os SP informados.');
          return null;
        } finally {
          setIsSavingCoins(false);
        }
      }
      return value;
    })().finally(() => {
      coinsSaveRef.current = null;
    });

    coinsSaveRef.current = savePromise;
    return savePromise;
  };

  const handleCoinsBlur = async () => {
    await commitCoinsChange();
  };

  const validateReady = (coinsToOffer = coins): boolean => {
    if (!skipBalanceCheck && coinsToOffer > characterCoins) {
      setError(`Saldo insuficiente de SP. Você tem ${characterCoins} SP.`);
      return false;
    }

    if (!skipBalanceCheck && !useCatalog) {
      for (const ti of sideItems) {
        const inv = inventoryItems.find((i) => i.id === ti.item_id);
        if (!inv || (inv.availableQuantity ?? 0) < ti.quantity) {
          setError(`Quantidade insuficiente de "${ti.items?.name ?? 'item'}".`);
          return false;
        }
      }
    }

    setError(null);
    return true;
  };

  const handleReadyToggle = async () => {
    if (isReady) {
      onReady(false);
      setError(null);
      return;
    }
    const committedCoins = await commitCoinsChange();
    if (committedCoins === null) return;

    if (validateReady(committedCoins)) {
      onReady(true);
    }
  };

  return (
    <div className="flex-1 border border-stone-700 rounded-lg p-4 bg-stone-900/50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-stone-200">{label}</h4>
        {isReady && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            ✓ Pronto
          </span>
        )}
      </div>

      {!isReady && otherSideReady && (
        <div className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Aguardando outro lado...
        </div>
      )}

      <div>
        <label className="text-xs text-stone-400 block mb-1">Shekels de Prata (SP)</label>
        <input
          type="number"
          min={0}
          value={coinsInput}
          onChange={(e) => setCoinsInput(e.target.value)}
          onBlur={handleCoinsBlur}
          disabled={!canEdit || isReady || isSavingCoins}
          className="w-full px-3 py-2 bg-stone-900 border border-stone-600 rounded-md text-stone-200 text-sm font-mono disabled:opacity-50"
        />
        {!skipBalanceCheck && (
          <span className="text-xs text-stone-500 mt-1 block">Saldo: {characterCoins} SP</span>
        )}
      </div>

      <div>
        <label className="text-xs text-stone-400 block mb-2">Itens oferecidos</label>
        {sideItems.length > 0 && (
          <ul className="mb-3 space-y-1">
            {sideItems.map((ti) => (
              <li key={ti.id} className="text-sm text-stone-300 flex items-center gap-2">
                <span>{ti.items?.name ?? 'Item'} × {ti.quantity}</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-stone-700 text-stone-400">
                  {ti.items?.price != null ? `${ti.items.price} SP` : '—'}
                </span>
                {isGM && canEdit && !isReady ? (
                  <div className="flex items-center gap-0.5 bg-stone-800 rounded border border-stone-700 h-5">
                    <button
                      type="button"
                      onClick={async () => {
                        await tradeService.updateTradeItemLevel(ti.id, Math.max(1, (ti.level || 1) - 1));
                        onItemsChanged();
                      }}
                      className="text-stone-400 hover:text-white px-1 flex items-center justify-center disabled:opacity-30 text-xs"
                      disabled={(ti.level || 1) <= 1}
                    >-</button>
                    <span className="text-[10px] text-amber-200 font-bold w-7 text-center leading-none" title="Nível do Item">
                      Nv.{ti.level || 1}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await tradeService.updateTradeItemLevel(ti.id, Math.min(5, (ti.level || 1) + 1));
                        onItemsChanged();
                      }}
                      className="text-stone-400 hover:text-white px-1 flex items-center justify-center disabled:opacity-30 text-xs"
                      disabled={(ti.level || 1) >= 5}
                    >+</button>
                  </div>
                ) : (
                  (ti.level || 1) > 1 && (
                    <span className="text-[10px] bg-amber-900/80 text-amber-200 px-1 rounded font-bold leading-none" title={`Nível ${ti.level}`}>
                      Nv.{ti.level}
                    </span>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
        {canEdit && !isReady && (
          <TradeItemSelector
            items={availableItems}
            selectedItems={selectedItems}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            onUpdateQuantity={handleUpdateQuantity}
            useCatalog={useCatalog}
            disabled={isReady}
          />
        )}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
          {error}
        </div>
      )}

      {canEdit && (
        <Button
          onClick={handleReadyToggle}
          disabled={isSavingCoins}
          className={`w-full ${isReady ? 'bg-stone-600 hover:bg-stone-500' : 'bg-amber-600 hover:bg-amber-500'} text-white`}
        >
          {isSavingCoins ? 'Salvando SP...' : isReady ? 'Cancelar Pronto' : 'Pronto'}
        </Button>
      )}
    </div>
  );
}
