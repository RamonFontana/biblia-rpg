import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUpdateNPCInventory } from '@/hooks/useUpdateNPCInventory';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface NPCInventoryManagerProps {
  characterId: string;
  items: any[];
}

export function NPCInventoryManager({ characterId, items }: NPCInventoryManagerProps) {
  const { addItem, updateQuantity, removeItem, isUpdating } = useUpdateNPCInventory();
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);

  useEffect(() => {
    async function fetchAvailableItems() {
      const { data } = await supabase.from('items').select('id, name, category').order('name');
      if (data) setAvailableItems(data);
    }
    fetchAvailableItems();
  }, []);

  const handleAddItem = async () => {
    if (!selectedItemId) return;
    await addItem(characterId, selectedItemId, quantityToAdd);
    setSelectedItemId('');
    setQuantityToAdd(1);
  };

  return (
    <div className="space-y-4">
      <div className="bg-stone-900 border border-stone-800 p-4 rounded-lg flex flex-col sm:flex-row gap-3">
        <select 
          className="bg-stone-800 border border-stone-700 rounded-md p-2 text-sm text-stone-200 flex-1"
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
        >
          <option value="">-- Selecione um item --</option>
          {availableItems.map(item => (
            <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input 
            type="number" 
            min="1" 
            className="bg-stone-800 border border-stone-700 rounded-md p-2 w-20 text-sm text-center text-stone-200"
            value={quantityToAdd}
            onChange={(e) => setQuantityToAdd(Number(e.target.value))}
          />
          <button 
            disabled={!selectedItemId || isUpdating}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-colors"
            onClick={handleAddItem}
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-bold text-amber-500/80 uppercase tracking-wider mb-2">Gerenciar Itens</h4>
        {items.map((item: any) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-stone-900 border border-stone-800 rounded-lg">
            <div>
              <span className="text-stone-200 font-medium">{item.items?.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
              <button 
                disabled={isUpdating}
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200"
              >
                <Minus size={16} />
              </button>
              <span className="text-sm text-stone-200 w-6 text-center font-mono">{item.quantity}</span>
              <button 
                disabled={isUpdating}
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200"
              >
                <Plus size={16} />
              </button>
              <button 
                disabled={isUpdating}
                onClick={() => removeItem(item.id)}
                className="p-1 ml-2 hover:bg-red-900/30 rounded text-red-500 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
