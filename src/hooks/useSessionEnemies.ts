import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/features/character-management/types';

export function useSessionEnemies(sessionId: string | undefined) {
  const [enemies, setEnemies] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchEnemies = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('session_participants')
        .select(`
          characters (*, character_items(*, items(*)))
        `)
        .eq('session_id', sessionId);

      if (!error) {
        const allCharacters = (data || []).map((d: any) => d.characters).filter(Boolean);
        const sessionEnemies = allCharacters.filter((c: any) => c.is_enemy === true);
        
        setEnemies(sessionEnemies as any);
      } else {
        console.error('Error fetching session enemies:', error);
      }
      setIsLoading(false);
    };

    fetchEnemies();

    // Subscribe to session_participants and characters changes
    const channel = supabase
      .channel(`session_enemies_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchEnemies();
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
          fetchEnemies();
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
          setEnemies((prev) => {
            const updatedIndex = prev.findIndex(e => e.id === payload.new.id);
            // Also need to handle if a character became an enemy (is_enemy changed)
            // The simplest approach is to just refetch if we are unsure,
            // but we can just let fetchEnemies handle it if they were added to session_participants
            if (updatedIndex === -1) {
              if (payload.new.is_enemy) {
                 fetchEnemies();
              }
              return prev;
            }
            
            if (payload.new.is_enemy === false) {
              return prev.filter(e => e.id !== payload.new.id);
            }

            const newArray = [...prev];
            // Preserve character_items if not provided in the payload
            const oldEnemy = newArray[updatedIndex] as any;
            newArray[updatedIndex] = {
              ...oldEnemy,
              ...payload.new,
              character_items: (payload.new as any).character_items || oldEnemy.character_items
            } as Character;
            return newArray;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const updateLocalEnemy = (enemyId: string, newData: any) => {
    setEnemies((prev) => {
      const updatedIndex = prev.findIndex(e => e.id === enemyId);
      if (updatedIndex === -1) return prev;
      
      const newArray = [...prev];
      newArray[updatedIndex] = {
        ...newArray[updatedIndex],
        ...newData
      };
      return newArray;
    });
  };

  return { enemies, isLoading, updateLocalEnemy };
}
