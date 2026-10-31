import { describe, expect, it } from 'vitest';
import {
  centerOn,
  clampView,
  coverView,
  fitView,
  mapToScreen,
  panBy,
  screenToMap,
  zoomAround,
  type Size,
  type View,
} from './view';

const viewport: Size = { width: 400, height: 300 };
const content: Size = { width: 960, height: 720 }; // 20×15 Quadrados de 48
const limits = { min: 0.4, max: 3 };

describe('conversão tela ↔ mapa', () => {
  it('é a identidade na vista neutra', () => {
    const view: View = { scale: 1, x: 0, y: 0 };
    expect(mapToScreen(view, { x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });

  it('aplica escala e deslocamento', () => {
    const view: View = { scale: 2, x: -50, y: 30 };
    expect(mapToScreen(view, { x: 100, y: 10 })).toEqual({ x: 150, y: 50 });
  });

  it('ida e volta devolve o mesmo ponto', () => {
    const view: View = { scale: 1.7, x: -123, y: 45 };
    const point = { x: 321.5, y: 98.25 };
    const back = screenToMap(view, mapToScreen(view, point));
    expect(back.x).toBeCloseTo(point.x, 9);
    expect(back.y).toBeCloseTo(point.y, 9);
  });
});

describe('fitView', () => {
  it('cabe o mapa inteiro no Palco e o centraliza', () => {
    const view = fitView(viewport, content);
    expect(view.scale).toBeCloseTo(300 / 720, 9); // limitado pela altura
    const size = { w: content.width * view.scale, h: content.height * view.scale };
    expect(view.x).toBeCloseTo((viewport.width - size.w) / 2, 9);
    expect(view.y).toBeCloseTo((viewport.height - size.h) / 2, 9);
  });

  it('não amplia além de 1 um mapa pequeno', () => {
    expect(fitView({ width: 2000, height: 2000 }, { width: 240, height: 240 }).scale).toBe(1);
  });
});

describe('zoomAround', () => {
  it('mantém fixo o ponto do mapa sob o dedo', () => {
    const view: View = { scale: 1, x: -100, y: -40 };
    const anchor = { x: 200, y: 150 };
    const before = screenToMap(view, anchor);
    const next = zoomAround(view, 1.5, anchor, viewport, content, limits);
    const after = screenToMap(next, anchor);
    expect(next.scale).toBeCloseTo(1.5, 9);
    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
  });

  it('respeita a escala mínima e a máxima', () => {
    const view: View = { scale: 1, x: 0, y: 0 };
    expect(zoomAround(view, 100, { x: 0, y: 0 }, viewport, content, limits).scale).toBe(3);
    expect(zoomAround(view, 0.001, { x: 0, y: 0 }, viewport, content, limits).scale).toBe(0.4);
  });
});

describe('clampView e panBy', () => {
  it('centra o mapa no eixo em que ele é menor que o Palco', () => {
    const small: Size = { width: 100, height: 100 };
    const view = clampView({ scale: 1, x: 999, y: -999 }, viewport, small);
    expect(view.x).toBe((400 - 100) / 2);
    expect(view.y).toBe((300 - 100) / 2);
  });

  it('não deixa o mapa sair do Palco quando ele é maior', () => {
    const big: View = { scale: 2, x: 0, y: 0 }; // 1920×1440
    expect(clampView({ ...big, x: 500, y: 500 }, viewport, content)).toEqual({
      scale: 2,
      x: 0,
      y: 0,
    });
    const far = clampView({ ...big, x: -99999, y: -99999 }, viewport, content);
    expect(far.x).toBe(400 - 1920);
    expect(far.y).toBe(300 - 1440);
  });

  it('panBy soma o arrasto e prende nos limites', () => {
    const view: View = { scale: 2, x: -100, y: -100 };
    expect(panBy(view, 30, -20, viewport, content)).toEqual({ scale: 2, x: -70, y: -120 });
    expect(panBy(view, 1000, 1000, viewport, content)).toEqual({ scale: 2, x: 0, y: 0 });
  });
});

describe('centerOn', () => {
  it('põe o ponto do mapa no meio do Palco, mantendo a escala', () => {
    const view: View = { scale: 1, x: 0, y: 0 };
    const next = centerOn(view, { x: 500, y: 400 }, viewport, content);
    const screen = mapToScreen(next, { x: 500, y: 400 });
    expect(screen.x).toBeCloseTo(200, 6);
    expect(screen.y).toBeCloseTo(150, 6);
    expect(next.scale).toBe(1);
  });

  it('não sai do mapa quando o ponto está na borda', () => {
    const next = centerOn({ scale: 1, x: -300, y: -300 }, { x: 5, y: 5 }, viewport, content);
    expect(next.x).toBe(0);
    expect(next.y).toBe(0);
  });
});

describe('coverView', () => {
  it('cobre o Palco inteiro com a imagem, centrada no eixo que sobra', () => {
    const view = coverView({ width: 400, height: 300 }, { width: 1000, height: 500 });
    // A altura manda: 300/500 = 0,6; a largura fica 600 e sobra 200 para os lados.
    expect(view.scale).toBeCloseTo(0.6, 9);
    expect(view.x).toBeCloseTo((400 - 600) / 2, 9);
    expect(view.y).toBeCloseTo(0, 9);
  });

  it('amplia uma imagem pequena até cobrir', () => {
    expect(coverView({ width: 400, height: 300 }, { width: 100, height: 100 }).scale).toBe(4);
  });
});
