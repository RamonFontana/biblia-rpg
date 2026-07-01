import { ITEMS_DB } from '../src/data/itemsDb';
import * as fs from 'fs';

let sql = '';

for (const item of ITEMS_DB) {
  const id = item.id;
  const name = item.name.replace(/'/g, "''");
  const category = item.type; // It seems the TradeSide and others use 'category' to determine if it's Armadura. No, let's use type from itemsDb.
  const cat = item.type ? item.type.replace(/'/g, "''") : item.category.replace(/'/g, "''");
  const desc = item.description ? item.description.replace(/'/g, "''") : '';
  const is_consumable = item.type === 'Consumível';
  const level = item.level || 1;
  const ac = item.armorClass || 0;
  const damage = item.damage ? `'${item.damage.replace(/'/g, "''")}'` : 'NULL';
  const price = item.cost || 0;

  let cr = 'ARRAY[]::text[]';
  if (item.conditionResistances && item.conditionResistances.length > 0) {
    const formattedArray = item.conditionResistances.map(c => `'${c}'`).join(',');
    cr = `ARRAY[${formattedArray}]::text[]`;
  }

  sql += `
INSERT INTO items (id, name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
VALUES ('${id}', '${name}', '${cat}', '${desc}', ${is_consumable}, ${price}, ${level}, ${ac}, ${damage}, ${cr})
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_consumable = EXCLUDED.is_consumable,
  price = EXCLUDED.price,
  level = EXCLUDED.level,
  armor_class = EXCLUDED.armor_class,
  damage = EXCLUDED.damage,
  condition_resistances = EXCLUDED.condition_resistances;
`;
}

fs.writeFileSync('supabase/seed_items.sql', sql);
console.log('SQL generated at supabase/seed_items.sql');
