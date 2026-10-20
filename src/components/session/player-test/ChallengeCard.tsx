import type { SessionTest } from '@/data-access/sessionTests';

/** O pedido do Mestre: o tipo do Teste e a dificuldade (ou Misericórdia/Punição, na Fé). */
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
