import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { findLatestCharacterOfUser } from '@/data-access/characters';
import { consumeItemViaRpc, getInventoryForMenu } from '@/data-access/inventory';
import { findParticipantCharacterId } from '@/data-access/sessions';

type InventoryMenuItem = Awaited<ReturnType<typeof getInventoryForMenu>>[number];

interface TokenContextMenuProps {
  userId: string;
  sessionId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function TokenContextMenu({ userId, sessionId, x, y, onClose }: TokenContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState({ top: y, left: x });

  // Mantém o menu dentro da viewport (evita cortar em telas de celular perto das bordas)
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - margin;
    const maxTop = window.innerHeight - rect.height - margin;

    setPosition({
      left: Math.max(margin, Math.min(x, maxLeft)),
      top: Math.max(margin, Math.min(y, maxTop)),
    });
  }, [x, y, isLoading, inventoryItems.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    async function fetchInventory() {
      setIsLoading(true);
      try {
        let characterIdToFetch: string | null = null;

        if (sessionId) {
          characterIdToFetch = await findParticipantCharacterId(sessionId, userId);
        }

        if (!characterIdToFetch) {
          characterIdToFetch = (await findLatestCharacterOfUser(userId))?.id ?? null;
        }

        if (characterIdToFetch) {
          setInventoryItems(await getInventoryForMenu(characterIdToFetch));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, [userId]);

  const handleUseItem = async (
    characterItemId: string,
    isConsumable: boolean | null | undefined,
  ) => {
    if (!isConsumable) return;

    // Call RPC to use item
    try {
      await consumeItemViaRpc(characterItemId);
    } catch (error) {
      console.error('Error using item:', error);
    }

    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 max-w-[calc(100vw-1rem)] bg-stone-900 border border-stone-700 rounded-lg shadow-xl overflow-hidden"
      style={position}
    >
      <div className="bg-stone-800 px-3 py-2 border-b border-stone-700 font-semibold text-stone-200 text-sm flex justify-between items-center">
        Ações
        <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
          &times;
        </button>
      </div>
      <div className="p-2 space-y-1">
        <div className="text-xs text-stone-500 uppercase tracking-wider font-bold mb-1 px-1">
          Itens
        </div>
        {isLoading ? (
          <div className="px-2 py-1 text-sm text-stone-400">Carregando...</div>
        ) : inventoryItems.length > 0 ? (
          inventoryItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleUseItem(item.id, item.items?.is_consumable)}
              className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors flex items-center justify-between ${
                item.items?.is_consumable
                  ? 'text-amber-400 hover:bg-stone-800'
                  : 'text-stone-400 opacity-50 cursor-not-allowed'
              }`}
              disabled={!item.items?.is_consumable}
            >
              <div className="flex items-center gap-2">
                <span>{item.items?.name}</span>
                {(item.quantity ?? 0) > 1 && (
                  <span className="text-[10px] bg-stone-800 px-1 rounded">x{item.quantity}</span>
                )}
              </div>
              {item.items?.is_consumable && (
                <span className="text-[10px] uppercase border border-amber-500/30 px-1 rounded bg-amber-500/10">
                  Usar
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="px-2 py-1 text-sm text-stone-500 italic">Nenhum item</div>
        )}
      </div>
    </div>
  );
}
