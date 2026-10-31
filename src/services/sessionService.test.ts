// CARACTERIZAÇÃO: fixa o comportamento ATUAL de criar e encerrar uma sessão, com um Supabase falso
// que só grava as chamadas. As linhas de NPC e inimigo estão em lib/sessionEntities.test.ts.
// Decisões: ROADMAP.md, Onda 2: Marco no lugar de XP; um personagem Morrendo não atravessa o fim
// da sessão, o Mestre resolve os Testes de Morte antes de encerrar (regra ainda não existe no código).
// Termos: CONTEXT.md (Marco, Morrendo).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
  userId: 'gm-1' as string | null,
}));

vi.mock('../lib/supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
      userId: () => state.userId,
    }),
  };
});

import { callsOf, filterOf } from '../test/fakeSupabase';
import type { SessionEnemyDraft, SessionNPCDraft } from '../store/createSessionStore';
import { createGameSession, endSession } from './sessionService';

const ops = () => state.calls.map((c) => `${c.table}:${c.op}`);

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  state.userId = 'gm-1';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('endSession', () => {
  const respond = (call: FakeCall): FakeResult | undefined => {
    if (call.table === 'session_participants') {
      return { data: [{ character_id: 'player-1' }, { character_id: 'npc-1' }] };
    }
    if (call.table === 'characters' && call.op === 'select') {
      return { data: [{ id: 'npc-1' }] };
    }
    return undefined;
  };

  it('faz tudo na ordem: cancela trocas, apaga NPCs e inimigos, concede nível, finaliza', async () => {
    state.respond = respond;
    await endSession('s1', ['player-1']);
    expect(ops()).toEqual([
      'cancel_session_trades:rpc',
      'session_participants:select',
      'characters:select',
      'characters:delete',
      'characters:update',
      'game_sessions:update',
    ]);
  });

  it('cancela as trocas em aberto da sessão', async () => {
    state.respond = respond;
    await endSession('s1', []);
    expect(callsOf(state.calls, 'cancel_session_trades', 'rpc')[0].payload).toEqual({
      p_session_id: 's1',
    });
  });

  it('apaga de verdade só os participantes que são NPC ou inimigo, nunca os jogadores', async () => {
    state.respond = respond;
    await endSession('s1', []);
    const lookup = callsOf(state.calls, 'characters', 'select')[0];
    expect(filterOf(lookup, 'in', 'id')).toEqual(['player-1', 'npc-1']);
    expect(lookup.filters).toContainEqual(['or', 'is_npc.eq.true,is_enemy.eq.true']);
    const del = callsOf(state.calls, 'characters', 'delete')[0];
    expect(filterOf(del, 'in', 'id')).toEqual(['npc-1']);
  });

  it('se nenhum participante é NPC ou inimigo, não apaga nada', async () => {
    state.respond = (call) => {
      if (call.table === 'session_participants') return { data: [{ character_id: 'player-1' }] };
      if (call.table === 'characters' && call.op === 'select') return { data: [] };
      return undefined;
    };
    await endSession('s1', []);
    expect(callsOf(state.calls, 'characters', 'delete')).toEqual([]);
  });

  it('sem participantes, não apaga nada', async () => {
    state.respond = (call) => (call.table === 'session_participants' ? { data: [] } : undefined);
    await endSession('s1', []);
    expect(callsOf(state.calls, 'characters')).toEqual([]);
  });

  it('concede o level-up pendente só a quem o Mestre escolheu', async () => {
    state.respond = respond;
    await endSession('s1', ['player-1', 'player-2']);
    const grant = callsOf(state.calls, 'characters', 'update')[0];
    expect(grant.payload).toEqual({ pending_level_up: true });
    expect(filterOf(grant, 'in', 'id')).toEqual(['player-1', 'player-2']);
  });

  it('sem ninguém escolhido, não escreve nada nas fichas', async () => {
    state.respond = respond;
    await endSession('s1', []);
    expect(callsOf(state.calls, 'characters', 'update')).toEqual([]);
  });

  it('finaliza a sessão e devolve true', async () => {
    state.respond = respond;
    expect(await endSession('s1', [])).toBe(true);
    const finish = callsOf(state.calls, 'game_sessions', 'update')[0];
    expect(finish.payload).toEqual({ status: 'finished' });
    expect(filterOf(finish, 'eq', 'id')).toBe('s1');
  });

  it('devolve false se não conseguir finalizar a sessão', async () => {
    state.respond = (call) =>
      call.table === 'game_sessions' ? { error: new Error('falhou') } : respond(call);
    expect(await endSession('s1', [])).toBe(false);
  });

  it('GAP conhecido: se cancelar as trocas falhar, segue em frente e encerra mesmo assim', async () => {
    state.respond = (call) =>
      call.table === 'cancel_session_trades' ? { error: new Error('falhou') } : respond(call);
    expect(await endSession('s1', [])).toBe(true);
  });

  it('GAP conhecido: erro ao apagar NPCs ou ao conceder nível é ignorado e a sessão encerra', async () => {
    state.respond = (call) =>
      call.table === 'characters' && (call.op === 'delete' || call.op === 'update')
        ? { error: new Error('falhou') }
        : respond(call);
    expect(await endSession('s1', ['player-1'])).toBe(true);
  });

  it('GAP conhecido: encerra sem olhar PV nem Testes de Morte (a regra do Morrendo ainda não existe)', async () => {
    // A única leitura de fichas é a lista de ids de NPC e inimigo a apagar.
    state.respond = respond;
    await endSession('s1', []);
    const reads = callsOf(state.calls, 'characters', 'select');
    expect(reads.map((r) => r.columns)).toEqual(['id']);
    expect(callsOf(state.calls, 'game_sessions', 'update')).toHaveLength(1);
  });
});

describe('createGameSession', () => {
  const simpleNpc = {
    name: 'Mercador',
    description: 'Vende sal',
    isPlayable: false,
    stats: { ca: 10 },
  } as unknown as SessionNPCDraft;
  const playableNpc = {
    name: 'Guarda',
    description: 'Vigia',
    isPlayable: true,
    characterData: { for: 14, tribo: 'Judá', classe: 'Guerreiro' },
  } as unknown as SessionNPCDraft;
  const enemy = {
    name: 'Filisteu',
    vocation: 'Guerreiro',
    hpMax: 12,
    hpCurrent: 12,
    attributes: { for: 14 },
  } as unknown as SessionEnemyDraft;

  const respond = (call: FakeCall): FakeResult | undefined => {
    if (call.table === 'characters' && call.op === 'insert') {
      const name = (call.payload as { name: string }).name;
      return { data: { id: `${name}-id` } };
    }
    if (call.table === 'create_game_session') return { data: 'session-new' };
    return undefined;
  };
  const payload = (over: Partial<Parameters<typeof createGameSession>[0]> = {}) => ({
    session_name: 'Cerco de Jericó',
    session_description: 'Sete voltas',
    enemies: [],
    npcs: [],
    maps: [],
    participant_character_ids: ['player-1'],
    ...over,
  });

  it('devolve o id da sessão criada pela função SQL', async () => {
    state.respond = respond;
    expect(await createGameSession(payload())).toBe('session-new');
  });

  it('sem usuário autenticado, lança antes de escrever qualquer coisa', async () => {
    state.userId = null;
    await expect(createGameSession(payload())).rejects.toThrow('User not authenticated');
    expect(state.calls).toEqual([]);
  });

  it('NPC jogável e inimigo viram fichas do Mestre e entram na lista de participantes', async () => {
    state.respond = respond;
    await createGameSession(payload({ npcs: [playableNpc], enemies: [enemy] }));
    const inserts = callsOf(state.calls, 'characters', 'insert').map(
      (c) => c.payload as { name: string; user_id: string },
    );
    expect(inserts.map((r) => [r.name, r.user_id])).toEqual([
      ['Guarda', 'gm-1'],
      ['Filisteu', 'gm-1'],
    ]);
    const rpc = callsOf(state.calls, 'create_game_session', 'rpc')[0];
    expect(rpc.payload).toMatchObject({
      participant_character_ids: ['player-1', 'Guarda-id', 'Filisteu-id'],
    });
  });

  it('NPC simples vai pela função SQL; inimigos nunca (a lista de inimigos vai vazia)', async () => {
    state.respond = respond;
    await createGameSession(payload({ npcs: [simpleNpc, playableNpc], enemies: [enemy] }));
    const rpc = callsOf(state.calls, 'create_game_session', 'rpc')[0];
    expect(rpc.payload).toMatchObject({
      session_name: 'Cerco de Jericó',
      session_description: 'Sete voltas',
      enemies: [],
      npcs: [{ name: 'Mercador', description: 'Vende sal', stats: { ca: 10 } }],
    });
  });

  it('NPC jogável sem dados de ficha é ignorado', async () => {
    state.respond = respond;
    const empty = { name: 'Vazio', isPlayable: true } as unknown as SessionNPCDraft;
    await createGameSession(payload({ npcs: [empty] }));
    expect(callsOf(state.calls, 'characters', 'insert')).toEqual([]);
  });

  describe('os mapas escolhidos', () => {
    const maps = [
      { id: 'tmp-1', libraryId: 'terreno-areia', name: 'Deserto', columns: 20, rows: 15 },
      { id: 'tmp-2', libraryId: 'terreno-pedra', name: 'Muralha', columns: 30, rows: 8 },
    ];

    it('entram na sessão nova, em ordem, sem o id temporário', async () => {
      state.respond = respond;
      await createGameSession(payload({ maps }));
      const [insert] = callsOf(state.calls, 'session_maps', 'insert');
      expect(insert?.payload).toEqual([
        expect.objectContaining({
          session_id: 'session-new',
          library_id: 'terreno-areia',
          name: 'Deserto',
          position: 0,
        }),
        expect.objectContaining({
          session_id: 'session-new',
          library_id: 'terreno-pedra',
          name: 'Muralha',
          position: 1,
        }),
      ]);
      expect(JSON.stringify(insert?.payload)).not.toContain('tmp-1');
    });

    it('depois de criar a sessão', async () => {
      state.respond = respond;
      await createGameSession(payload({ maps }));
      expect(ops().indexOf('session_maps:insert')).toBeGreaterThan(
        ops().indexOf('create_game_session:rpc'),
      );
    });

    it('um mapa do Mestre entra com a origem dele, e o terreno com a da Biblioteca', async () => {
      state.respond = respond;
      await createGameSession(
        payload({
          maps: [
            { id: 'tmp-1', libraryId: 'terreno-areia', name: 'Deserto', columns: 20, rows: 15 },
            { id: 'tmp-2', masterMapId: 'mm1', name: 'Cerco', columns: 30, rows: 8 },
          ],
        }),
      );
      const [insert] = callsOf(state.calls, 'session_maps', 'insert');
      expect(insert?.payload).toEqual([
        expect.objectContaining({ library_id: 'terreno-areia', master_map_id: null }),
        expect.objectContaining({ library_id: null, master_map_id: 'mm1', name: 'Cerco' }),
      ]);
    });

    it('sem mapas, a sessão nasce como antes', async () => {
      state.respond = respond;
      await createGameSession(payload());
      expect(callsOf(state.calls, 'session_maps', 'insert')).toEqual([]);
    });

    it('erro ao gravar os mapas é só registrado: a sessão já existe e é devolvida', async () => {
      state.respond = (call) =>
        call.table === 'session_maps' ? { error: new Error('falhou') } : respond(call);
      expect(await createGameSession(payload({ maps }))).toBe('session-new');
    });
  });

  it('marca todos os participantes como "já participaram de sessão"', async () => {
    state.respond = respond;
    await createGameSession(payload({ enemies: [enemy] }));
    const mark = callsOf(state.calls, 'characters', 'update')[0];
    expect(mark.payload).toEqual({ has_participated_in_session: true });
    expect(filterOf(mark, 'in', 'id')).toEqual(['player-1', 'Filisteu-id']);
  });

  describe('Início de Partida: os personagens dos jogadores entram Descansados', () => {
    const rowsOf =
      (...rows: Record<string, unknown>[]) =>
      (call: FakeCall) =>
        call.table === 'characters' && call.op === 'select' ? { data: rows } : respond(call);
    const restWrites = () =>
      callsOf(state.calls, 'characters', 'update').filter(
        (c) => filterOf(c, 'eq', 'id') !== undefined,
      );

    it('PV máximo, usos de Habilidade restaurados, Dados de Vida devolvidos e morte zerada', async () => {
      state.respond = rowsOf({
        id: 'player-1',
        is_dead: false,
        stats: { pv: 30, current_pv: 4, current_faith: 40 },
        skills: { ability_uses: { a: 1 }, path_choices: { tribe: 'A' } },
      });
      await createGameSession(payload());
      const [write] = restWrites();
      expect(filterOf(write, 'eq', 'id')).toBe('player-1');
      expect(write.payload).toEqual({
        stats: { pv: 30, current_pv: 30, current_faith: 40 },
        skills: { ability_uses: {}, path_choices: { tribe: 'A' } },
        hit_dice_spent: 0,
      });
    });

    it('só os participantes dos jogadores: NPC jogável e inimigo criados agora ficam de fora', async () => {
      state.respond = rowsOf({ id: 'player-1', stats: { pv: 10 }, skills: null });
      await createGameSession(payload({ npcs: [playableNpc], enemies: [enemy] }));
      const select = callsOf(state.calls, 'characters', 'select')[0];
      expect(filterOf(select, 'in', 'id')).toEqual(['player-1']);
    });

    it('personagem Morto não volta à vida', async () => {
      state.respond = rowsOf({ id: 'player-1', is_dead: true, stats: { pv: 10 }, skills: null });
      await createGameSession(payload());
      expect(restWrites()).toEqual([]);
    });

    it('erro ao restaurar é só registrado; a sessão é devolvida', async () => {
      state.respond = (call) =>
        call.table === 'characters' && call.op === 'select'
          ? { error: new Error('falhou') }
          : respond(call);
      expect(await createGameSession(payload())).toBe('session-new');
    });
  });

  it('sem participantes, não marca ficha nenhuma', async () => {
    state.respond = respond;
    await createGameSession(payload({ participant_character_ids: [] }));
    expect(callsOf(state.calls, 'characters', 'update')).toEqual([]);
  });

  it('erro ao marcar participação é só registrado; a sessão é devolvida', async () => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'update'
        ? { error: new Error('falhou') }
        : respond(call);
    expect(await createGameSession(payload())).toBe('session-new');
  });

  it('GAP conhecido: se a função SQL falhar, as fichas de NPC e inimigo já criadas ficam órfãs', async () => {
    state.respond = (call) =>
      call.table === 'create_game_session' ? { error: new Error('falhou') } : respond(call);
    await expect(createGameSession(payload({ enemies: [enemy] }))).rejects.toThrow('falhou');
    expect(callsOf(state.calls, 'characters', 'insert')).toHaveLength(1);
    expect(callsOf(state.calls, 'characters', 'delete')).toEqual([]);
  });

  it('erro ao criar uma ficha de inimigo interrompe a criação da sessão', async () => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'insert'
        ? { error: new Error('falhou') }
        : respond(call);
    await expect(createGameSession(payload({ enemies: [enemy] }))).rejects.toThrow('falhou');
    expect(callsOf(state.calls, 'create_game_session')).toEqual([]);
  });
});
