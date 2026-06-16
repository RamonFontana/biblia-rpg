import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceState {
  user_id: string;
  character_id?: string;
  online_at: string;
  name?: string;
}

export const useSupabasePresence = (
  sessionId: string | undefined,
  userPayload?: PresenceState
) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    let channel: RealtimeChannel;

    const setupPresence = () => {
      channel = supabase.channel(`session_${sessionId}`, {
        config: {
          presence: {
            key: userPayload?.user_id || 'anonymous',
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          const users: PresenceState[] = [];
          
          Object.values(newState).forEach((presences) => {
            if (Array.isArray(presences)) {
              users.push(...(presences as unknown as PresenceState[]));
            }
          });
          
          // Deduplicate by user_id
          const uniqueUsers = Array.from(
            new Map(users.map((item) => [item.user_id, item])).values()
          );
          
          setOnlineUsers(uniqueUsers);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && userPayload) {
            await channel.track(userPayload);
          }
        });
    };

    setupPresence();

    return () => {
      if (channel) {
        // Automatically untracks when leaving channel
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, userPayload?.user_id, userPayload?.character_id, userPayload?.name]);

  return { onlineUsers };
};
