import { HeartCrack } from 'lucide-react';

interface DyingAlertProps {
  /** Quem está a 0 PV e ainda não morreu. */
  names: string[];
}

/** Aviso do Mestre, no topo do Palco, enquanto alguém está Morrendo. Some quando o PV sobe. */
export function DyingAlert({ names }: DyingAlertProps) {
  if (names.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-400"
    >
      <HeartCrack className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <strong>Morrendo:</strong> {names.join(', ')}.
      </p>
    </div>
  );
}
