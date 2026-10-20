import { useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import type { PresenceState } from '@/data-access/realtime';
import { useSupabasePresence } from './useSupabasePresence';

/** Quem está online na sessão. O nome vem do perfil, ou do e-mail, ou "Jogador". */
export function useSessionPresence(sessionId: string | undefined, user: User | null) {
  const payload = useMemo<PresenceState | undefined>(
    () =>
      user
        ? {
            user_id: user.id,
            name:
              user.user_metadata?.name ||
              user.user_metadata?.username ||
              user.email?.split('@')[0] ||
              'Jogador',
            online_at: new Date().toISOString(),
          }
        : undefined,
    [user],
  );

  return useSupabasePresence(sessionId, payload);
}
