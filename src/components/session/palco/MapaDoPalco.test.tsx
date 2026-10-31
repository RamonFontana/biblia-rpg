import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

describe('MapaDoPalco: a escuridão', () => {
  const lit = (over: Partial<MapScene> = {}) => sceneWith({ ...over });

  it('em Ambiente claro não há máscara de escuridão', () => {
    renderScene(lit());
    expect(screen.queryByTestId('escuridao-do-mapa')).not.toBeInTheDocument();
  });

  it('à noite, o mapa do jogador escurece forte', () => {
    renderScene(lit({ ambient: 'escuridao' }));
    const dark = screen.getByTestId('escuridao-do-mapa');
    expect(dark).toHaveAttribute('data-ambient', 'escuridao');
    expect(Number(dark.getAttribute('data-opacity'))).toBeCloseTo(0.82, 2);
  });

  it('na Penumbra, escurece menos', () => {
    renderScene(lit({ ambient: 'penumbra' }));
    expect(
      Number(screen.getByTestId('escuridao-do-mapa').getAttribute('data-opacity')),
    ).toBeCloseTo(0.45, 2);
  });

  it('o Mestre vê o escuro mais leve que o jogador', () => {
    renderScene(lit({ ambient: 'escuridao' }), { isGm: true });
    expect(
      Number(screen.getByTestId('escuridao-do-mapa').getAttribute('data-opacity')),
    ).toBeCloseTo(0.41, 2);
  });

  it('cada Fonte de luz abre um círculo na máscara', () => {
    renderScene(
      lit({
        ambient: 'escuridao',
        sources: [
          { cell: { col: 4, row: 4 }, brightM: 6, dimM: 6 },
          { cell: { col: 9, row: 9 }, brightM: 3, dimM: 0 },
        ],
      }),
    );
    const dark = screen.getByTestId('escuridao-do-mapa');
    expect(dark).toHaveAttribute('data-sources', '2');
    expect(dark.querySelectorAll('mask circle')).toHaveLength(2);
  });

  it('o círculo vai do centro da fonte até o fim da Penumbra, em Quadrados', () => {
    renderScene(
      lit({ ambient: 'escuridao', sources: [{ cell: { col: 4, row: 4 }, brightM: 6, dimM: 6 }] }),
    );
    const circle = screen.getByTestId('escuridao-do-mapa').querySelector('mask circle')!;
    expect(Number(circle.getAttribute('cx'))).toBeCloseTo(4.5, 3);
    expect(Number(circle.getAttribute('cy'))).toBeCloseTo(4.5, 3);
    // 12 m = 8 Quadrados (a Luz plena de 6 m são 4).
    expect(Number(circle.getAttribute('r'))).toBeCloseTo(8, 3);
  });
});

describe('MapaDoPalco: o Mestre controla o Ambiente e as luzes', () => {
  const light = {
    id: 'l1',
    map_id: 'm1',
    col: 6,
    row: 4,
    bright_m: 6,
    dim_m: 6,
    label: 'Fogueira',
  };
  const withLight = (over: Partial<MapScene> = {}) => sceneWith({ lights: [light], ...over });

  function renderGm(scene: MapScene, over: Partial<{ ambient: string | null }> = {}) {
    const gm = {
      onSetAmbient: vi.fn(),
      onAddLight: vi.fn(),
      onMoveLight: vi.fn(),
      onChangeLight: vi.fn(),
      onRemoveLight: vi.fn(),
      onSetPinLight: vi.fn(),
      onSetTorch: vi.fn(),
    };
    render(
      <MapaDoPalco
        map={{ ...map, ambient: over.ambient ?? null }}
        scene={scene}
        isGm
        gm={gm}
        onOpenRetrato={vi.fn()}
        onMovePin={vi.fn()}
        onToggleHidden={vi.fn()}
      />,
    );
    return gm;
  }

  it('o jogador não tem controles de Ambiente nem de luz', () => {
    renderScene(withLight());
    expect(screen.queryByLabelText('Ambiente do mapa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Somar luz' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Luz Fogueira/ })).not.toBeInTheDocument();
  });

  it('o Ambiente mostra o que o Mestre fixou, e "segue o período" quando não fixou', () => {
    renderGm(sceneWith());
    expect(screen.getByLabelText('Ambiente do mapa')).toHaveValue('');
    cleanup();
    renderGm(sceneWith(), { ambient: 'penumbra' });
    expect(screen.getByLabelText('Ambiente do mapa')).toHaveValue('penumbra');
  });

  it('diz qual é o Ambiente de agora', () => {
    renderGm(sceneWith({ ambient: 'escuridao' }));
    expect(screen.getByText('Agora: Escuridão')).toBeInTheDocument();
  });

  it('fixar o Ambiente avisa quem chamou; "segue o período" manda nulo', () => {
    const gm = renderGm(sceneWith());
    fireEvent.change(screen.getByLabelText('Ambiente do mapa'), { target: { value: 'escuridao' } });
    expect(gm.onSetAmbient).toHaveBeenCalledWith('escuridao');
    fireEvent.change(screen.getByLabelText('Ambiente do mapa'), { target: { value: '' } });
    expect(gm.onSetAmbient).toHaveBeenLastCalledWith(null);
  });

  it('Somar luz pede uma luz nova', () => {
    const gm = renderGm(sceneWith());
    fireEvent.click(screen.getByRole('button', { name: 'Somar luz' }));
    expect(gm.onAddLight).toHaveBeenCalled();
  });

  it('cada luz fixa é um botão no Quadrado dela, com os raios no nome', () => {
    renderGm(withLight());
    const token = screen.getByRole('button', {
      name: 'Luz Fogueira, 6 m de Luz plena e 6 m de Penumbra',
    });
    expect(token).toHaveAttribute('data-col', '6');
    expect(token).toHaveAttribute('data-row', '4');
  });

  it('arrastar a luz para outro Quadrado a move', () => {
    const gm = renderGm(withLight());
    const token = screen.getByRole('button', { name: /^Luz Fogueira/ });
    fireEvent.pointerDown(token, { pointerId: 1, ...at(6, 4) });
    fireEvent.pointerMove(token, { pointerId: 1, ...at(9, 7) });
    fireEvent.pointerUp(token, { pointerId: 1, ...at(9, 7) });
    expect(gm.onMoveLight).toHaveBeenCalledWith(light, { col: 9, row: 7 });
  });

  it('soltar a luz fora do mapa cancela', () => {
    const gm = renderGm(withLight());
    const token = screen.getByRole('button', { name: /^Luz Fogueira/ });
    fireEvent.pointerDown(token, { pointerId: 1, ...at(6, 4) });
    fireEvent.pointerMove(token, { pointerId: 1, clientX: -50, clientY: 100 });
    fireEvent.pointerUp(token, { pointerId: 1, clientX: -50, clientY: 100 });
    expect(gm.onMoveLight).not.toHaveBeenCalled();
  });

  it('tocar na luz abre a barra com o rótulo e os raios; mudar um raio avisa ao sair do campo', () => {
    const gm = renderGm(withLight());
    fireEvent.click(screen.getByRole('button', { name: /^Luz Fogueira/ }));
    const bar = screen.getByRole('group', { name: 'Ajustes da luz Fogueira' });
    const bright = within(bar).getByLabelText('Luz plena (m)');
    expect(bright).toHaveValue(6);
    fireEvent.change(bright, { target: { value: '9' } });
    fireEvent.blur(bright);
    expect(gm.onChangeLight).toHaveBeenCalledWith('l1', { brightM: 9 });
    const dim = within(bar).getByLabelText('Penumbra (m)');
    fireEvent.change(dim, { target: { value: '3' } });
    fireEvent.blur(dim);
    expect(gm.onChangeLight).toHaveBeenLastCalledWith('l1', { dimM: 3 });
  });

  it('o raio digitado é prendido entre 0 e 120 m', () => {
    const gm = renderGm(withLight());
    fireEvent.click(screen.getByRole('button', { name: /^Luz Fogueira/ }));
    const bright = within(
      screen.getByRole('group', { name: 'Ajustes da luz Fogueira' }),
    ).getByLabelText('Luz plena (m)');
    fireEvent.change(bright, { target: { value: '500' } });
    fireEvent.blur(bright);
    expect(gm.onChangeLight).toHaveBeenCalledWith('l1', { brightM: 120 });
  });

  it('renomeia a luz e a remove pela barra', () => {
    const gm = renderGm(withLight());
    fireEvent.click(screen.getByRole('button', { name: /^Luz Fogueira/ }));
    const bar = screen.getByRole('group', { name: 'Ajustes da luz Fogueira' });
    const name = within(bar).getByLabelText('Nome da luz');
    fireEvent.change(name, { target: { value: 'Braseiro' } });
    fireEvent.blur(name);
    expect(gm.onChangeLight).toHaveBeenCalledWith('l1', { label: 'Braseiro' });
    fireEvent.click(within(bar).getByRole('button', { name: 'Remover luz' }));
    expect(gm.onRemoveLight).toHaveBeenCalledWith('l1');
  });

  it('um inimigo ou NPC acende e apaga a própria luz pela barra do pin', () => {
    const gm = renderGm(
      sceneWith({
        pins: [{ retrato: guarda, cell: { col: 2, row: 2 }, turn: false, level: 'plena' }],
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'E1, 12 de 12 PV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Acender luz em E1' }));
    expect(gm.onSetPinLight).toHaveBeenCalledWith(guarda, { brightM: 6, dimM: 6 });
  });

  it('com a luz acesa, a barra mostra os raios, apaga e ajusta', () => {
    const gm = renderGm(
      sceneWith({
        pins: [
          {
            retrato: guarda,
            cell: { col: 2, row: 2 },
            turn: false,
            level: 'plena',
            light: { brightM: 3, dimM: 4.5 },
          },
        ],
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'E1, 12 de 12 PV' }));
    const bar = screen.getByRole('group', { name: 'Ações de E1' });
    expect(within(bar).getByLabelText('Luz plena (m)')).toHaveValue(3);
    expect(within(bar).getByLabelText('Penumbra (m)')).toHaveValue(4.5);
    const bright = within(bar).getByLabelText('Luz plena (m)');
    fireEvent.change(bright, { target: { value: '6' } });
    fireEvent.blur(bright);
    expect(gm.onSetPinLight).toHaveBeenCalledWith(guarda, { brightM: 6, dimM: 4.5 });
    fireEvent.click(within(bar).getByRole('button', { name: 'Apagar luz de E1' }));
    expect(gm.onSetPinLight).toHaveBeenLastCalledWith(guarda, null);
  });

  it('o personagem de jogador não tem luz pelo pin (a Tocha é outra coisa)', () => {
    renderGm(sceneWith());
    fireEvent.click(screen.getByRole('button', { name: 'C1, 8 de 10 PV' }));
    expect(screen.queryByRole('button', { name: /luz em C1/i })).not.toBeInTheDocument();
  });

  it('o Mestre acende a Tocha de um personagem de jogador pelo pin e a apaga quando acesa', () => {
    const gm = renderGm(sceneWith());
    fireEvent.click(screen.getByRole('button', { name: 'C1, 8 de 10 PV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Acender Tocha de C1' }));
    expect(gm.onSetTorch).toHaveBeenCalledWith(eliabe, true);
  });

  it('com a Tocha acesa o botão apaga', () => {
    const gm = renderGm(
      sceneWith({
        pins: [
          {
            retrato: eliabe,
            cell: { col: 1, row: 1 },
            turn: false,
            level: 'plena',
            light: { brightM: 6, dimM: 6 },
            torch: true,
          },
        ],
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'C1, 8 de 10 PV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar Tocha de C1' }));
    expect(gm.onSetTorch).toHaveBeenCalledWith(eliabe, false);
  });
});
