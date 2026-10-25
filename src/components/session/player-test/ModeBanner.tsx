import type { TestMode, ResolvedTestMode } from '@/domain/testMode';
import { physicalDieReminder } from '@/domain/testMode';

interface ModeBannerProps {
  testType: string;
  resolved: ResolvedTestMode;
}

const BOX: Record<Exclude<TestMode, 'normal'>, string> = {
  vantagem: 'border-green-700/50 bg-green-900/30',
  desvantagem: 'border-red-500/50 bg-red-900/30',
};
const TITLE: Record<Exclude<TestMode, 'normal'>, string> = {
  vantagem: 'text-green-400',
  desvantagem: 'text-red-400',
};

/** Diz ao jogador se rola com Vantagem, Desvantagem ou normal, por quê, e qual dado usar. */
export function ModeBanner({ testType, resolved }: ModeBannerProps) {
  const { mode, advantages, disadvantages } = resolved;

  if (mode === 'normal') {
    if (advantages.length === 0 || disadvantages.length === 0) return null;
    return (
      <div className="mb-4 rounded border border-stone-600 bg-stone-800 p-2 text-center">
        <p className="text-sm text-stone-300">Vantagem e Desvantagem se anulam. Role um dado só.</p>
        <p className="text-xs text-stone-400">
          Vantagem: {advantages.join(', ')}. Desvantagem: {disadvantages.join(', ')}.
        </p>
      </div>
    );
  }

  const reasons = mode === 'vantagem' ? advantages : disadvantages;
  return (
    <div className={`mb-4 rounded border p-2 text-center ${BOX[mode]}`}>
      <p className={`text-sm font-bold ${TITLE[mode]}`}>
        {mode === 'vantagem' ? '✨ Vantagem' : '⚠️ Desvantagem'}
      </p>
      <p className="text-xs text-stone-300">{`Motivo: ${reasons.join(', ')}`}</p>
      <p className="text-xs text-stone-300">{physicalDieReminder(testType, mode)}</p>
    </div>
  );
}
