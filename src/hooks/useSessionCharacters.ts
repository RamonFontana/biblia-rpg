import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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

    const channel = supabase
      .channel(`session_characters_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sessionId}` }, fetchCharacters)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_items' }, fetchCharacters)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters' }, fetchCharacters)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_npcs', filter: `session_id=eq.${sessionId}` }, fetchCharacters)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'combats', filter: `session_id=eq.${sessionId}` }, (payload) => {
         if (payload.new.status === 'finished') {
           fetchCharacters();
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchCharacters]);

  const updateLocalPlayerData = useCallback((characterId: string, newData: any) => {
    setPlayerCharacters(prev => {
      const updatedIndex = prev.findIndex(p => p.character?.id === characterId);
      if (updatedIndex === -1) return prev;
      const newArray = [...prev];
      newArray[updatedIndex] = { ...newArray[updatedIndex], character: { ...newArray[updatedIndex].character, ...newData } };
      return newArray;
    });
  }, []);

  const updateLocalPlayerCharacter = useCallback((characterId: string, updatedStats: any) => {
    updateLocalPlayerData(characterId, { stats: updatedStats });
  }, [updateLocalPlayerData]);

  const updateLocalNPCData = useCallback((npcId: string, newData: any) => {
    setNpcs(prev => {
      const updatedIndex = prev.findIndex(npc => npc.id === npcId);
      if (updatedIndex === -1) return prev;
      const newArray = [...prev];
      newArray[updatedIndex] = { ...newArray[updatedIndex], ...newData };
      return newArray;
    });
  }, []);

  const updateLocalNPC = useCallback((npcId: string, updatedStats: any) => {
    updateLocalNPCData(npcId, { stats: updatedStats });
  }, [updateLocalNPCData]);

  const updateLocalEnemy = useCallback((enemyId: string, newData: any) => {
    setEnemies(prev => {
      const updatedIndex = prev.findIndex(e => e.id === enemyId);
      if (updatedIndex === -1) return prev;
      const newArray = [...prev];
      newArray[updatedIndex] = { ...newArray[updatedIndex], ...newData };
      return newArray;
    });
  }, []);

  return {
    playerCharacters,
    npcs,
    enemies,
    isLoading,
    refresh: fetchCharacters,
    updateLocalPlayerData,
    updateLocalPlayerCharacter,
    updateLocalNPCData,
    updateLocalNPC,
    updateLocalEnemy
  };
}
