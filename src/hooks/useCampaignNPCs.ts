import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/features/character-management/types';

export function useCampaignNPCs() {
  const [npcs, setNpcs] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNPCs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('is_npc' as any, true)
        .order('name');

      if (!error && data) {
        setNpcs(data as any as Character[]);
      } else if (error) {
        console.error('Error fetching campaign NPCs:', error);
      }
      setIsLoading(false);
    };

    fetchNPCs();
  }, []);

  return { npcs, isLoading };
}
