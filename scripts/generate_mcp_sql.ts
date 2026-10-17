import * as fs from 'fs';
import { ITEMS_DB } from '../src/data/itemsDb';

let sql = 'DO $$\nBEGIN\n';

for (const item of ITEMS_DB) {
  const name = item.name.replace(/'/g, "''");
  const desc = (item.description || '').replace(/'/g, "''");
  const category = item.type || item.category || 'Utilidade';
  const is_consumable = category === 'Consumível';
  const price = Math.round(item.cost || 0); // avoid 0.5 issue
  const level = item.level || 1;
  const ac = item.armorClass || 0;

  let dmg = item.damage ? `'${item.damage}'` : 'NULL';

  // Create array literal for resistances
  const resList = item.conditionResistances || [];
  const resArrayStr =
    resList.length > 0
      ? `ARRAY[${resList.map((r) => `'${r}'`).join(',')}]::text[]`
      : `ARRAY[]::text[]`;

  sql += `
  UPDATE items SET 
    category = '${category}',
    description = '${desc}',
    is_consumable = ${is_consumable},
    price = ${price},
    level = ${level},
    armor_class = ${ac},
    damage = ${dmg},
    condition_resistances = ${resArrayStr}
  WHERE name = '${name}';

  IF NOT FOUND THEN
    INSERT INTO items (name, category, description, is_consumable, price, level, armor_class, damage, condition_resistances)
    VALUES ('${name}', '${category}', '${desc}', ${is_consumable}, ${price}, ${level}, ${ac}, ${dmg}, ${resArrayStr});
  END IF;
`;
}

sql += 'END $$;';

fs.writeFileSync('supabase/seed_items_mcp.sql', sql);
console.log('Generated supabase/seed_items_mcp.sql');
