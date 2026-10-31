// Um raio de luz em metros, de 0 a 120. Digita-se à vontade; ao sair do campo o valor é prendido ao
// intervalo e só então avisa quem chamou (uma gravação por ajuste).
import { useState } from 'react';

export const MAX_LIGHT_RADIUS_M = 120;

interface RadiusFieldProps {
  label: string;
  value: number;
  onCommit: (meters: number) => void;
}

export function RadiusField({ label, value, onCommit }: RadiusFieldProps) {
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const typed = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(typed)) {
      setDraft(String(value));
      return;
    }
    const meters = Math.min(MAX_LIGHT_RADIUS_M, Math.max(0, typed));
    setDraft(String(meters));
    if (meters !== value) onCommit(meters);
  };

  return (
    <label className="flex items-center gap-1 text-xs text-stone-300">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={MAX_LIGHT_RADIUS_M}
        step={1.5}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="h-9 w-20 rounded-md border border-stone-700 bg-stone-800 px-2 text-sm text-stone-100"
      />
    </label>
  );
}
