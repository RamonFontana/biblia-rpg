// Pins do mapa (CONTEXT.md: Mapa, Bandeja). As funções lançam o erro do Supabase.
import { uniqueChannelName } from '@/lib/channelName';
import { supabase } from '@/lib/supabase';
import { subscribeToScopedRows, type ChangePayload, type SubscribeOptions } from './realtime';

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

/** O Retrato de um pin: uma ficha (jogador, NPC jogável ou inimigo) ou um NPC simples. */
export interface PinTarget {
  kind: 'character' | 'npc';
  id: string;
}

export async function listMapPins(mapId: string): Promise<PinRow[]> {
  const { data, error } = await supabase
    .from('session_map_pins')
    .select('id, map_id, character_id, npc_id, col, row, light_bright_m, light_dim_m')
    .eq('map_id', mapId);
  if (error) throw error;
  return data ?? [];
}

const columnOf = (target: PinTarget) => (target.kind === 'character' ? 'character_id' : 'npc_id');

/** Põe o Retrato no Quadrado; se já tinha pin neste mapa, o troca de lugar. */
export async function placePin(input: {
  mapId: string;
  target: PinTarget;
  col: number;
  row: number;
}): Promise<void> {
  const { error } = await supabase.from('session_map_pins').upsert(
    {
      map_id: input.mapId,
      character_id: input.target.kind === 'character' ? input.target.id : null,
      npc_id: input.target.kind === 'npc' ? input.target.id : null,
      col: input.col,
      row: input.row,
    },
    { onConflict: `map_id,${columnOf(input.target)}` },
  );
  if (error) throw error;
}

/** A luz no pin: raio de Luz plena e faixa de Penumbra, em metros. */
export interface PinLight {
  brightM: number;
  dimM: number;
}

/** Acende (ou muda) a luz do pin do Retrato neste mapa; nulo apaga. O pin precisa existir. */
export async function setPinLight(
  mapId: string,
  target: PinTarget,
  light: PinLight | null,
): Promise<void> {
  const { error } = await supabase
    .from('session_map_pins')
    .update({ light_bright_m: light?.brightM ?? null, light_dim_m: light?.dimM ?? null })
    .eq('map_id', mapId)
    .eq(columnOf(target), target.id);
  if (error) throw error;
}

/** Devolve o Retrato à Bandeja: apaga o pin dele neste mapa. */
export async function removePin(mapId: string, target: PinTarget): Promise<void> {
  const { error } = await supabase
    .from('session_map_pins')
    .delete()
    .eq('map_id', mapId)
    .eq(columnOf(target), target.id);
  if (error) throw error;
}

/**
 * Avisa a cada mudança nos pins do mapa. Devolve a função que cancela. O Realtime não entrega
 * `DELETE` por assinatura com filtro (e o registro apagado só traz o `id`), então o apagar vem de uma
 * assinatura à parte, sem filtro; quem escuta ignora o `id` que não conhece.
 */
export function subscribeToMapPins(
  mapId: string,
  onChange: (payload: ChangePayload) => void,
  options?: SubscribeOptions,
): () => void {
  return subscribeToScopedRows(
    uniqueChannelName(`map-pins-${mapId}`),
    'session_map_pins',
    { column: 'map_id', value: mapId },
    onChange,
    options,
  );
}
