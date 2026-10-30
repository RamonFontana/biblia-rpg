// O Painel da tela da sessão (ADR 0009): o que o trilho abre. Abaixo de `md` é um bottom sheet
// nosso (ADR 0008), arrastado pela alça, com dois pontos de parada (meia altura e tela cheia); de
// `md` a `lg` abre ao lado, por cima do Palco; a partir de `lg` abre ao lado sem cobrir nada (a
// moldura encolhe o Palco). Termos: CONTEXT.md (Painel, Palco).
import { useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/** A mola curta de abrir e fechar (no "reduzir movimento", o `MotionConfig` deixa só a opacidade). */
const SPRING = { type: 'spring', stiffness: 520, damping: 42, mass: 0.8 } as const;

/** Largura do Painel lateral. */
export const DOCK_PANEL_WIDTH = 'w-[26rem]';
/** A folga que a moldura abre à direita no `lg`, enquanto o Painel está aberto: o Palco encolhe e o
 * trilho fica ao lado do Painel, sem ficar coberto. (A classe é literal para o Tailwind a achar.) */
export const DOCK_PANEL_GAP = 'lg:pr-[26rem]';

interface DockPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function DockPanel({ open, onOpenChange, title, children }: DockPanelProps) {
  const isSide = useMediaQuery('(min-width: 768px)');
  const isBeside = useMediaQuery('(min-width: 1024px)');
  const [full, setFull] = useState(false);
  const drag = useDragControls();

  const change = (next: boolean) => {
    if (!next) setFull(false);
    onOpenChange(next);
  };

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y < -60 || info.velocity.y < -500) setFull(true);
    else if (info.offset.y > 110 || info.velocity.y > 600) {
      if (full) setFull(false);
      else change(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={change} modal={!isBeside}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {!isBeside && (
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-40 bg-stone-950/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </DialogPrimitive.Overlay>
            )}
            <DialogPrimitive.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onInteractOutside={isBeside ? (e) => e.preventDefault() : undefined}
            >
              {isSide ? (
                <motion.div
                  className={`fixed top-0 right-0 z-50 flex h-full max-w-full ${DOCK_PANEL_WIDTH} flex-col border-l border-stone-700 bg-stone-900 text-stone-100 shadow-2xl`}
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={SPRING}
                >
                  <PanelHeader title={title} />
                  <div className="flex-1 overflow-y-auto p-4">{children}</div>
                </motion.div>
              ) : (
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-stone-700 bg-stone-900 text-stone-100 shadow-2xl"
                  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1, height: full ? '92dvh' : '55dvh' }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={SPRING}
                  drag="y"
                  dragControls={drag}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0.15, bottom: 0.9 }}
                  onDragEnd={onDragEnd}
                >
                  <div
                    aria-hidden
                    className="flex cursor-grab touch-none justify-center pt-2 pb-1"
                    onPointerDown={(e) => drag.start(e)}
                  >
                    <span className="h-1.5 w-10 rounded-full bg-stone-600" />
                  </div>
                  <PanelHeader title={title} />
                  <div className="flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
                </motion.div>
              )}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-800 px-4 py-2">
      <DialogPrimitive.Title className="font-serif text-xl text-amber-500">
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Close
        aria-label="Fechar"
        className="flex h-11 w-11 items-center justify-center rounded text-stone-400 hover:text-stone-100"
      >
        <X className="h-5 w-5" />
      </DialogPrimitive.Close>
    </div>
  );
}
