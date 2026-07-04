import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase1 = createClient(supabaseUrl, supabaseAnonKey);
const supabase2 = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const channelName = 'presence_session_test';

  const channel1 = supabase1.channel(channelName, {
    config: { presence: { key: 'user_1' } }
  });

  const channel2 = supabase2.channel(channelName, {
    config: { presence: { key: 'user_2' } }
  });

  channel1.on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User 1 JOIN event:', key, newPresences);
  });
  
  channel1.on('presence', { event: 'sync' }, () => {
    console.log('User 1 SYNC:', Object.keys(channel1.presenceState()));
  });

  channel2.on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User 2 JOIN event:', key, newPresences);
  });
  
  channel2.on('presence', { event: 'sync' }, () => {
    console.log('User 2 SYNC:', Object.keys(channel2.presenceState()));
  });

  await new Promise(r => {
    channel1.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Channel 1 subscribed');
        await channel1.track({ user_id: 'user_1', name: 'Master' });
        r();
      }
    });
  });

  await new Promise(r => {
    channel2.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Channel 2 subscribed');
        await channel2.track({ user_id: 'user_2', name: 'Player' });
        r();
      }
    });
  });

  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

test();
