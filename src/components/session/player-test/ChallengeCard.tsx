import type { SessionTest } from '@/data-access/sessionTests';
import { FAITH_USE_LABELS } from '@/domain/sessionTests';

/**
 * O pedido do Mestre: o tipo do Teste e a dificuldade (ou Misericórdia/Punição, na Fé, com o uso e
 * a marca de Pedido Egoísta).
 */
export function ChallengeCard({ test }: { test: SessionTest }) {
  return (
    <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 text-center relative">
      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-stone-900 px-2 text-xs font-bold text-stone-500 uppercase tracking-widest">
        Desafio
      </span>
      <div className="grid grid-cols-2 gap-4 divide-x divide-stone-700">
        <div>
          <p className="text-xs text-stone-400 mb-1 uppercase">Teste de</p>
          <p className="font-bold text-amber-400 text-lg">{test.test_type}</p>
          {test.faith_use && (
            <p className="mt-1 text-sm text-stone-300">{FAITH_USE_LABELS[test.faith_use]}</p>
          )}
          {test.selfish_request && (
            <p className="mt-1 inline-block rounded-full border border-red-700/50 bg-red-900/30 px-2 py-0.5 text-xs text-red-400">
              Pedido Egoísta
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-stone-400 mb-1 uppercase">
            {test.test_type === 'Fé'
              ? test.difficulty < 0
                ? 'Punição'
                : 'Misericórdia'
              : 'Dificuldade'}
          </p>
          <p className="font-bold text-red-500 text-2xl leading-none">
            {Math.abs(test.difficulty)}
          </p>
        </div>
      </div>
    </div>
  );
}
