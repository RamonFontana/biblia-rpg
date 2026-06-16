import { supabase } from '../../../lib/supabase';
import type { DraftCharacter } from '../types';

export async function saveCharacter(draft: DraftCharacter) {
  // O usuário já deve estar logado
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Usuário não autenticado. Faça login para salvar seu personagem.');
  }

  // Verificar campos obrigatórios básicos
  if (!draft.name || !draft.tribe || !draft.vocation || !draft.attributes || !draft.stats) {
    throw new Error('Ficha incompleta. Preencha todos os passos obrigatórios.');
  }

  const { data, error } = await supabase
    .from('characters')
    .insert({
      user_id: user.id,
      name: draft.name,
      tribe: draft.tribe,
      vocation: draft.vocation,
      attributes: draft.attributes as any, // jsonb
      fortress: draft.fortress || null,
      temptation: draft.temptation || null,
      stats: draft.stats as any, // jsonb
      equipment: draft.equipment as any || [], // jsonb
      coins: draft.coins || 0,
      narrative: draft.narrative as any || null, // jsonb
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
