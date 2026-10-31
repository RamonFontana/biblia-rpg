import { useState } from 'react';
import { Coffee, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BalmSpender } from './BalmSpender';
import { hasBalm } from '@/domain/balm';
import { HitDiceSpender, type SpenderCharacter } from './HitDiceSpender';
import {
  closeShortRest,
  finishShortRest,
  openShortRest,
  refuseShortRestRequests,
  requestShortRest,
  withdrawShortRestRequest,
} from '@/data-access/sessions';
import {
  finishedSummaryText,
  getRestRoster,
  getShortRestState,
  requestSummaryText,
  shortRestBlockMessage,
  type RestPlayer,
  type ShortRestSession,
} from '@/domain/shortRest';

interface ShortRestCardProps {
  role: 'master' | 'player';
  sessionId: string;
  session: ShortRestSession;
  hasActiveCombat: boolean;
  /** Os jogadores da sessão (o personagem de cada um): quem conta no "todos" do pedido. */
  players?: RestPlayer[];
  /** O personagem do jogador que vê o cartão; sem ele, o jogador só acompanha. */
  myCharacterId?: string;
  /** Quem gasta Dados de Vida neste cartão: o jogador, o próprio personagem; o Mestre, os NPCs jogáveis. */
  spenders?: SpenderCharacter[];
  /** Avisa a tela do que mudou na ficha de quem gastou um dado. */
  onSpent?: (characterId: string, patch: Record<string, unknown>) => void;
}

/**
 * O cartão "Descanso Curto", igual nas duas telas (ADR 0006): quantos restam no dia, por que não
 * dá para abrir, quem pediu, quem abriu o descanso e quem já terminou. O Mestre abre, recusa o
 * pedido e encerra; o jogador pede, retira o pedido e marca "Terminei".
 */
export function ShortRestCard({
  role,
  sessionId,
  session,
  hasActiveCombat,
  players = [],
  myCharacterId,
  spenders = [],
  onSpent,
}: ShortRestCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = getShortRestState(session, hasActiveCombat);
  const roster = getRestRoster(
    players,
    session.short_rest_requested ?? [],
    session.short_rest_finished ?? [],
  );
  // Só o jogador de um personagem vivo da sessão pede e termina.
  const me = players.find((p) => p.id === myCharacterId && !p.is_dead);
  const iRequested = !!me && roster.requested.some((p) => p.id === me.id);
  const iFinished = !!me && roster.finished.some((p) => p.id === me.id);

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
        <>
          <p className="text-sm font-semibold text-green-400 mt-2">
            {state.openedBy === 'group' ? 'Aberto a pedido do grupo' : 'Aberto pelo Mestre'}
          </p>
          {roster.total > 0 && (
            <p className="text-sm text-stone-400 mt-1">{finishedSummaryText(roster)}</p>
          )}
        </>
      ) : (
        <>
          {state.block && (
            <p className="text-sm text-amber-400 mt-2">{shortRestBlockMessage(state.block)}</p>
          )}
          {roster.total > 0 && (!state.block || roster.requested.length > 0) && (
            <p className="text-sm text-stone-400 mt-2">{requestSummaryText(roster)}</p>
          )}
          {role === 'player' && state.refused && (
            <p className="text-sm text-amber-400 mt-2">O Mestre recusou o pedido de descanso.</p>
          )}
          {role === 'player' && !state.block && !myCharacterId && (
            <p className="text-sm text-stone-400 mt-2">Aguardando o Mestre abrir o descanso.</p>
          )}
        </>
      )}

      {state.isOpen && spenders.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {spenders.map((character) => (
            <div key={character.id} className="flex flex-col gap-2">
              <HitDiceSpender
                character={character}
                restOpen
                showName={role === 'master'}
                onSpent={(id, patch) => onSpent?.(id, patch)}
              />
              {(role === 'player' || hasBalm(character.character_items)) && (
                <BalmSpender
                  character={character}
                  restOpen
                  onSpent={(id, patch) => onSpent?.(id, patch)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {role === 'player' && me && (
        <div className="mt-3">
          {state.isOpen ? (
            iFinished ? (
              <p className="text-sm text-stone-400">Você terminou.</p>
            ) : (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  run(() => finishShortRest(sessionId, me.id), 'Não foi possível marcar o fim.')
                }
                className="bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700"
              >
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Terminei
              </Button>
            )
          ) : (
            !state.block && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  iRequested
                    ? run(
                        () => withdrawShortRestRequest(sessionId, me.id),
                        'Não foi possível retirar o pedido.',
                      )
                    : run(
                        () => requestShortRest(sessionId, me.id),
                        'Não foi possível pedir o descanso.',
                      )
                }
                className="bg-green-900/20 text-green-500 border-green-800 hover:bg-green-900/40 hover:text-green-400"
              >
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {iRequested ? 'Retirar pedido' : 'Pedir Descanso Curto'}
              </Button>
            )
          )}
        </div>
      )}

      {role === 'master' && (
        <div className="mt-3 flex flex-wrap gap-2">
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
          {!state.isOpen && roster.requested.length > 0 && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(() => refuseShortRestRequests(sessionId), 'Não foi possível recusar o pedido.')
              }
              className="bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700"
            >
              Recusar pedido
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
