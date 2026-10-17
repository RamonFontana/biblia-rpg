import { useState } from 'react';
import type { Character } from '@/features/character-management/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CharacterSheetView } from '../character/CharacterSheetView';
import { supabase } from '@/lib/supabase';
import { CreateEnemyDialog } from './CreateEnemyDialog';
import { getCombatStats } from '@/lib/equipmentUtils';
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import { characterVitalsService } from '@/services/characterVitalsService';
import { CharacterAvatar } from '../ui/CharacterAvatar';

interface SessionEnemyListProps {
  sessionId: string;
  enemies: Character[];
  isLoading: boolean;
  updateLocalEnemy: (enemyId: string, updates: Partial<Character>) => void;
}

export function SessionEnemyList({
  sessionId,
  enemies,
  isLoading,
  updateLocalEnemy,
}: SessionEnemyListProps) {
  const [selectedEnemy, setSelectedEnemy] = useState<Character | null>(null);

  const handleEnemyClick = (enemy: Character) => {
    setSelectedEnemy(enemy);
  };

  const closeSheet = () => setSelectedEnemy(null);

  const updateEnemyStat = async (
    enemy: Character,
    statKey: 'current_pv' | 'current_faith',
    delta: number,
  ) => {
    if (!enemy.stats) return;

    if (statKey === 'current_pv') {
      try {
        const newStats = await characterVitalsService.adjustCurrentPvWithStatus(
          enemy.id,
          enemy.stats,
          delta,
        );
        updateLocalEnemy(enemy.id, { stats: newStats as any });
      } catch (e) {
        console.error('Erro ao atualizar status do inimigo:', e);
      }
      return;
    }

    const maxValue = enemy.stats.faith || 100;
    const currentValue = enemy.stats.current_faith ?? enemy.stats.faith ?? 0;

    let newValue = Math.max(0, currentValue + delta);
    if (newValue > maxValue) newValue = maxValue;

    const newStats = { ...enemy.stats, current_faith: newValue };

    try {
      await supabase.from('characters').update({ stats: newStats }).eq('id', enemy.id);

      updateLocalEnemy(enemy.id, { stats: newStats });
    } catch (e) {
      console.error('Erro ao atualizar status do inimigo:', e);
    }
  };

  return (
    <>
      <div className="bg-stone-800 p-3 md:p-4 rounded-lg border border-stone-700 shadow-md">
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
                  <div className="flex items-start gap-3">
                    <CharacterAvatar
                      imageUrl={enemy.narrative?.imageUrl}
                      name={enemy.name || 'Inimigo'}
                      className="w-10 h-10 border border-stone-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <p className="font-semibold text-stone-200 truncate">{enemy.name}</p>
                          {enemy.stats?.status === 'Morto' && (
                            <span className="shrink-0 px-2 py-0.5 bg-red-900/50 text-red-400 text-[10px] font-bold rounded uppercase border border-red-500/30">
                              Morto
                            </span>
                          )}
                        </div>
                      </div>
                      {enemy.vocation && (
                        <p className="text-sm text-stone-400 line-clamp-1">{enemy.vocation}</p>
                      )}
                    </div>
                  </div>
                  {enemy.stats && (
                    <div className="flex gap-4 mt-2 pt-2 border-t border-stone-800/50 text-xs text-stone-400">
                      <div className="flex items-center gap-2 bg-stone-950 px-2 py-1 rounded">
                        <span className="text-red-400">♥</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateEnemyStat(enemy, 'current_pv', -1);
                            }}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono">
                            {getCurrentPv(enemy.stats, 10)}/{getMaxPv(enemy.stats, 10)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateEnemyStat(enemy, 'current_pv', 1);
                            }}
                            className="w-5 h-5 bg-stone-800 hover:bg-stone-700 rounded flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-stone-950 px-2 py-1 rounded">
                        <span className="text-blue-400">⛨</span>
                        <span className="font-mono">CA {getCombatStats(enemy).totalAc}</span>
                      </div>
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
              <CharacterSheetView
                characterId={selectedEnemy.id}
                sessionId={sessionId}
                isGM={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
