// A Bandeja (CONTEXT.md): quem ainda não tem posição neste mapa. Só o Mestre a vê; arrastar um item
// para o mapa o põe num Quadrado, e arrastar um pin para cá o tira do mapa.
import type { ComponentProps } from 'react';
import { CharacterAvatar } from '@/components/ui/CharacterAvatar';
import type { Retrato } from '@/lib/retratos';
import { pinLabel } from '@/lib/mapScene';

type Handlers = Pick<
  ComponentProps<'button'>,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onClick'
>;

interface BandejaProps {
  retratos: Retrato[];
  handlersFor: (retrato: Retrato) => Handlers;
  /** O Retrato que está no ar, para apagá-lo na Bandeja. */
  liftedId?: string;
}

export function Bandeja({ retratos, handlersFor, liftedId }: BandejaProps) {
  return (
    <section
      aria-label="Bandeja"
      data-bandeja
      className="border-t border-stone-800 bg-stone-950/60 p-2"
    >
      <h3 className="mb-1 text-xs tracking-wide text-stone-400 uppercase">Bandeja</h3>
      {retratos.length === 0 ? (
        <p className="text-xs text-stone-500">Todos estão no mapa.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {retratos.map((retrato) => (
            <li key={retrato.id}>
              <button
                type="button"
                aria-label={`${pinLabel(retrato)}, na Bandeja`}
                {...handlersFor(retrato)}
                className={`flex min-h-11 touch-none cursor-grab items-center gap-2 rounded-full border bg-stone-900 py-1 pr-3 pl-1 text-xs text-stone-200 ${
                  retrato.kind === 'enemy' ? 'border-red-800' : 'border-stone-700'
                } ${retrato.hidden ? 'border-dashed' : ''} ${liftedId === retrato.id ? 'opacity-30' : ''}`}
              >
                <CharacterAvatar
                  imageUrl={retrato.imageUrl}
                  name={retrato.name}
                  className="h-8 w-8 text-[10px]"
                />
                <span className="max-w-[8rem] truncate">{retrato.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
