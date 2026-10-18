import { useState, useEffect, useCallback } from 'react';
import { subscribeToTables } from '@/data-access/realtime';
import {
  fetchSessionRoster,
  groupSessionRoster,
  type SessionCharacter,
  type SessionNpc,
  type SessionPlayer,
} from '@/data-access/sessions';

export function useSessionCharacters(sessionId: string | undefined) {
  const [playerCharacters, setPlayerCharacters] = useState<SessionPlayer[]>([]);
  const [npcs, setNpcs] = useState<SessionNpc[]>([]);
  const [enemies, setEnemies] = useState<SessionCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCharacters = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);

    try {
      const roster = groupSessionRoster(await fetchSessionRoster(sessionId));
      setPlayerCharacters(roster.players);
      setNpcs(roster.npcs);
      setEnemies(roster.enemies);
    } catch (error) {
      console.error('Error fetching session characters:', error);
    }

    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  useEffect(() => {
    if (!sessionId) return;

    return subscribeToTables(`session_characters_${sessionId}_${Math.random()}`, [
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
    ]);
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
