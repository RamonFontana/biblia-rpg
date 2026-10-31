import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapScene } from '@/lib/mapScene';
import type { Retrato } from '@/lib/retratos';
import type { SessionMap } from '@/data-access/maps';
vi.mock('@/data-access/masterMaps', () => ({ getMasterMapImage: vi.fn() }));

import { MapaDoPalco } from './MapaDoPalco';

const map: SessionMap = {
  id: 'm1',
  session_id: 's1',
  library_id: 'terreno-areia',
  master_map_id: null,
  name: 'Deserto de Zim',
  columns: 20,
  rows: 15,
  grid_visible: true,
  ambient: null,
  position: 0,
  created_at: '2026-11-01T00:00:00Z',
};

describe('MapaDoPalco', () => {
  it('anuncia o nome do Mapa atual', () => {
    render(<MapaDoPalco map={map} />);
    expect(screen.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeInTheDocument();
  });

  it('desenha o grid com uma linha por divisão de Quadrado', () => {
    render(<MapaDoPalco map={map} />);
    const grid = screen.getByTestId('grid-do-mapa');
    // 19 divisões internas em 20 colunas e 14 em 15 linhas.
    expect(grid.getAttribute('data-vertical')).toBe('19');
    expect(grid.getAttribute('data-horizontal')).toBe('14');
  });

  it('esconde as linhas quando o Mestre as desliga, sem perder o mapa', () => {
    render(<MapaDoPalco map={{ ...map, grid_visible: false }} />);
    expect(screen.queryByTestId('grid-do-mapa')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeInTheDocument();
  });

  it('avisa quando o mapa da Biblioteca não existe mais', () => {
    render(<MapaDoPalco map={{ ...map, library_id: 'terreno-sumiu' }} />);
    expect(screen.getByText('Mapa indisponível.')).toBeInTheDocument();
  });
});

// jsdom não mede nada: o Palco tem 400×300 e o mapa 20×15 Quadrados de 48 px (960×720), então o
// mapa inteiro cabe com escala 300/720 e cada Quadrado mede 20 px na tela.
const SQUARE = 20;
const at = (col: number, row: number) => ({
  clientX: col * SQUARE + SQUARE / 2,
  clientY: row * SQUARE + SQUARE / 2,
});

const retrato = (id: string, over: Partial<Retrato> = {}): Retrato => ({
  id,
  kind: 'player',
  name: id.toUpperCase(),
  pv: 8,
  pvMax: 10,
  down: false,
  conditions: [],
  isMe: false,
  ...over,
});

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 400,
    height: 300,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 400,
    bottom: 300,
    toJSON: () => ({}),
  });
});
afterEach(() => vi.restoreAllMocks());

function renderScene(scene: MapScene, over: { isGm?: boolean } = {}) {
  const onOpenRetrato = vi.fn();
  const onMovePin = vi.fn();
  const onToggleHidden = vi.fn();
  render(
    <MapaDoPalco
      map={map}
      scene={scene}
      isGm={over.isGm ?? false}
      onOpenRetrato={onOpenRetrato}
      onMovePin={onMovePin}
      onToggleHidden={onToggleHidden}
    />,
  );
  return { onOpenRetrato, onMovePin, onToggleHidden };
}

const eliabe = retrato('c1', { isMe: true });
const guarda = retrato('e1', { kind: 'enemy', pv: 12, pvMax: 12 });
const sceneWith = (over: Partial<MapScene> = {}): MapScene => ({
  ambient: 'claro',
  sources: [],
  lights: [],
  pins: [{ retrato: eliabe, cell: { col: 4, row: 2 }, turn: false, level: 'plena' as const }],
  tray: [],
  ...over,
});

describe('MapaDoPalco: pins', () => {
  it('desenha cada Retrato como botão com o nome e o PV, no Quadrado dele', () => {
    renderScene(sceneWith());
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    expect(pin).toHaveAttribute('data-col', '4');
    expect(pin).toHaveAttribute('data-row', '2');
  });

  it('tocar no pin abre o cartão do Retrato', () => {
    const { onOpenRetrato } = renderScene(sceneWith());
    fireEvent.click(screen.getByRole('button', { name: 'C1, 8 de 10 PV' }));
    expect(onOpenRetrato).toHaveBeenCalledWith(eliabe);
  });

  it('o jogador não arrasta nenhum pin', () => {
    const { onMovePin, onOpenRetrato } = renderScene(sceneWith());
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, { pointerId: 1, ...at(8, 6) });
    fireEvent.pointerUp(pin, { pointerId: 1, ...at(8, 6) });
    expect(onMovePin).not.toHaveBeenCalled();
    expect(screen.queryByText(/Quadrados?\s·/)).not.toBeInTheDocument();
    void onOpenRetrato;
  });

  it('o jogador não vê a Bandeja', () => {
    renderScene(sceneWith());
    expect(screen.queryByRole('region', { name: 'Bandeja' })).not.toBeInTheDocument();
  });
});

describe('MapaDoPalco: o Mestre arrasta', () => {
  it('um pin para outro Quadrado, que o encaixa no centro do Quadrado', () => {
    const { onMovePin } = renderScene(sceneWith(), { isGm: true });
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, { pointerId: 1, clientX: 7 * SQUARE + 3, clientY: 5 * SQUARE + 17 });
    fireEvent.pointerUp(pin, { pointerId: 1, clientX: 7 * SQUARE + 3, clientY: 5 * SQUARE + 17 });
    expect(onMovePin).toHaveBeenCalledWith(eliabe, { col: 7, row: 5 });
  });

  it('mostra a régua em Quadrados e metros enquanto arrasta', () => {
    renderScene(sceneWith(), { isGm: true });
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, { pointerId: 1, ...at(8, 4) });
    expect(screen.getByText('4 Quadrados · 6 m')).toBeInTheDocument();
    fireEvent.pointerMove(pin, { pointerId: 1, ...at(5, 2) });
    expect(screen.getByText('1 Quadrado · 1,5 m')).toBeInTheDocument();
    fireEvent.pointerUp(pin, { pointerId: 1, ...at(5, 2) });
    expect(screen.queryByText(/Quadrados?\s·/)).not.toBeInTheDocument();
  });

  it('a diagonal conta um Quadrado por passo', () => {
    renderScene(sceneWith(), { isGm: true });
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, { pointerId: 1, ...at(7, 5) });
    expect(screen.getByText('3 Quadrados · 4,5 m')).toBeInTheDocument();
  });

  it('um toque curto não move: seleciona o pin, e a barra abre o cartão', () => {
    const { onMovePin, onOpenRetrato } = renderScene(sceneWith(), { isGm: true });
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, {
      pointerId: 1,
      clientX: at(4, 2).clientX + 2,
      clientY: at(4, 2).clientY,
    });
    fireEvent.pointerUp(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.click(pin);
    expect(onMovePin).not.toHaveBeenCalled();
    expect(onOpenRetrato).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir o cartão de C1' }));
    expect(onOpenRetrato).toHaveBeenCalledWith(eliabe);
  });

  it('depois de arrastar, o clique que o navegador dispara não abre o cartão', () => {
    const { onOpenRetrato } = renderScene(sceneWith(), { isGm: true });
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, { pointerId: 1, ...at(9, 9) });
    fireEvent.pointerUp(pin, { pointerId: 1, ...at(9, 9) });
    fireEvent.click(pin);
    expect(onOpenRetrato).not.toHaveBeenCalled();
  });

  it('soltar fora do mapa cancela o movimento', () => {
    const { onMovePin } = renderScene(sceneWith(), { isGm: true });
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, { pointerId: 1, clientX: -40, clientY: 100 });
    fireEvent.pointerUp(pin, { pointerId: 1, clientX: -40, clientY: 100 });
    expect(onMovePin).not.toHaveBeenCalled();
  });

  it('arrastar um pin para a Bandeja o devolve a ela', () => {
    const { onMovePin } = renderScene(sceneWith({ tray: [guarda] }), { isGm: true });
    const tray = screen.getByRole('region', { name: 'Bandeja' });
    document.elementFromPoint = vi.fn(() => tray);
    const pin = screen.getByRole('button', { name: 'C1, 8 de 10 PV' });
    fireEvent.pointerDown(pin, { pointerId: 1, ...at(4, 2) });
    fireEvent.pointerMove(pin, { pointerId: 1, clientX: 100, clientY: 500 });
    fireEvent.pointerUp(pin, { pointerId: 1, clientX: 100, clientY: 500 });
    expect(onMovePin).toHaveBeenCalledWith(eliabe, null);
    // @ts-expect-error limpeza do que o teste instalou
    delete document.elementFromPoint;
  });
});

describe('MapaDoPalco: a Bandeja', () => {
  it('lista quem ainda não tem pin neste mapa, só para o Mestre', () => {
    renderScene(sceneWith({ tray: [guarda] }), { isGm: true });
    const tray = screen.getByRole('region', { name: 'Bandeja' });
    expect(tray).toHaveTextContent('E1');
  });

  it('diz que a Bandeja está vazia quando todos estão no mapa', () => {
    renderScene(sceneWith(), { isGm: true });
    expect(screen.getByRole('region', { name: 'Bandeja' })).toHaveTextContent(
      'Todos estão no mapa',
    );
  });

  it('arrastar da Bandeja para o mapa põe o Retrato no Quadrado', () => {
    const { onMovePin } = renderScene(sceneWith({ tray: [guarda] }), { isGm: true });
    const item = screen.getByRole('button', { name: 'E1, 12 de 12 PV, na Bandeja' });
    fireEvent.pointerDown(item, { pointerId: 1, clientX: 100, clientY: 400 });
    fireEvent.pointerMove(item, { pointerId: 1, ...at(10, 7) });
    fireEvent.pointerUp(item, { pointerId: 1, ...at(10, 7) });
    expect(onMovePin).toHaveBeenCalledWith(guarda, { col: 10, row: 7 });
  });

  it('tocar num item da Bandeja o seleciona, e a barra abre o cartão', () => {
    const { onOpenRetrato } = renderScene(sceneWith({ tray: [guarda] }), { isGm: true });
    fireEvent.click(screen.getByRole('button', { name: 'E1, 12 de 12 PV, na Bandeja' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abrir o cartão de E1' }));
    expect(onOpenRetrato).toHaveBeenCalledWith(guarda);
  });
});

describe('MapaDoPalco: centralizar no personagem', () => {
  it('fica desabilitado, com o motivo, quando o jogador não tem pin', () => {
    renderScene(
      sceneWith({
        pins: [
          {
            retrato: retrato('c2'),
            cell: { col: 1, row: 1 },
            turn: false,
            level: 'plena' as const,
          },
        ],
      }),
    );
    const button = screen.getByRole('button', { name: /Centralizar no meu personagem/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName(/não está no mapa/);
  });

  it('com pin, centraliza e amplia', () => {
    renderScene(sceneWith());
    const layer = screen.getByTestId('camada-do-mapa');
    const before = layer.style.transform;
    const button = screen.getByRole('button', { name: 'Centralizar no meu personagem' });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(layer.style.transform).not.toBe(before);
  });

  it('o Mestre não tem personagem para centralizar', () => {
    renderScene(sceneWith(), { isGm: true });
    expect(screen.queryByRole('button', { name: /Centralizar/ })).not.toBeInTheDocument();
  });
});

describe('MapaDoPalco: combate', () => {
  it('destaca o pin de quem age agora, e só ele', () => {
    renderScene(
      sceneWith({
        pins: [
          { retrato: eliabe, cell: { col: 4, row: 2 }, turn: false, level: 'plena' as const },
          { retrato: guarda, cell: { col: 8, row: 5 }, turn: true, level: 'plena' as const },
        ],
      }),
    );
    expect(screen.getByRole('button', { name: 'E1, 12 de 12 PV' })).toHaveAttribute(
      'data-turn',
      'true',
    );
    expect(screen.getByRole('button', { name: 'C1, 8 de 10 PV' })).not.toHaveAttribute('data-turn');
    expect(screen.getAllByTestId('anel-do-turno')).toHaveLength(1);
  });

  it('o inimigo a 0 PV fica no mapa, apagado, e o nome diz que está caído', () => {
    const caido = retrato('e1', { kind: 'enemy', pv: 0, pvMax: 12, down: true });
    renderScene(
      sceneWith({
        pins: [{ retrato: caido, cell: { col: 3, row: 3 }, turn: false, level: 'plena' as const }],
      }),
    );
    const pin = screen.getByRole('button', { name: 'E1, 0 de 12 PV, caído' });
    expect(pin).toHaveAttribute('data-down', 'true');
    expect(pin.className).toContain('grayscale');
  });

  it('quem está de pé não vem apagado', () => {
    renderScene(sceneWith());
    expect(screen.getByRole('button', { name: 'C1, 8 de 10 PV' })).not.toHaveAttribute('data-down');
  });
});

describe('MapaDoPalco: Oculto', () => {
  const oculto = retrato('e1', { kind: 'enemy', pv: 12, pvMax: 12, hidden: true });
  const withHidden = () =>
    sceneWith({
      pins: [{ retrato: oculto, cell: { col: 8, row: 5 }, turn: false, level: 'plena' as const }],
    });

  it('o Mestre vê o pin Oculto marcado, e o nome acessível diz que está oculto', () => {
    renderScene(withHidden(), { isGm: true });
    const pin = screen.getByRole('button', { name: 'E1, 12 de 12 PV, oculto' });
    expect(pin.className).toContain('opacity-60');
    expect(pin.className).toContain('border-dashed');
  });

  it('tocar no pin do Mestre mostra a barra com o estado e o botão Revelar', () => {
    const { onToggleHidden } = renderScene(withHidden(), { isGm: true });
    fireEvent.click(screen.getByRole('button', { name: 'E1, 12 de 12 PV, oculto' }));
    const bar = screen.getByRole('group', { name: 'Ações de E1' });
    expect(bar).toHaveTextContent('Oculto');
    fireEvent.click(screen.getByRole('button', { name: 'Revelar E1' }));
    expect(onToggleHidden).toHaveBeenCalledWith(oculto);
  });

  it('quem está visível mostra o botão Ocultar', () => {
    const { onToggleHidden } = renderScene(
      sceneWith({
        pins: [{ retrato: guarda, cell: { col: 1, row: 1 }, turn: false, level: 'plena' as const }],
      }),
      { isGm: true },
    );
    fireEvent.click(screen.getByRole('button', { name: 'E1, 12 de 12 PV' }));
    expect(screen.getByRole('group', { name: 'Ações de E1' })).toHaveTextContent('Visível');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar E1' }));
    expect(onToggleHidden).toHaveBeenCalledWith(guarda);
  });

  it('o item da Bandeja também se revela antes de ir para o mapa', () => {
    const { onToggleHidden } = renderScene(sceneWith({ tray: [oculto] }), { isGm: true });
    fireEvent.click(screen.getByRole('button', { name: 'E1, 12 de 12 PV, oculto, na Bandeja' }));
    fireEvent.click(screen.getByRole('button', { name: 'Revelar E1' }));
    expect(onToggleHidden).toHaveBeenCalledWith(oculto);
  });

  it('jogador do grupo não se oculta: a barra não oferece o botão', () => {
    renderScene(sceneWith(), { isGm: true });
    fireEvent.click(screen.getByRole('button', { name: 'C1, 8 de 10 PV' }));
    expect(screen.getByRole('group', { name: 'Ações de C1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^(Revelar|Ocultar)/ })).not.toBeInTheDocument();
  });

  it('o jogador não tem a barra: tocar no pin abre o cartão direto', () => {
    const { onOpenRetrato } = renderScene(sceneWith());
    fireEvent.click(screen.getByRole('button', { name: 'C1, 8 de 10 PV' }));
    expect(onOpenRetrato).toHaveBeenCalledWith(eliabe);
    expect(screen.queryByRole('group', { name: /^Ações de/ })).not.toBeInTheDocument();
  });

  it('a barra some quando o Retrato sai da cena', () => {
    const { rerender } = (() => {
      const onToggleHidden = vi.fn();
      const view = render(
        <MapaDoPalco map={map} scene={sceneWith()} isGm onToggleHidden={onToggleHidden} />,
      );
      return { rerender: view.rerender };
    })();
    fireEvent.click(screen.getByRole('button', { name: 'C1, 8 de 10 PV' }));
    expect(screen.getByRole('group', { name: 'Ações de C1' })).toBeInTheDocument();
    rerender(<MapaDoPalco map={map} scene={sceneWith({ pins: [] })} isGm />);
    expect(screen.queryByRole('group', { name: /^Ações de/ })).not.toBeInTheDocument();
  });
});
