import { supabase } from './supabase';

export interface TableSubscription {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onChange: (payload: any) => void;
}

// Wires one realtime channel to N postgres_changes listeners and returns its teardown.
// Centralizes the channel-naming/listener/cleanup boilerplate that every session-scoped
// hook (and combatStore) was hand-rolling separately — the refetch-vs-patch decision
// stays with each caller's onChange, this only owns the wiring around it.
export function subscribeToTables(channelName: string, subscriptions: TableSubscription[]): () => void {
  const channel = supabase.channel(channelName);

  for (const sub of subscriptions) {
    channel.on(
      'postgres_changes' as any,
      {
        event: sub.event ?? '*',
        schema: 'public',
        table: sub.table,
        ...(sub.filter ? { filter: sub.filter } : {}),
      },
      sub.onChange
    );
  }

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
