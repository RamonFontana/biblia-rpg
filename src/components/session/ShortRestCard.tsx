import { useState } from 'react';
import { Coffee, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { closeShortRest, openShortRest } from '@/data-access/sessions';
import {
  getShortRestState,
  shortRestBlockMessage,
  type ShortRestSession,
} from '@/domain/shortRest';

interface ShortRestCardProps {
  role: 'master' | 'player';
  sessionId: string;
  session: ShortRestSession;
  hasActiveCombat: boolean;
}

/**
 * O cartão "Descanso Curto", igual nas duas telas (ADR 0006): quantos restam no dia, por que não
 * dá para abrir, quem abriu o descanso. Só o Mestre abre e encerra.
 */
export function ShortRestCard({ role, sessionId, session, hasActiveCombat }: ShortRestCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = getShortRestState(session, hasActiveCombat);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      console.error(failure, e);
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  const restsText = `${state.restsLeft} ${state.restsLeft === 1 ? 'restante' : 'restantes'} hoje`;

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4 shadow-sm w-full max-w-md">
      <h3 className="text-lg font-semibold text-stone-200 mb-2 flex items-center gap-2">
        <Coffee className="w-4 h-4 text-green-500" aria-hidden />
        Descanso Curto
      </h3>
      <p className="text-sm text-stone-400">{restsText}</p>

      {state.isOpen ? (
        <p className="text-sm font-semibold text-green-400 mt-2">
          {state.openedBy === 'group' ? 'Aberto a pedido do grupo' : 'Aberto pelo Mestre'}
        </p>
      ) : (
        <>
          {state.block && (
            <p className="text-sm text-amber-400 mt-2">{shortRestBlockMessage(state.block)}</p>
          )}
          {role === 'player' && !state.block && (
            <p className="text-sm text-stone-400 mt-2">Aguardando o Mestre abrir o descanso.</p>
          )}
        </>
      )}

      {role === 'master' && (
        <div className="mt-3">
          {state.isOpen ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(() => closeShortRest(sessionId), 'Não foi possível encerrar o descanso.')
              }
              className="bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700"
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Encerrar descanso
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={busy || state.block !== null}
              onClick={() =>
                run(() => openShortRest(sessionId), 'Não foi possível abrir o descanso.')
              }
              className="bg-green-900/20 text-green-500 border-green-800 hover:bg-green-900/40 hover:text-green-400"
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Abrir Descanso Curto
            </Button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-400 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
