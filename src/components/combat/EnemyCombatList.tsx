import React, { useState } from 'react';
import { useCombatStore } from '../../store/combatStore';
import { useSessionEnemies } from '../../hooks/useSessionEnemies';
import { EnemyCard } from './EnemyCard';
import { EnemySheet } from './EnemySheet';
import type { Character } from '@/features/character-management/types';

interface EnemyCombatListProps {
  sessionId: string;
}

export function EnemyCombatList({ sessionId }: EnemyCombatListProps) {
  const { participants, activeCombat } = useCombatStore();
  const { enemies, isLoading } = useSessionEnemies(sessionId);
  
  const [selectedEnemy, setSelectedEnemy] = useState<Character | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!activeCombat || participants.length === 0) return null;

  // Filter participants that are enemies/npcs
  const enemyParticipants = participants.filter(p => p.entity_type === 'enemy' || p.entity_type === 'npc');

  if (enemyParticipants.length === 0) return null;

  const handleEnemyClick = (enemy: Character) => {
    setSelectedEnemy(enemy);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-stone-300 border-b border-stone-800 pb-2">Inimigos na Cena</h3>
      
      {isLoading ? (
        <div className="text-sm text-stone-500 animate-pulse">Carregando inimigos...</div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {enemyParticipants.map(participant => {
            const enemyData = enemies.find(e => e.id === participant.entity_id);
            
            if (!enemyData) return null; // Still loading or not found

            return (
              <EnemyCard 
                key={participant.id} 
                enemy={enemyData} 
                participant={participant} 
                onClick={() => handleEnemyClick(enemyData)} 
              />
            );
          })}
        </div>
      )}

      <EnemySheet 
        enemy={selectedEnemy} 
        participant={participants.find(p => p.entity_id === selectedEnemy?.id)}
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  );
}
