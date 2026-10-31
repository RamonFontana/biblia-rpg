import { useEffect, useState } from 'react';
import { listSessionMaps, subscribeToSessionMaps, type SessionMap } from '@/data-access/maps';

/** Os mapas da sessão, lidos uma vez e atualizados em tempo real. */
export function useSessionMaps(sessionId: string | undefined): SessionMap[] {
  const [maps, setMaps] = useState<SessionMap[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    const load = async () => {
      try {
        const list = await listSessionMaps(sessionId);
        if (active) setMaps(list);
      } catch (error) {
        console.error('Erro ao buscar os mapas da sessão:', error);
      }
    };
    load();
    const unsubscribe = subscribeToSessionMaps(sessionId, load, { onSubscribed: load });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [sessionId]);

  return maps;
}
