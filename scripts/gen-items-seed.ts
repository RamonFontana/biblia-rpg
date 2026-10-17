// Cria a migration de seed da tabela `items` quando o conteúdo mudou desde o último seed.
// Uso: npm run gen:items-seed (depois aplique com `npx supabase db push`, com confirmação).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ITEMS_DB } from '../src/content/items.ts';
import { buildItemsSeedSql } from '../src/content/itemsSeed.ts';

const dir = 'supabase/migrations';
const sql = buildItemsSeedSql(ITEMS_DB);
const latest = readdirSync(dir)
  .filter((file) => file.endsWith('_seed_items.sql'))
  .sort()
  .at(-1);

if (latest && readFileSync(`${dir}/${latest}`, 'utf8') === sql) {
  console.log(`O seed já reflete o conteúdo: ${latest}`);
} else {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const file = `${dir}/${stamp}_seed_items.sql`;
  writeFileSync(file, sql);
  console.log(`Criado ${file}`);
}
