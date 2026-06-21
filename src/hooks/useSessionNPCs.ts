import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/features/character-management/types';

export function useSessionNPCs(sessionId: string | undefined) {
  const [npcs, setNpcs] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchNPCs = async () => {
      setIsLoading(true);
      const { data: playableData, error: playableError } = await supabase
        .from('session_participants')
        .select(`
          characters (*, character_items(*, items(*)))
        `)
        .eq('session_id', sessionId);

      const { data: simpleData, error: simpleError } = await supabase
        .from('session_npcs')
        .select('*')
        .eq('session_id', sessionId);

      if (!playableError && !simpleError) {
        // Characters are returned inside the join. We need to filter for NPCs.
        const allCharacters = (playableData || []).map((d: any) => d.characters).filter(Boolean);
        const sessionNpcs = allCharacters.filter((c: any) => c.is_npc === true).map((c: any) => ({ ...c, is_playable: true }));
        
        const simpleSessionNpcs = (simpleData || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          tribe: 'NPC Simples',
          vocation: d.description || '',
          stats: d.stats || { pv: 10, current_pv: 10, ca: 10, faith: 0, current_faith: 0 },
          is_playable: false,
          is_visible: d.is_visible
        }));

        setNpcs([...sessionNpcs, ...simpleSessionNpcs] as any);
      } else {
        console.error('Error fetching session NPCs:', playableError || simpleError);
      }
      setIsLoading(false);
    };

    fetchNPCs();

    // Subscribe to session_participants changes for this session
    const channel = supabase
      .channel(`session_participants_npcs_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Refetch NPCs on any participant change
          fetchNPCs();
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
          setNpcs((prev) => {
            const updatedIndex = prev.findIndex(npc => npc.id === payload.new.id);
            if (updatedIndex === -1) return prev;
            
            const newArray = [...prev];
            const oldNpc = newArray[updatedIndex] as any;
            newArray[updatedIndex] = {
              ...oldNpc,
              ...payload.new,
              character_items: (payload.new as any).character_items || oldNpc.character_items
            } as Character;
            return newArray;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_npcs',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchNPCs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const updateLocalNPCData = (npcId: string, newData: any) => {
    setNpcs((prev) => {
      const updatedIndex = prev.findIndex(npc => npc.id === npcId);
      if (updatedIndex === -1) return prev;
      
      const newArray = [...prev];
      newArray[updatedIndex] = {
        ...newArray[updatedIndex],
        ...newData
      };
      return newArray;
    });
  };

  const updateLocalNPC = (npcId: string, updatedStats: any) => {
    updateLocalNPCData(npcId, { stats: updatedStats });
  };

  return { npcs, isLoading, updateLocalNPC, updateLocalNPCData };
}
