// O Mapa atual no Palco (CONTEXT.md, Palco, Mapa, Retrato): o terreno da Biblioteca com o grid de
// Quadrados e, por cima, os pins dos Retratos. Só o Mestre arrasta os pins; todos os tocam para abrir
// o cartão. As coordenadas do desenho estão em Quadrados (1 unidade = 1,5 m).
import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, Flame, X } from 'lucide-react';
import type { SessionMap } from '@/data-access/maps';
import { findMapLibraryEntry } from '@/content/maps';
import { PanZoomViewport, type ViewApi } from '@/components/map/PanZoomViewport';
import { CharacterAvatar } from '@/components/ui/CharacterAvatar';
import {
  distanceInMeters,
  distanceInSquares,
  formatMeters,
  isInsideGrid,
  snapToCell,
  type Cell,
} from '@/domain/map/grid';
import type { MapScene, LightRow } from '@/lib/mapScene';
import { TORCH_LIGHT } from '@/domain/torch';
import type { Retrato } from '@/lib/retratos';
import { Bandeja } from './Bandeja';
import { DarknessLayer } from './DarknessLayer';
import { LightToken } from './LightToken';
import { RadiusField } from './RadiusField';
import { MasterMapBackground } from './MasterMapBackground';
import { PinToken } from './PinToken';

// Pixels de um Quadrado sem zoom: o mapa inteiro é colunas × CELL por linhas × CELL.
const CELL = 48;
/** Abaixo disto o gesto é um toque (abre o cartão); acima, um arrasto. */
const DRAG_THRESHOLD = 5;

interface MapaDoPalcoProps {
  map: SessionMap;
  scene?: MapScene;
  /** Só o Mestre arrasta os pins e vê a Bandeja. */
  isGm?: boolean;
  onOpenRetrato?: (retrato: Retrato) => void;
  /** Oculta o Retrato visível ou revela o Oculto. Só o Mestre, e nunca o personagem de jogador. */
  onToggleHidden?: (retrato: Retrato) => void;
  /** Põe o Retrato num Quadrado, ou o devolve à Bandeja com nulo. */
  onMovePin?: (retrato: Retrato, cell: Cell | null) => void;
  /** O que só o Mestre faz com a luz: o Ambiente, as luzes fixas e a luz no pin. */
  gm?: GmMapActions;
  /** O "Ver como" do Mestre: vai na barra do mapa, ou sozinho quando ele já olha pela Visão de alguém. */
  visionControl?: ReactNode;
}

export interface GmMapActions {
  /** Fixa o Ambiente do mapa; nulo volta a seguir o período. */
  onSetAmbient: (ambient: 'claro' | 'penumbra' | 'escuridao' | null) => void;
  onAddLight: () => void;
  onMoveLight: (light: LightRow, cell: Cell) => void;
  onChangeLight: (id: string, patch: { brightM?: number; dimM?: number; label?: string }) => void;
  onRemoveLight: (id: string) => void;
  /** Acende (ou muda) a luz no pin do Retrato; nulo apaga. */
  onSetPinLight: (retrato: Retrato, light: { brightM: number; dimM: number } | null) => void;
  /** Acende (gasta uma Tocha do inventário) ou apaga a Tocha do personagem de jogador. */
  onSetTorch: (retrato: Retrato, lit: boolean) => void;
}

const AMBIENT_NAME = { claro: 'Claro', penumbra: 'Penumbra', escuridao: 'Escuridão' } as const;

interface LightDrag {
  light: LightRow;
  x: number;
  y: number;
  cell: Cell | null;
}

interface Drag {
  retrato: Retrato;
  from: Cell | null;
  x: number;
  y: number;
  /** O Quadrado sob o dedo, ou nulo fora do mapa. */
  cell: Cell | null;
  overTray: boolean;
}

const EMPTY_SCENE: MapScene = {
  pins: [],
  tray: [],
  ambient: 'claro',
  sources: [],
  lights: [],
};

export function MapaDoPalco({
  map,
  scene = EMPTY_SCENE,
  isGm = false,
  onOpenRetrato,
  onToggleHidden,
  onMovePin,
  gm,
  visionControl,
}: MapaDoPalcoProps) {
  // O fundo vem da Biblioteca (terreno liso) ou da imagem de um mapa do Mestre.
  const entry = map.library_id ? findMapLibraryEntry(map.library_id) : undefined;
  const unavailable = map.library_id !== null && !entry;
  const label = `Mapa: ${map.name}`;
  const viewApi = useRef<ViewApi>(null);
  const press = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  // O Retrato que o Mestre tocou: a barra de ações aparece embaixo do mapa.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [lightDrag, setLightDrag] = useState<LightDrag | null>(null);

  if (unavailable) {
    return (
      <section
        aria-label={label}
        className="rounded-lg border border-stone-800 bg-stone-950/40 p-6 text-center text-sm text-stone-500"
      >
        Mapa indisponível.
      </section>
    );
  }

  /** Onde o dedo está: na Bandeja, no mapa (com o Quadrado) ou fora de ambos. */
  const locate = (clientX: number, clientY: number): Pick<Drag, 'cell' | 'overTray'> => {
    // Fora da janela do navegador não há elemento: soltar ali cancela (a conta do mapa não vale).
    const canHitTest = typeof document.elementFromPoint === 'function';
    const under = canHitTest ? document.elementFromPoint(clientX, clientY) : null;
    if (canHitTest && !under) return { cell: null, overTray: false };
    if (under?.closest('[data-bandeja]')) return { cell: null, overTray: true };
    if (under && !under.closest('[data-area-do-mapa]')) return { cell: null, overTray: false };
    const point = viewApi.current?.clientToContent(clientX, clientY);
    if (!point) return { cell: null, overTray: false };
    const square = { x: point.x / CELL, y: point.y / CELL };
    const inside = isInsideGrid(
      { col: Math.floor(square.x), row: Math.floor(square.y) },
      map.columns,
      map.rows,
    );
    return { cell: inside ? snapToCell(square, map.columns, map.rows) : null, overTray: false };
  };

  const handlersFor = (retrato: Retrato, from: Cell | null) => {
    const open = () => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      if (isGm) {
        setSelectedId(retrato.id);
        setSelectedLightId(null);
      } else onOpenRetrato?.(retrato);
    };
    if (!isGm) return { onClick: open };

    return {
      onClick: open,
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        // O pin é do pin: o mapa por baixo não deve arrastar junto.
        event.stopPropagation();
        suppressClick.current = false;
        press.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      },
      onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
        const start = press.current;
        if (!start || start.id !== event.pointerId) return;
        if (
          !start.moved &&
          Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD
        ) {
          return;
        }
        start.moved = true;
        setDrag({
          retrato,
          from,
          x: event.clientX,
          y: event.clientY,
          ...locate(event.clientX, event.clientY),
        });
      },
      onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
        const start = press.current;
        if (!start || start.id !== event.pointerId) return;
        press.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        if (!start.moved) return;
        suppressClick.current = true;
        const target = locate(event.clientX, event.clientY);
        setDrag(null);
        if (target.overTray) onMovePin?.(retrato, null);
        else if (target.cell) onMovePin?.(retrato, target.cell);
      },
      onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (press.current?.id !== event.pointerId) return;
        press.current = null;
        setDrag(null);
      },
    };
  };

  const lightHandlers = (light: LightRow) => ({
    onClick: () => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      setSelectedLightId(light.id);
      setSelectedId(null);
    },
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      suppressClick.current = false;
      press.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const start = press.current;
      if (!start || start.id !== event.pointerId) return;
      if (
        !start.moved &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD
      ) {
        return;
      }
      start.moved = true;
      setLightDrag({
        light,
        x: event.clientX,
        y: event.clientY,
        cell: locate(event.clientX, event.clientY).cell,
      });
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const start = press.current;
      if (!start || start.id !== event.pointerId) return;
      press.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      if (!start.moved) return;
      suppressClick.current = true;
      const target = locate(event.clientX, event.clientY);
      setLightDrag(null);
      if (target.cell) gm?.onMoveLight(light, target.cell);
    },
    onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (press.current?.id !== event.pointerId) return;
      press.current = null;
      setLightDrag(null);
    },
  });

  const selectedLight = isGm ? scene.lights.find((l) => l.id === selectedLightId) : undefined;
  const selected = isGm
    ? [...scene.pins.map((pin) => pin.retrato), ...scene.tray].find((r) => r.id === selectedId)
    : undefined;
  const selectedPin = selected
    ? scene.pins.find((pin) => pin.retrato.id === selected.id)
    : undefined;
  const me = isGm ? undefined : scene.pins.find((pin) => pin.retrato.isMe);
  const patternId = `textura-${map.id}`;
  const vertical = Array.from({ length: map.columns - 1 }, (_, i) => i + 1);
  const horizontal = Array.from({ length: map.rows - 1 }, (_, i) => i + 1);

  const ruler =
    drag?.cell && drag.from
      ? `${distanceInSquares(drag.from, drag.cell)} ${distanceInSquares(drag.from, drag.cell) === 1 ? 'Quadrado' : 'Quadrados'} · ${formatMeters(distanceInMeters(drag.from, drag.cell))}`
      : null;

  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-lg border border-stone-800 bg-stone-950/40"
    >
      <PanZoomViewport
        key={map.id}
        label={`Área do mapa ${map.name}`}
        content={{ width: map.columns * CELL, height: map.rows * CELL }}
        className="h-[60vh]"
        apiRef={viewApi}
        controls={
          isGm ? null : (
            <button
              type="button"
              aria-label={
                me
                  ? 'Centralizar no meu personagem'
                  : 'Centralizar no meu personagem (seu personagem não está no mapa)'
              }
              title={me ? 'Centralizar no meu personagem' : 'Seu personagem não está no mapa'}
              disabled={!me}
              onClick={() =>
                me &&
                viewApi.current?.centerOn({
                  x: (me.cell.col + 0.5) * CELL,
                  y: (me.cell.row + 0.5) * CELL,
                })
              }
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-700 bg-stone-900/90 text-stone-200 hover:border-amber-500/60 hover:text-amber-500 disabled:opacity-40 disabled:hover:border-stone-700 disabled:hover:text-stone-200"
            >
              <Crosshair className="h-5 w-5" />
            </button>
          )
        }
      >
        <svg
          viewBox={`0 0 ${map.columns} ${map.rows}`}
          width={map.columns * CELL}
          height={map.rows * CELL}
          className="block"
          role="presentation"
        >
          {entry ? (
            <>
              <defs>
                <pattern id={patternId} width="2" height="2" patternUnits="userSpaceOnUse">
                  <circle cx="0.4" cy="0.5" r="0.06" fill={entry.speck} />
                  <circle cx="1.45" cy="1.2" r="0.05" fill={entry.speck} />
                  <circle cx="0.9" cy="1.7" r="0.04" fill={entry.speck} />
                </pattern>
              </defs>
              <rect width={map.columns} height={map.rows} fill={entry.fill} />
              <rect width={map.columns} height={map.rows} fill={`url(#${patternId})`} />
            </>
          ) : (
            map.master_map_id && (
              <MasterMapBackground
                mapId={map.master_map_id}
                columns={map.columns}
                rows={map.rows}
              />
            )
          )}
          {map.grid_visible && (
            <g
              data-testid="grid-do-mapa"
              data-vertical={vertical.length}
              data-horizontal={horizontal.length}
              className="text-stone-950/40"
              stroke="currentColor"
              strokeWidth={1}
            >
              {vertical.map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={map.rows}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {horizontal.map((y) => (
                <line
                  key={`h${y}`}
                  x1={0}
                  y1={y}
                  x2={map.columns}
                  y2={y}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )}
          <DarknessLayer
            mapId={map.id}
            ambient={scene.ambient}
            sources={scene.sources}
            columns={map.columns}
            rows={map.rows}
            lighter={isGm}
          />
          {(drag?.cell ?? lightDrag?.cell) && (
            <rect
              data-testid="quadrado-de-destino"
              x={(drag?.cell ?? lightDrag?.cell)!.col}
              y={(drag?.cell ?? lightDrag?.cell)!.row}
              width={1}
              height={1}
              fill="none"
              className="text-amber-400"
              stroke="currentColor"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {scene.pins.map(({ retrato, cell, turn }) => (
          <PinToken
            key={retrato.id}
            retrato={retrato}
            col={cell.col}
            row={cell.row}
            size={CELL}
            turn={turn}
            lifted={drag?.retrato.id === retrato.id}
            draggable={isGm}
            handlers={handlersFor(retrato, cell)}
          />
        ))}
        {isGm &&
          scene.lights.map((light) => (
            <LightToken
              key={light.id}
              light={light}
              size={CELL}
              selected={light.id === selectedLightId}
              lifted={lightDrag?.light.id === light.id}
              handlers={lightHandlers(light)}
            />
          ))}
      </PanZoomViewport>

      {isGm && gm && (
        <div className="absolute top-2 left-2 z-[5] flex flex-wrap items-center gap-2 rounded-lg border border-stone-700 bg-stone-900/90 p-1.5 text-xs text-stone-200">
          <label className="flex items-center gap-1">
            <span>Ambiente</span>
            <select
              aria-label="Ambiente do mapa"
              value={map.ambient ?? ''}
              onChange={(e) =>
                gm.onSetAmbient(
                  e.target.value === ''
                    ? null
                    : (e.target.value as 'claro' | 'penumbra' | 'escuridao'),
                )
              }
              className="h-9 rounded-md border border-stone-700 bg-stone-800 px-1 text-sm text-stone-100"
            >
              <option value="">Segue o período</option>
              <option value="claro">Claro</option>
              <option value="penumbra">Penumbra</option>
              <option value="escuridao">Escuridão</option>
            </select>
          </label>
          <span>Agora: {AMBIENT_NAME[scene.ambient]}</span>
          <button
            type="button"
            onClick={gm.onAddLight}
            className="flex min-h-9 items-center gap-1 rounded-md border border-stone-700 px-2 text-stone-100 hover:border-amber-500/60"
          >
            <Flame className="h-4 w-4" aria-hidden="true" />
            Somar luz
          </button>
          {visionControl}
        </div>
      )}
      {!(isGm && gm) && visionControl && (
        <div className="absolute top-2 left-2 z-[5] flex flex-wrap items-center gap-2 rounded-lg border border-stone-700 bg-stone-900/90 p-1.5 text-xs text-stone-200">
          {visionControl}
        </div>
      )}

      {isGm && gm && selectedLight && (
        <div
          role="group"
          aria-label={`Ajustes da luz ${selectedLight.label}`}
          className="absolute top-2 right-2 left-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-stone-700 bg-stone-900/95 p-2 text-sm text-stone-200 shadow-lg"
        >
          <NameField
            key={selectedLight.label}
            value={selectedLight.label}
            onCommit={(label) => gm.onChangeLight(selectedLight.id, { label })}
          />
          <RadiusField
            key={`b${selectedLight.bright_m}`}
            label="Luz plena (m)"
            value={selectedLight.bright_m}
            onCommit={(brightM) => gm.onChangeLight(selectedLight.id, { brightM })}
          />
          <RadiusField
            key={`d${selectedLight.dim_m}`}
            label="Penumbra (m)"
            value={selectedLight.dim_m}
            onCommit={(dimM) => gm.onChangeLight(selectedLight.id, { dimM })}
          />
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => {
                gm.onRemoveLight(selectedLight.id);
                setSelectedLightId(null);
              }}
              className="min-h-11 rounded-md border border-red-900/70 px-3 text-red-300 hover:border-red-500/60"
            >
              Remover luz
            </button>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setSelectedLightId(null)}
              className="min-h-11 rounded-md border border-stone-700 px-3 text-stone-100 hover:border-amber-500/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {isGm && selected && (
        <div
          role="group"
          aria-label={`Ações de ${selected.name}`}
          className="absolute top-2 right-2 left-2 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-stone-700 bg-stone-900/95 p-2 text-sm text-stone-200 shadow-lg"
        >
          <span className="font-medium">{selected.name}</span>
          {selected.kind !== 'player' && (
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${
                selected.hidden
                  ? 'border-amber-500/60 text-amber-400'
                  : 'border-stone-600 text-stone-300'
              }`}
            >
              {selected.hidden ? 'Oculto' : 'Visível'}
            </span>
          )}
          {gm && selected.kind === 'player' && selectedPin && (
            <button
              type="button"
              aria-label={`${selectedPin.torch ? 'Apagar' : 'Acender'} Tocha de ${selected.name}`}
              onClick={() => gm.onSetTorch(selected, !selectedPin.torch)}
              className="flex min-h-11 items-center gap-1 rounded-md border border-stone-700 px-3 text-stone-100 hover:border-amber-500/60"
            >
              <Flame className="h-4 w-4" aria-hidden="true" />
              {selectedPin.torch ? 'Apagar Tocha' : 'Acender Tocha'}
            </button>
          )}
          {gm && selected.kind !== 'player' && selectedPin && (
            <PinLightControls
              retrato={selected}
              light={selectedPin.light ?? null}
              onChange={(light) => gm.onSetPinLight(selected, light)}
            />
          )}
          <div className="ml-auto flex gap-2">
            {selected.kind !== 'player' && onToggleHidden && (
              <button
                type="button"
                aria-label={`${selected.hidden ? 'Revelar' : 'Ocultar'} ${selected.name}`}
                onClick={() => onToggleHidden(selected)}
                className="min-h-11 rounded-md border border-stone-700 px-3 text-stone-100 hover:border-amber-500/60"
              >
                {selected.hidden ? 'Revelar' : 'Ocultar'}
              </button>
            )}
            <button
              type="button"
              aria-label={`Abrir o cartão de ${selected.name}`}
              onClick={() => onOpenRetrato?.(selected)}
              className="min-h-11 rounded-md border border-stone-700 px-3 text-stone-100 hover:border-amber-500/60"
            >
              Abrir cartão
            </button>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setSelectedId(null)}
              className="min-h-11 rounded-md border border-stone-700 px-3 text-stone-100 hover:border-amber-500/60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {isGm && (
        <Bandeja
          retratos={scene.tray}
          handlersFor={(retrato) => handlersFor(retrato, null)}
          liftedId={drag?.retrato.id}
        />
      )}

      {drag &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-50"
            style={{ left: drag.x - 24, top: drag.y - 24 }}
          >
            <CharacterAvatar
              imageUrl={drag.retrato.imageUrl}
              name={drag.retrato.name}
              className="h-12 w-12 border-2 border-amber-400 shadow-lg"
            />
            {ruler && (
              <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded-full bg-stone-950/90 px-2 py-0.5 text-xs whitespace-nowrap text-amber-300">
                {ruler}
              </span>
            )}
          </div>,
          document.body,
        )}

      {lightDrag &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400 bg-stone-900/90 text-amber-400 shadow-lg"
            style={{ left: lightDrag.x - 24, top: lightDrag.y - 24 }}
          >
            <Flame className="h-7 w-7" />
          </div>,
          document.body,
        )}
    </section>
  );
}

/** O nome de uma luz fixa: digita-se à vontade e grava ao sair do campo, se mudou e não ficou vazio. */
function NameField({ value, onCommit }: { value: string; onCommit: (name: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <label className="flex items-center gap-1 text-xs text-stone-300">
      <span>Nome da luz</span>
      <input
        value={draft}
        maxLength={40}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const next = draft.trim();
          if (next && next !== value) onCommit(next);
          else setDraft(value);
        }}
        className="h-9 w-32 rounded-md border border-stone-700 bg-stone-800 px-2 text-sm text-stone-100"
      />
    </label>
  );
}

/** A luz que um inimigo ou NPC carrega no pin: acende com 6 m + 6 m, ajusta os raios e apaga. */
function PinLightControls({
  retrato,
  light,
  onChange,
}: {
  retrato: Retrato;
  light: { brightM: number; dimM: number } | null;
  onChange: (light: { brightM: number; dimM: number } | null) => void;
}) {
  if (!light) {
    return (
      <button
        type="button"
        aria-label={`Acender luz em ${retrato.name}`}
        onClick={() => onChange({ ...TORCH_LIGHT })}
        className="flex min-h-11 items-center gap-1 rounded-md border border-stone-700 px-3 text-stone-100 hover:border-amber-500/60"
      >
        <Flame className="h-4 w-4" aria-hidden="true" />
        Acender luz
      </button>
    );
  }
  return (
    <>
      <RadiusField
        key={`b${light.brightM}`}
        label="Luz plena (m)"
        value={light.brightM}
        onCommit={(brightM) => onChange({ ...light, brightM })}
      />
      <RadiusField
        key={`d${light.dimM}`}
        label="Penumbra (m)"
        value={light.dimM}
        onCommit={(dimM) => onChange({ ...light, dimM })}
      />
      <button
        type="button"
        aria-label={`Apagar luz de ${retrato.name}`}
        onClick={() => onChange(null)}
        className="min-h-11 rounded-md border border-stone-700 px-3 text-stone-100 hover:border-amber-500/60"
      >
        Apagar luz
      </button>
    </>
  );
}
