require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const channel = supabase.channel('test_presence_channel', {
    config: {
      presence: {
        key: 'test_user_id',
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      console.log('Sync event:', JSON.stringify(channel.presenceState()));
    })
    .subscribe(async (status) => {
      console.log('Status:', status);
      if (status === 'SUBSCRIBED') {
        const trackRes = await channel.track({ name: 'Test User' });
        console.log('Track result:', trackRes);
      }
    });

  setTimeout(() => {
    supabase.removeChannel(channel);
    console.log('Removed channel');
    process.exit(0);
  }, 3000);
}

test();
