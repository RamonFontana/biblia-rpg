// O recorte da imagem de um mapa enviado (CONTEXT.md: Mapa, Quadrado). O editor mostra um Palco com
// a proporção colunas × linhas; o Mestre arrasta e amplia a imagem por baixo do grid, e o que sai é o
// retângulo da imagem que esse Palco mostra, reduzido a no máximo `MAX_MAP_IMAGE_SIDE` px.
import type { Size, View } from './view';

/** O maior lado, em pixels, da imagem salva de um mapa. */
export const MAX_MAP_IMAGE_SIDE = 2048;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** O Palco do editor: a proporção colunas × linhas, o maior que cabe em `maxWidth` × `maxHeight`. */
export function frameSize(
  columns: number,
  rows: number,
  maxWidth: number,
  maxHeight: number,
): Size {
  const scale = Math.min(maxWidth / columns, maxHeight / rows);
  return { width: columns * scale, height: rows * scale };
}

/** O retângulo da imagem (em pixels dela) que o Palco do editor mostra na vista dada. */
export function cropRect(view: View, frame: Size): Rect {
  return {
    x: -view.x / view.scale,
    y: -view.y / view.scale,
    width: frame.width / view.scale,
    height: frame.height / view.scale,
  };
}

/** O tamanho da imagem salva: o recorte, reduzido pelo lado maior se passar de `maxSide`. */
export function outputSize(rect: Size, maxSide: number): Size {
  const scale = Math.min(1, maxSide / Math.max(rect.width, rect.height));
  return {
    width: Math.max(1, Math.round(rect.width * scale)),
    height: Math.max(1, Math.round(rect.height * scale)),
  };
}
