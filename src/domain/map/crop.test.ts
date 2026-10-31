// O recorte da imagem de um mapa enviado: o Palco do editor mostra colunas × linhas Quadrados, e o
// que sai é o retângulo da imagem que esse Palco mostra. Termos: CONTEXT.md (Mapa, Quadrado).
import { describe, expect, it } from 'vitest';
import { cropRect, frameSize, outputSize } from './crop';
import { coverView, zoomAround, panBy } from './view';

describe('frameSize', () => {
  it('mantém a proporção colunas × linhas dentro da largura máxima', () => {
    expect(frameSize(20, 10, 600, 400)).toEqual({ width: 600, height: 300 });
  });

  it('um mapa alto é limitado pela altura máxima', () => {
    expect(frameSize(10, 20, 600, 400)).toEqual({ width: 200, height: 400 });
  });

  it('um mapa quadrado cabe no menor lado', () => {
    expect(frameSize(15, 15, 600, 400)).toEqual({ width: 400, height: 400 });
  });
});

describe('cropRect', () => {
  const image = { width: 2000, height: 1000 };
  const frame = { width: 600, height: 300 };

  it('na vista que cobre o Palco, o recorte é a imagem toda quando a proporção bate', () => {
    const rect = cropRect(coverView(frame, image), frame);
    expect(rect.x).toBeCloseTo(0, 6);
    expect(rect.y).toBeCloseTo(0, 6);
    expect(rect.width).toBeCloseTo(2000, 6);
    expect(rect.height).toBeCloseTo(1000, 6);
  });

  it('com a proporção diferente, corta o que sobra dos lados, centrado', () => {
    const square = { width: 300, height: 300 };
    const rect = cropRect(coverView(square, image), square);
    expect(rect.width).toBeCloseTo(1000, 6);
    expect(rect.height).toBeCloseTo(1000, 6);
    expect(rect.x).toBeCloseTo(500, 6);
  });

  it('ampliar mostra um pedaço menor da imagem; arrastar o desloca', () => {
    const start = coverView(frame, image);
    const zoomed = zoomAround(start, 2, { x: 0, y: 0 }, frame, image, {
      min: start.scale,
      max: 10,
    });
    const rect = cropRect(zoomed, frame);
    expect(rect.width).toBeCloseTo(1000, 6);
    expect(rect.x).toBeCloseTo(0, 6);
    const moved = panBy(zoomed, -100, 0, frame, image);
    expect(cropRect(moved, frame).x).toBeCloseTo(100 / zoomed.scale, 6);
  });

  it('o recorte nunca passa dos limites da imagem', () => {
    const start = coverView(frame, image);
    const zoomed = zoomAround(start, 3, { x: 300, y: 150 }, frame, image, {
      min: start.scale,
      max: 10,
    });
    const far = panBy(zoomed, 99999, 99999, frame, image);
    const rect = cropRect(far, frame);
    expect(rect.x).toBeGreaterThanOrEqual(-1e-9);
    expect(rect.y).toBeGreaterThanOrEqual(-1e-9);
    expect(rect.x + rect.width).toBeLessThanOrEqual(image.width + 1e-9);
    expect(rect.y + rect.height).toBeLessThanOrEqual(image.height + 1e-9);
  });
});

describe('outputSize', () => {
  it('não amplia o que já cabe', () => {
    expect(outputSize({ width: 1200, height: 800 }, 2048)).toEqual({ width: 1200, height: 800 });
  });

  it('reduz pelo lado maior para no máximo 2048 px, mantendo a proporção', () => {
    expect(outputSize({ width: 4096, height: 2048 }, 2048)).toEqual({ width: 2048, height: 1024 });
    expect(outputSize({ width: 1000, height: 5000 }, 2048)).toEqual({ width: 410, height: 2048 });
  });

  it('nunca devolve lado zero', () => {
    const out = outputSize({ width: 10000, height: 3 }, 2048);
    expect(out.height).toBeGreaterThanOrEqual(1);
  });
});
