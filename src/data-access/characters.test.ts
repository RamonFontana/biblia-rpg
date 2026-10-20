// Fixa o que a camada de fichas grava e consulta (tabela, filtros, payload) com o Supabase falso.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
  userId: 'user-1' as string | null,
  syncInventoryItems: vi.fn(),
  subscriptions: [] as { name: string; subscriptions: unknown[] }[],
  stopped: 0,
}));

vi.mock('@/lib/supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
      userId: () => state.userId,
    }),
  };
});

vi.mock('./inventory', () => ({ syncInventoryItems: state.syncInventoryItems }));
vi.mock('./realtime', () => ({
  subscribeToTables: (name: string, subscriptions: unknown[]) => {
    state.subscriptions.push({ name, subscriptions });
    return () => {
      state.stopped += 1;
    };
  },
}));

import { callsOf, filterOf } from '../test/fakeSupabase';
import {
  createEnemyCharacter,
  deleteCharacters,
  filterNpcAndEnemyIds,
  findLatestCharacterOfUser,
  getActiveSessionCharacterIds,
  getCharacterById,
  getCharacterDeathState,
  getCharacterResistanceSource,
  getCharacterStats,
  getCharacterTestContext,
  getCharacters,
  getMyCharacters,
  grantPendingLevelUp,
  insertCharacter,
  listCampaignNpcs,
  markCharactersParticipated,
  saveCharacter,
  setCharacterVisible,
  subscribeToCharacterSheet,
  subscribeToCharacterUpdates,
  updateCharacter,
  updateCharacterDeathState,
  updateCharacterEquipment,
  updateCharacterRest,
  updateCharacterSkills,
  updateCharacterStats,
} from './characters';

const failure = { message: 'falhou' };
const stats = { pv: 20, ca: 12, faith: 10, current_pv: 7, current_faith: 4 };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  state.userId = 'user-1';
  state.syncInventoryItems.mockReset();
  state.subscriptions.length = 0;
  state.stopped = 0;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('listCampaignNpcs', () => {
  it('lista as fichas de NPC por nome', async () => {
    state.respond = () => ({ data: [{ id: 'n1' }, { id: 'n2' }] });
    await expect(listCampaignNpcs()).resolves.toEqual([{ id: 'n1' }, { id: 'n2' }]);
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(filterOf(call, 'eq', 'is_npc')).toBe(true);
    expect(call.filters).toContainEqual(['order', 'name']);
  });

  it('devolve lista vazia sem dados e lança o erro quando falha', async () => {
    state.respond = () => ({ data: null });
    await expect(listCampaignNpcs()).resolves.toEqual([]);
    state.respond = () => ({ error: failure });
    await expect(listCampaignNpcs()).rejects.toBe(failure);
  });
});

describe('updateCharacterStats', () => {
  it('grava só as estatísticas da ficha pedida', async () => {
    await updateCharacterStats('c1', stats);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ stats });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('lança o erro ao gravar', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateCharacterStats('c1', stats)).rejects.toBe(failure);
  });
});

describe('updateCharacterRest', () => {
  it('grava estatísticas e habilidades juntas', async () => {
    const skills = { ability_uses: { golpe: 0 } };
    await updateCharacterRest('c1', { stats, skills });
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ stats, skills });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('lança o erro ao gravar', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateCharacterRest('c1', { stats, skills: {} })).rejects.toBe(failure);
  });
});

describe('setCharacterVisible', () => {
  it('grava a visibilidade da ficha pedida', async () => {
    await setCharacterVisible('c1', true);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ is_visible: true });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });
});

describe('createEnemyCharacter', () => {
  const row = {
    name: 'Soldado',
    vocation: 'Guerreiro',
    tribe: 'Inimigo',
    is_enemy: true,
    user_id: 'gm',
    stats,
    attributes: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  };

  it('insere a linha e devolve a ficha gravada', async () => {
    state.respond = () => ({ data: { id: 'c9', ...row } });
    await expect(createEnemyCharacter(row)).resolves.toEqual({ id: 'c9', ...row });
    const [call] = callsOf(state.calls, 'characters', 'insert');
    expect(call.payload).toEqual(row);
    expect(call.single).toBe(true);
  });

  it('lança o erro ao inserir', async () => {
    state.respond = () => ({ error: failure });
    await expect(createEnemyCharacter(row)).rejects.toBe(failure);
  });
});

describe('getCharacters e getMyCharacters', () => {
  const activeFilters = [
    ['or', 'is_npc.eq.false,is_npc.is.null'],
    ['or', 'is_enemy.eq.false,is_enemy.is.null'],
    ['or', 'is_deleted.eq.false,is_deleted.is.null'],
    ['or', 'is_dead.eq.false,is_dead.is.null'],
  ];

  it('listam só fichas jogáveis e ativas, com o inventário, da mais nova para a mais antiga', async () => {
    state.respond = () => ({ data: [{ id: 'c1' }] });
    await expect(getCharacters()).resolves.toEqual([{ id: 'c1' }]);

    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('*, character_items(*, items(*))');
    expect(call.filters).toEqual([...activeFilters, ['order', 'created_at', { ascending: false }]]);
  });

  it('getMyCharacters acrescenta o filtro do usuário logado', async () => {
    state.respond = () => ({ data: [{ id: 'c1' }] });
    await expect(getMyCharacters()).resolves.toEqual([{ id: 'c1' }]);

    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(filterOf(call, 'eq', 'user_id')).toBe('user-1');
    expect(call.filters).toContainEqual(['order', 'created_at', { ascending: false }]);
  });

  it('getMyCharacters exige usuário logado', async () => {
    state.userId = null;
    await expect(getMyCharacters()).rejects.toThrow('Usuário não autenticado');
    expect(callsOf(state.calls, 'characters')).toHaveLength(0);
  });

  it('registram e lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getCharacters()).rejects.toBe(failure);
    await expect(getMyCharacters()).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});

describe('getCharacterById e findLatestCharacterOfUser', () => {
  it('getCharacterById lê uma ficha pelo id', async () => {
    state.respond = () => ({ data: { id: 'c1' } });
    await expect(getCharacterById('c1')).resolves.toEqual({ id: 'c1' });
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('*');
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
    expect(call.single).toBe(true);
  });

  it('devolvem nulo quando não há linha (PGRST116) e lançam os outros erros', async () => {
    state.respond = () => ({ error: { code: 'PGRST116', message: 'sem linha' } });
    await expect(getCharacterById('c1')).resolves.toBeNull();
    await expect(findLatestCharacterOfUser('u1')).resolves.toBeNull();

    state.respond = () => ({ error: failure });
    await expect(getCharacterById('c1')).rejects.toBe(failure);
    await expect(findLatestCharacterOfUser('u1')).rejects.toBe(failure);
  });

  it('findLatestCharacterOfUser pega a ficha mais nova do usuário', async () => {
    state.respond = () => ({ data: { id: 'c9' } });
    await expect(findLatestCharacterOfUser('u1')).resolves.toEqual({ id: 'c9' });
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(filterOf(call, 'eq', 'user_id')).toBe('u1');
    expect(call.filters).toContainEqual(['order', 'created_at', { ascending: false }]);
    expect(call.filters).toContainEqual(['limit', 1]);
    expect(call.single).toBe(true);
  });
});

describe('updateCharacter', () => {
  it('grava só o que veio e devolve a ficha gravada', async () => {
    state.respond = () => ({ data: { id: 'c1', vocation: 'Batedor' } });
    await expect(updateCharacter('c1', { level: 2 })).resolves.toEqual({
      id: 'c1',
      vocation: 'Batedor',
    });

    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ level: 2 });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
    expect(call.single).toBe(true);
    expect(state.syncInventoryItems).not.toHaveBeenCalled();
  });

  it('refaz o inventário quando o equipamento muda, com a vocação enviada', async () => {
    state.respond = () => ({ data: { id: 'c1', vocation: 'Batedor' } });
    const equipment = [{ id: 'adaga', name: 'Adaga', type: 'arma' }];
    await updateCharacter('c1', { equipment, vocation: 'Guerreiro' });
    expect(state.syncInventoryItems).toHaveBeenCalledWith('c1', equipment, 'Guerreiro');
  });

  it('sem vocação enviada usa a da ficha, e sem ela usa Guerreiro', async () => {
    const equipment = [{ id: 'adaga', name: 'Adaga', type: 'arma' }];
    state.respond = () => ({ data: { id: 'c1', vocation: 'Batedor' } });
    await updateCharacter('c1', { equipment });
    expect(state.syncInventoryItems).toHaveBeenLastCalledWith('c1', equipment, 'Batedor');

    state.respond = () => ({ data: { id: 'c1', vocation: '' } });
    await updateCharacter('c1', { equipment });
    expect(state.syncInventoryItems).toHaveBeenLastCalledWith('c1', equipment, 'Guerreiro');
  });

  it('registra e lança o erro do Supabase sem mexer no inventário', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateCharacter('c1', { equipment: [{}] })).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalled();
    expect(state.syncInventoryItems).not.toHaveBeenCalled();
  });
});

describe('getActiveSessionCharacterIds', () => {
  it('devolve os personagens do usuário em sessões ativas', async () => {
    state.respond = () => ({ data: [{ character_id: 'c1' }, { character_id: 'c2' }] });
    await expect(getActiveSessionCharacterIds()).resolves.toEqual(new Set(['c1', 'c2']));

    const [call] = callsOf(state.calls, 'session_participants', 'select');
    expect(filterOf(call, 'eq', 'game_sessions.status')).toBe('active');
    expect(filterOf(call, 'eq', 'user_id')).toBe('user-1');
  });

  it('sem usuário logado ou com erro, devolve um conjunto vazio', async () => {
    state.userId = null;
    await expect(getActiveSessionCharacterIds()).resolves.toEqual(new Set());
    expect(callsOf(state.calls, 'session_participants')).toHaveLength(0);

    state.userId = 'user-1';
    state.respond = () => ({ error: failure });
    await expect(getActiveSessionCharacterIds()).resolves.toEqual(new Set());
    expect(console.error).toHaveBeenCalled();
  });
});

describe('updateCharacterEquipment', () => {
  const equipment = { head: null, body: 'ci-1', mainHand: 'ci-2', offHand: null };

  it('grava as quatro posições na ficha pedida', async () => {
    await updateCharacterEquipment('c1', equipment);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ equipment });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateCharacterEquipment('c1', equipment)).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('saveCharacter', () => {
  const draft = {
    name: 'Eli',
    tribe: 'Judá',
    vocation: 'Guerreiro',
    attributes: { for: 14, des: 12, con: 13, int: 10, sab: 10, car: 8 },
    stats: { pv: 12, ca: 11, faith: 10 },
  };

  it('exige usuário logado', async () => {
    state.userId = null;
    await expect(saveCharacter(draft)).rejects.toThrow('Usuário não autenticado');
    expect(callsOf(state.calls, 'characters')).toHaveLength(0);
  });

  it.each(['name', 'tribe', 'vocation', 'attributes', 'stats'] as const)(
    'recusa a ficha sem %s',
    async (field) => {
      await expect(saveCharacter({ ...draft, [field]: undefined })).rejects.toThrow(
        'Ficha incompleta',
      );
      expect(callsOf(state.calls, 'characters')).toHaveLength(0);
    },
  );

  it('grava a ficha com os padrões das colunas opcionais', async () => {
    state.respond = () => ({ data: { id: 'c1' } });
    await expect(saveCharacter(draft)).resolves.toEqual({ id: 'c1' });

    const [call] = callsOf(state.calls, 'characters', 'insert');
    expect(call.payload).toEqual({
      user_id: 'user-1',
      name: 'Eli',
      tribe: 'Judá',
      vocation: 'Guerreiro',
      attributes: draft.attributes,
      fortress: null,
      temptation: null,
      stats: draft.stats,
      proficiencies: null,
      equipment: [],
      coins: 0,
      narrative: null,
    });
    expect(state.syncInventoryItems).not.toHaveBeenCalled();
  });

  it('refaz o inventário com o equipamento e a vocação da ficha', async () => {
    state.respond = () => ({ data: { id: 'c1' } });
    const equipment = [{ id: 'kit_basico', name: 'Kit', type: 'kit' }];
    await saveCharacter({ ...draft, equipment, coins: 5, fortress: 'Coragem', temptation: 'Ira' });

    const [call] = callsOf(state.calls, 'characters', 'insert');
    expect(call.payload).toMatchObject({
      equipment,
      coins: 5,
      fortress: 'Coragem',
      temptation: 'Ira',
    });
    expect(state.syncInventoryItems).toHaveBeenCalledWith('c1', equipment, 'Guerreiro');
  });

  it('lança o erro do Supabase sem mexer no inventário', async () => {
    state.respond = () => ({ error: failure });
    await expect(saveCharacter({ ...draft, equipment: [{ id: 'x' }] })).rejects.toBe(failure);
    expect(state.syncInventoryItems).not.toHaveBeenCalled();
  });
});

describe('subscribeToCharacterSheet', () => {
  type Sub = {
    table: string;
    event?: string;
    filter: string;
    onChange: (payload: { new: unknown }) => void;
  };
  const setup = () => {
    const handlers = { onInventoryChange: vi.fn(), onCharacterUpdate: vi.fn() };
    const stop = subscribeToCharacterSheet('c1', handlers);
    const [{ name, subscriptions }] = state.subscriptions;
    return { handlers, stop, name, subs: subscriptions as Sub[] };
  };

  it('assina os itens do personagem e as atualizações da ficha', () => {
    const { name, subs } = setup();
    expect(name).toMatch(/^character_sheet_updates_c1_/);
    expect(subs.map((s) => [s.table, s.event, s.filter])).toEqual([
      ['character_items', undefined, 'character_id=eq.c1'],
      ['characters', 'UPDATE', 'id=eq.c1'],
    ]);
  });

  it('avisa quando o inventário muda, sem repassar o payload', () => {
    const { handlers, subs } = setup();
    subs[0].onChange({ new: { id: 'ci1' } });
    expect(handlers.onInventoryChange).toHaveBeenCalledWith();
    expect(handlers.onCharacterUpdate).not.toHaveBeenCalled();
  });

  it('entrega a linha nova quando a ficha é atualizada', () => {
    const { handlers, subs } = setup();
    subs[1].onChange({ new: { id: 'c1', level: 2 } });
    expect(handlers.onCharacterUpdate).toHaveBeenCalledWith({ id: 'c1', level: 2 });
    expect(handlers.onInventoryChange).not.toHaveBeenCalled();
  });

  it('devolve o cancelamento da assinatura', () => {
    const { stop } = setup();
    expect(state.stopped).toBe(0);
    stop();
    expect(state.stopped).toBe(1);
  });
});

describe('updateCharacterSkills', () => {
  it('grava só as habilidades da ficha pedida', async () => {
    const skills = { ability_uses: { golpe: 1 } };
    await updateCharacterSkills('c1', skills);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ skills });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(updateCharacterSkills('c1', {})).rejects.toBe(failure);
  });
});

describe('getCharacterResistanceSource', () => {
  it('lê o equipamento e os itens com o slug da ficha', async () => {
    state.respond = () => ({ data: { equipment: {}, character_items: [] } });
    await expect(getCharacterResistanceSource('c1')).resolves.toEqual({
      equipment: {},
      character_items: [],
    });
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('equipment, character_items(*, items(slug))');
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
    expect(call.single).toBe(true);
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getCharacterResistanceSource('c1')).rejects.toBe(failure);
  });
});

describe('estado de morte', () => {
  it('getCharacterDeathState lê os testes de morte, estável e morto', async () => {
    const row = {
      id: 'c1',
      death_saves_successes: 1,
      death_saves_failures: 0,
      is_stable: false,
      is_dead: false,
    };
    state.respond = () => ({ data: row });
    await expect(getCharacterDeathState('c1')).resolves.toEqual(row);
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe(
      'id, death_saves_successes, death_saves_failures, is_stable, is_dead',
    );
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('updateCharacterDeathState grava só os campos pedidos', async () => {
    await updateCharacterDeathState('c1', { is_stable: true, death_saves_successes: 3 });
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ is_stable: true, death_saves_successes: 3 });
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getCharacterDeathState('c1')).rejects.toBe(failure);
    await expect(updateCharacterDeathState('c1', { is_dead: true })).rejects.toBe(failure);
  });

  it('subscribeToCharacterUpdates entrega a linha nova das atualizações da ficha', () => {
    const onChange = vi.fn();
    const stop = subscribeToCharacterUpdates('c1', onChange);
    const [{ name, subscriptions }] = state.subscriptions;
    const [sub] = subscriptions as {
      table: string;
      event: string;
      filter: string;
      onChange: (p: { new: unknown }) => void;
    }[];
    expect(name).toMatch(/^char_death_c1_/);
    expect([sub.table, sub.event, sub.filter]).toEqual(['characters', 'UPDATE', 'id=eq.c1']);

    sub.onChange({ new: { id: 'c1', is_dead: true } });
    expect(onChange).toHaveBeenCalledWith({ id: 'c1', is_dead: true });
    stop();
    expect(state.stopped).toBe(1);
  });
});

describe('fichas de uma sessão (criar, marcar, apagar)', () => {
  const newRow = {
    name: 'Guarda',
    user_id: 'gm',
    tribe: 'Inimigo',
    vocation: '',
    attributes: {},
    stats: {},
  };

  it('getCharacterStats lê só os stats da ficha', async () => {
    state.respond = () => ({ data: { stats: { pv: 10, ca: 12, faith: 50 } } });
    await expect(getCharacterStats('c1')).resolves.toEqual({ pv: 10, ca: 12, faith: 50 });
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
    expect(call.single).toBe(true);
  });

  it('getCharacterTestContext lê só o que o bônus do Teste usa', async () => {
    state.respond = () => ({ data: { level: 3, vocation: 'Guerreiro' } });
    await expect(getCharacterTestContext('c1')).resolves.toEqual({
      level: 3,
      vocation: 'Guerreiro',
    });
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('stats, equipment, level, proficiencies, attributes, vocation');
    expect(filterOf(call, 'eq', 'id')).toBe('c1');
  });

  it('insertCharacter grava a linha e devolve o id', async () => {
    state.respond = () => ({ data: { id: 'novo' } });
    await expect(insertCharacter(newRow)).resolves.toBe('novo');
    const [call] = callsOf(state.calls, 'characters', 'insert');
    expect(call.payload).toEqual(newRow);
  });

  it('markCharactersParticipated marca só os ids dados', async () => {
    await markCharactersParticipated(['a', 'b']);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ has_participated_in_session: true });
    expect(filterOf(call, 'in', 'id')).toEqual(['a', 'b']);
  });

  it('filterNpcAndEnemyIds devolve só os ids que são NPC ou inimigo', async () => {
    state.respond = () => ({ data: [{ id: 'npc-1' }] });
    await expect(filterNpcAndEnemyIds(['p1', 'npc-1'])).resolves.toEqual(['npc-1']);
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(filterOf(call, 'in', 'id')).toEqual(['p1', 'npc-1']);
    expect(call.filters).toContainEqual(['or', 'is_npc.eq.true,is_enemy.eq.true']);
  });

  it('deleteCharacters apaga de vez e grantPendingLevelUp só marca o nível pendente', async () => {
    await deleteCharacters(['x']);
    await grantPendingLevelUp(['y', 'z']);
    const [del] = callsOf(state.calls, 'characters', 'delete');
    expect(filterOf(del, 'in', 'id')).toEqual(['x']);
    const [grant] = callsOf(state.calls, 'characters', 'update');
    expect(grant.payload).toEqual({ pending_level_up: true });
    expect(filterOf(grant, 'in', 'id')).toEqual(['y', 'z']);
  });

  it('lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getCharacterStats('c1')).rejects.toBe(failure);
    await expect(getCharacterTestContext('c1')).rejects.toBe(failure);
    await expect(insertCharacter(newRow)).rejects.toBe(failure);
    await expect(markCharactersParticipated(['a'])).rejects.toBe(failure);
    await expect(filterNpcAndEnemyIds(['a'])).rejects.toBe(failure);
    await expect(deleteCharacters(['a'])).rejects.toBe(failure);
    await expect(grantPendingLevelUp(['a'])).rejects.toBe(failure);
  });
});
