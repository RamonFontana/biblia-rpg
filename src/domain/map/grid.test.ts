import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GRID,
  MAX_GRID_SIDE,
  MIN_GRID_SIDE,
  SQUARE_METERS,
  cellCenter,
  clampGridSide,
  distanceInMeters,
  distanceInSquares,
  isInsideGrid,
  snapToCell,
} from './grid';

describe('grid do mapa', () => {
  it('um Quadrado vale 1,5 m', () => {
    expect(SQUARE_METERS).toBe(1.5);
  });

  describe('distanceInSquares', () => {
    it('conta a reta em Quadrados', () => {
      expect(distanceInSquares({ col: 2, row: 3 }, { col: 7, row: 3 })).toBe(5);
      expect(distanceInSquares({ col: 2, row: 3 }, { col: 2, row: 0 })).toBe(3);
    });

    it('conta a diagonal como 1 Quadrado por passo', () => {
      expect(distanceInSquares({ col: 0, row: 0 }, { col: 1, row: 1 })).toBe(1);
      expect(distanceInSquares({ col: 0, row: 0 }, { col: 4, row: 4 })).toBe(4);
    });

    it('usa o maior dos dois deslocamentos', () => {
      expect(distanceInSquares({ col: 0, row: 0 }, { col: 6, row: 2 })).toBe(6);
    });

    it('é zero no mesmo Quadrado e simétrica', () => {
      const a = { col: 3, row: 3 };
      const b = { col: 9, row: 1 };
      expect(distanceInSquares(a, a)).toBe(0);
      expect(distanceInSquares(a, b)).toBe(distanceInSquares(b, a));
    });
  });

  describe('distanceInMeters', () => {
    it('multiplica por 1,5 m', () => {
      expect(distanceInMeters({ col: 0, row: 0 }, { col: 6, row: 0 })).toBe(9);
      expect(distanceInMeters({ col: 0, row: 0 }, { col: 4, row: 2 })).toBe(6);
      expect(distanceInMeters({ col: 0, row: 0 }, { col: 1, row: 1 })).toBe(1.5);
    });
  });

  describe('snapToCell', () => {
    it('devolve o Quadrado que contém o ponto', () => {
      expect(snapToCell({ x: 3.2, y: 4.9 }, 20, 15)).toEqual({ col: 3, row: 4 });
      expect(snapToCell({ x: 0, y: 0 }, 20, 15)).toEqual({ col: 0, row: 0 });
    });

    it('prende o ponto de fora ao Quadrado mais próximo da borda', () => {
      expect(snapToCell({ x: -3, y: 40 }, 20, 15)).toEqual({ col: 0, row: 14 });
      expect(snapToCell({ x: 20, y: 15 }, 20, 15)).toEqual({ col: 19, row: 14 });
    });
  });

  describe('cellCenter', () => {
    it('fica no meio do Quadrado', () => {
      expect(cellCenter({ col: 0, row: 0 })).toEqual({ x: 0.5, y: 0.5 });
      expect(cellCenter({ col: 3, row: 7 })).toEqual({ x: 3.5, y: 7.5 });
    });

    it('encaixar o centro devolve o mesmo Quadrado', () => {
      const cell = { col: 5, row: 2 };
      expect(snapToCell(cellCenter(cell), 20, 15)).toEqual(cell);
    });
  });

  describe('isInsideGrid', () => {
    it('aceita só Quadrados dentro das colunas e linhas', () => {
      expect(isInsideGrid({ col: 19, row: 14 }, 20, 15)).toBe(true);
      expect(isInsideGrid({ col: 20, row: 0 }, 20, 15)).toBe(false);
      expect(isInsideGrid({ col: 0, row: -1 }, 20, 15)).toBe(false);
    });
  });

  describe('tamanho do mapa', () => {
    it('o padrão é 20×15, de 5 a 60 por lado', () => {
      expect(DEFAULT_GRID).toEqual({ columns: 20, rows: 15 });
      expect(MIN_GRID_SIDE).toBe(5);
      expect(MAX_GRID_SIDE).toBe(60);
    });

    it('clampGridSide prende ao intervalo e arredonda', () => {
      expect(clampGridSide(2)).toBe(5);
      expect(clampGridSide(100)).toBe(60);
      expect(clampGridSide(12.6)).toBe(13);
      expect(clampGridSide(Number.NaN)).toBe(DEFAULT_GRID.columns);
    });
  });
});
