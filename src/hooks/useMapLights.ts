import { useCallback, useEffect, useState } from 'react';
import {
  addMapLight,
  listMapLights,
  removeMapLight,
  subscribeToMapLights,
  updateMapLight,
  type MapLightPatch,
} from '@/data-access/mapLights';
import type { LightRow } from '@/lib/mapScene';

/**
 * As luzes fixas de um mapa, lidas uma vez e seguidas em tempo real. Mover e mudar mostram o
 * resultado na hora; se a gravação falhar, relê o que o banco tem.
 */
export function useMapLights(mapId: string | undefined) {
  const [loaded, setLoaded] = useState<{ mapId: string; lights: LightRow[] } | null>(null);
  const lights = loaded && loaded.mapId === mapId ? loaded.lights : [];

  const update = useCallback(
    (id: string, change: (lights: LightRow[]) => LightRow[]) =>
      setLoaded((current) => ({
        mapId: id,
        lights: change(current && current.mapId === id ? current.lights : []),
      })),
    [],
  );

  useEffect(() => {
    if (!mapId) return;
    let active = true;
    const load = async () => {
      try {
        const list = await listMapLights(mapId);
        if (active) setLoaded({ mapId, lights: list });
      } catch (error) {
        console.error('Erro ao buscar as luzes do mapa:', error);
      }
    };
    load();
    const unsubscribe = subscribeToMapLights(
      mapId,
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as { id?: string }).id;
          update(mapId, (list) => list.filter((l) => l.id !== oldId));
        } else {
          const next = payload.new as unknown as LightRow;
          update(mapId, (list) => [...list.filter((l) => l.id !== next.id), next]);
        }
      },
      { onSubscribed: load },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [mapId, update]);

  const reload = useCallback(async () => {
    if (!mapId) return;
    try {
      setLoaded({ mapId, lights: await listMapLights(mapId) });
    } catch (error) {
      console.error('Erro ao reler as luzes do mapa:', error);
    }
  }, [mapId]);

  const add = useCallback(
    async (light: { col: number; row: number; brightM: number; dimM: number; label: string }) => {
      if (!mapId) return;
      try {
        await addMapLight({ mapId, ...light });
      } catch (error) {
        console.error('Erro ao somar a luz:', error);
      }
    },
    [mapId],
  );

  const change = useCallback(
    async (id: string, patch: MapLightPatch) => {
      if (!mapId) return;
      update(mapId, (list) =>
        list.map((l) =>
          l.id === id
            ? {
                ...l,
                ...(patch.col !== undefined && { col: patch.col }),
                ...(patch.row !== undefined && { row: patch.row }),
                ...(patch.brightM !== undefined && { bright_m: patch.brightM }),
                ...(patch.dimM !== undefined && { dim_m: patch.dimM }),
                ...(patch.label !== undefined && { label: patch.label }),
              }
            : l,
        ),
      );
      try {
        await updateMapLight(id, patch);
      } catch (error) {
        console.error('Erro ao mudar a luz:', error);
        await reload();
      }
    },
    [mapId, update, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!mapId) return;
      update(mapId, (list) => list.filter((l) => l.id !== id));
      try {
        await removeMapLight(id);
      } catch (error) {
        console.error('Erro ao tirar a luz:', error);
        await reload();
      }
    },
    [mapId, update, reload],
  );

  return { lights, add, change, remove };
}
