import { useState, useEffect } from 'react';
import { listCampaignNpcs } from '@/data-access/characters';
import type { Character } from '@/features/character-management/types';

export function useCampaignNPCs() {
  const [npcs, setNpcs] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNPCs = async () => {
      setIsLoading(true);
      try {
        setNpcs(await listCampaignNpcs());
      } catch (error) {
        console.error('Error fetching campaign NPCs:', error);
      }
      setIsLoading(false);
    };

    fetchNPCs();
  }, []);

  return { npcs, isLoading };
}
