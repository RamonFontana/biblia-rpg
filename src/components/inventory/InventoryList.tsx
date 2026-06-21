import { Target } from 'lucide-react';
import type { CharacterEquipment } from '@/types/combat';
import { canEquipItem } from '@/lib/equipmentUtils';

interface InventoryListProps {
  inventoryItems: any[];
  equipment: CharacterEquipment | null;
  onEquip: (characterItemId: string, itemEffects: any, targetHand?: 'mainHand' | 'offHand') => void;
  onUseConsumable: (item: any) => void;
  isUpdating: boolean;
}

export function InventoryList({ inventoryItems, equipment, onEquip, onUseConsumable, isUpdating }: InventoryListProps) {
  if (inventoryItems.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
          <Target className="w-5 h-5 text-amber-500" />
          Inventário
        </h3>
        <p className="text-sm text-stone-500 italic">Inventário vazio.</p>
      </div>
    );
  }

  // Group items by category
  const groupedItems = inventoryItems.reduce((acc, curr) => {
    const category = curr.items?.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
        <Target className="w-5 h-5 text-amber-500" />
        Inventário
      </h3>
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-bold text-amber-500/80 uppercase tracking-wider mb-2">{category}</h4>
            <div className="space-y-2">
              {(items as any[]).map((item: any) => {
                const itemEffects = item.items?.effects || {};
                let itemSlot = itemEffects.slot;
                
                // Infer slot from category if missing
                if (!itemSlot) {
                  const category = item.items?.category?.toUpperCase() || '';
                  if (category.includes('SIMPLES') || category.includes('MARCIAL')) {
                    itemSlot = '1h'; // Default to 1h
                  } else if (category.includes('LEVE') || category.includes('MÉDI') || category.includes('PESAD') || category.includes('ARMADURA')) {
                    itemSlot = 'body';
                  } else if (category.includes('ESCUDO')) {
                    itemSlot = 'shield';
                  }
                }
                
                const normalizedEffects = { ...itemEffects, slot: itemSlot };

                const equippedCount = 
                  (equipment?.head === item.id ? 1 : 0) +
                  (equipment?.body === item.id ? 1 : 0) +
                  (equipment?.mainHand === item.id && itemSlot !== '2h' ? 1 : 0) +
                  (equipment?.offHand === item.id && itemSlot !== '2h' ? 1 : 0) +
                  // For 2h weapons, they occupy both hands but count as 1 item equipped
                  (equipment?.mainHand === item.id && equipment?.offHand === item.id && itemSlot === '2h' ? 1 : 0);

                const isEquipped = equippedCount > 0;
                const fullyEquipped = equippedCount >= item.quantity || (itemSlot !== '1h' && equippedCount >= 1);
                  
                const isEquippable = !!itemSlot && canEquipItem(normalizedEffects, equipment || { head: null, body: null, mainHand: null, offHand: null });

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-stone-900 border border-stone-800 rounded-lg group hover:border-stone-700 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-200 font-medium">{item.items?.name}</span>
                        {item.quantity > 1 && (
                          <span className="text-xs px-1.5 py-0.5 bg-stone-800 rounded-md text-stone-400 font-mono">
                            x{item.quantity}
                          </span>
                        )}
                        {isEquipped && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/40 text-amber-400 rounded border border-amber-900/50">
                            Equipado {equippedCount > 1 ? `(x${equippedCount})` : ''}
                          </span>
                        )}
                      </div>
                      {item.items?.description && <span className="text-xs text-stone-500 block mt-1">{item.items.description}</span>}
                      {normalizedEffects.damageDie && (
                        <span className="text-xs text-amber-500 font-bold block mt-1">Dano: {normalizedEffects.damageDie}</span>
                      )}
                      {(() => {
                        let bonus = 0;
                        if (normalizedEffects.acBonus !== undefined) bonus = Number(normalizedEffects.acBonus);
                        else if (normalizedEffects.ca !== undefined) bonus = Number(normalizedEffects.ca);
                        else if (normalizedEffects.armorClass !== undefined) bonus = Math.max(0, Number(normalizedEffects.armorClass) - 10);
                        
                        if (bonus > 0) {
                          return (
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-900/50 font-bold">
                              CA +{bonus}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                      {item.items?.is_consumable && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-amber-900/20 text-amber-400 rounded border border-amber-900/30">Consumível</span>
                          <button
                            onClick={() => onUseConsumable(item)}
                            disabled={isUpdating}
                            className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded shadow-sm disabled:opacity-50"
                          >
                            Usar
                          </button>
                        </div>
                      )}
                      
                      {isEquippable && !fullyEquipped && (
                        <div className="flex items-center gap-2">
                          {normalizedEffects.slot === '1h' ? (
                            <>
                              {equipment?.mainHand !== item.id && (
                                <button
                                  onClick={() => onEquip(item.id, normalizedEffects, 'mainHand')}
                                  disabled={isUpdating}
                                  className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded border border-stone-700 transition-colors disabled:opacity-50"
                                >
                                  Mão Principal
                                </button>
                              )}
                              {equipment?.offHand !== item.id && (
                                <button
                                  onClick={() => onEquip(item.id, normalizedEffects, 'offHand')}
                                  disabled={isUpdating}
                                  className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded border border-stone-700 transition-colors disabled:opacity-50"
                                >
                                  Mão Secundária
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => onEquip(item.id, normalizedEffects)}
                              disabled={isUpdating}
                              className="text-xs px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded border border-stone-700 transition-colors disabled:opacity-50"
                            >
                              Equipar
                            </button>
                          )}
                        </div>
                      )}

                      {item.items?.weight > 0 && (
                        <span className="text-xs text-stone-500">{item.items.weight} kg</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
