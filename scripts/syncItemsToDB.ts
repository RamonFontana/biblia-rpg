import { createClient } from '@supabase/supabase-js';
import { ITEMS_DB } from '../src/data/itemsDb';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Starting sync of', ITEMS_DB.length, 'items...');

  for (const item of ITEMS_DB) {
    const payload = {
      name: item.name,
      category: item.type || item.category,
      description: item.description || null,
      is_consumable: item.type === 'Consumível',
      price: item.cost || 0,
      level: item.level || 1,
      armor_class: item.armorClass || 0,
      damage: item.damage || null,
      condition_resistances: item.conditionResistances || [],
    };

    // Find if item exists by name
    const { data: existing, error: fetchErr } = await supabase
      .from('items')
      .select('id')
      .eq('name', item.name)
      .limit(1);

    if (fetchErr) {
      console.error('Failed to fetch item:', item.name, fetchErr);
      continue;
    }

    if (existing && existing.length > 0) {
      // Update
      const { error } = await supabase.from('items').update(payload).eq('id', existing[0].id);
      if (error) {
        console.error('Failed to update item:', item.name, error);
      } else {
        console.log('Updated:', item.name);
      }
    } else {
      // Insert
      const { error } = await supabase.from('items').insert([payload]);
      if (error) {
        console.error('Failed to insert item:', item.name, error);
      } else {
        console.log('Inserted:', item.name);
      }
    }
  }

  console.log('Sync finished.');
}

main().catch(console.error);
