import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PanZoomViewport } from './PanZoomViewport';

// jsdom não mede nada: o Palco tem 400×300 e o mapa 960×720 (20×15 Quadrados de 48).
const VIEWPORT = { width: 400, height: 300 };
const CONTENT = { width: 960, height: 720 };

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    ...VIEWPORT,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: VIEWPORT.width,
    bottom: VIEWPORT.height,
    toJSON: () => ({}),
  });
});
afterEach(() => vi.restoreAllMocks());

function renderMap() {
  render(
    <PanZoomViewport content={CONTENT} label="Área do mapa">
      <div>mapa</div>
    </PanZoomViewport>,
  );
  return {
    viewport: screen.getByRole('group', { name: 'Área do mapa' }),
    layer: screen.getByTestId('camada-do-mapa'),
  };
}

/** Lê escala e deslocamento do `transform` da camada. */
function readView(layer: HTMLElement) {
  const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(
    layer.style.transform,
  );
  if (!match) throw new Error(`transform inesperado: ${layer.style.transform}`);
  return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) };
}

const FIT = 300 / 720;

describe('PanZoomViewport', () => {
  it('começa com o mapa inteiro à vista, centrado', () => {
    const { layer } = renderMap();
    const view = readView(layer);
    expect(view.scale).toBeCloseTo(FIT, 5);
    expect(view.x).toBeCloseTo((400 - 960 * FIT) / 2, 3);
    expect(view.y).toBeCloseTo(0, 3);
  });

  it('a roda do mouse amplia em torno do cursor', () => {
    const { viewport, layer } = renderMap();
    fireEvent.wheel(viewport, { deltaY: -200, clientX: 200, clientY: 150 });
    expect(readView(layer).scale).toBeGreaterThan(FIT);
  });

  it('a roda para o outro lado reduz, sem passar do mínimo (o mapa inteiro)', () => {
    const { viewport, layer } = renderMap();
    fireEvent.wheel(viewport, { deltaY: 5000, clientX: 200, clientY: 150 });
    expect(readView(layer).scale).toBeCloseTo(FIT, 5);
  });

  it('um dedo arrasta o mapa quando ele está ampliado', () => {
    const { viewport, layer } = renderMap();
    fireEvent.wheel(viewport, { deltaY: -600, clientX: 200, clientY: 150 });
    const before = readView(layer);
    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 200, clientY: 150 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 170, clientY: 140 });
    fireEvent.pointerUp(viewport, { pointerId: 1, clientX: 170, clientY: 140 });
    const after = readView(layer);
    expect(after.x).toBeCloseTo(before.x - 30, 3);
    expect(after.y).toBeCloseTo(before.y - 10, 3);
    expect(after.scale).toBe(before.scale);
  });

  it('dois dedos afastando ampliam (pinça)', () => {
    const { viewport, layer } = renderMap();
    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 180, clientY: 150 });
    fireEvent.pointerDown(viewport, { pointerId: 2, clientX: 220, clientY: 150 });
    fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 300, clientY: 150 });
    fireEvent.pointerUp(viewport, { pointerId: 2 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    expect(readView(layer).scale).toBeGreaterThan(FIT);
  });

  it('os botões Ampliar, Reduzir e Ajustar funcionam sem gesto', () => {
    const { layer } = renderMap();
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar o mapa' }));
    const zoomed = readView(layer).scale;
    expect(zoomed).toBeGreaterThan(FIT);
    fireEvent.click(screen.getByRole('button', { name: 'Reduzir o mapa' }));
    expect(readView(layer).scale).toBeLessThan(zoomed);
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar o mapa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar o mapa ao Palco' }));
    expect(readView(layer).scale).toBeCloseTo(FIT, 5);
  });

  it('+ amplia e a seta para a esquerda olha para a esquerda (o mapa desliza para a direita)', () => {
    const { viewport, layer } = renderMap();
    fireEvent.keyDown(viewport, { key: '+' });
    fireEvent.keyDown(viewport, { key: '+' });
    const before = readView(layer);
    act(() => {
      fireEvent.keyDown(viewport, { key: 'ArrowLeft' });
    });
    expect(readView(layer).x).toBeGreaterThan(before.x);
  });

  it('impede o navegador de rolar a página sobre o mapa', () => {
    const { viewport } = renderMap();
    expect(viewport.className).toContain('touch-none');
  });
});

describe('PanZoomViewport: modo cobrir (o editor de recorte)', () => {
  const wide = { width: 1000, height: 500 };

  it('começa cobrindo o Palco inteiro, sem vazio, em vez de mostrar o mapa inteiro', () => {
    render(
      <PanZoomViewport content={wide} label="Recorte" fit="cover">
        <div>imagem</div>
      </PanZoomViewport>,
    );
    const view = readView(screen.getByTestId('camada-do-mapa'));
    expect(view.scale).toBeCloseTo(300 / 500, 5); // a altura manda; sobra largura dos lados
    expect(view.x).toBeCloseTo((400 - 1000 * view.scale) / 2, 3);
  });

  it('não deixa reduzir abaixo de cobrir o Palco', () => {
    render(
      <PanZoomViewport content={wide} label="Recorte" fit="cover">
        <div>imagem</div>
      </PanZoomViewport>,
    );
    fireEvent.wheel(screen.getByRole('group', { name: 'Recorte' }), { deltaY: 5000 });
    expect(readView(screen.getByTestId('camada-do-mapa')).scale).toBeCloseTo(0.6, 5);
  });

  it('a vista de agora fica à mão de quem desenha por cima, e o overlay não acompanha o zoom', () => {
    const apiRef = {
      current: null as null | { getView: () => unknown; getViewport: () => unknown },
    };
    render(
      <PanZoomViewport
        content={wide}
        label="Recorte"
        fit="cover"
        apiRef={apiRef as never}
        overlay={<span>grade</span>}
      >
        <div>imagem</div>
      </PanZoomViewport>,
    );
    expect(apiRef.current?.getViewport()).toEqual({ width: 400, height: 300 });
    expect(apiRef.current?.getView()).toMatchObject({ scale: expect.closeTo(0.6, 5) });
    expect(screen.getByText('grade').closest('[data-testid="camada-do-mapa"]')).toBeNull();
  });
});
