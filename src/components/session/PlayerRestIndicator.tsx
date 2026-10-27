import { Coffee, Moon } from 'lucide-react';
import type { GameSession } from '@/data-access/sessions';
import { canTakeLongRest, canTakeShortRest } from '@/domain/rest';

interface PlayerRestIndicatorProps {
  sessionData: Pick<GameSession, 'short_rests_today' | 'current_day' | 'last_long_rest_day'> | null;
}

export function PlayerRestIndicator({ sessionData }: PlayerRestIndicatorProps) {
  if (!sessionData) return null;

  const shortRestsTaken = sessionData.short_rests_today || 0;
  const currentDay = sessionData.current_day || 1;
  const lastLongRestDay = sessionData.last_long_rest_day || 1;

  const canShortRest = canTakeShortRest(shortRestsTaken);
  const canLongRest = canTakeLongRest(currentDay, lastLongRestDay);

  if (!canShortRest && !canLongRest) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
      {canShortRest && (
        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 border bg-green-900/30 text-green-400 border-green-700/50 gap-2 px-3 py-1.5 shadow-sm">
          <Coffee className="w-4 h-4" />
          <span>Descanso Curto Disponível (Mestre)</span>
        </span>
      )}
      {canLongRest && (
        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 border bg-amber-900/30 text-amber-400 border-amber-700/50 gap-2 px-3 py-1.5 shadow-sm">
          <Moon className="w-4 h-4" />
          <span>Descanso Longo Disponível (Mestre)</span>
        </span>
      )}
    </div>
  );
}
