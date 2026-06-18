import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessions() {
  console.log('Checking game_sessions...');
  const { data: sessions, error: sessionsErr } = await supabase
    .from('game_sessions')
    .select('id, name, status, gm_id')
    .order('created_at', { ascending: false });

  if (sessionsErr) {
    console.error('Error fetching sessions:', sessionsErr);
  } else {
    console.log('Game Sessions:', sessions);
  }
}

checkSessions();
