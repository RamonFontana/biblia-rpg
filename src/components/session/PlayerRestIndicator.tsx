import { Moon } from 'lucide-react';
import type { GameSession } from '@/data-access/sessions';
import { canTakeLongRest } from '@/domain/rest';

interface PlayerRestIndicatorProps {
  sessionData: Pick<GameSession, 'current_day' | 'last_long_rest_day'> | null;
}

/** O aviso de Descanso Longo; o Descanso Curto é o cartão `ShortRestCard`. */
export function PlayerRestIndicator({ sessionData }: PlayerRestIndicatorProps) {
  if (!sessionData) return null;

  const currentDay = sessionData.current_day || 1;
  const lastLongRestDay = sessionData.last_long_rest_day || 1;

  if (!canTakeLongRest(currentDay, lastLongRestDay)) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 border bg-amber-900/30 text-amber-400 border-amber-700/50 gap-2 px-3 py-1.5 shadow-sm">
        <Moon className="w-4 h-4" />
        <span>Descanso Longo Disponível (Mestre)</span>
      </span>
    </div>
  );
}
