// A cena do mapa (CONTEXT.md: Mapa, pin, Bandeja): onde cada Retrato está no mapa e quem espera na
// Bandeja. Parte dos Retratos de `buildRetratos`, mas deixa o inimigo com pin aparecer fora do combate.
import type { Cell } from '@/domain/map/grid';
import type { PinTarget } from '@/data-access/mapPins';
import { buildRetratos, type BuildInput, type Retrato } from './retratos';

/** Uma linha de `session_map_pins`: o Retrato é o personagem ou o NPC simples (um dos dois). */
export interface PinRow {
  id: string;
  map_id: string;
  character_id: string | null;
  npc_id: string | null;
  col: number;
  row: number;
}

export type Viewer = 'gm' | 'player' | 'spectator';

export interface ScenePin {
  retrato: Retrato;
  cell: Cell;
}

export interface MapScene {
  pins: ScenePin[];
  /** Quem ainda não tem posição neste mapa: só o Mestre vê. */
  tray: Retrato[];
}

/** O id do Retrato a que o pin se refere. */
export const pinRetratoId = (pin: Pick<PinRow, 'character_id' | 'npc_id'>): string | null =>
  pin.character_id ?? pin.npc_id;

/** O nome acessível de um Retrato no mapa: nome, PV e se está caído ou escondido. */
export const pinLabel = (retrato: Retrato): string =>
  `${retrato.name}, ${retrato.pv} de ${retrato.pvMax} PV${retrato.down ? ', caído' : ''}${retrato.hidden ? ', escondido' : ''}`;

/** A que coluna do pin o Retrato se liga: o NPC simples é uma linha própria; o resto é uma ficha. */
export const pinTargetOf = (retrato: Retrato): PinTarget =>
  retrato.kind === 'npc' && retrato.npc?.is_playable === false
    ? { kind: 'npc', id: retrato.id }
    : { kind: 'character', id: retrato.id };

interface SceneInput extends Omit<BuildInput, 'extraEnemies' | 'includeHiddenNpcs'> {
  pins: PinRow[];
  viewer: Viewer;
}

export function buildMapScene({ pins, viewer, ...input }: SceneInput): MapScene {
  const placed = new Set(pins.map(pinRetratoId).filter((id): id is string => id !== null));
  const gm = viewer === 'gm';
  const retratos = buildRetratos({
    ...input,
    includeHiddenNpcs: gm,
    extraEnemies: gm ? 'all' : placed,
  });
  const cells = new Map(pins.map((pin) => [pinRetratoId(pin), { col: pin.col, row: pin.row }]));

  const placedPins: ScenePin[] = [];
  const tray: Retrato[] = [];
  for (const retrato of retratos) {
    const cell = cells.get(retrato.id);
    if (cell) placedPins.push({ retrato, cell });
    else if (gm) tray.push(retrato);
  }
  return { pins: placedPins, tray };
}
