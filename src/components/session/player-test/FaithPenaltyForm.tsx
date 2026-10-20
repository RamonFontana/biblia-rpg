interface FaithPenaltyFormProps {
  value: number | '';
  onChange: (value: number | '') => void;
  isRolling: boolean;
  isSubmitting: boolean;
  error: string | null;
  onRoll: () => void;
  onSubmit: () => void;
}

/** A tela da punição: o d6 de Fé perdida depois de reprovar no Teste de Fé. */
export function FaithPenaltyForm({
  value,
  onChange,
  isRolling,
  isSubmitting,
  error,
  onRoll,
  onSubmit,
}: FaithPenaltyFormProps) {
  return (
    <>
      <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20 mb-4 text-center">
        <p className="text-red-400 font-medium mb-1">Teste de Fé Reprovado!</p>
        <p className="text-stone-300 text-sm">
          A sua fé vacilou perante o desafio. O personagem perderá <strong>1d6</strong> de Fé.
        </p>
      </div>

      <div>
        <label className="block text-center text-sm font-medium text-stone-300 mb-3">
          Role o d6 de punição pela falha de Fé:
        </label>
        <input
          type="number"
          min="1"
          max="6"
          autoFocus
          disabled={isRolling || isSubmitting}
          value={value}
          onChange={(e) => onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isRolling && !isSubmitting) {
              onSubmit();
            }
          }}
          className="w-full bg-stone-950 border-2 border-stone-700 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-red-500 text-center font-mono text-4xl placeholder-stone-700 transition-colors disabled:opacity-70"
          placeholder="0"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onRoll}
          disabled={isSubmitting || isRolling}
          className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>🎲</span> {isRolling ? 'Rolando...' : 'Rolar 1d6'}
        </button>

        <button
          onClick={onSubmit}
          disabled={isSubmitting || isRolling || value === ''}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] active:scale-[0.98]"
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar Punição'}
        </button>
      </div>
    </>
  );
}
