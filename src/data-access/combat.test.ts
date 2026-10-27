// Fixa o que a camada de combate pede ao Supabase (tabela, filtros, payload) com o Supabase falso.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
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

import { callsOf, filterOf } from '../test/fakeSupabase';
import {
  applyAttack,
  createCombat,
  finishCombat,
  findSessionCombat,
  getCharacterConditions,
  getCharacterSkills,
  getCharactersForCombatEnd,
  getCombat,
  insertCombatParticipants,
  listCombatAbilityUses,
  listCombatAttacks,
  listCombatParticipants,
  recordAbilityUse,
  resolveAbilityUse,
  setParticipantConditions,
  softDeleteCharacters,
  updateCombatTurn,
} from './combat';

const failure = { message: 'falhou' };

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('createCombat', () => {
  it('cria o combate ativo da sessão no primeiro turno da primeira rodada', async () => {
    state.respond = () => ({ data: { id: 'combat-1' } });
    await expect(createCombat('s1')).resolves.toEqual({ id: 'combat-1' });
    const [call] = callsOf(state.calls, 'combats', 'insert');
    expect(call.payload).toEqual({
      session_id: 's1',
      status: 'active',
      current_turn_index: 0,
      round_number: 1,
    });
    expect(call.single).toBe(true);
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(createCombat('s1')).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Failed to create combat', failure);
  });
});

describe('insertCombatParticipants', () => {
  const row = {
    combat_id: 'c1',
    entity_id: 'e1',
    entity_type: 'player' as const,
    initiative: 12,
    hp_current: 9,
    conditions: [{ conditionId: 'cego', duration: 2 }],
  };

  it('insere os participantes com as Condições', async () => {
    await insertCombatParticipants([row]);
    const [call] = callsOf(state.calls, 'combat_participants', 'insert');
    expect(call.payload).toEqual([row]);
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(insertCombatParticipants([row])).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Failed to insert participants', failure);
  });
});

describe('leituras das fichas do combate', () => {
  it('getCharacterConditions devolve as Condições por ficha, com lista vazia para nulo', async () => {
    state.respond = () => ({
      data: [
        { id: 'a', conditions: [{ conditionId: 'cego', duration: null }] },
        { id: 'b', conditions: null },
      ],
    });
    await expect(getCharacterConditions(['a', 'b'])).resolves.toEqual({
      a: [{ conditionId: 'cego', duration: null }],
      b: [],
    });
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('id, conditions');
    expect(filterOf(call, 'in', 'id')).toEqual(['a', 'b']);
  });

  it('getCharacterSkills devolve as habilidades por ficha, com objeto vazio para nulo', async () => {
    state.respond = () => ({
      data: [
        { id: 'a', skills: { ability_uses: { golpe: 1 } } },
        { id: 'b', skills: null },
      ],
    });
    await expect(getCharacterSkills(['a', 'b'])).resolves.toEqual([
      { id: 'a', skills: { ability_uses: { golpe: 1 } } },
      { id: 'b', skills: {} },
    ]);
    expect(callsOf(state.calls, 'characters', 'select')[0].columns).toBe('id, skills');
  });

  it('getCharactersForCombatEnd pede o que fecha a vida de cada ficha', async () => {
    state.respond = () => ({ data: [{ id: 'a' }] });
    await expect(getCharactersForCombatEnd(['a'])).resolves.toEqual([{ id: 'a' }]);
    const [call] = callsOf(state.calls, 'characters', 'select');
    expect(call.columns).toBe('id, stats, is_dead, is_enemy');
    expect(filterOf(call, 'in', 'id')).toEqual(['a']);
  });

  it('lançam o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(getCharacterConditions(['a'])).rejects.toBe(failure);
    await expect(getCharacterSkills(['a'])).rejects.toBe(failure);
    await expect(getCharactersForCombatEnd(['a'])).rejects.toBe(failure);
  });
});

describe('findSessionCombat e listCombatParticipants', () => {
  it('findSessionCombat procura o combate da sessão no estado pedido', async () => {
    state.respond = () => ({ data: { id: 'combat-1' } });
    await expect(findSessionCombat('s1', 'setup')).resolves.toEqual({ id: 'combat-1' });
    const [call] = callsOf(state.calls, 'combats', 'select');
    expect(filterOf(call, 'eq', 'session_id')).toBe('s1');
    expect(filterOf(call, 'eq', 'status')).toBe('setup');
  });

  it('devolve nulo sem combate e lança o erro do Supabase', async () => {
    state.respond = () => ({ data: null });
    await expect(findSessionCombat('s1', 'active')).resolves.toBeNull();
    state.respond = () => ({ error: failure });
    await expect(findSessionCombat('s1', 'active')).rejects.toBe(failure);
  });

  it('getCombat lê o combate pelo id e lança o erro do Supabase', async () => {
    state.respond = () => ({ data: { id: 'combat-1', current_turn_index: 2 } });
    await expect(getCombat('combat-1')).resolves.toEqual({ id: 'combat-1', current_turn_index: 2 });
    const [call] = callsOf(state.calls, 'combats', 'select');
    expect(filterOf(call, 'eq', 'id')).toBe('combat-1');
    expect(call.single).toBe(true);
    state.respond = () => ({ error: failure });
    await expect(getCombat('combat-1')).rejects.toBe(failure);
  });

  it('listCombatParticipants lista os participantes do combate', async () => {
    state.respond = () => ({ data: [{ id: 'p1' }] });
    await expect(listCombatParticipants('combat-1')).resolves.toEqual([{ id: 'p1' }]);
    expect(filterOf(callsOf(state.calls, 'combat_participants')[0], 'eq', 'combat_id')).toBe(
      'combat-1',
    );
    state.respond = () => ({ error: failure });
    await expect(listCombatParticipants('combat-1')).rejects.toBe(failure);
  });
});

describe('gravações do combate', () => {
  it('setParticipantConditions grava as Condições do participante', async () => {
    const conditions = [{ conditionId: 'cego', duration: 1 }];
    await setParticipantConditions('p1', conditions);
    const [call] = callsOf(state.calls, 'combat_participants', 'update');
    expect(call.payload).toEqual({ conditions });
    expect(filterOf(call, 'eq', 'id')).toBe('p1');
  });

  it('updateCombatTurn grava turno e rodada', async () => {
    await updateCombatTurn('combat-1', 2, 3);
    const [call] = callsOf(state.calls, 'combats', 'update');
    expect(call.payload).toEqual({ current_turn_index: 2, round_number: 3 });
    expect(filterOf(call, 'eq', 'id')).toBe('combat-1');
  });

  it('finishCombat marca o combate como finalizado', async () => {
    await finishCombat('combat-1');
    const [call] = callsOf(state.calls, 'combats', 'update');
    expect(call.payload).toEqual({ status: 'finished' });
    expect(filterOf(call, 'eq', 'id')).toBe('combat-1');
  });

  it('softDeleteCharacters marca as fichas como apagadas', async () => {
    await softDeleteCharacters(['a', 'b']);
    const [call] = callsOf(state.calls, 'characters', 'update');
    expect(call.payload).toEqual({ is_deleted: true });
    expect(filterOf(call, 'in', 'id')).toEqual(['a', 'b']);
  });

  it('as quatro lançam o erro do Supabase, e as três primeiras o registram', async () => {
    state.respond = () => ({ error: failure });
    await expect(setParticipantConditions('p1', [])).rejects.toBe(failure);
    await expect(updateCombatTurn('c', 0, 1)).rejects.toBe(failure);
    await expect(finishCombat('c')).rejects.toBe(failure);
    await expect(softDeleteCharacters(['a'])).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledWith('Failed to update conditions', failure);
    expect(console.error).toHaveBeenCalledWith('Failed to update turn', failure);
    expect(console.error).toHaveBeenCalledWith('Failed to end combat', failure);
  });
});

describe('applyAttack', () => {
  const attack = {
    attackerParticipantId: 'p1',
    targetParticipantId: 'p2',
    naturalRoll: 14,
    total: 19,
    targetAc: 15,
    hit: true,
    critical: false,
    fumble: false,
    damage: 7,
    appliedMode: 'vantagem' as const,
    rolls: [14, 6],
    inspirationUsed: true,
    weaponEffectTriggered: true,
    weaponConditions: [{ conditionId: 'sangrando', duration: 3 }],
  };

  it('chama a função de ataque com o resultado do motor e devolve o id do ataque', async () => {
    state.respond = () => ({ data: 'atk-1' });
    await expect(applyAttack(attack)).resolves.toBe('atk-1');
    const [call] = callsOf(state.calls, 'apply_attack', 'rpc');
    expect(call.payload).toEqual({
      p_attacker_participant_id: 'p1',
      p_target_participant_id: 'p2',
      p_natural_roll: 14,
      p_total: 19,
      p_target_ac: 15,
      p_hit: true,
      p_critical: false,
      p_fumble: false,
      p_damage: 7,
      p_applied_mode: 'vantagem',
      p_rolls: [14, 6],
      p_inspiration_used: true,
      p_weapon_effect_triggered: true,
      p_conditions: [{ conditionId: 'sangrando', duration: 3 }],
    });
  });

  it('sem os dois d20, não manda a lista', async () => {
    state.respond = () => ({ data: 'atk-1' });
    await applyAttack({
      ...attack,
      rolls: null,
      appliedMode: 'normal',
      inspirationUsed: false,
      weaponEffectTriggered: false,
      weaponConditions: [],
    });
    const [call] = callsOf(state.calls, 'apply_attack', 'rpc');
    expect(call.payload).toMatchObject({
      p_applied_mode: 'normal',
      p_rolls: undefined,
      p_inspiration_used: false,
      p_weapon_effect_triggered: false,
      p_conditions: [],
    });
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(applyAttack(attack)).rejects.toBe(failure);
  });
});

describe('listCombatAttacks', () => {
  it('lê os últimos ataques do combate, do mais novo para o mais antigo', async () => {
    state.respond = () => ({ data: [{ id: 'a1' }] });
    await expect(listCombatAttacks('c1', 10)).resolves.toEqual([{ id: 'a1' }]);
    const [call] = callsOf(state.calls, 'combat_attacks', 'select');
    expect(filterOf(call, 'eq', 'combat_id')).toBe('c1');
    expect(call.filters).toContainEqual(['order', 'created_at', { ascending: false }]);
    expect(call.filters).toContainEqual(['limit', 10]);
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listCombatAttacks('c1', 10)).rejects.toBe(failure);
  });
});

describe('recordAbilityUse', () => {
  const use = {
    userParticipantId: 'p1',
    abilityId: 'tribe-levi-16-palavra-de-auto',
    abilityName: 'Palavra de Autoridade',
    actionType: 'action',
    targets: [
      { participantId: 'p2', conditions: [{ conditionId: 'paralisado', duration: 1 }] },
      { participantId: 'p3', conditions: [] },
    ],
  };

  it('chama a função do banco com os alvos e as Condições que chegaram, e devolve o id', async () => {
    state.respond = () => ({ data: 'use-1' });
    await expect(recordAbilityUse(use)).resolves.toBe('use-1');
    const [call] = callsOf(state.calls, 'record_ability_use', 'rpc');
    expect(call.payload).toEqual({
      p_user_participant_id: 'p1',
      p_ability_id: 'tribe-levi-16-palavra-de-auto',
      p_ability_name: 'Palavra de Autoridade',
      p_action_type: 'action',
      p_targets: use.targets,
    });
  });

  it('manda as Condições que saem de cada alvo', async () => {
    state.respond = () => ({ data: 'use-2' });
    const removal = {
      ...use,
      targets: [{ participantId: 'p3', conditions: [], remove: ['envenenado'] }],
    };
    await recordAbilityUse(removal);
    const [call] = callsOf(state.calls, 'record_ability_use', 'rpc');
    expect(call.payload).toMatchObject({ p_targets: removal.targets });
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(recordAbilityUse(use)).rejects.toBe(failure);
  });

  it('com TR manda o atributo e a CD, e as Condições ficam de fora', async () => {
    state.respond = () => ({ data: 'use-2' });
    await recordAbilityUse({
      ...use,
      save: { attribute: 'sab', cd: 13 },
      targets: [{ participantId: 'p2', conditions: [] }],
    });
    const [call] = callsOf(state.calls, 'record_ability_use', 'rpc');
    expect(call.payload).toMatchObject({ p_save: { attribute: 'sab', cd: 13 } });
  });

  it('sem TR não manda o parâmetro do TR', async () => {
    state.respond = () => ({ data: 'use-1' });
    await recordAbilityUse(use);
    const [call] = callsOf(state.calls, 'record_ability_use', 'rpc');
    expect(call.payload).not.toHaveProperty('p_save');
  });
});

describe('resolveAbilityUse', () => {
  const results = [
    {
      participantId: 'p2',
      natural: 4,
      total: 9,
      failed: true,
      mode: 'normal',
      conditions: [{ conditionId: 'amedrontado', duration: 10 }],
    },
  ];

  it('chama a função do banco com o resultado de cada alvo e devolve o estado do uso', async () => {
    state.respond = () => ({ data: 'resolved' });
    await expect(resolveAbilityUse('use-1', results)).resolves.toBe('resolved');
    const [call] = callsOf(state.calls, 'resolve_ability_use', 'rpc');
    expect(call.payload).toEqual({ p_use_id: 'use-1', p_results: results });
  });

  it('devolve expired quando o combate já acabou', async () => {
    state.respond = () => ({ data: 'expired' });
    await expect(resolveAbilityUse('use-1', results)).resolves.toBe('expired');
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(resolveAbilityUse('use-1', results)).rejects.toBe(failure);
  });
});

describe('listCombatAbilityUses', () => {
  it('lê os últimos usos do combate, do mais novo para o mais antigo', async () => {
    state.respond = () => ({ data: [{ id: 'u1' }] });
    await expect(listCombatAbilityUses('c1', 10)).resolves.toEqual([{ id: 'u1' }]);
    const [call] = callsOf(state.calls, 'combat_ability_uses', 'select');
    expect(filterOf(call, 'eq', 'combat_id')).toBe('c1');
    expect(call.filters).toContainEqual(['order', 'created_at', { ascending: false }]);
    expect(call.filters).toContainEqual(['limit', 10]);
  });

  it('lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(listCombatAbilityUses('c1', 10)).rejects.toBe(failure);
  });
});
