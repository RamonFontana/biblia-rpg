// Mapas da sessão (CONTEXT.md, Mapa e Mapa atual). As funções lançam o erro do Supabase.
import { uniqueChannelName } from '@/lib/channelName';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database.types';
import { subscribeToTables, type SubscribeOptions } from './realtime';
import { updateGameSession } from './sessions';

export type SessionMap = Tables<'session_maps'>;

export interface NewSessionMap {
  sessionId: string;
  libraryId: string;
  name: string;
  columns: number;
  rows: number;
  position: number;
}

export async function listSessionMaps(sessionId: string): Promise<SessionMap[]> {
  const { data, error } = await supabase
    .from('session_maps')
    .select('*')
    .eq('session_id', sessionId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addSessionMap(map: NewSessionMap): Promise<void> {
  const { error } = await supabase.from('session_maps').insert({
    session_id: map.sessionId,
    library_id: map.libraryId,
    name: map.name,
    columns: map.columns,
    rows: map.rows,
    position: map.position,
  });
  if (error) throw error;
}

/** Soma vários terrenos de uma vez a uma sessão nova, na ordem dada. */
export async function addSessionMaps(
  sessionId: string,
  maps: Omit<NewSessionMap, 'sessionId' | 'position'>[],
): Promise<void> {
  if (maps.length === 0) return;
  const { error } = await supabase.from('session_maps').insert(
    maps.map((map, position) => ({
      session_id: sessionId,
      library_id: map.libraryId,
      name: map.name,
      columns: map.columns,
      rows: map.rows,
      position,
    })),
  );
  if (error) throw error;
}

export async function updateSessionMap(
  id: string,
  patch: TablesUpdate<'session_maps'>,
): Promise<void> {
  const { error } = await supabase.from('session_maps').update(patch).eq('id', id);
  if (error) throw error;
}

export async function removeSessionMap(id: string): Promise<void> {
  const { error } = await supabase.from('session_maps').delete().eq('id', id);
  if (error) throw error;
}

/** Mostra o mapa aos jogadores (o Mapa atual); nulo volta ao Palco de Retratos. */
export function showSessionMap(sessionId: string, mapId: string | null): Promise<void> {
  return updateGameSession(sessionId, { shown_map_id: mapId });
}

/**
 * Avisa a cada mudança nos mapas da sessão. Devolve a função que cancela. O Realtime não entrega
 * `DELETE` por assinatura com filtro, então o apagar vem de uma assinatura à parte, sem filtro:
 * quem escuta só relê a lista.
 */
export function subscribeToSessionMaps(
  sessionId: string,
  onChange: () => void,
  options?: SubscribeOptions,
): () => void {
  return subscribeToTables(
    uniqueChannelName(`session-maps-${sessionId}`),
    [
      { table: 'session_maps', event: 'INSERT', filter: `session_id=eq.${sessionId}`, onChange },
      { table: 'session_maps', event: 'UPDATE', filter: `session_id=eq.${sessionId}`, onChange },
      { table: 'session_maps', event: 'DELETE', onChange },
    ],
    options,
  );
}
