import { useState } from 'react';
import type { Character } from '@/features/character-management/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CharacterSheetView } from '../character/CharacterSheetView';
import { supabase } from '@/lib/supabase';
import { useSessionEnemies } from '@/hooks/useSessionEnemies';
import { CreateEnemyDialog } from './CreateEnemyDialog';

interface SessionEnemyListProps {
  sessionId: string;
}

export function SessionEnemyList({ sessionId }: SessionEnemyListProps) {
  const { enemies, isLoading, updateLocalEnemy } = useSessionEnemies(sessionId);
  const [selectedEnemy, setSelectedEnemy] = useState<Character | null>(null);

  const handleEnemyClick = (enemy: Character) => {
    setSelectedEnemy(enemy);
  };

  const closeSheet = () => setSelectedEnemy(null);

  const updateEnemyStat = async (enemy: Character, statKey: 'current_pv' | 'current_faith', delta: number) => {
    if (!enemy.stats) return;

    const baseKey = statKey === 'current_pv' ? 'pv' : 'faith';
    const maxValue = enemy.stats[baseKey] || (statKey === 'current_pv' ? 10 : 100);
    const currentValue = enemy.stats[statKey] ?? enemy.stats[baseKey] ?? (statKey === 'current_pv' ? 10 : 0);

    let newValue = Math.max(0, currentValue + delta);
    if (newValue > maxValue) newValue = maxValue;

    const newStats = { ...enemy.stats, [statKey]: newValue };

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
        .eq('id', enemy.id);

      updateLocalEnemy(enemy.id, { stats: newStats });
    } catch (e) {
      console.error('Erro ao atualizar status do inimigo:', e);
    }
  };

  return (
    <>
      <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 shadow-md">
        <div className="flex justify-between items-center mb-4 border-b border-stone-600 pb-2">
          <h3 className="text-xl font-bold text-stone-200 flex items-center gap-2">
            Inimigos ({enemies.length})
          </h3>
          <CreateEnemyDialog sessionId={sessionId} />
        </div>

        {isLoading ? (
          <p className="text-stone-400 text-sm">Carregando inimigos...</p>
        ) : enemies.length === 0 ? (
          <p className="text-stone-400 text-sm">Nenhum inimigo nesta sessão.</p>
        ) : (
          <ul className="space-y-3">
            {enemies.map((enemy) => (
              <li key={enemy.id}>
                <div
                  className={`relative p-3 bg-stone-900 border border-stone-700 rounded-md transition-colors cursor-pointer hover:bg-stone-700 ${enemy.stats?.status === 'Morto' ? 'opacity-60 grayscale' : ''}`}
                  onClick={() => handleEnemyClick(enemy)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-stone-200">{enemy.name}</p>
                    </div>
                  </div>
                  {enemy.vocation && (
                    <p className="text-sm text-stone-400 line-clamp-1">{enemy.vocation}</p>
                  )}
                  {enemy.stats && (
                    <div className="flex gap-4 mt-2 pt-2 border-t border-stone-800/50 text-xs text-stone-400">
                      <div className="flex items-center gap-2 bg-stone-950 px-2 py-1 rounded">
                        <span className="text-red-400">♥</span>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); updateEnemyStat(enemy, 'current_pv', -1); }} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center">-</button>
                          <span className="w-8 text-center font-mono">
                            {enemy.stats.current_pv ?? enemy.stats.pv ?? 10}/{enemy.stats.pv ?? 10}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); updateEnemyStat(enemy, 'current_pv', 1); }} className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center">+</button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded">
                        <span className="text-blue-400">⛨</span>
                        <span className="font-mono">CA {enemy.stats.ca ?? 10}</span>
                      </div>
                    </div>
                  )}
                  {enemy.stats?.status === 'Morto' && (
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

      <Dialog open={!!selectedEnemy} onOpenChange={(open: boolean) => !open && closeSheet()}>
        <DialogContent className="w-full sm:max-w-4xl bg-stone-950 border border-stone-800 p-0 text-stone-200 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="p-6 border-b border-stone-800 bg-stone-900">
            <DialogTitle className="text-stone-100">Inimigo: {selectedEnemy?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
            {selectedEnemy && (
              <CharacterSheetView characterId={selectedEnemy.id} sessionId={sessionId} isGM={true} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
