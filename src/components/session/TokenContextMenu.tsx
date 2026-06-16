import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TokenContextMenuProps {
  userId: string;
  sessionId: string;
  x: number;
  y: number;
  onClose: () => void;
}

export function TokenContextMenu({ userId, sessionId, x, y, onClose }: TokenContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          const { data: participantData } = await supabase
            .from('session_participants')
            .select('character_id')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          if (participantData?.character_id) {
            characterIdToFetch = participantData.character_id;
          }
        }

        if (!characterIdToFetch) {
          const { data: charData } = await supabase
            .from('characters')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (charData) {
            characterIdToFetch = charData.id;
          }
        }

        if (characterIdToFetch) {
          const { data: itemsData } = await supabase
            .from('character_items')
            .select(`
              id,
              quantity,
              items (
                id,
                name,
                is_consumable,
                requires_target
              )
            `)
            .eq('character_id', characterIdToFetch);

          if (itemsData) setInventoryItems(itemsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, [userId]);

  const handleUseItem = async (characterItemId: string, isConsumable: boolean) => {
    if (!isConsumable) return;
    
    // Call RPC to use item
    await supabase.rpc('use_consumable_item', {
      p_character_item_id: characterItemId
    });

    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 bg-stone-900 border border-stone-700 rounded-lg shadow-xl overflow-hidden"
      style={{ top: y, left: x }}
    >
      <div className="bg-stone-800 px-3 py-2 border-b border-stone-700 font-semibold text-stone-200 text-sm flex justify-between items-center">
        Ações
        <button onClick={onClose} className="text-stone-400 hover:text-stone-200">&times;</button>
      </div>
      <div className="p-2 space-y-1">
        <div className="text-xs text-stone-500 uppercase tracking-wider font-bold mb-1 px-1">Itens</div>
        {isLoading ? (
          <div className="px-2 py-1 text-sm text-stone-400">Carregando...</div>
        ) : inventoryItems.length > 0 ? (
          inventoryItems.map(item => (
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
                {item.quantity > 1 && (
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
