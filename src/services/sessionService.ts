import { getCurrentUser } from '@/data-access/auth';
import {
  deleteCharacters,
  filterNpcAndEnemyIds,
  grantPendingLevelUp,
  insertCharacter,
  markCharactersParticipated,
  restCharactersForNewSession,
} from '@/data-access/characters';
import {
  createGameSessionRecord,
  listSessionParticipantCharacterIds,
  updateGameSession,
} from '@/data-access/sessions';
import { addSessionMaps } from '@/data-access/maps';
import { cancelSessionTrades } from '@/data-access/trades';
import { buildEnemyRow, buildPlayableNpcRow } from '@/lib/sessionEntities';
import type {
  SessionEnemyDraft,
  SessionMapDraft,
  SessionNPCDraft,
} from '@/store/createSessionStore';

export interface CreateSessionPayload {
  session_name: string;
  session_description: string;
  enemies: SessionEnemyDraft[];
  npcs: SessionNPCDraft[];
  /** Os terrenos escolhidos para a sessão (passo opcional). */
  maps: SessionMapDraft[];
  participant_character_ids: string[];
}

export const createGameSession = async (payload: CreateSessionPayload): Promise<string> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const playableNPCs = payload.npcs.filter((n) => n.isPlayable);
  const simpleNPCs = payload.npcs.filter((n) => !n.isPlayable);

  const finalParticipantIds = [...payload.participant_character_ids];

  // 1. Create Playable NPCs as Characters
  for (const npc of playableNPCs) {
    if (!npc.characterData) continue;

    try {
      finalParticipantIds.push(await insertCharacter(buildPlayableNpcRow(npc, user.id)));
    } catch (error) {
      console.error('Error creating playable NPC character:', error);
      throw error;
    }
  }

  // 1.5 Create Enemies as Characters
  for (const enemy of payload.enemies) {
    try {
      finalParticipantIds.push(await insertCharacter(buildEnemyRow(enemy, user.id)));
    } catch (error) {
      console.error('Error creating enemy character:', error);
      throw error;
    }
  }

  // 2. Create Session via RPC
  let sessionId: string;
  try {
    sessionId = await createGameSessionRecord({
      name: payload.session_name,
      description: payload.session_description,
      npcs: simpleNPCs.map((n) => ({
        name: n.name,
        description: n.description,
        stats: n.stats || {},
      })),
      participantCharacterIds: finalParticipantIds,
    });
  } catch (error) {
    console.error('Error creating session via RPC:', error);
    throw error;
  }

  // Os mapas escolhidos. A sessão já existe, então uma falha aqui só é registrada: o Mestre soma os
  // mapas pelo Painel Mapas.
  try {
    await addSessionMaps(sessionId, payload.maps);
  } catch (error) {
    console.error('Error adding the chosen maps to the session:', error);
  }

  if (finalParticipantIds.length > 0) {
    try {
      await markCharactersParticipated(finalParticipantIds);
    } catch (error) {
      console.error('Error updating characters participated in session:', error);
    }
  }

  // O personagem do jogador entra Descansado (PV máximo, Habilidades e Dados de Vida); NPC
  // jogável e inimigo acabam de ser criados e já nascem cheios.
  try {
    await restCharactersForNewSession(payload.participant_character_ids);
  } catch (error) {
    console.error('Error resting the characters for the new session:', error);
  }

  return sessionId;
};

// Cancels open trades, hard-deletes the NPCs/enemies created for this session, grants
// pending level-ups to the chosen characters, and marks the session finished. Returns
// whether the final status update succeeded, so the caller can decide whether to
// navigate away (matching the prior page-level behavior exactly).
export const endSession = async (
  sessionId: string,
  levelUpCharacterIds: string[],
): Promise<boolean> => {
  try {
    await cancelSessionTrades(sessionId);
  } catch (e) {
    console.error('Erro ao cancelar negociações:', e);
  }

  try {
    // Deletar personagens (NPCs e inimigos) que foram criados para esta sessão
    const charIds = await listSessionParticipantCharacterIds(sessionId);

    if (charIds.length > 0) {
      // Apenas exclui os que são NPCs ou Inimigos
      const deleteIds = await filterNpcAndEnemyIds(charIds);

      if (deleteIds.length > 0) {
        await deleteCharacters(deleteIds);
      }
    }
  } catch (e) {
    console.error('Erro ao deletar NPCs/Inimigos da sessão:', e);
  }

  try {
    if (levelUpCharacterIds.length > 0) {
      await grantPendingLevelUp(levelUpCharacterIds);
    }
  } catch (e) {
    console.error('Erro ao conceder level up:', e);
  }

  try {
    await updateGameSession(sessionId, { status: 'finished' });
    return true;
  } catch {
    return false;
  }
};
