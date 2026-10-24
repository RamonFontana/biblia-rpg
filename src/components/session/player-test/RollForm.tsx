import type { CharacterTestContext } from '@/data-access/characters';
import type { SessionTest } from '@/data-access/sessionTests';
import { getTestModifiers } from '@/features/character-management/utils/characterMath';
import { BonusBreakdown } from './BonusBreakdown';

interface RollFormProps {
  test: SessionTest;
  sheet: CharacterTestContext | null;
  hasStealthDisadvantage: boolean;
  faithPenalty: number;
  value: number | '';
  onChange: (value: number | '') => void;
  isRolling: boolean;
  isSubmitting: boolean;
  error: string | null;
  onRoll: () => void;
  onSubmit: () => void;
}

/** O formulário do Teste: avisos, o dado digitado (ou rolado) e o botão de enviar. */
export function RollForm({
  test,
  sheet,
  hasStealthDisadvantage,
  faithPenalty,
  value: resultValue,
  onChange,
  isRolling,
  isSubmitting,
  error,
  onRoll,
  onSubmit,
}: RollFormProps) {
  return (
    <>
      {hasStealthDisadvantage && test.test_type === 'Destreza' && (
        <div className="bg-red-900/30 border border-red-500/50 p-2 rounded mb-4 text-center">
          <p className="text-red-400 text-sm font-bold">⚠️ Desvantagem</p>
          <p className="text-stone-300 text-xs">
            Sua armadura pesada prejudica seus reflexos e furtividade. Role 2 dados e escolha o
            pior!
          </p>
        </div>
      )}

      {test.test_type === 'Fé' && faithPenalty < 0 && (
        <div className="bg-amber-900/30 border border-amber-500/50 p-2 rounded mb-4 text-center">
          <p className="text-amber-400 text-sm font-bold">⚠️ Profanação</p>
          <p className="text-stone-300 text-xs">
            A presença de um item profano no seu inventário reduziu sua Fé em{' '}
            {Math.abs(faithPenalty)} para este teste.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center">
        <label className="block text-center text-sm font-medium text-stone-300 mb-1">
          Qual foi o valor tirado no dado?
        </label>
        {test.test_type !== 'Fé' && (
          <p className="text-center text-xs text-stone-500 mb-3">
            Seus bônus serão aplicados automaticamente.
          </p>
        )}

        <input
          type="number"
          min="1"
          max={test.test_type === 'Fé' ? 100 : 20}
          autoFocus
          disabled={isRolling || isSubmitting}
          value={resultValue}
          onChange={(e) => onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isRolling && !isSubmitting && resultValue !== '') {
              onSubmit();
            }
          }}
          className="w-full bg-stone-950 border-2 border-stone-700 rounded-lg px-4 py-4 text-stone-100 focus:outline-none focus:border-amber-500 text-center font-mono text-4xl placeholder-stone-700 transition-colors disabled:opacity-70 mb-2"
          placeholder="0"
        />

        {resultValue !== '' && !isRolling && test.test_type !== 'Fé' && (
          <BonusBreakdown
            roll={Number(resultValue)}
            modifiers={getTestModifiers(test.test_type, sheet)}
          />
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded mt-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRoll}
          disabled={isSubmitting || isRolling}
          className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-100 rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>🎲</span>{' '}
          {isRolling ? 'Rolando...' : test.test_type === 'Fé' ? 'Rolar D100' : 'Rolar D20'}
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || isRolling || resultValue === ''}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-100 rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.5)] active:scale-[0.98]"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Valor'}
        </button>
      </div>
    </>
  );
}
