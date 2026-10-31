// A vista do mapa no Palco: escala e deslocamento, em pixels de tela. A mesma conta serve ao Palco,
// ao arrasto do pin e ao editor de recorte. Um ponto do mapa `m` aparece na tela em `m * scale + (x, y)`.
// O "conteúdo" é o mapa em pixels sem zoom.
import type { Point } from './grid';

export interface View {
  scale: number;
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ScaleLimits {
  min: number;
  max: number;
}

export function mapToScreen(view: View, point: Point): Point {
  return { x: point.x * view.scale + view.x, y: point.y * view.scale + view.y };
}

export function screenToMap(view: View, point: Point): Point {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale };
}

/** Prende uma coordenada: centra se o mapa é menor que o Palco; senão, impede mostrar o vazio. */
function clampAxis(offset: number, viewportSize: number, contentSize: number): number {
  if (contentSize <= viewportSize) return (viewportSize - contentSize) / 2;
  return Math.min(0, Math.max(viewportSize - contentSize, offset));
}

/** Mantém o mapa dentro do Palco: nunca mostra além da borda dele. */
export function clampView(view: View, viewport: Size, content: Size): View {
  return {
    scale: view.scale,
    x: clampAxis(view.x, viewport.width, content.width * view.scale),
    y: clampAxis(view.y, viewport.height, content.height * view.scale),
  };
}

/** A vista que mostra o mapa inteiro, centrado, sem ampliar além do tamanho real. */
export function fitView(viewport: Size, content: Size): View {
  const scale = Math.min(1, viewport.width / content.width, viewport.height / content.height);
  return clampView({ scale, x: 0, y: 0 }, viewport, content);
}

/** Muda a escala por um fator, mantendo fixo o ponto do mapa que está sob `anchor` (em tela). */
export function zoomAround(
  view: View,
  factor: number,
  anchor: Point,
  viewport: Size,
  content: Size,
  limits: ScaleLimits,
): View {
  const scale = Math.min(limits.max, Math.max(limits.min, view.scale * factor));
  const ratio = scale / view.scale;
  return clampView(
    {
      scale,
      x: anchor.x - (anchor.x - view.x) * ratio,
      y: anchor.y - (anchor.y - view.y) * ratio,
    },
    viewport,
    content,
  );
}

export function panBy(view: View, dx: number, dy: number, viewport: Size, content: Size): View {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, viewport, content);
}
