import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { subscribeToTables } from '@/lib/realtimeSubscriptions';
import type { Character } from '@/features/character-management/types';

export function useSessionCharacters(sessionId: string | undefined) {
  const [playerCharacters, setPlayerCharacters] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<Character[]>([]);
  const [enemies, setEnemies] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCharacters = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);

    const { data: participantsData, error: participantsError } = await supabase
      .from('session_participants')
      .select(`
        user_id,
        characters (*, character_items(*, items(*)))
      `)
      .eq('session_id', sessionId);

    const { data: simpleNpcsData, error: simpleNpcsError } = await supabase
      .from('session_npcs')
      .select('*')
      .eq('session_id', sessionId);

    if (!participantsError && !simpleNpcsError) {
      const pChars: any[] = [];
      const sessionNpcs: Character[] = [];
      const sessionEnemies: Character[] = [];

      (participantsData || []).forEach((p: any) => {
        const char = p.characters;
        if (!char) return;

        if (char.is_enemy) {
          sessionEnemies.push(char);
        } else if (char.is_npc) {
          sessionNpcs.push({ ...char, is_playable: true });
        } else {
          pChars.push({ user_id: p.user_id, character: char, profile: null });
        }
      });

      const simpleSessionNpcs = (simpleNpcsData || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        tribe: 'NPC Simples',
        vocation: d.description || '',
        stats: d.stats || { pv: 10, current_pv: 10, ca: 10, faith: 0, current_faith: 0 },
        is_playable: false,
        is_visible: d.is_visible
      }));

      setPlayerCharacters(pChars);
      setNpcs([...sessionNpcs, ...simpleSessionNpcs] as any);
      setEnemies(sessionEnemies as any);
    } else {
      console.error('Error fetching session characters:', participantsError || simpleNpcsError);
    }
    
    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  useEffect(() => {
    if (!sessionId) return;

    return subscribeToTables(`session_characters_${sessionId}_${Math.random()}`, [
      { table: 'session_participants', filter: `session_id=eq.${sessionId}`, onChange: fetchCharacters },
      { table: 'character_items', onChange: fetchCharacters },
      { table: 'characters', event: 'UPDATE', onChange: fetchCharacters },
      { table: 'session_npcs', filter: `session_id=eq.${sessionId}`, onChange: fetchCharacters },
      {
        table: 'combats',
        event: 'UPDATE',
        filter: `session_id=eq.${sessionId}`,
        onChange: (payload) => {
          if (payload.new.status === 'finished') {
            fetchCharacters();
          }
        },
      },
    ]);
  }, [sessionId, fetchCharacters]);

  // Single local-state patcher for all three entity kinds. Players are stored as
  // { user_id, character } wrapper rows, so their patch merges one level deeper
  // (into .character); NPCs and enemies are stored as the entity itself.
  const updateLocal = useCallback((kind: 'player' | 'npc' | 'enemy', id: string, patch: Record<string, unknown>) => {
    if (kind === 'player') {
      setPlayerCharacters(prev => {
        const index = prev.findIndex(p => p.character?.id === id);
        if (index === -1) return prev;
        const next = [...prev];
        next[index] = { ...next[index], character: { ...next[index].character, ...patch } };
        return next;
      });
      return;
    }

    const setEntities = kind === 'npc' ? setNpcs : setEnemies;
    setEntities(prev => {
      const index = prev.findIndex(entity => entity.id === id);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  return {
    playerCharacters,
    npcs,
    enemies,
    isLoading,
    refresh: fetchCharacters,
    updateLocal,
  };
}
