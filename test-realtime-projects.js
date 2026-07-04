import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRealtime() {
  const channelName = 'presence_session_c0a80121-0000-1000-8000-00805f9b34fb'; // dummy id
  const channel = supabase.channel(channelName);
  console.log('Channel created:', channel.topic);
  process.exit(0);
}
checkRealtime();
