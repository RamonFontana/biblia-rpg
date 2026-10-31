// A Fonte de luz fixa no mapa (fogueira, braseiro, janela), só para o Mestre: um botão no Quadrado
// dela, que ele arrasta e toca. Para os jogadores só existe o efeito: a luz.
import type { ComponentProps } from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { lightLabel, type LightRow } from '@/lib/mapScene';

interface LightTokenProps {
  light: LightRow;
  /** Pixels de um Quadrado sem zoom. */
  size: number;
  selected: boolean;
  lifted: boolean;
  handlers: Pick<
    ComponentProps<'button'>,
    'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onClick'
  >;
}

export function LightToken({ light, size, selected, lifted, handlers }: LightTokenProps) {
  return (
    <motion.div
      className="absolute top-0 left-0 p-2"
      style={{ width: size, height: size }}
      initial={false}
      animate={{ x: light.col * size, y: light.row * size }}
      transition={{ type: 'spring', stiffness: 520, damping: 42 }}
    >
      <button
        type="button"
        aria-label={lightLabel(light)}
        data-col={light.col}
        data-row={light.row}
        {...handlers}
        className={`flex h-full w-full touch-none cursor-grab items-center justify-center rounded-full border-2 bg-stone-900/80 text-amber-400 shadow ${
          selected ? 'border-amber-300' : 'border-amber-600/70'
        } ${lifted ? 'opacity-30' : ''}`}
      >
        <Flame className="h-full w-full p-0.5" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
