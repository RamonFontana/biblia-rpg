// O pin de um Retrato no mapa (CONTEXT.md: Retrato, Quadrado): um botão com a imagem e o nome
// acessível, no Quadrado dele. O Mestre o arrasta; todo mundo o toca para abrir o cartão.
import type { ComponentProps } from 'react';
import { motion } from 'motion/react';
import { CharacterAvatar } from '@/components/ui/CharacterAvatar';
import { pinLabel } from '@/lib/mapScene';
import type { Retrato } from '@/lib/retratos';

interface PinTokenProps {
  retrato: Retrato;
  col: number;
  row: number;
  /** Pixels de um Quadrado sem zoom. */
  size: number;
  /** Está sendo arrastado: o pin fica apagado no lugar de origem. */
  lifted: boolean;
  /** Só o Mestre arrasta. */
  draggable: boolean;
  handlers: Pick<
    ComponentProps<'button'>,
    'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onClick'
  >;
}

export function PinToken({ retrato, col, row, size, lifted, draggable, handlers }: PinTokenProps) {
  return (
    <motion.div
      className="absolute top-0 left-0 p-[3px]"
      style={{ width: size, height: size }}
      initial={false}
      animate={{ x: col * size, y: row * size }}
      transition={{ type: 'spring', stiffness: 520, damping: 42 }}
    >
      <button
        type="button"
        aria-label={pinLabel(retrato)}
        data-col={col}
        data-row={row}
        {...handlers}
        className={`block h-full w-full touch-none rounded-full border-2 bg-stone-900 shadow-md ${
          draggable ? 'cursor-grab' : 'cursor-pointer'
        } ${retrato.isMe ? 'border-amber-500' : retrato.kind === 'enemy' ? 'border-red-700' : 'border-stone-200'} ${
          retrato.hidden ? 'border-dashed opacity-60' : ''
        } ${retrato.down ? 'opacity-60 grayscale' : ''} ${lifted ? 'opacity-30' : ''}`}
      >
        <CharacterAvatar
          imageUrl={retrato.imageUrl}
          name={retrato.name}
          className="h-full w-full text-[10px]"
        />
      </button>
    </motion.div>
  );
}
