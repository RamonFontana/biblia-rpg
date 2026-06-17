import React, { useState } from 'react';
import type { Character } from '@/features/character-management/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CharacterSheetView } from '../character/CharacterSheetView';
import { supabase } from '@/lib/supabase';

interface SessionNPC extends Character {
  is_playable?: boolean;
}

interface SessionNPCListProps {
  npcs: SessionNPC[];
  sessionId: string;
  onUpdateNPCStat?: (npcId: string, stats: any) => void;
}

export function SessionNPCList({ npcs, sessionId, onUpdateNPCStat }: SessionNPCListProps) {
  const [selectedNPC, setSelectedNPC] = useState<Character | null>(null);

  const handleNPCClick = (npc: SessionNPC) => {
    if (npc.is_playable) {
      setSelectedNPC(npc as Character);
    }
  };

  const closeSheet = () => setSelectedNPC(null);

  const updateNPCStat = async (npc: SessionNPC, statKey: 'current_pv' | 'current_faith', delta: number) => {
    if (!npc.stats) return;

    const baseKey = statKey === 'current_pv' ? 'pv' : 'faith';
    const maxValue = npc.stats[baseKey] || (statKey === 'current_pv' ? 10 : 100);
    const currentValue = npc.stats[statKey] ?? npc.stats[baseKey] ?? (statKey === 'current_pv' ? 10 : 0);

    let newValue = Math.max(0, currentValue + delta);
    if (newValue > maxValue) newValue = maxValue;

    const newStats = { ...npc.stats, [statKey]: newValue };

    // NPC death rule: 0 PV = Morto (only if we actually have PV to lose)
    if (statKey === 'current_pv') {
      if (newValue === 0 && maxValue > 0) {
        newStats.status = 'Morto';
      } else if (newValue > 0 && newStats.status === 'Morto') {
        newStats.status = 'Vivo';
      }
    }

    try {
      await supabase
        .from('characters')
        .update({ stats: newStats })
        .eq('id', npc.id);

      if (onUpdateNPCStat) {
        onUpdateNPCStat(npc.id, newStats);
      }
    } catch (e) {
      console.error('Erro ao atualizar status do NPC:', e);
    }
  };

  return (
    <>
      <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 shadow-md">
        <h3 className="text-xl font-bold text-stone-200 mb-4 border-b border-stone-600 pb-2 flex items-center gap-2">
          NPCs da Sessão ({npcs.length})
        </h3>
        {npcs.length === 0 ? (
          <p className="text-stone-400 text-sm">Nenhum NPC inserido nesta sessão.</p>
        ) : (
          <ul className="space-y-3">
            {npcs.map((npc) => (
              <li key={npc.id}>
                <div
                  className={`relative p-3 bg-stone-900 border border-stone-700 rounded-md transition-colors ${npc.is_playable ? 'cursor-pointer hover:bg-stone-700' : ''} ${npc.stats?.status === 'Morto' ? 'opacity-60 grayscale' : ''}`}
                  onClick={() => handleNPCClick(npc)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-stone-200">{npc.name}</p>
                    {npc.is_playable && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        Ficha Completa
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${npc.is_playable ? 'text-stone-400' : 'text-stone-500 line-clamp-2'}`}>
                    {npc.is_playable ? `${npc.tribe || 'Tribo Desconhecida'} • ${npc.vocation || 'Sem Vocação'}` : npc.vocation}
                  </p>
                  {npc.stats && (
                    <div className="flex gap-4 mt-2 pt-2 border-t border-stone-800/50 text-xs text-stone-400">
                      <div className="flex items-center gap-2 bg-stone-950 px-2 py-1 rounded">
                        <span className="text-red-400">♥</span>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); updateNPCStat(npc, 'current_pv', -1); }} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center">-</button>
                          <span className="w-8 text-center font-mono">
                            {npc.stats.current_pv ?? npc.stats.pv ?? 10}/{npc.stats.pv ?? 10}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); updateNPCStat(npc, 'current_pv', 1); }} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center">+</button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded">
                        <span className="text-blue-400">⛨</span>
                        <span className="font-mono">CA {npc.stats.ca ?? 10}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-stone-950 px-2 py-1 rounded">
                        <span className="text-amber-400">✨</span>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); updateNPCStat(npc, 'current_faith', -1); }} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center">-</button>
                          <span className="w-8 text-center font-mono">
                            {npc.stats.current_faith ?? npc.stats.faith ?? 0}/100
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); updateNPCStat(npc, 'current_faith', 1); }} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center">+</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {npc.stats?.status === 'Morto' && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-900/50 text-red-400 text-[10px] font-bold rounded uppercase border border-red-500/30">
                      Morto
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!selectedNPC} onOpenChange={(open: boolean) => !open && closeSheet()}>
        <DialogContent className="w-full sm:max-w-4xl bg-stone-950 border border-stone-800 p-0 text-stone-200 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="p-6 border-b border-stone-800 bg-stone-900">
            <DialogTitle className="text-stone-100">Ficha do NPC: {selectedNPC?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
            {selectedNPC && (
              <CharacterSheetView characterId={selectedNPC.id} sessionId={sessionId} isGM={true} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
