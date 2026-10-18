import { useEffect, useState } from 'react';
import { joinSessionPresence, type PresenceState } from '@/data-access/realtime';

export type { PresenceState };

export const useSupabasePresence = (sessionId: string | undefined, userPayload?: PresenceState) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!sessionId || !userPayload) return;
    return joinSessionPresence(sessionId, userPayload, setOnlineUsers);
  }, [sessionId, userPayload?.user_id, userPayload?.character_id, userPayload?.name]);

  return { onlineUsers };
};
