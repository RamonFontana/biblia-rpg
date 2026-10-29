// A Barra de Status do jogador (ADR 0009): o que ele precisa ver o tempo todo. PV em barra e
// número, Fé Atual com o Estado de Fé, Condições com as rodadas, Inspiração, turno, dia e período.
// Tocar no personagem abre a Ficha. Termos: CONTEXT.md (Barra de Status, Estado de Fé).
import { motion } from 'motion/react';
import { ConditionBadge } from '@/components/conditions/ConditionBadge';
import { FaithStateBadge } from '@/components/faith/FaithStateBadge';
import { InspirationPanel } from '@/components/session/InspirationPanel';
import type { Character } from '@/features/character-management/types';
import { getCurrentFaith } from '@/domain/faith';
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import type { ConditionEntry } from '@/types/combat';

export interface StatusBarTurn {
  /** O turno atual é do personagem do jogador. */
  isMine: boolean;
  /** De quem é o turno agora. */
  name: string;
}

interface PlayerStatusBarProps {
  /** A ficha do jogador nesta sessão; sem ela, a barra mostra só o dia e o período. */
  character: Character | undefined;
  sessionId: string;
  day: number;
  period: string;
  /** Só no combate; `null` fora dele. */
  turn: StatusBarTurn | null;
  onOpenSheet: () => void;
  onInspirationUsed: (patch: {
    inspiration_used_day: number;
    inspiration_session_id: string;
  }) => void;
}

export function PlayerStatusBar({
  character,
  sessionId,
  day,
  period,
  turn,
  onOpenSheet,
  onInspirationUsed,
}: PlayerStatusBarProps) {
  const dayChip = (
    <span className="rounded-full border border-stone-700 bg-stone-800/50 px-2.5 py-0.5 text-xs text-stone-300">
      Dia {day} · {period}
    </span>
  );

  if (!character) {
    return (
      <section
        aria-label="Barra de Status"
        className="flex justify-end border-b border-stone-800 p-2"
      >
        {dayChip}
      </section>
    );
  }

  const pv = getCurrentPv(character.stats);
  const pvMax = getMaxPv(character.stats);
  const percent = pvMax > 0 ? Math.min(100, Math.max(0, (pv / pvMax) * 100)) : 0;
  const conditions = (character.conditions ?? []) as ConditionEntry[];

  return (
    <section
      aria-label="Barra de Status"
      className="space-y-2 border-b border-stone-800 bg-stone-900 p-2 pr-16 md:pr-2"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSheet}
          aria-label={`Abrir a Ficha de ${character.name}`}
          className="flex min-h-11 min-w-0 flex-1 flex-col items-stretch gap-1 rounded text-left hover:bg-stone-800/50"
        >
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-serif text-lg text-stone-100">{character.name}</span>
            <span className="text-sm tabular-nums text-stone-200">{`${pv}/${pvMax}`}</span>
          </span>
          <span
            role="progressbar"
            aria-label="PV"
            aria-valuemin={0}
            aria-valuemax={pvMax}
            aria-valuenow={pv}
            className="h-2 w-full overflow-hidden rounded-full bg-stone-700"
          >
            <motion.span
              className="block h-full bg-red-600"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </span>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 text-sm text-stone-200">
            <span>{`Fé ${getCurrentFaith(character.stats)}`}</span>
            <FaithStateBadge stats={character.stats} />
          </span>
          {dayChip}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 empty:hidden">
        {turn && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              turn.isMine ? 'bg-amber-600 text-stone-900' : 'bg-stone-700 text-stone-300'
            }`}
          >
            {turn.isMine ? 'Seu turno' : `Turno: ${turn.name}`}
          </span>
        )}
        {conditions.length > 0 && (
          <ul aria-label="Condições" className="flex flex-wrap gap-1">
            {conditions.map((condition) => (
              <li key={condition.conditionId}>
                <ConditionBadge
                  conditionId={condition.conditionId}
                  duration={condition.duration ?? undefined}
                  readonly
                />
              </li>
            ))}
          </ul>
        )}
        <InspirationPanel
          character={character}
          sessionId={sessionId}
          day={day}
          onUsed={onInspirationUsed}
          className="w-auto"
        />
      </div>
    </section>
  );
}
