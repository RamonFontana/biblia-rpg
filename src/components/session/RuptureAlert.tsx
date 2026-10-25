import { AlertTriangle } from 'lucide-react';
import type { SessionPlayer } from '@/data-access/sessions';
import { getFaithState } from '@/domain/faith';

interface RuptureAlertProps {
  players: SessionPlayer[];
}

/** Aviso fixo do Mestre enquanto algum jogador está em Ruptura (Fé 0). Some quando a Fé sobe. */
export function RuptureAlert({ players }: RuptureAlertProps) {
  const names = players
    .filter((p) => getFaithState(p.character.stats).id === 'ruptura')
    .map((p) => p.character.name);
  if (names.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-400"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <strong>Ruptura:</strong> {names.join(', ')}. O personagem sucumbe a menos que o grupo faça
        um ato de consagração e jejum liderado por um Sacerdote, até o nascer do sol.
      </p>
    </div>
  );
}
