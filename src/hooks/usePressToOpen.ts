import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

/** Quanto tempo segurar para abrir, em milissegundos. */
export const LONG_PRESS_MS = 450;

/**
 * O gesto de abrir um Cartão: toque, clique e Enter abrem; segurar o dedo (toque, não mouse) também
 * abre, com uma vibração curta onde houver e sem o menu de contexto do sistema. O clique que vem
 * depois de segurar não abre de novo.
 */
export function usePressToOpen(onOpen: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const clear = () => window.clearTimeout(timer.current);
  useEffect(() => clear, []);

  return {
    onPointerDown: (event: PointerEvent) => {
      fired.current = false;
      if (event.pointerType === 'mouse') return;
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        navigator.vibrate?.(12);
        onOpen();
      }, LONG_PRESS_MS);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      onOpen();
    },
    onContextMenu: (event: MouseEvent) => event.preventDefault(),
  };
}
