import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface PresenceState {
  user_id: string;
  character_id?: string;
  online_at: string;
  name?: string;
}

export const useSupabasePresence = (sessionId: string | undefined, userPayload?: PresenceState) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!sessionId || !userPayload) return;

    let isMounted = true;
    const channelName = `presence_session_${sessionId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userPayload.user_id,
        },
      },
    });

    const updatePresence = () => {
      if (!isMounted) return;
      const newState = channel.presenceState();

      const users: PresenceState[] = [];
      Object.values(newState).forEach((presences) => {
        if (Array.isArray(presences)) {
          users.push(...(presences as unknown as PresenceState[]));
        }
      });

      const uniqueUsers = Array.from(new Map(users.map((item) => [item.user_id, item])).values());

      setOnlineUsers(uniqueUsers);
    };

    channel.on('presence', { event: 'sync' }, updatePresence).subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && isMounted) {
        try {
          await channel.track(userPayload);
        } catch (err) {
          console.error('[Presence] Error tracking presence:', err);
        }
      }
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, userPayload?.user_id, userPayload?.character_id, userPayload?.name]);

  return { onlineUsers };
};
