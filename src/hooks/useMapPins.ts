import { useCallback, useEffect, useState } from 'react';
import {
  listMapPins,
  placePin,
  removePin,
  setPinLight,
  subscribeToMapPins,
  type PinLight,
  type PinTarget,
} from '@/data-access/mapPins';
import { pinRetratoId, type PinRow } from '@/lib/mapScene';
import type { Cell } from '@/domain/map/grid';

const keyOf = (target: PinTarget) => target.id;

/** Troca ou acrescenta um pin, sem repetir o Retrato (o eco do realtime chega com outro id). */
function withPin(pins: PinRow[], next: PinRow): PinRow[] {
  const id = pinRetratoId(next);
  return [...pins.filter((p) => p.id !== next.id && pinRetratoId(p) !== id), next];
}

/**
 * Os pins de um mapa, lidos uma vez e seguidos em tempo real. `move` põe o Retrato num Quadrado (ou
 * na Bandeja, com nulo): o pin muda na hora e a gravação confere; se falhar, relê o que o banco tem.
 */
export function useMapPins(mapId: string | undefined) {
  const [loaded, setLoaded] = useState<{ mapId: string; pins: PinRow[] } | null>(null);
  const pins = loaded && loaded.mapId === mapId ? loaded.pins : [];

  const update = useCallback(
    (id: string, change: (pins: PinRow[]) => PinRow[]) =>
      setLoaded((current) => ({
        mapId: id,
        pins: change(current && current.mapId === id ? current.pins : []),
      })),
    [],
  );

  useEffect(() => {
    if (!mapId) return;
    let active = true;
    const load = async () => {
      try {
        const list = await listMapPins(mapId);
        if (active) setLoaded({ mapId, pins: list });
      } catch (error) {
        console.error('Erro ao buscar os pins do mapa:', error);
      }
    };
    load();
    const unsubscribe = subscribeToMapPins(
      mapId,
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id?: string }).id;
          update(mapId, (list) => list.filter((p) => p.id !== oldId));
        } else {
          update(mapId, (list) => withPin(list, payload.new as unknown as PinRow));
        }
      },
      { onSubscribed: load },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [mapId, update]);

  const move = useCallback(
    async (target: PinTarget, cell: Cell | null) => {
      if (!mapId) return;
      const matches = (p: PinRow) => pinRetratoId(p) === keyOf(target);
      try {
        if (cell) {
          update(mapId, (list) =>
            withPin(list, {
              id: list.find(matches)?.id ?? `local-${target.id}`,
              map_id: mapId,
              character_id: target.kind === 'character' ? target.id : null,
              npc_id: target.kind === 'npc' ? target.id : null,
              col: cell.col,
              row: cell.row,
            }),
          );
          await placePin({ mapId, target, col: cell.col, row: cell.row });
        } else {
          update(mapId, (list) => list.filter((p) => !matches(p)));
          await removePin(mapId, target);
        }
      } catch (error) {
        console.error('Erro ao mover o pin:', error);
        try {
          setLoaded({ mapId, pins: await listMapPins(mapId) });
        } catch (reloadError) {
          console.error('Erro ao reler os pins do mapa:', reloadError);
        }
      }
    },
    [mapId, update],
  );

  /** Acende (ou muda) a luz do pin do Retrato; nulo apaga. A tela muda na hora. */
  const setLight = useCallback(
    async (target: PinTarget, light: PinLight | null) => {
      if (!mapId) return;
      update(mapId, (list) =>
        list.map((p) =>
          pinRetratoId(p) === target.id
            ? { ...p, light_bright_m: light?.brightM ?? null, light_dim_m: light?.dimM ?? null }
            : p,
        ),
      );
      try {
        await setPinLight(mapId, target, light);
      } catch (error) {
        console.error('Erro ao mudar a luz do pin:', error);
        try {
          setLoaded({ mapId, pins: await listMapPins(mapId) });
        } catch (reloadError) {
          console.error('Erro ao reler os pins do mapa:', reloadError);
        }
      }
    },
    [mapId, update],
  );

  return { pins, move, setLight };
}
