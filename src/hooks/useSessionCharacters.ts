import { useState, useEffect, useCallback } from 'react';
import { subscribeToTables } from '@/data-access/realtime';
import {
  fetchSessionRoster,
  groupSessionRoster,
  type SessionCharacter,
  type SessionNpc,
  type SessionPlayer,
} from '@/data-access/sessions';

const logFetchError = (error: unknown) =>
  console.error('Error fetching session characters:', error);

export function useSessionCharacters(sessionId: string | undefined) {
  const [playerCharacters, setPlayerCharacters] = useState<SessionPlayer[]>([]);
  const [npcs, setNpcs] = useState<SessionNpc[]>([]);
  const [enemies, setEnemies] = useState<SessionCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Outra sessão recomeça o carregamento. Ajustar durante a renderização (e não num efeito) evita
  // um quadro com a sessão nova e `isLoading` desligado.
  const [loadedSessionId, setLoadedSessionId] = useState(sessionId);
  if (loadedSessionId !== sessionId) {
    setLoadedSessionId(sessionId);
    setIsLoading(true);
  }

  // Quem chama trata a falha (`logFetchError`); aqui só se garante que o carregamento termina.
  const loadCharacters = useCallback(async () => {
    if (!sessionId) return;

    try {
      const roster = groupSessionRoster(await fetchSessionRoster(sessionId));
      setPlayerCharacters(roster.players);
      setNpcs(roster.npcs);
      setEnemies(roster.enemies);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Consulta nova (realtime ou chamada de fora): liga `isLoading` e carrega.
  const fetchCharacters = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    await loadCharacters().catch(logFetchError);
  }, [sessionId, loadCharacters]);

  useEffect(() => {
    loadCharacters().catch(logFetchError);
  }, [loadCharacters]);

  useEffect(() => {
    if (!sessionId) return;

    return subscribeToTables(
      `session_characters_${sessionId}_${Math.random()}`,
      [
        {
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
          onChange: fetchCharacters,
        },
        { table: 'character_items', onChange: fetchCharacters },
        { table: 'characters', event: 'UPDATE', onChange: fetchCharacters },
        { table: 'session_npcs', filter: `session_id=eq.${sessionId}`, onChange: fetchCharacters },
        {
          table: 'combats',
          event: 'UPDATE',
          filter: `session_id=eq.${sessionId}`,
          onChange: (payload) => {
            if ('status' in payload.new && payload.new.status === 'finished') {
              fetchCharacters();
            }
          },
        },
      ],
      // Eventos antes da confirmação do canal (ou durante uma reconexão) se perdem: relê aqui.
      { onSubscribed: () => loadCharacters().catch(logFetchError) },
    );
  }, [sessionId, fetchCharacters]);

  // Single local-state patcher for all three entity kinds. Players are stored as
  // { user_id, character } wrapper rows, so their patch merges one level deeper
  // (into .character); NPCs and enemies are stored as the entity itself.
  const updateLocal = useCallback(
    (kind: 'player' | 'npc' | 'enemy', id: string, patch: Partial<SessionNpc>) => {
      if (kind === 'player') {
        setPlayerCharacters((prev) => {
          const index = prev.findIndex((p) => p.character?.id === id);
          if (index === -1) return prev;
          const next = [...prev];
          next[index] = { ...next[index], character: { ...next[index].character, ...patch } };
          return next;
        });
        return;
      }

      const patchEntity = <T extends SessionNpc>(prev: T[]): T[] => {
        const index = prev.findIndex((entity) => entity.id === id);
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      };

      if (kind === 'npc') {
        setNpcs(patchEntity);
      } else {
        setEnemies(patchEntity);
      }
    },
    [],
  );

  return {
    playerCharacters,
    npcs,
    enemies,
    isLoading,
    refresh: fetchCharacters,
    updateLocal,
  };
}
