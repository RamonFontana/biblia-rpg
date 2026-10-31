// A cena do mapa (CONTEXT.md: Mapa, pin, Bandeja): onde cada Retrato está no mapa e quem espera na
// Bandeja. Parte dos Retratos de `buildRetratos`, mas deixa o inimigo com pin aparecer fora do combate.
import { distanceInMeters, type Cell } from '@/domain/map/grid';
import {
  effectiveAmbient,
  isSeen,
  lightLevelAt,
  type Ambient,
  type LightLevel,
  type LightSource,
} from '@/domain/map/light';
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
  /** A luz no pin (de um inimigo ou NPC): raio de Luz plena e faixa de Penumbra, em metros. */
  light_bright_m?: number | null;
  light_dim_m?: number | null;
}

/** Uma linha de `session_map_lights`: uma Fonte de luz fixa no mapa. */
export interface LightRow {
  id: string;
  map_id: string;
  col: number;
  row: number;
  bright_m: number;
  dim_m: number;
  label: string;
}

export type Viewer = 'gm' | 'player' | 'spectator';

export interface ScenePin {
  retrato: Retrato;
  cell: Cell;
  /** É quem age agora no combate. */
  turn: boolean;
  /** A luz no Quadrado dele. */
  level: LightLevel;
}

export interface MapScene {
  pins: ScenePin[];
  /** Quem ainda não tem posição neste mapa: só o Mestre vê. */
  tray: Retrato[];
  /** O Ambiente de agora (o fixado no mapa ou o do período). */
  ambient: Ambient;
  /** As Fontes de luz que iluminam a cena: as fixas e as dos pins que aparecem. */
  sources: LightSource[];
  /** As luzes fixas do mapa, para o Mestre mover. */
  lights: LightRow[];
}

/** O id do Retrato a que o pin se refere. */
export const pinRetratoId = (pin: Pick<PinRow, 'character_id' | 'npc_id'>): string | null =>
  pin.character_id ?? pin.npc_id;

/** O nome acessível de um Retrato no mapa: nome, PV e se está caído ou Oculto. */
export const pinLabel = (retrato: Retrato): string =>
  `${retrato.name}, ${retrato.pv} de ${retrato.pvMax} PV${retrato.down ? ', caído' : ''}${retrato.hidden ? ', oculto' : ''}`;

/** A que coluna do pin o Retrato se liga: o NPC simples é uma linha própria; o resto é uma ficha. */
export const pinTargetOf = (retrato: Retrato): PinTarget =>
  retrato.kind === 'npc' && retrato.npc?.is_playable === false
    ? { kind: 'npc', id: retrato.id }
    : { kind: 'character', id: retrato.id };

interface SceneInput extends Omit<BuildInput, 'extraEnemies' | 'includeHidden'> {
  pins: PinRow[];
  viewer: Viewer;
  /** Quem age agora no combate (o `entity_id` do participante do turno). */
  turnEntityId?: string;
  /** As luzes fixas do mapa. */
  lights?: LightRow[];
  /** O Ambiente que o Mestre fixou no mapa; nulo segue o período. */
  ambient?: string | null;
  /** O período da sessão (Manhã, Tarde, Noite). */
  period?: string | null;
}

export function buildMapScene({
  pins,
  viewer,
  turnEntityId,
  lights = [],
  ambient: fixedAmbient = null,
  period = null,
  ...input
}: SceneInput): MapScene {
  const placed = new Set(pins.map(pinRetratoId).filter((id): id is string => id !== null));
  const gm = viewer === 'gm';
  const retratos = buildRetratos({
    ...input,
    includeHidden: gm,
    extraEnemies: gm ? 'all' : placed,
  });
  const cells = new Map(pins.map((pin) => [pinRetratoId(pin), pin]));
  const ambient = effectiveAmbient(fixedAmbient, period);

  const placedPins: { retrato: Retrato; cell: Cell }[] = [];
  const tray: Retrato[] = [];
  for (const retrato of retratos) {
    const pin = cells.get(retrato.id);
    if (pin) placedPins.push({ retrato, cell: { col: pin.col, row: pin.row } });
    else if (gm) tray.push(retrato);
  }

  // As luzes dos pins só contam se o pin aparece (um Oculto não denuncia o lugar nem ilumina).
  const sources: LightSource[] = [
    ...lights.map((l) => ({
      cell: { col: l.col, row: l.row },
      brightM: l.bright_m,
      dimM: l.dim_m,
    })),
    ...placedPins.flatMap(({ retrato, cell }) => {
      const pin = cells.get(retrato.id);
      return pin?.light_bright_m != null && pin.light_dim_m != null
        ? [{ cell, brightM: pin.light_bright_m, dimM: pin.light_dim_m }]
        : [];
    }),
  ];

  const scenePins = placedPins
    .map(({ retrato, cell }) => ({
      retrato,
      cell,
      turn: retrato.id === turnEntityId,
      level: lightLevelAt(cell, ambient, sources),
    }))
    // O grupo aparece sempre; inimigos e NPCs, só em Luz plena ou Penumbra. O Mestre vê todos.
    .filter(({ retrato, level }) => gm || retrato.kind === 'player' || isSeen(level));

  return { pins: scenePins, tray, ambient, sources, lights };
}

/**
 * A distância em metros do pin de `fromId` até cada um dos outros pins (a diagonal vale um Quadrado).
 * Quem não tem pin neste mapa fica de fora; sem o pin de `fromId`, não há distância nenhuma. O
 * Ataque a mostra ao jogador e nunca o trava por ela.
 */
export function distancesFrom(scene: MapScene, fromId: string): Record<string, number> {
  const from = scene.pins.find((pin) => pin.retrato.id === fromId);
  if (!from) return {};
  return Object.fromEntries(
    scene.pins
      .filter((pin) => pin.retrato.id !== fromId)
      .map((pin) => [pin.retrato.id, distanceInMeters(from.cell, pin.cell)]),
  );
}
