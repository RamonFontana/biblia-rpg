// A janela do mapa com pan e zoom (ADR 0009): um dedo arrasta, dois dedos ampliam (pinça), a roda do
// mouse amplia em torno do cursor, e botões e teclado fazem o mesmo para quem não usa gestos. Pointer
// Events e CSS transform, sem biblioteca; a conta fica em `src/domain/map/view.ts`.
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import {
  centerOn,
  clampView,
  fitView,
  panBy,
  screenToMap,
  zoomAround,
  type ScaleLimits,
  type Size,
  type View,
} from '@/domain/map/view';
import type { Point } from '@/domain/map/grid';

/** O que quem desenha por cima do mapa precisa da vista: converter o dedo em ponto do mapa e centrar. */
export interface ViewApi {
  /** Um ponto da tela (clientX, clientY) em pixels do mapa sem zoom. */
  clientToContent: (clientX: number, clientY: number) => Point;
  /** Leva o ponto do mapa (em pixels sem zoom) ao meio do Palco, ampliando até o tamanho real. */
  centerOn: (point: Point) => void;
}

interface PanZoomViewportProps {
  /** O tamanho do mapa em pixels, sem zoom. */
  content: Size;
  /** O nome acessível da área do mapa. */
  label: string;
  className?: string;
  /** Acesso à vista para quem desenha pins e arrasta por cima do mapa. */
  apiRef?: Ref<ViewApi>;
  /** Botões extras ao lado dos de zoom. */
  controls?: ReactNode;
  children: ReactNode;
}

const BUTTON_ZOOM = 1.4;
const KEY_PAN = 48;
const WHEEL_SENSITIVITY = 0.0015;
const buttonClass =
  'flex h-11 w-11 items-center justify-center rounded-full border border-stone-700 bg-stone-900/90 text-stone-200 hover:border-amber-500/60 hover:text-amber-500';

/** Da escala que mostra o mapa inteiro até seis vezes isso (no mínimo, o tamanho real em dobro). */
function limitsFor(fit: number): ScaleLimits {
  return { min: fit, max: Math.max(fit * 6, 2) };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function PanZoomViewport({
  content,
  label,
  className = '',
  apiRef,
  controls,
  children,
}: PanZoomViewportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  // Nulo = a vista que mostra o mapa inteiro; o primeiro gesto a substitui pela escolha da pessoa.
  const [chosen, setChosen] = useState<View | null>(null);
  const pointers = useRef(new Map<number, Point>());

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const measured = size.width > 0 && size.height > 0;
  const fit = measured ? fitView(size, content) : { scale: 1, x: 0, y: 0 };
  const limits = limitsFor(fit.scale);
  const view = !measured
    ? fit
    : chosen
      ? clampView(
          { ...chosen, scale: Math.min(limits.max, Math.max(limits.min, chosen.scale)) },
          size,
          content,
        )
      : fit;

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  });

  const toLocal = useCallback((clientX: number, clientY: number): Point => {
    const rect = ref.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }, []);

  const zoom = (factor: number, anchor: Point) =>
    setChosen(zoomAround(viewRef.current, factor, anchor, size, content, limits));

  // A roda precisa de `preventDefault` para a página não rolar, e o `onWheel` do React é passivo.
  // O ouvinte é ligado uma vez e chama sempre a versão mais nova de `zoom`.
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomRef.current(
        Math.exp(-event.deltaY * WHEEL_SENSITIVITY),
        toLocal(event.clientX, event.clientY),
      );
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [toLocal]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, toLocal(event.clientX, event.clientY));
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = toLocal(event.clientX, event.clientY);
    const others = [...pointers.current.entries()].filter(([id]) => id !== event.pointerId);
    pointers.current.set(event.pointerId, next);

    if (others.length === 0) {
      setChosen(panBy(viewRef.current, next.x - previous.x, next.y - previous.y, size, content));
      return;
    }
    // Pinça: a distância entre os dois dedos manda no zoom, e o ponto médio carrega o arrasto.
    const other = others[0]![1];
    const factor = distance(next, other) / (distance(previous, other) || 1);
    const midBefore = { x: (previous.x + other.x) / 2, y: (previous.y + other.y) / 2 };
    const midAfter = { x: (next.x + other.x) / 2, y: (next.y + other.y) / 2 };
    const zoomed = zoomAround(viewRef.current, factor, midBefore, size, content, limits);
    setChosen(panBy(zoomed, midAfter.x - midBefore.x, midAfter.y - midBefore.y, size, content));
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  useImperativeHandle(apiRef, () => ({
    clientToContent: (clientX, clientY) => screenToMap(viewRef.current, toLocal(clientX, clientY)),
    centerOn: (point) => {
      const scale = Math.max(viewRef.current.scale, Math.min(limits.max, 1));
      setChosen(centerOn({ ...viewRef.current, scale }, point, size, content));
    },
  }));

  const center = { x: size.width / 2, y: size.height / 2 };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const pan: Record<string, [number, number]> = {
      ArrowLeft: [KEY_PAN, 0],
      ArrowRight: [-KEY_PAN, 0],
      ArrowUp: [0, KEY_PAN],
      ArrowDown: [0, -KEY_PAN],
    };
    const delta = pan[event.key];
    if (delta) {
      event.preventDefault();
      setChosen(panBy(viewRef.current, delta[0], delta[1], size, content));
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoom(BUTTON_ZOOM, center);
    } else if (event.key === '-') {
      event.preventDefault();
      zoom(1 / BUTTON_ZOOM, center);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        role="group"
        data-area-do-mapa
        aria-label={label}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        className="h-full min-h-[18rem] w-full cursor-grab touch-none overflow-hidden select-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:outline-none active:cursor-grabbing"
      >
        <div
          data-testid="camada-do-mapa"
          style={{
            width: content.width,
            height: content.height,
            position: 'relative',
            transformOrigin: '0 0',
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            visibility: measured ? 'visible' : 'hidden',
          }}
        >
          {children}
        </div>
      </div>
      <div className="absolute bottom-2 left-2 flex gap-1">
        <button
          type="button"
          aria-label="Ampliar o mapa"
          className={buttonClass}
          onClick={() => zoom(BUTTON_ZOOM, center)}
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Reduzir o mapa"
          className={buttonClass}
          onClick={() => zoom(1 / BUTTON_ZOOM, center)}
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Ajustar o mapa ao Palco"
          className={buttonClass}
          onClick={() => setChosen(null)}
        >
          <Maximize2 className="h-5 w-5" />
        </button>
        {controls}
      </div>
    </div>
  );
}
