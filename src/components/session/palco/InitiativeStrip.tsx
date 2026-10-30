// A faixa de iniciativa no topo do Palco, só no combate: quem age agora vem primeiro, marcado,
// e os outros seguem na ordem em que agem. Termos: CONTEXT.md (Palco).
import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/ui/CharacterAvatar';

export interface InitiativeEntry {
  id: string;
  name: string;
  imageUrl?: string;
  /** É o personagem de quem está olhando. */
  isMe: boolean;
  /** A 0 PV ou menos. */
  down: boolean;
}

interface InitiativeStripProps {
  /** Na ordem de iniciativa. */
  entries: InitiativeEntry[];
  /** Quem age agora; a lista gira para ele vir primeiro. */
  currentId: string | undefined;
  round: number;
}

export function InitiativeStrip({ entries, currentId, round }: InitiativeStripProps) {
  const start = entries.findIndex((e) => e.id === currentId);
  const ordered = start > 0 ? [...entries.slice(start), ...entries.slice(0, start)] : entries;

  return (
    <section
      aria-label="Iniciativa"
      className="flex items-center gap-3 overflow-x-auto rounded-lg border border-stone-800 bg-stone-900 px-3 py-2"
    >
      <span className="shrink-0 text-xs font-semibold tracking-wider text-stone-400 uppercase">
        Rodada {round}
      </span>
      <ol aria-label="Ordem de iniciativa" className="flex items-center gap-2">
        {ordered.map((entry) => {
          const current = entry.id === currentId;
          const label = entry.isMe ? `${entry.name} (você)` : entry.name;
          return (
            <motion.li
              key={entry.id}
              layout="position"
              aria-label={entry.down ? `${label}, caído` : undefined}
              aria-current={current ? 'true' : undefined}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm ${
                current
                  ? 'border-amber-500 bg-amber-950/40 text-amber-100'
                  : 'border-stone-700 text-stone-300'
              } ${entry.down ? 'opacity-60' : ''}`}
            >
              <span aria-hidden="true">
                <CharacterAvatar
                  imageUrl={entry.imageUrl}
                  name={entry.name}
                  className={`h-7 w-7 border ${current ? 'border-amber-500' : 'border-stone-700'}`}
                />
              </span>
              <span>{label}</span>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
