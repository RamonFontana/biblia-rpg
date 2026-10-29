// A grade de Retratos do Palco: quem está na cena (grupo, NPCs visíveis e inimigos em combate).
// No mapa, cada um vira o seu pin. O PV fica à vista, e o dano ou a cura flutua do Retrato.
// Termos: CONTEXT.md (Palco, Retrato).
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/ui/CharacterAvatar';
import type { Retrato } from '@/lib/retratos';

interface RetratosProps {
  retratos: Retrato[];
  onOpen: (retrato: Retrato) => void;
}

const KIND_LABEL = { player: '', npc: 'NPC', enemy: 'Inimigo' } as const;
const DELTA_MS = 1200;

export function Retratos({ retratos, onOpen }: RetratosProps) {
  return (
    <section
      aria-label="Retratos"
      className="relative overflow-hidden rounded-lg border border-stone-800 bg-stone-950/40 p-3"
    >
      {/* O mapa ocupa este lugar; até lá, só a marca. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-6xl tracking-widest text-stone-800/60 select-none"
      >
        Mapa
      </span>
      {retratos.length === 0 ? (
        <p className="relative py-6 text-center text-sm text-stone-500">Ninguém na cena ainda.</p>
      ) : (
        <ul className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {retratos.map((retrato) => (
            <li key={retrato.id}>
              <RetratoTile retrato={retrato} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RetratoTile({ retrato, onOpen }: { retrato: Retrato; onOpen: (r: Retrato) => void }) {
  // O delta é o que o PV mudou desde o desenho anterior (estado derivado, sem efeito).
  const [prevPv, setPrevPv] = useState(retrato.pv);
  const [hit, setHit] = useState<{ delta: number; key: number } | null>(null);
  if (retrato.pv !== prevPv) {
    setPrevPv(retrato.pv);
    setHit((current) => ({ delta: retrato.pv - prevPv, key: (current?.key ?? 0) + 1 }));
  }
  const hitKey = hit?.key;
  useEffect(() => {
    if (hitKey === undefined) return;
    const timer = window.setTimeout(() => setHit(null), DELTA_MS);
    return () => window.clearTimeout(timer);
  }, [hitKey]);

  const percent =
    retrato.pvMax > 0 ? Math.min(100, Math.max(0, (retrato.pv / retrato.pvMax) * 100)) : 0;
  const label = `${retrato.name}, ${retrato.pv} de ${retrato.pvMax} PV${retrato.down ? ', caído' : ''}`;
  const kind = KIND_LABEL[retrato.kind];

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onOpen(retrato)}
      className={`relative flex min-h-[88px] w-full flex-col items-center gap-1.5 rounded-lg border bg-stone-900 p-2 text-center transition-colors hover:border-amber-500/60 ${
        retrato.isMe ? 'border-amber-500/50' : 'border-stone-700'
      } ${retrato.down ? 'opacity-60' : ''}`}
    >
      <CharacterAvatar
        imageUrl={retrato.imageUrl}
        name={retrato.name}
        className={`h-12 w-12 border-2 ${retrato.kind === 'enemy' ? 'border-red-900/60' : 'border-stone-700'} ${retrato.down ? 'grayscale' : ''}`}
      />
      <span className="w-full truncate text-sm text-stone-100">{retrato.name}</span>
      {kind && <span className="text-[10px] tracking-wide text-stone-500 uppercase">{kind}</span>}
      <span
        role="progressbar"
        aria-label={`PV de ${retrato.name}`}
        aria-valuemin={0}
        aria-valuemax={retrato.pvMax}
        aria-valuenow={retrato.pv}
        className="h-1.5 w-full overflow-hidden rounded-full bg-stone-700"
      >
        <motion.span
          className="block h-full bg-red-600"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </span>
      {hit && (
        <motion.span
          key={hit.key}
          aria-hidden="true"
          className={`pointer-events-none absolute top-1 right-2 text-sm font-bold ${
            hit.delta < 0 ? 'text-red-400' : 'text-green-400'
          }`}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -14 }}
          transition={{ duration: DELTA_MS / 1000, times: [0, 0.15, 0.7, 1] }}
        >
          {hit.delta < 0 ? `−${-hit.delta}` : `+${hit.delta}`}
        </motion.span>
      )}
    </button>
  );
}
