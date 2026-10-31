// Luzes fixas do mapa (CONTEXT.md: Fonte de luz). Os raios são em metros: Luz plena e, depois dela,
// uma faixa de Penumbra. As funções lançam o erro do Supabase.
import { uniqueChannelName } from '@/lib/channelName';
import { supabase } from '@/lib/supabase';
import { subscribeToScopedRows, type ChangePayload, type SubscribeOptions } from './realtime';

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

export interface NewMapLight {
  mapId: string;
  col: number;
  row: number;
  brightM: number;
  dimM: number;
  label: string;
}

export async function listMapLights(mapId: string): Promise<LightRow[]> {
  const { data, error } = await supabase
    .from('session_map_lights')
    .select('id, map_id, col, row, bright_m, dim_m, label')
    .eq('map_id', mapId);
  if (error) throw error;
  return data ?? [];
}

export async function addMapLight(light: NewMapLight): Promise<void> {
  const { error } = await supabase.from('session_map_lights').insert({
    map_id: light.mapId,
    col: light.col,
    row: light.row,
    bright_m: light.brightM,
    dim_m: light.dimM,
    label: light.label,
  });
  if (error) throw error;
}

export type MapLightPatch = Partial<Omit<NewMapLight, 'mapId'>>;

/** Muda só o que veio no `patch`: posição, raios ou rótulo. */
export async function updateMapLight(id: string, patch: MapLightPatch): Promise<void> {
  const row = {
    ...(patch.col !== undefined && { col: patch.col }),
    ...(patch.row !== undefined && { row: patch.row }),
    ...(patch.brightM !== undefined && { bright_m: patch.brightM }),
    ...(patch.dimM !== undefined && { dim_m: patch.dimM }),
    ...(patch.label !== undefined && { label: patch.label }),
  };
  const { error } = await supabase.from('session_map_lights').update(row).eq('id', id);
  if (error) throw error;
}

export async function removeMapLight(id: string): Promise<void> {
  const { error } = await supabase.from('session_map_lights').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Avisa a cada mudança nas luzes do mapa. Devolve a função que cancela. O Realtime não entrega
 * `DELETE` por assinatura com filtro, então o apagar vem de uma assinatura à parte, sem filtro.
 */
export function subscribeToMapLights(
  mapId: string,
  onChange: (payload: ChangePayload) => void,
  options?: SubscribeOptions,
): () => void {
  return subscribeToScopedRows(
    uniqueChannelName(`map-lights-${mapId}`),
    'session_map_lights',
    { column: 'map_id', value: mapId },
    onChange,
    options,
  );
}
