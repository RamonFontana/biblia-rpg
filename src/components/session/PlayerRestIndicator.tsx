import { Coffee, Moon } from "lucide-react";

interface PlayerRestIndicatorProps {
  sessionData: any;
  character?: any;
}

export function PlayerRestIndicator({ sessionData, character }: PlayerRestIndicatorProps) {
  if (!sessionData) return null;

  const shortRestsTaken = sessionData.short_rests_today || 0;
  const currentDay = sessionData.current_day || 1;
  const lastLongRestDay = sessionData.last_long_rest_day || 1;

  const canShortRest = shortRestsTaken < 2;
  const canLongRest = (currentDay - lastLongRestDay) >= 2;

  if (!canShortRest && !canLongRest) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
      {canShortRest && (
        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 border bg-emerald-900/30 text-emerald-400 border-emerald-700/50 gap-2 px-3 py-1.5 shadow-sm">
          <Coffee className="w-4 h-4" /> 
          <span>Descanso Curto Disponível (Mestre)</span>
        </span>
      )}
      {canLongRest && (
        <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 border bg-indigo-900/30 text-indigo-400 border-indigo-700/50 gap-2 px-3 py-1.5 shadow-sm">
          <Moon className="w-4 h-4" /> 
          <span>Descanso Longo Disponível (Mestre)</span>
        </span>
      )}
    </div>
  );
}
