import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, created_at, proficiencies, tribe, vocation')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Recent characters:', JSON.stringify(data, null, 2));
}

run();
