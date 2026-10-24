import { Shield, Coins, Heart, Sparkles } from 'lucide-react';
import { describeConditionResistances } from '@/domain/armorResistance';
import { formatSiclos } from '@/domain/coins';
import { getCurrentFaith } from '@/domain/faith';
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import type { Character } from '@/features/character-management/types';

interface VitalsGridProps {
  stats: Character['stats'];
  coins: number | undefined;
  totalAc: number;
  baseAc: number;
  bonusAc: number;
  resistances: string[];
  conditionResistanceLevels: Record<string, number>;
}

/** PV, CA (com o bônus dos itens e o selo de Resistência), Fé e moedas. */
export function VitalsGrid({
  stats,
  coins,
  totalAc,
  baseAc,
  bonusAc,
  resistances,
  conditionResistanceLevels,
}: VitalsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
        <Heart className="w-8 h-8 text-red-500 mb-2" />
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-stone-100">{getCurrentPv(stats, 10)}</span>
          <span className="text-sm text-stone-500 font-medium">/{getMaxPv(stats, 10)}</span>
        </div>
        <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold mt-1">
          PV
        </span>
      </div>
      <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-stone-500/5 group-hover:bg-stone-500/10 transition-colors"></div>
        <Shield className="w-8 h-8 text-stone-400 mb-2" />
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-stone-100">{totalAc}</span>
          {bonusAc > 0 && (
            <span
              className="text-sm text-amber-500 font-medium"
              title={`Base ${baseAc} + Bônus ${bonusAc}`}
            >
              (+{bonusAc})
            </span>
          )}
        </div>
        <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold mt-1">
          CA
        </span>
        {resistances.length > 0 && (
          <div className="absolute bottom-1 w-full text-center">
            <span
              className="text-[9px] text-stone-300 bg-stone-700 px-1 rounded"
              title={[
                ...describeConditionResistances(conditionResistanceLevels),
                ...resistances.filter((r) => !(r in conditionResistanceLevels)),
              ].join(', ')}
            >
              Resistência
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-amber-900/50 rounded-xl shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
        <Sparkles className="w-8 h-8 text-amber-500 mb-2" />
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-amber-100">{getCurrentFaith(stats)}</span>
          <span className="text-sm text-amber-500/50 font-medium">/100</span>
        </div>
        <span className="text-xs text-amber-500/70 uppercase tracking-wider font-semibold mt-1">
          Fé
        </span>
      </div>
      <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-amber-900/50 rounded-xl shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
        <Coins className="w-8 h-8 text-amber-500 mb-2" />
        <span className="text-3xl font-bold text-amber-100">{formatSiclos(coins)}</span>
        <span className="text-xs text-amber-500/70 uppercase tracking-wider font-semibold mt-1">
          SP
        </span>
      </div>
    </div>
  );
}
