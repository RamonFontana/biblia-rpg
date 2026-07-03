import { supabase } from './src/lib/supabase';

async function main() {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, skills')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}

main();
