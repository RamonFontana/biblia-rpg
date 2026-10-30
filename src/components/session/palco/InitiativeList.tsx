// A lista de iniciativa do Palco do Mestre no celular, só no combate: uma linha por participante,
// na ordem de iniciativa; a linha expande para o dano, as Condições e os controles dele. Sem
// animação nas listas do Mestre. Termos: CONTEXT.md (Palco).
import type { ReactNode } from 'react';
import { CharacterAvatar } from '@/components/ui/CharacterAvatar';

export interface InitiativeRow {
  /** O id do participante no combate. */
  id: string;
  name: string;
  kind: 'player' | 'npc' | 'enemy';
  initiative: number;
  pv: number;
  imageUrl?: string;
  /** A 0 PV ou menos. */
  down: boolean;
}

interface InitiativeListProps {
  rows: InitiativeRow[];
  round: number;
  /** O participante que age agora. */
  currentId: string | undefined;
  expandedId: string | undefined;
  onToggle: (id: string) => void;
  renderExpanded: (id: string) => ReactNode;
}

const KIND_LABEL = { player: '', npc: 'NPC', enemy: 'Inimigo' } as const;

export function InitiativeList({
  rows,
  round,
  currentId,
  expandedId,
  onToggle,
  renderExpanded,
}: InitiativeListProps) {
  return (
    <section aria-label="Iniciativa" className="space-y-2">
      <h2 className="text-xs font-semibold tracking-wider text-stone-400 uppercase">
        Rodada {round}
      </h2>
      <ol aria-label="Ordem de iniciativa" className="space-y-2">
        {rows.map((row) => {
          const current = row.id === currentId;
          const expanded = row.id === expandedId;
          const kind = KIND_LABEL[row.kind];
          const label = `${row.name}, iniciativa ${row.initiative}, ${row.pv} PV${
            current ? ', turno atual' : ''
          }${row.down ? ', caído' : ''}`;
          return (
            <li
              key={row.id}
              className={`rounded-lg border bg-stone-900 ${
                current ? 'border-amber-500' : 'border-stone-700'
              } ${row.down ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                aria-label={label}
                aria-expanded={expanded}
                aria-current={current ? 'true' : undefined}
                onClick={() => onToggle(row.id)}
                className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left"
              >
                <span aria-hidden="true" className="flex items-center gap-3">
                  <CharacterAvatar
                    imageUrl={row.imageUrl}
                    name={row.name}
                    className={`h-9 w-9 border ${row.kind === 'enemy' ? 'border-red-900/60' : 'border-stone-700'}`}
                  />
                  <span className="text-sm text-stone-100">{row.name}</span>
                  {kind && (
                    <span className="text-[10px] tracking-wide text-stone-500 uppercase">
                      {kind}
                    </span>
                  )}
                </span>
                <span aria-hidden="true" className="ml-auto text-sm text-stone-300">
                  {row.pv} PV
                </span>
              </button>
              {expanded && (
                <div className="border-t border-stone-800 p-3">{renderExpanded(row.id)}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
