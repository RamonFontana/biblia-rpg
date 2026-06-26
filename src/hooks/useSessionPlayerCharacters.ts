import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useSessionPlayerCharacters(sessionId: string | undefined) {
  const [playerCharacters, setPlayerCharacters] = useState<any[]>([]);

  const fetchPlayers = useCallback(async () => {
    if (!sessionId) return;

    // 1. Get all participants for this session
    const { data: participants, error: pError } = await supabase
      .from('session_participants')
      .select('user_id, character_id')
      .eq('session_id', sessionId as string);

    if (pError || !participants) return;


    // 3. Fetch characters
    const charIds = participants.map(p => p.character_id).filter(Boolean);
    const { data: characters } = await supabase
      .from('characters')
      .select('*, character_items(*, items(*))')
      .in('id', charIds);

    const combined = participants.map(p => {
      const character = characters?.find(c => c.id === p.character_id) || null;
      return { user_id: p.user_id, character, profile: null };
    }).filter(item => item.character); // Only include those with characters

    setPlayerCharacters(combined);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    fetchPlayers();

    // Subscribe to session_participants and characters
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`session_players_realtime_${sessionId}_${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_items',
        },
        () => {
          fetchPlayers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
        },
        (payload) => {
          // If the updated character is one of our session characters, update its stats locally
          setPlayerCharacters((prev) => {
            const updatedIndex = prev.findIndex(p => p.character?.id === payload.new.id);
            if (updatedIndex === -1) return prev;
            
            const newArray = [...prev];
            const oldCharacter = newArray[updatedIndex].character as any;
            newArray[updatedIndex] = {
              ...newArray[updatedIndex],
              character: {
                ...oldCharacter,
                ...payload.new,
                character_items: (payload.new as any).character_items || oldCharacter.character_items
              }
            };
            return newArray;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'combats',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.status === 'finished') {
            fetchPlayers();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchPlayers]);

  const updateLocalPlayerCharacter = (characterId: string, updatedStats: any) => {
    setPlayerCharacters(prev => {
      const updatedIndex = prev.findIndex(p => p.character?.id === characterId);
      if (updatedIndex === -1) return prev;
      
      const newArray = [...prev];
      newArray[updatedIndex] = {
        ...newArray[updatedIndex],
        character: {
          ...newArray[updatedIndex].character,
          stats: updatedStats
        }
      };
      return newArray;
    });
  };

  return { playerCharacters, updateLocalPlayerCharacter, refresh: fetchPlayers };
}
