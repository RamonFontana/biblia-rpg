// Mapas do Mestre (CONTEXT.md: Mapa). O mapa é do Mestre e serve a qualquer sessão dele; a imagem fica
// em tabela própria, fora do Realtime e fora da lista, e é lida à parte, por id (ADR 0010).
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type MasterMap = Tables<'master_maps'>;

export interface NewMasterMap {
  name: string;
  columns: number;
  rows: number;
  /** O data URL webp já recortado e reduzido. */
  image: string;
}

/** Os mapas do Mestre, do mais novo ao mais velho (sem as imagens). */
export async function listMasterMaps(ownerId: string): Promise<MasterMap[]> {
  const { data, error } = await supabase
    .from('master_maps')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Grava o mapa e a imagem dele; se a imagem falhar, desfaz o mapa para não deixar um vazio. */
export async function createMasterMap({ image, ...map }: NewMasterMap): Promise<MasterMap> {
  const { data, error } = await supabase.from('master_maps').insert(map).select('*').single();
  if (error) throw error;

  const { error: imageError } = await supabase
    .from('master_map_images')
    .insert({ map_id: data.id, image });
  if (imageError) {
    await supabase.from('master_maps').delete().eq('id', data.id);
    throw imageError;
  }
  return data;
}

export async function getMasterMapImage(mapId: string): Promise<string> {
  const { data, error } = await supabase
    .from('master_map_images')
    .select('image')
    .eq('map_id', mapId)
    .single();
  if (error) throw error;
  return data.image;
}

export async function renameMasterMap(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('master_maps').update({ name }).eq('id', id);
  if (error) throw error;
}

/** Apaga o mapa. O banco recusa (erro 23503) se uma sessão ativa o usa. */
export async function removeMasterMap(id: string): Promise<void> {
  const { error } = await supabase.from('master_maps').delete().eq('id', id);
  if (error) throw error;
}
