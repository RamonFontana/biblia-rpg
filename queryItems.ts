import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('items')
    .select('name, effects')
    .ilike('name', '%Couro Cru%');
    
  console.log('Couro Cru:', JSON.stringify(data, null, 2));

  const { data: d2 } = await supabase
    .from('items')
    .select('name, effects')
    .ilike('name', '%Escudo%');

  console.log('Escudo:', JSON.stringify(d2, null, 2));
}

run();
