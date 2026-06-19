import { useEffect, useState } from 'react';

import { Button } from '../ui/button';
import { useDeathSaves } from '../../hooks/useDeathSaves';
import { supabase } from '@/lib/supabase';

interface MasterDeathControlsProps {
  characterId: string;
  participantId?: string;
}

export function MasterDeathControls({ characterId, participantId }: MasterDeathControlsProps) {
  const { addSuccess, addFailure, healAndAwake, killInstant } = useDeathSaves();
  const [characterState, setCharacterState] = useState<any>(null);

  useEffect(() => {
    const fetchChar = async () => {
      const { data } = await supabase.from('characters').select('id, death_saves_successes, death_saves_failures, is_stable, is_dead').eq('id', characterId).single();
      if (data) setCharacterState(data);
    };
    fetchChar();

    const channel = supabase.channel(`char_death_${characterId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` }, (payload) => {
        setCharacterState(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  if (!characterState) return null;

  return (
    <div className="mt-4 p-4 border border-orange-500/30 rounded-md bg-orange-500/5">
      <h4 className="font-semibold text-orange-500 mb-2">Controles de Morte (Mestre)</h4>
      
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col text-sm">
          <span className="text-green-500">Sucessos: {characterState.death_saves_successes || 0}</span>
          <span className="text-destructive">Falhas: {characterState.death_saves_failures || 0}</span>
        </div>
        <div className="flex flex-col text-sm">
          <span>Estável: {characterState.is_stable ? 'Sim' : 'Não'}</span>
          <span>Morto: {characterState.is_dead ? 'Sim' : 'Não'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
          onClick={() => addSuccess(characterId, characterState.death_saves_successes || 0)}
          disabled={characterState.is_stable || characterState.is_dead}
        >
          +1 Sucesso
        </Button>
        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white"
          onClick={() => addFailure(characterId, characterState.death_saves_failures || 0)}
          disabled={characterState.is_dead}
        >
          +1 Falha
        </Button>
        <Button size="sm" variant="secondary" 
          onClick={() => healAndAwake(characterId, participantId, 1)}
          disabled={characterState.is_dead}
        >
          Levantar (+1 PV)
        </Button>
        <Button size="sm" variant="destructive"
          onClick={() => killInstant(characterId)}
          disabled={characterState.is_dead}
        >
          Morte Instantânea
        </Button>
      </div>
    </div>
  );
}
