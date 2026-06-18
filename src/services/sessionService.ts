import { supabase } from '@/lib/supabase';
import type { SessionEnemyDraft, SessionNPCDraft } from '@/store/createSessionStore';

export interface CreateSessionPayload {
  session_name: string;
  session_description: string;
  enemies: SessionEnemyDraft[];
  npcs: SessionNPCDraft[];
  participant_character_ids: string[];
}

export const createGameSession = async (payload: CreateSessionPayload): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const playableNPCs = payload.npcs.filter(n => n.isPlayable);
  const simpleNPCs = payload.npcs.filter(n => !n.isPlayable);
  
  const finalParticipantIds = [...payload.participant_character_ids];

  // 1. Create Playable NPCs as Characters
  for (const npc of playableNPCs) {
    if (!npc.characterData) continue;

    const { data: charData, error: charErr } = await supabase.from('characters').insert({
      user_id: user.id, // Mestre "possui" o NPC por padrão
      is_npc: true,
      name: npc.name,
      tribe: npc.characterData.tribo || '',
      vocation: npc.characterData.classe || '',
      attributes: {
        strength: npc.characterData.for || 10,
        dexterity: npc.characterData.des || 10,
        constitution: npc.characterData.con || 10,
        intelligence: npc.characterData.int || 10,
        wisdom: npc.characterData.sab || 10,
        charisma: npc.characterData.car || 10,
      },
      stats: {
        level: npc.characterData.level || 1,
        armor_class: npc.characterData.ca || 10,
        current_hp: 10,
        max_hp: 10,
        current_faith: 100,
        max_faith: 100,
        experience: 0
      },
      narrative: {
        biography: npc.description,
      },
      fortress: 'Coragem',
      temptation: 'Ganância',
    } as any).select('id').single();

    if (charErr) {
      console.error('Error creating playable NPC character:', charErr);
      throw charErr;
    }

    if (charData) {
      finalParticipantIds.push(charData.id);
    }
  }

  // 1.5 Create Enemies as Characters
  for (const enemy of payload.enemies) {
    const newCharacter = {
      user_id: user.id,
      is_enemy: true,
      name: enemy.name,
      vocation: enemy.vocation || '',
      tribe: 'Inimigo',
      has_participated_in_session: true,
      attributes: {
        for: enemy.attributes?.for || 0,
        des: enemy.attributes?.des || 0,
        con: enemy.attributes?.con || 0,
        int: enemy.attributes?.int || 0,
        sab: enemy.attributes?.sab || 0,
        car: enemy.attributes?.car || 0,
      },
      stats: {
        pv: enemy.hpMax,
        current_pv: enemy.hpCurrent,
        ca: enemy.ca,
        faith: 0,
        current_faith: 0
      },
      skills: enemy.skills || [],
      narrative: {
        imageUrl: enemy.imageBase64 || ''
      }
    };

    const { data: charData, error: charErr } = await supabase.from('characters').insert(newCharacter as any).select('id').single();
    if (charErr) {
      console.error('Error creating enemy character:', charErr);
      throw charErr;
    }

    if (charData) {
      finalParticipantIds.push(charData.id);
    }
  }

  // 2. Create Session via RPC
  const { data, error } = await supabase.rpc('create_game_session', {
    session_name: payload.session_name,
    session_description: payload.session_description,
    enemies: [], // No longer use session_enemies table
    npcs: simpleNPCs.map(n => ({
      name: n.name,
      description: n.description,
      stats: n.stats || {}
    })),
    participant_character_ids: finalParticipantIds,
  });

  if (error) {
    console.error('Error creating session via RPC:', error);
    throw error;
  }

  return data;
};
