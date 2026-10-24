// Fixa o que a camada de sessões pede ao Supabase (tabela, filtros, payload) e como ela monta o
// elenco da mesa. Usa o Supabase falso, que só registra as chamadas.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
  tables: [] as { name: string; subscriptions: unknown[] }[],
}));

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
    }),
  };
});

vi.mock('./realtime', () => ({
  subscribeToTables: (name: string, subscriptions: unknown[]) => {
    state.tables.push({ name, subscriptions });
    return () => {};
  },
}));

import { callsOf, filterOf } from '../test/fakeSupabase';
import {
  addSessionParticipant,
  createGameSessionRecord,
  fetchSessionRoster,
  findGmActiveSessionId,
  findParticipantCharacterId,
  getGameSession,
  groupSessionRoster,
  listSessionParticipantCharacterIds,
  listPlayerActiveSessions,
  setSimpleNpcVisible,
  subscribeToGameSession,
  toActivePlayerSessions,
  updateGameSession,
  type SessionRoster,
} from './sessions';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  state.tables.length = 0;
});

describe('getGameSession e updateGameSession', () => {
  it('lê a sessão pelo id', async () => {
    state.respond = () => ({ data: { id: 's1', name: 'Mesa' } });
    await expect(getGameSession('s1')).resolves.toEqual({ id: 's1', name: 'Mesa' });
    const [call] = callsOf(state.calls, 'game_sessions', 'select');
    expect(filterOf(call, 'eq', 'id')).toBe('s1');
    expect(call.single).toBe(true);
  });

  it('lança o erro ao ler', async () => {
    state.respond = () => ({ error: failure });
    await expect(getGameSession('s1')).rejects.toBe(failure);
  });

  it('grava só o patch na sessão pedida', async () => {
    await updateGameSession('s1', { current_period: 'Tarde', current_day: 2 });
    const [call] = callsOf(state.calls, 'game_sessions', 'update');
    expect(call.payload).toEqual({ current_period: 'Tarde', current_day: 2 });
    expect(filterOf(call, 'eq', 'id')).toBe('s1');
  });

  it('lança o erro ao gravar', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateGameSession('s1', { current_day: 3 })).rejects.toBe(failure);
  });
});

describe('subscribeToGameSession', () => {
  it('assina a linha da sessão e entrega a linha nova', () => {
    const onChange = vi.fn();
    subscribeToGameSession('s1', onChange);

    const [{ name, subscriptions }] = state.tables;
    expect(name).toMatch(/^session-s1_/);
    const [subscription] = subscriptions as {
      table: string;
      filter: string;
      onChange: (p: { new: unknown }) => void;
    }[];
    expect(subscription.table).toBe('game_sessions');
    expect(subscription.filter).toBe('id=eq.s1');

    subscription.onChange({ new: { id: 's1', current_period: 'Noite' } });
    expect(onChange).toHaveBeenCalledWith({ id: 's1', current_period: 'Noite' });
  });
});

describe('findGmActiveSessionId', () => {
  it('pede a sessão ativa mais recente do Mestre', async () => {
    state.respond = () => ({ data: { id: 's9' } });
    await expect(findGmActiveSessionId('gm-1')).resolves.toBe('s9');
    const [call] = callsOf(state.calls, 'game_sessions', 'select');
    expect(filterOf(call, 'eq', 'gm_id')).toBe('gm-1');
    expect(filterOf(call, 'eq', 'status')).toBe('active');
    expect(call.filters).toContainEqual(['order', 'created_at', { ascending: false }]);
    expect(call.filters).toContainEqual(['limit', 1]);
  });

  it('devolve nulo sem sessão ativa e lança o erro quando falha', async () => {
    state.respond = () => ({ data: null });
    await expect(findGmActiveSessionId('gm-1')).resolves.toBeNull();
    state.respond = () => ({ error: failure });
    await expect(findGmActiveSessionId('gm-1')).rejects.toBe(failure);
  });
});

describe('toActivePlayerSessions', () => {
  it('fica com a última participação de cada sessão, na ordem em que a sessão apareceu', () => {
    const rows = [
      { session_id: 's1', character_id: 'c1', game_sessions: { name: 'Mesa', gm_id: 'gm' } },
      { session_id: 's1', character_id: 'c2', game_sessions: { name: 'Mesa', gm_id: 'gm' } },
      { session_id: 's2', character_id: 'c3', game_sessions: { name: 'Outra', gm_id: 'gm2' } },
    ];
    expect(toActivePlayerSessions(rows).map((s) => [s.session_id, s.character_id])).toEqual([
      ['s1', 'c2'],
      ['s2', 'c3'],
    ]);
  });

  it('usa o nome padrão e o Mestre vazio quando a sessão não veio', () => {
    expect(
      toActivePlayerSessions([{ session_id: 's1', character_id: 'c1', game_sessions: null }]),
    ).toEqual([{ session_id: 's1', character_id: 'c1', session_name: 'Sessão Ativa', gm_id: '' }]);
  });
});

describe('listPlayerActiveSessions', () => {
  it('filtra pelo usuário e pela sessão ativa', async () => {
    state.respond = () => ({
      data: [{ session_id: 's1', character_id: 'c1', game_sessions: { name: 'Mesa', gm_id: 'g' } }],
    });
    await expect(listPlayerActiveSessions('u1')).resolves.toEqual([
      { session_id: 's1', character_id: 'c1', session_name: 'Mesa', gm_id: 'g' },
    ]);
    const [call] = callsOf(state.calls, 'session_participants', 'select');
    expect(filterOf(call, 'eq', 'user_id')).toBe('u1');
    expect(filterOf(call, 'eq', 'game_sessions.status')).toBe('active');
  });

  it('devolve lista vazia sem dados e lança o erro quando falha', async () => {
    state.respond = () => ({ data: null });
    await expect(listPlayerActiveSessions('u1')).resolves.toEqual([]);
    state.respond = () => ({ error: failure });
    await expect(listPlayerActiveSessions('u1')).rejects.toBe(failure);
  });
});

describe('addSessionParticipant e setSimpleNpcVisible', () => {
  it('insere o participante com as colunas do banco', async () => {
    await addSessionParticipant({ sessionId: 's1', characterId: 'c1', userId: 'u1' });
    const [call] = callsOf(state.calls, 'session_participants', 'insert');
    expect(call.payload).toEqual({ session_id: 's1', character_id: 'c1', user_id: 'u1' });
  });

  it('lança o erro ao inserir', async () => {
    state.respond = () => ({ error: failure });
    await expect(
      addSessionParticipant({ sessionId: 's1', characterId: 'c1', userId: 'u1' }),
    ).rejects.toBe(failure);
  });

  it('muda a visibilidade do NPC simples pelo id', async () => {
    await setSimpleNpcVisible('n1', false);
    const [call] = callsOf(state.calls, 'session_npcs', 'update');
    expect(call.payload).toEqual({ is_visible: false });
    expect(filterOf(call, 'eq', 'id')).toBe('n1');
  });
});

describe('fetchSessionRoster', () => {
  it('busca participantes e NPCs simples da sessão', async () => {
    state.respond = (call) =>
      call.table === 'session_participants'
        ? { data: [{ user_id: 'u1', characters: null }] }
        : { data: [{ id: 'n1' }] };
    await expect(fetchSessionRoster('s1')).resolves.toEqual({
      participants: [{ user_id: 'u1', characters: null }],
      simpleNpcs: [{ id: 'n1' }],
    });
    expect(filterOf(callsOf(state.calls, 'session_participants')[0], 'eq', 'session_id')).toBe(
      's1',
    );
    expect(filterOf(callsOf(state.calls, 'session_npcs')[0], 'eq', 'session_id')).toBe('s1');
  });

  it('devolve listas vazias quando as consultas voltam sem dados', async () => {
    state.respond = () => ({ data: null });
    await expect(fetchSessionRoster('s1')).resolves.toEqual({ participants: [], simpleNpcs: [] });
  });

  it('lança o erro de qualquer das duas consultas', async () => {
    state.respond = (call) => (call.table === 'session_npcs' ? { error: failure } : { data: [] });
    await expect(fetchSessionRoster('s1')).rejects.toBe(failure);
    state.respond = (call) =>
      call.table === 'session_participants' ? { error: failure } : { data: [] };
    await expect(fetchSessionRoster('s1')).rejects.toBe(failure);
  });
});

describe('groupSessionRoster', () => {
  const participant = (userId: string, character: Record<string, unknown> | null) => ({
    user_id: userId,
    characters: character,
  });
  const roster = (participants: unknown[], simpleNpcs: unknown[] = []) =>
    ({ participants, simpleNpcs }) as unknown as SessionRoster;

  it('separa jogadores, NPCs jogáveis e inimigos pela ficha', () => {
    const grouped = groupSessionRoster(
      roster([
        participant('u1', { id: 'c1', is_enemy: false, is_npc: false }),
        participant('gm', { id: 'c2', is_enemy: false, is_npc: true }),
        participant('gm', { id: 'c3', is_enemy: true, is_npc: false }),
      ]),
    );

    expect(grouped.players).toEqual([
      { user_id: 'u1', character: expect.objectContaining({ id: 'c1' }), profile: null },
    ]);
    expect(grouped.npcs).toEqual([expect.objectContaining({ id: 'c2', is_playable: true })]);
    expect(grouped.enemies).toEqual([expect.objectContaining({ id: 'c3' })]);
  });

  it('um inimigo que também é NPC conta como inimigo', () => {
    const grouped = groupSessionRoster(
      roster([participant('gm', { id: 'c1', is_enemy: true, is_npc: true })]),
    );
    expect(grouped.enemies).toHaveLength(1);
    expect(grouped.npcs).toHaveLength(0);
  });

  it('ignora participante sem ficha', () => {
    const grouped = groupSessionRoster(roster([participant('u1', null)]));
    expect(grouped).toEqual({ players: [], npcs: [], enemies: [] });
  });

  it('põe os NPCs simples depois dos jogáveis, sem ser fichas', () => {
    const grouped = groupSessionRoster(
      roster(
        [participant('gm', { id: 'c1', is_enemy: false, is_npc: true })],
        [
          {
            id: 'n1',
            name: 'Mercador',
            description: 'Vende pão',
            stats: { pv: 5 },
            is_visible: false,
          },
        ],
      ),
    );

    expect(grouped.npcs.map((n) => n.id)).toEqual(['c1', 'n1']);
    expect(grouped.npcs[1]).toEqual({
      id: 'n1',
      name: 'Mercador',
      tribe: 'NPC Simples',
      vocation: 'Vende pão',
      stats: { pv: 5 },
      is_playable: false,
      is_visible: false,
    });
  });

  it('o NPC simples sem estatísticas nem descrição recebe os padrões', () => {
    const [npc] = groupSessionRoster(
      roster(
        [],
        [{ id: 'n1', name: 'Mercador', description: null, stats: null, is_visible: true }],
      ),
    ).npcs;
    expect(npc.vocation).toBe('');
    expect(npc.stats).toEqual({ pv: 10, current_pv: 10, ca: 10, faith: 0, current_faith: 0 });
  });
});

describe('findParticipantCharacterId', () => {
  it('devolve a ficha com que o usuário joga na sessão', async () => {
    state.respond = () => ({ data: { character_id: 'c1' } });
    await expect(findParticipantCharacterId('s1', 'u1')).resolves.toBe('c1');
    const [call] = callsOf(state.calls, 'session_participants', 'select');
    expect(call.columns).toBe('character_id');
    expect(filterOf(call, 'eq', 'session_id')).toBe('s1');
    expect(filterOf(call, 'eq', 'user_id')).toBe('u1');
    expect(call.filters).toContainEqual(['limit', 1]);
  });

  it('devolve nulo quando o usuário não está na sessão e lança o erro quando falha', async () => {
    state.respond = () => ({ data: null });
    await expect(findParticipantCharacterId('s1', 'u1')).resolves.toBeNull();
    state.respond = () => ({ error: failure });
    await expect(findParticipantCharacterId('s1', 'u1')).rejects.toBe(failure);
  });
});

describe('criação e fim de uma sessão', () => {
  it('createGameSessionRecord chama a RPC com os NPCs simples e os participantes', async () => {
    state.respond = () => ({ data: 'sessao-1' });
    const id = await createGameSessionRecord({
      name: 'Mesa',
      description: 'Deserto',
      npcs: [{ name: 'Mercador', description: 'Vende pão', stats: { pv: 5 } }],
      participantCharacterIds: ['a', 'b'],
    });
    expect(id).toBe('sessao-1');
    const [call] = callsOf(state.calls, 'create_game_session', 'rpc');
    expect(call.payload).toEqual({
      session_name: 'Mesa',
      session_description: 'Deserto',
      enemies: [],
      npcs: [{ name: 'Mercador', description: 'Vende pão', stats: { pv: 5 } }],
      participant_character_ids: ['a', 'b'],
    });
  });

  it('createGameSessionRecord lança o erro da RPC', async () => {
    state.respond = () => ({ error: failure });
    await expect(
      createGameSessionRecord({
        name: 'x',
        description: '',
        npcs: [],
        participantCharacterIds: [],
      }),
    ).rejects.toBe(failure);
  });

  it('listSessionParticipantCharacterIds devolve os ids sem os vazios', async () => {
    state.respond = () => ({
      data: [{ character_id: 'a' }, { character_id: null }, { character_id: 'b' }],
    });
    await expect(listSessionParticipantCharacterIds('s1')).resolves.toEqual(['a', 'b']);
    const [call] = callsOf(state.calls, 'session_participants', 'select');
    expect(filterOf(call, 'eq', 'session_id')).toBe('s1');
  });

  it('listSessionParticipantCharacterIds lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listSessionParticipantCharacterIds('s1')).rejects.toBe(failure);
  });
});
