// Realtime do Supabase: assinaturas de mudanças em tabelas e presença numa sessão.
import type {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type ChangePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

export interface TableSubscription {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onChange: (payload: ChangePayload) => void;
}

// Wires one realtime channel to N postgres_changes listeners and returns its teardown.
// Centralizes the channel-naming/listener/cleanup boilerplate that every session-scoped
// hook (and combatStore) was hand-rolling separately — the refetch-vs-patch decision
// stays with each caller's onChange, this only owns the wiring around it.
export function subscribeToTables(
  channelName: string,
  subscriptions: TableSubscription[],
): () => void {
  const channel = supabase.channel(channelName);

  for (const sub of subscriptions) {
    // As sobrecargas de `on` pedem um `event` literal; o tipo da união não casa com nenhuma.
    const filter = {
      event: sub.event ?? '*',
      schema: 'public',
      table: sub.table,
      ...(sub.filter ? { filter: sub.filter } : {}),
    } as RealtimePostgresChangesFilter<'*'>;
    channel.on('postgres_changes', filter, sub.onChange);
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export interface PresenceState {
  user_id: string;
  character_id?: string;
  online_at: string;
  name?: string;
}

/** Um registro por usuário, o último que chegou, na ordem em que cada usuário apareceu. */
export function uniquePresenceUsers(users: PresenceState[]): PresenceState[] {
  return Array.from(new Map(users.map((item) => [item.user_id, item])).values());
}

/**
 * Entra no canal de presença da sessão, anuncia `me` e chama `onSync` com os usuários online a
 * cada mudança. Devolve a função que sai do canal.
 */
export function joinSessionPresence(
  sessionId: string,
  me: PresenceState,
  onSync: (users: PresenceState[]) => void,
): () => void {
  let active = true;

  const channel = supabase.channel(`presence_session_${sessionId}`, {
    config: { presence: { key: me.user_id } },
  });

  const updatePresence = () => {
    if (!active) return;
    const users: PresenceState[] = [];
    Object.values(channel.presenceState()).forEach((presences) => {
      if (Array.isArray(presences)) {
        users.push(...(presences as unknown as PresenceState[]));
      }
    });
    onSync(uniquePresenceUsers(users));
  };

  channel.on('presence', { event: 'sync' }, updatePresence).subscribe(async (status) => {
    if (status === 'SUBSCRIBED' && active) {
      try {
        await channel.track(me);
      } catch (err) {
        console.error('[Presence] Error tracking presence:', err);
      }
    }
  });

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
