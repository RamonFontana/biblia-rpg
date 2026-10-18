// Fichas (`characters`) usadas pelas telas de sessão. As funções lançam o erro do Supabase.
import { supabase } from '@/lib/supabase';
import type { Json, Tables, TablesInsert } from '@/types/database.types';
import type { Character } from '@/features/character-management/types';
import type {
  CharacterSkills,
  CharacterStats,
  EnemySkill,
} from '@/features/character-creation/types';

export type CharacterRow = Tables<'characters'>;

/**
 * Converte a linha do banco na ficha do app. Os campos `jsonb` (`stats`, `attributes`…) chegam
 * como `Json`; o app os trata como as formas tipadas de `Character`. É a única asserção dessa
 * conversão, e quem grava as colunas é o próprio app.
 */
export function toCharacter(row: CharacterRow): Character {
  return row as unknown as Character;
}

/** Valor `jsonb` a partir de um tipo do app (interfaces não são atribuíveis a `Json`). */
function toJson(value: unknown): Json {
  return value as Json;
}

/** Todas as fichas de NPC da campanha, por nome. */
export async function listCampaignNpcs(): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_npc', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toCharacter);
}

export async function updateCharacterStats(id: string, stats: CharacterStats): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ stats: toJson(stats) })
    .eq('id', id);
  if (error) throw error;
}

/** Grava `stats` e `skills` juntos (descanso longo). */
export async function updateCharacterRest(
  id: string,
  patch: { stats: CharacterStats; skills: CharacterSkills | EnemySkill[] },
): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ stats: toJson(patch.stats), skills: toJson(patch.skills) })
    .eq('id', id);
  if (error) throw error;
}

export async function setCharacterVisible(id: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .update({ is_visible: isVisible })
    .eq('id', id);
  if (error) throw error;
}

/** Cria a ficha de um inimigo e devolve a linha gravada. */
export async function createEnemyCharacter(row: TablesInsert<'characters'>): Promise<Character> {
  const { data, error } = await supabase.from('characters').insert(row).select().single();
  if (error) throw error;
  return toCharacter(data);
}
