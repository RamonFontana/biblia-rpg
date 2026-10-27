// Sessões de jogo: `game_sessions`, participantes, NPCs simples e o elenco que o Mestre vê.
// As funções lançam o erro do Supabase; quem chama decide o que fazer com ele.
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database.types';
import type { CombatInventoryItem } from '@/types/inventory';
import type { Character } from '@/features/character-management/types';
import { subscribeToTables } from './realtime';
import { uniqueChannelName } from '@/lib/channelName';
import { toCharacter } from './characters';
import { toJson } from './json';

export type GameSession = Tables<'game_sessions'>;
export type SessionNpcRow = Tables<'session_npcs'>;

export async function getGameSession(id: string): Promise<GameSession> {
  const { data, error } = await supabase.from('game_sessions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function updateGameSession(
  id: string,
  patch: TablesUpdate<'game_sessions'>,
): Promise<void> {
  const { error } = await supabase.from('game_sessions').update(patch).eq('id', id);
  if (error) throw error;
}

/**
 * O Mestre abre o Descanso Curto (ADR 0006). A função confere que é o Mestre, que não há combate
 * ativo, que sobra Descanso Curto no dia e que não há outro aberto; soma 1 ao dia. Devolve a
 * identidade do descanso.
 */
export async function openShortRest(sessionId: string): Promise<string> {
  const { data, error } = await supabase.rpc('open_short_rest', { p_session_id: sessionId });
  if (error) throw error;
  return data;
}

/** O Mestre encerra o Descanso Curto aberto; zera os pedidos e quem terminou. */
export async function closeShortRest(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('close_short_rest', { p_session_id: sessionId });
  if (error) throw error;
}

/** Cria a sessão, o Mestre e os participantes numa só chamada (RPC `create_game_session`). */
export async function createGameSessionRecord(input: {
  name: string;
  description: string;
  npcs: { name: string; description: string; stats: unknown }[];
  participantCharacterIds: string[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_game_session', {
    session_name: input.name,
    session_description: input.description,
    enemies: [], // No longer use session_enemies table
    npcs: toJson(input.npcs),
    participant_character_ids: input.participantCharacterIds,
  });
  if (error) throw error;
  return data;
}

/** Os `character_id` de todos os participantes da sessão (sem os vazios). */
export async function listSessionParticipantCharacterIds(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('session_participants')
    .select('character_id')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data.map((p) => p.character_id).filter(Boolean);
}

/** Chama `onChange` com a linha nova a cada mudança da sessão. Devolve a função que cancela. */
export function subscribeToGameSession(
  id: string,
  onChange: (session: GameSession) => void,
): () => void {
  return subscribeToTables(uniqueChannelName(`session-${id}`), [
    {
      table: 'game_sessions',
      filter: `id=eq.${id}`,
      onChange: (payload) => onChange(payload.new as GameSession),
    },
  ]);
}

/** A sessão ativa mais recente que o usuário mestra, ou nulo. */
export async function findGmActiveSessionId(gmId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('gm_id', gmId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export interface ActivePlayerSession {
  session_id: string;
  character_id: string;
  session_name: string;
  gm_id: string;
}

interface ParticipationRow {
  session_id: string;
  character_id: string;
  game_sessions: { name: string; gm_id: string } | null;
}

/** Uma entrada por sessão (a primeira participação), com o nome padrão se faltar. */
export function toActivePlayerSessions(rows: ParticipationRow[]): ActivePlayerSession[] {
  const sessions = rows.map((row) => ({
    session_id: row.session_id,
    character_id: row.character_id,
    session_name: row.game_sessions?.name || 'Sessão Ativa',
    gm_id: row.game_sessions?.gm_id || '',
  }));
  return Array.from(new Map(sessions.map((item) => [item.session_id, item])).values());
}

/** As sessões ativas em que o usuário joga. */
export async function listPlayerActiveSessions(userId: string): Promise<ActivePlayerSession[]> {
  const { data, error } = await supabase
    .from('session_participants')
    .select(
      `
      session_id,
      character_id,
      game_sessions!inner (
        id,
        name,
        status,
        gm_id
      )
    `,
    )
    .eq('user_id', userId)
    .eq('game_sessions.status', 'active');
  if (error) throw error;
  return toActivePlayerSessions(data ?? []);
}

export async function addSessionParticipant(input: {
  sessionId: string;
  characterId: string;
  userId: string;
}): Promise<void> {
  const { error } = await supabase.from('session_participants').insert({
    session_id: input.sessionId,
    character_id: input.characterId,
    user_id: input.userId,
  });
  if (error) throw error;
}

/** A ficha com que o usuário joga na sessão, ou nulo se ele ainda não escolheu. */
export async function findParticipantCharacterId(
  sessionId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('session_participants')
    .select('character_id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.character_id ?? null;
}

export async function setSimpleNpcVisible(id: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase
    .from('session_npcs')
    .update({ is_visible: isVisible })
    .eq('id', id);
  if (error) throw error;
}

const ROSTER_PARTICIPANTS = `
  user_id,
  characters (*, character_items(*, items(*)))
`;

/** O que o Mestre carrega para montar a mesa: participantes com ficha e itens, e NPCs simples. */
export async function fetchSessionRoster(sessionId: string) {
  const [participants, simpleNpcs] = await Promise.all([
    supabase.from('session_participants').select(ROSTER_PARTICIPANTS).eq('session_id', sessionId),
    supabase.from('session_npcs').select('*').eq('session_id', sessionId),
  ]);
  if (participants.error) throw participants.error;
  if (simpleNpcs.error) throw simpleNpcs.error;
  return { participants: participants.data ?? [], simpleNpcs: simpleNpcs.data ?? [] };
}

export type SessionRoster = Awaited<ReturnType<typeof fetchSessionRoster>>;
type RosterParticipant = SessionRoster['participants'][number];

/** Ficha do elenco da sessão, com os itens aninhados como o app os carrega. */
export type SessionCharacter = Character & { character_items?: CombatInventoryItem[] };

export interface SessionPlayer {
  user_id: string;
  character: SessionCharacter;
  profile: null;
}

/** NPC da sessão: ficha completa (jogável) ou NPC simples (só nome, nota, estatísticas). */
export type SessionNpc = Character & { is_playable?: boolean; is_visible?: boolean };

export interface GroupedRoster {
  players: SessionPlayer[];
  npcs: SessionNpc[];
  enemies: SessionCharacter[];
}

const DEFAULT_SIMPLE_NPC_STATS = { pv: 10, current_pv: 10, ca: 10, faith: 0, current_faith: 0 };

function simpleNpcToSessionNpc(row: SessionNpcRow): SessionNpc {
  // O NPC simples não é uma ficha: os consumidores só leem os campos abaixo, então a conversão
  // para `SessionNpc` é uma asserção.
  return {
    id: row.id,
    name: row.name,
    tribe: 'NPC Simples',
    vocation: row.description || '',
    stats: row.stats || DEFAULT_SIMPLE_NPC_STATS,
    is_playable: false,
    is_visible: row.is_visible,
  } as unknown as SessionNpc;
}

/** Separa o elenco em jogadores, NPCs (fichas jogáveis e simples) e inimigos. */
export function groupSessionRoster(roster: SessionRoster): GroupedRoster {
  const players: SessionPlayer[] = [];
  const npcs: SessionNpc[] = [];
  const enemies: SessionCharacter[] = [];

  roster.participants.forEach((participant: RosterParticipant) => {
    const row = participant.characters;
    if (!row) return;
    const character = toCharacter(row) as SessionCharacter;

    if (row.is_enemy) {
      enemies.push(character);
    } else if (row.is_npc) {
      npcs.push({ ...character, is_playable: true });
    } else {
      players.push({ user_id: participant.user_id, character, profile: null });
    }
  });

  return { players, npcs: [...npcs, ...roster.simpleNpcs.map(simpleNpcToSessionNpc)], enemies };
}
