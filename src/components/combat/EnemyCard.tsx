import { Card, CardContent } from '../ui/card';
import { CharacterAvatar } from '../ui/CharacterAvatar';
import { Shield, Heart } from 'lucide-react';
import type { Character } from '@/features/character-management/types';

interface EnemyCardProps {
  enemy: Character;
  participant?: any;
  onClick?: () => void;
}

export function EnemyCard({ enemy, participant, onClick }: EnemyCardProps) {
  const hpCurrent = participant?.hp_current ?? enemy.stats?.current_pv ?? 0;
  const hpMax = enemy.stats?.pv ?? 0;
  const ca = enemy.stats?.ca ?? 10;
  const isDead = hpCurrent <= 0;

  return (
    <Card 
      className={`cursor-pointer transition-colors hover:border-primary bg-stone-900 border-stone-800 ${isDead ? 'opacity-50 grayscale' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <CharacterAvatar 
          imageUrl={enemy.narrative?.imageUrl} 
          name={enemy.name || 'Inimigo'} 
          className={`w-12 h-12 border border-red-900/50 ${isDead ? 'grayscale opacity-60' : ''}`} 
        />
        <div className="flex-1 overflow-hidden">
          <h3 className="font-bold text-stone-200 truncate">{enemy.name}</h3>
          <p className="text-xs text-stone-400 truncate">{enemy.vocation || 'Inimigo'}</p>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-red-400">
              <Heart size={14} />
              <span>{hpCurrent}</span>
            </div>
            <span className="text-[10px] text-stone-500">/{hpMax}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-blue-400">
              <Shield size={14} />
              <span>{ca}</span>
            </div>
            <span className="text-[10px] text-stone-500">CA</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
