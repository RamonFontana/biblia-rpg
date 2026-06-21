import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const VITE_SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1];
const VITE_SUPABASE_ANON_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1];

const supabase = createClient(VITE_SUPABASE_URL!, VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching item:', error);
  } else {
    console.log('Item:', JSON.stringify(data, null, 2));
  }
}

main();
