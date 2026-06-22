import { supabase } from '@/lib/supabase';
import type { EquipmentItem } from '../../character-creation/types';
import { ITEMS_DB } from '@/data/itemsDb';

const VOCATION_KIT_ITEMS: Record<string, any[]> = {
  'Guerreiro': [
    { name: 'Espada Curta (Ferro)', category: 'Marcial', is_consumable: false, type: 'Arma' },
    { name: 'Couro Cru', category: 'Leve', is_consumable: false, type: 'Armadura' },
    { name: 'Escudo (Madeira/Bronze)', category: 'Escudo', is_consumable: false, type: 'Escudo' },
    { name: 'Ração de Viagem', category: 'Todas', is_consumable: true, type: 'Consumível', quantity: 5 },
    { name: 'Odre (Água)', category: 'Todas', is_consumable: true, type: 'Consumível' },
    { name: 'Faca/Adaga de Bronze', category: 'Simples', is_consumable: false, type: 'Arma' },
  ],
  'Caçador': [
    { name: 'Arco Curto', category: 'Marcial', is_consumable: false, type: 'Arma' },
    { name: 'Faca/Adaga de Bronze', category: 'Simples', is_consumable: false, type: 'Arma' },
    { name: 'Couro Cru', category: 'Leve', is_consumable: false, type: 'Armadura' },
    { name: 'Corda de Cânhamo (15m)', category: 'Todas', is_consumable: false, type: 'Utilidade' },
  ],
  'Batedor': [
    { name: 'Faca/Adaga de Bronze', category: 'Simples', is_consumable: false, type: 'Arma', quantity: 2 },
    { name: 'Couro Cru', category: 'Leve', is_consumable: false, type: 'Armadura' },
    { name: 'Corda de Cânhamo (15m)', category: 'Todas', is_consumable: false, type: 'Utilidade' },
  ],
  'Sacerdote': [
    { name: 'Cajado de Pastor', category: 'Simples', is_consumable: false, type: 'Arma' },
    { name: 'Bálsamo Curativo / Óleo', category: 'Todas', is_consumable: true, type: 'Consumível', quantity: 3 },
  ],
  'Sábio': [
    { name: 'Cajado de Pastor', category: 'Simples', is_consumable: false, type: 'Arma' },
    { name: 'Bálsamo Curativo / Óleo', category: 'Todas', is_consumable: true, type: 'Consumível', quantity: 3 },
  ]
};

function getEffectsFromItemName(name: string) {
  const dbItem = ITEMS_DB.find(i => i.name === name);
  if (!dbItem) return {};

  const effects: any = {};
  if (dbItem.damage) {
    const parts = dbItem.damage.split(' ');
    effects.damageDie = parts[0];
    if (parts.length > 1) effects.damageType = parts[1];
  }
  if (dbItem.armorClass) {
    if (dbItem.type === 'Escudo') {
      effects.acBonus = dbItem.armorClass;
    } else {
      effects.armorClass = dbItem.armorClass;
    }
  }
  if (dbItem.category) {
    effects.weaponCategory = dbItem.category;
  }
  if (dbItem.description && dbItem.description.includes('Versátil')) {
     const match = dbItem.description.match(/Versátil \((1d\d+)\)/);
     if (match) effects.versatileDamageDie = match[1];
  }

  let slot = '';
  if (dbItem.type === 'Escudo') slot = 'shield';
  else if (dbItem.type === 'Armadura') slot = 'body';
  else if (dbItem.type === 'Arma') {
    if (dbItem.description && dbItem.description.includes('Duas mãos')) slot = '2h';
    else slot = '1h';
  }
  if (slot) effects.slot = slot;

  if (dbItem.properties && dbItem.properties.length > 0) {
    effects.properties = dbItem.properties;
  }

  if (dbItem.statPenalty) {
    effects.statPenalty = dbItem.statPenalty;
  }

  return effects;
}

export async function syncInventoryItems(characterId: string, equipment: EquipmentItem[], vocation: string) {
  try {
    // Determine the raw items to insert
    const rawItemsToProcess: any[] = [];
    
    for (const eq of equipment) {
      if (eq.id === 'kit_basico') {
        const kitItems = VOCATION_KIT_ITEMS[vocation] || [];
        for (const kItem of kitItems) {
          rawItemsToProcess.push({
            name: kItem.name,
            category: kItem.category,
            is_consumable: kItem.is_consumable,
            type: kItem.type,
            quantity: kItem.quantity || 1
          });
        }
      } else {
        rawItemsToProcess.push({
          name: eq.name,
          category: (eq as any).category || 'Outros',
          is_consumable: eq.type === 'Consumível',
          type: eq.type,
          quantity: 1
        });
      }
    }

    // Process and insert into `items` table if they don't exist
    const finalCharacterItems = [];

    for (const itemData of rawItemsToProcess) {
      // Find item
      let { data: existingItem } = await supabase
        .from('items')
        .select('id')
        .eq('name', itemData.name)
        .maybeSingle();

      if (!existingItem) {
        // Insert new item
        const { data: newItem, error: insertError } = await supabase
          .from('items')
          .insert({
            name: itemData.name,
            category: itemData.category,
            is_consumable: itemData.is_consumable,
            effects: getEffectsFromItemName(itemData.name),
            requires_target: false
          })
          .select('id')
          .single();
          
        if (insertError) {
          console.error('Error inserting item:', insertError, itemData);
        }
          
        if (newItem) {
          existingItem = newItem;
        }
      }

      if (existingItem) {
        finalCharacterItems.push({
          character_id: characterId,
          item_id: existingItem.id,
          quantity: itemData.quantity
        });
      }
    }

    // Delete existing character items first
    const { error: deleteError } = await supabase.from('character_items').delete().eq('character_id', characterId);
    if (deleteError) {
      console.error('Error deleting old character items:', deleteError);
    }

    // Group items by item_id to sum quantities
    const groupedItems = finalCharacterItems.reduce((acc, curr) => {
      const existing = acc.find(i => i.item_id === curr.item_id);
      if (existing) {
        existing.quantity += curr.quantity;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as any[]);

    // Insert new character items
    if (groupedItems.length > 0) {
      const { error: insertItemsError } = await supabase.from('character_items').insert(groupedItems);
      if (insertItemsError) {
        console.error('Error inserting character items:', insertItemsError, groupedItems);
      }
    }
    
  } catch (err) {
    console.error('Error syncing inventory:', err);
  }
}
