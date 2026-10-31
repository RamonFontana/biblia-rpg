// O grid do mapa (CONTEXT.md, Quadrado): cada Quadrado vale 1,5 m, e a diagonal também vale 1.
// As coordenadas de ponto estão em Quadrados, com a origem no canto de cima à esquerda: o
// Quadrado {col, row} cobre de [col, col + 1) por [row, row + 1).

export const SQUARE_METERS = 1.5;
export const MIN_GRID_SIDE = 5;
export const MAX_GRID_SIDE = 60;
export const DEFAULT_GRID = { columns: 20, rows: 15 } as const;

export interface Cell {
  col: number;
  row: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Distância em Quadrados: o maior dos dois deslocamentos (a diagonal vale 1). */
export function distanceInSquares(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row));
}

export function distanceInMeters(a: Cell, b: Cell): number {
  return distanceInSquares(a, b) * SQUARE_METERS;
}

export function isInsideGrid(cell: Cell, columns: number, rows: number): boolean {
  return cell.col >= 0 && cell.col < columns && cell.row >= 0 && cell.row < rows;
}

/** O Quadrado que contém o ponto; o ponto de fora vai para o Quadrado mais próximo da borda. */
export function snapToCell(point: Point, columns: number, rows: number): Cell {
  const clamp = (value: number, size: number) => Math.min(size - 1, Math.max(0, Math.floor(value)));
  return { col: clamp(point.x, columns), row: clamp(point.y, rows) };
}

/** O centro do Quadrado, onde o pin se encaixa. */
export function cellCenter(cell: Cell): Point {
  return { x: cell.col + 0.5, y: cell.row + 0.5 };
}

/** Prende um lado do mapa (colunas ou linhas) ao intervalo permitido, em número inteiro. */
export function clampGridSide(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_GRID.columns;
  return Math.min(MAX_GRID_SIDE, Math.max(MIN_GRID_SIDE, Math.round(value)));
}
