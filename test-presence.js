import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const channel = supabase.channel('test-presence', {
  config: {
    presence: {
      key: 'test-user',
    },
  },
});

channel.on('presence', { event: 'sync' }, () => {
  console.log('Presence sync:', channel.presenceState());
});

channel.subscribe(async (status, err) => {
  console.log('Status:', status, err);
  if (status === 'SUBSCRIBED') {
    const res = await channel.track({ name: 'Test User' });
    console.log('Track res:', res);
    setTimeout(() => process.exit(0), 3000);
  }
});
