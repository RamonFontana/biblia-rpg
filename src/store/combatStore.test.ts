// CARACTERIZAÇÃO: fixa o comportamento ATUAL do combate (ordem de turnos, tique de Condições por
// rodada, início e fim do combate) no combatStore, com um Supabase falso que só grava as chamadas.
// Decisões: ROADMAP.md, Onda 2: PV 0 deixa o personagem Morrendo (hoje o fim do combate o mata);
// Sangrando causa dano no FINAL do turno (hoje o dano nem é automático).
// Termos: CONTEXT.md (Condição, Morrendo, Morto).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FakeCall, FakeResult } from '../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
}));

vi.mock('../lib/supabase', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
    }),
  };
});

import { callsOf, filterOf } from '../test/fakeSupabase';
import { ABILITIES } from '@/content/abilities';
import { useCombatStore, type Combat, type CombatParticipant } from './combatStore';

const combat = (over: Partial<Combat> = {}): Combat => ({
  created_at: '',
  current_turn_index: 0,
  id: 'combat-1',
  round_number: 1,
  session_id: 'session-1',
  status: 'active',
  updated_at: '',
  ...over,
});

const part = (over: Partial<CombatParticipant> = {}): CombatParticipant => ({
  combat_id: 'combat-1',
  conditions: [],
  created_at: '',
  entity_id: 'entity',
  entity_type: 'player',
  hp_current: 10,
  id: 'part',
  initiative: 0,
  is_surprised: false,
  updated_at: '',
  ...over,
});

const conds = (...entries: Array<[string, number | null]>) =>
  entries.map(([conditionId, duration]) => ({ conditionId, duration }));

const store = () => useCombatStore.getState();
const payloadOf = <T>(call: FakeCall) => call.payload as T;

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  useCombatStore.setState({
    activeCombat: null,
    participants: [],
    currentTurnParticipant: null,
    combatUnsubscribe: null,
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('setCombatState: ordem e vez de quem joga', () => {
  const a = part({ id: 'a', initiative: 12 });
  const b = part({ id: 'b', initiative: 18 });
  const c = part({ id: 'c', initiative: 5 });

  it('ordena por iniciativa decrescente e dá a vez a quem está no índice atual', () => {
    store().setCombatState(combat({ current_turn_index: 1 }), [a, b, c]);
    expect(store().participants.map((p) => p.id)).toEqual(['b', 'a', 'c']);
    expect(store().currentTurnParticipant?.id).toBe('a');
  });

  it('iniciativas iguais mantêm a ordem de chegada', () => {
    const x = part({ id: 'x', initiative: 10 });
    const y = part({ id: 'y', initiative: 10 });
    store().setCombatState(combat(), [x, y]);
    expect(store().participants.map((p) => p.id)).toEqual(['x', 'y']);
  });

  it('sem combate, ou sem participantes, ninguém tem a vez', () => {
    store().setCombatState(null, [a]);
    expect(store().currentTurnParticipant).toBeNull();
    store().setCombatState(combat(), []);
    expect(store().currentTurnParticipant).toBeNull();
  });

  it('um índice maior que a lista dá a volta', () => {
    store().setCombatState(combat({ current_turn_index: 4 }), [a, b, c]);
    expect(store().currentTurnParticipant?.id).toBe('a'); // 4 % 3 = 1 → segundo da lista ordenada
  });

  it('GAP conhecido: o índice guarda a posição, não o participante', () => {
    // A vez é do 2º da lista (a). Se b, que está antes, sai do combate, o mesmo índice passa
    // a apontar para outro participante (c).
    store().setCombatState(combat({ current_turn_index: 1 }), [a, b, c]);
    expect(store().currentTurnParticipant?.id).toBe('a');
    store().setCombatState(combat({ current_turn_index: 1 }), [a, c]);
    expect(store().currentTurnParticipant?.id).toBe('c');
  });
});

describe('nextTurn', () => {
  const setup = (index: number, round: number, participants: CombatParticipant[]) =>
    store().setCombatState(
      combat({ current_turn_index: index, round_number: round }),
      participants,
    );

  it('sem combate ativo não faz nada', async () => {
    await store().nextTurn();
    expect(state.calls).toEqual([]);
  });

  it('no meio da rodada só avança o índice e não mexe nas Condições', async () => {
    setup(0, 3, [
      part({ id: 'a', initiative: 20, conditions: conds(['sangrando', 2]) }),
      part({ id: 'b', initiative: 10 }),
    ]);
    await store().nextTurn();
    expect(callsOf(state.calls, 'combat_participants')).toEqual([]);
    const update = callsOf(state.calls, 'combats', 'update')[0];
    expect(update.payload).toEqual({ current_turn_index: 1, round_number: 3 });
    expect(filterOf(update, 'eq', 'id')).toBe('combat-1');
  });

  it('no fim da rodada volta ao primeiro e soma 1 à rodada', async () => {
    setup(1, 3, [part({ id: 'a', initiative: 20 }), part({ id: 'b', initiative: 10 })]);
    await store().nextTurn();
    expect(callsOf(state.calls, 'combats', 'update')[0].payload).toEqual({
      current_turn_index: 0,
      round_number: 4,
    });
  });

  it('as Condições temporárias perdem 1 de duração só na virada da rodada', async () => {
    setup(1, 1, [
      part({
        id: 'a',
        initiative: 20,
        conditions: conds(['sangrando', 3], ['cego', null], ['atordoado', 1]),
      }),
      part({ id: 'b', initiative: 10, conditions: conds(['caido', 2]) }),
    ]);
    await store().nextTurn();
    const updates = callsOf(state.calls, 'combat_participants', 'update');
    const byId = Object.fromEntries(
      updates.map((u) => [
        filterOf(u, 'eq', 'id') as string,
        payloadOf<{ conditions: unknown }>(u),
      ]),
    );
    // atordoado (duração 1) expira e some; cego (sem duração) fica; sangrando cai para 2.
    expect(byId.a.conditions).toEqual(conds(['sangrando', 2], ['cego', null]));
    expect(byId.b.conditions).toEqual(conds(['caido', 1]));
  });

  it('quem não tem Condição não recebe escrita', async () => {
    setup(1, 1, [
      part({ id: 'a', initiative: 20, conditions: conds(['sangrando', 3]) }),
      part({ id: 'b', initiative: 10, conditions: [] }),
    ]);
    await store().nextTurn();
    const updates = callsOf(state.calls, 'combat_participants', 'update');
    expect(updates.map((u) => filterOf(u, 'eq', 'id'))).toEqual(['a']);
  });

  it('as Condições são gravadas ANTES de avançar o turno', async () => {
    setup(1, 1, [
      part({ id: 'a', initiative: 20, conditions: conds(['sangrando', 3]) }),
      part({ id: 'b', initiative: 10 }),
    ]);
    await store().nextTurn();
    const order = state.calls.map((c) => `${c.table}:${c.op}`);
    expect(order).toEqual(['combat_participants:update', 'combats:update']);
  });

  it('espera as Condições serem gravadas antes de avançar o turno', async () => {
    setup(1, 1, [
      part({ id: 'a', initiative: 20, conditions: conds(['sangrando', 3]) }),
      part({ id: 'b', initiative: 10 }),
    ]);
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    state.respond = (call) => (call.table === 'combat_participants' ? { wait: gate } : undefined);
    const pending = store().nextTurn();
    await Promise.resolve();
    expect(callsOf(state.calls, 'combats')).toEqual([]);
    release();
    await pending;
    expect(callsOf(state.calls, 'combats', 'update')).toHaveLength(1);
  });

  it('GAP conhecido: se avançar o turno falhar, as Condições já foram descontadas', async () => {
    setup(1, 1, [
      part({ id: 'a', initiative: 20, conditions: conds(['sangrando', 3]) }),
      part({ id: 'b', initiative: 10 }),
    ]);
    state.respond = (call) =>
      call.table === 'combats' ? { error: new Error('falhou') } : undefined;
    await expect(store().nextTurn()).rejects.toThrow('falhou');
    expect(callsOf(state.calls, 'combat_participants', 'update')).toHaveLength(1);
  });

  it('quem está com 0 PV continua tendo turno (ninguém é pulado)', async () => {
    setup(0, 1, [
      part({ id: 'a', initiative: 20, hp_current: 0 }),
      part({ id: 'b', initiative: 10, hp_current: 0 }),
      part({ id: 'c', initiative: 5, hp_current: 0 }),
    ]);
    await store().nextTurn();
    expect(callsOf(state.calls, 'combats', 'update')[0].payload).toEqual({
      current_turn_index: 1,
      round_number: 1,
    });
  });
});

describe('endCombat', () => {
  const player = part({
    id: 'p-player',
    entity_id: 'char-player',
    initiative: 20,
    hp_current: 6,
    conditions: conds(['sangrando', 2], ['cego', null]),
  });
  const downedPlayer = part({
    id: 'p-downed',
    entity_id: 'char-downed',
    initiative: 15,
    hp_current: 0,
  });
  const deadEnemy = part({
    id: 'p-enemy',
    entity_id: 'char-enemy',
    entity_type: 'enemy',
    initiative: 10,
    hp_current: 0,
  });
  const liveEnemy = part({
    id: 'p-enemy-2',
    entity_id: 'char-enemy-2',
    entity_type: 'enemy',
    initiative: 9,
    hp_current: 4,
  });
  const lightweightNpc = part({
    id: 'p-npc',
    entity_id: 'session-npc',
    entity_type: 'npc',
    initiative: 5,
    hp_current: 3,
  });

  const characters = [
    { id: 'char-player', stats: { pv: 10, current_pv: 9 }, is_dead: false, is_enemy: false },
    { id: 'char-downed', stats: { pv: 10, current_pv: 3 }, is_dead: false, is_enemy: false },
    { id: 'char-enemy', stats: { pv: 8, current_pv: 2 }, is_dead: false, is_enemy: true },
    { id: 'char-enemy-2', stats: { pv: 8, current_pv: 8 }, is_dead: false, is_enemy: true },
  ];

  /**
   * `participants` é o estado local; `fresh` é o que o banco guarda naquele instante (o tempo real
   * pode estar atrasado). Sem `fresh`, os dois são iguais.
   */
  const run = async (
    participants: CombatParticipant[],
    rows: Array<Record<string, unknown>> = characters,
    fresh: CombatParticipant[] = participants,
  ) => {
    store().setCombatState(combat(), participants);
    state.respond = (call) => {
      if (call.op !== 'select') return undefined;
      if (call.table === 'characters') return { data: rows };
      if (call.table === 'combat_participants') return { data: fresh };
      return undefined;
    };
    await store().endCombat();
  };
  const writeOf = (id: string) =>
    callsOf(state.calls, 'characters', 'update').find((c) => filterOf(c, 'eq', 'id') === id);

  it('sem combate ativo não faz nada', async () => {
    await store().endCombat();
    expect(state.calls).toEqual([]);
  });

  it('grava o PV final e mantém só as Condições permanentes', async () => {
    await run([player, deadEnemy]);
    const write = writeOf('char-player')!;
    expect(write.payload).toEqual({
      stats: { pv: 10, current_pv: 6, status: 'Vivo' },
      conditions: conds(['cego', null]),
      is_dead: false,
    });
  });

  it('PV 0 ao fim do combate deixa o personagem Morrendo, sem matar', async () => {
    // Decisão do autor: o personagem continua os Testes de Morte depois do combate.
    await run([downedPlayer]);
    expect(writeOf('char-downed')!.payload).toEqual({
      stats: { pv: 10, current_pv: 0, status: 'Morrendo' },
      conditions: [],
      is_dead: false,
    });
  });

  it('o fim do combate não mexe nos Testes de Morte já feitos', async () => {
    await run([downedPlayer]);
    const keys = Object.keys(writeOf('char-downed')!.payload as object);
    expect(keys.sort()).toEqual(['conditions', 'is_dead', 'stats']);
  });

  it('inimigo com PV 0 morre ao fim do combate', async () => {
    await run([deadEnemy]);
    expect(writeOf('char-enemy')!.payload).toMatchObject({
      stats: { current_pv: 0, status: 'Morto' },
      is_dead: true,
    });
  });

  it('quem já estava Morto continua Morto mesmo com PV acima de 0', async () => {
    await run([player], [{ id: 'char-player', stats: { pv: 10 }, is_dead: true, is_enemy: false }]);
    expect(writeOf('char-player')!.payload).toMatchObject({ is_dead: true });
  });

  it('inimigo com PV 0 sai da lista (is_deleted); inimigo vivo e jogador no chão ficam', async () => {
    await run([downedPlayer, deadEnemy, liveEnemy]);
    const softDeletes = callsOf(state.calls, 'characters', 'update').filter(
      (c) => (c.payload as { is_deleted?: boolean }).is_deleted === true,
    );
    expect(softDeletes).toHaveLength(1);
    expect(filterOf(softDeletes[0], 'in', 'id')).toEqual(['char-enemy']);
  });

  it('NPC leve (session_npcs) não tem ficha em characters e não é tocado', async () => {
    await run([player, lightweightNpc]);
    expect(writeOf('session-npc')).toBeUndefined();
    expect(writeOf('char-player')).toBeDefined();
  });

  it('só encerra o combate depois de gravar as fichas, e limpa o estado', async () => {
    await run([player, deadEnemy]);
    const order = state.calls.map((c) => `${c.table}:${c.op}`);
    expect(order.at(-1)).toBe('combats:update');
    expect(order.indexOf('characters:update')).toBeLessThan(order.indexOf('combats:update'));
    expect(callsOf(state.calls, 'combats', 'update')[0].payload).toEqual({ status: 'finished' });
    expect(store().activeCombat).toBeNull();
    expect(store().participants).toEqual([]);
  });

  // O estado local vem do tempo real e pode estar atrasado: o dano de um instante atrás ainda não
  // chegou. Finalizar com ele gravava na ficha o PV de antes do dano.
  it('grava o PV que o banco guarda, não o do estado local atrasado', async () => {
    await run([player], characters, [{ ...player, hp_current: 0 }]);
    expect(writeOf('char-player')!.payload).toMatchObject({
      stats: { current_pv: 0, status: 'Morrendo' },
    });
  });

  it('lê os participantes do combate que está terminando', async () => {
    await run([player]);
    const read = callsOf(state.calls, 'combat_participants', 'select')[0];
    expect(filterOf(read, 'eq', 'combat_id')).toBe('combat-1');
  });

  it('se ler os participantes falhar, lança e não grava as fichas nem encerra o combate', async () => {
    store().setCombatState(combat(), [player]);
    state.respond = (call) =>
      call.table === 'combat_participants' ? { error: new Error('sem rede') } : undefined;
    await expect(store().endCombat()).rejects.toThrow('sem rede');
    expect(callsOf(state.calls, 'characters', 'update')).toEqual([]);
    expect(callsOf(state.calls, 'combats', 'update')).toEqual([]);
    expect(store().activeCombat).not.toBeNull();
  });

  it('se encerrar o combate falhar, lança e o estado local fica como estava', async () => {
    store().setCombatState(combat(), [player]);
    state.respond = (call) => {
      if (call.table === 'characters' && call.op === 'select') return { data: characters };
      if (call.table === 'combat_participants' && call.op === 'select') return { data: [player] };
      if (call.table === 'combats') return { error: new Error('falhou') };
      return undefined;
    };
    await expect(store().endCombat()).rejects.toThrow('falhou');
    expect(store().activeCombat).not.toBeNull();
  });
});

describe('startCombat', () => {
  const combatAbility = ABILITIES.find((a) => a.usageType === 'combat')!.id;
  const restAbility = ABILITIES.find((a) => a.usageType === 'short_rest')!.id;

  const respond = (call: FakeCall): FakeResult | undefined => {
    if (call.table === 'combats' && call.op === 'insert') return { data: { id: 'combat-new' } };
    if (call.table === 'characters' && call.op === 'select') {
      return {
        data: [
          {
            id: 'char-1',
            conditions: conds(['cego', null]),
            skills: {
              proficiencies: ['x'],
              ability_uses: { [combatAbility]: 1, [restAbility]: 2 },
            },
          },
        ],
      };
    }
    return undefined;
  };

  const players = [
    { entityId: 'char-1', entityType: 'player' as const, initiative: 14, hpCurrent: 9 },
    { entityId: 'enemy-1', entityType: 'enemy' as const, initiative: 8, hpCurrent: 5 },
  ];

  it('cria o combate já ativo, no turno 0 e na rodada 1', async () => {
    state.respond = respond;
    await store().startCombat('session-1', players);
    expect(callsOf(state.calls, 'combats', 'insert')[0].payload).toEqual({
      session_id: 'session-1',
      status: 'active',
      current_turn_index: 0,
      round_number: 1,
    });
  });

  it('não preenche o estado local: quem mostra o combate é a assinatura em tempo real', async () => {
    state.respond = respond;
    await store().startCombat('session-1', players);
    expect(store().activeCombat).toBeNull();
  });

  it('copia as Condições da ficha para jogadores e NPCs, mas não para inimigos', async () => {
    state.respond = respond;
    await store().startCombat('session-1', players);
    const rows = payloadOf<Array<{ entity_id: string; conditions: unknown; hp_current: number }>>(
      callsOf(state.calls, 'combat_participants', 'insert')[0],
    );
    expect(rows.find((r) => r.entity_id === 'char-1')).toMatchObject({
      conditions: conds(['cego', null]),
      hp_current: 9,
    });
    expect(rows.find((r) => r.entity_id === 'enemy-1')!.conditions).toEqual([]);
  });

  it('zera só as habilidades de combate das fichas de quem não é inimigo', async () => {
    state.respond = respond;
    await store().startCombat('session-1', players);
    const writes = callsOf(state.calls, 'characters', 'update');
    expect(writes).toHaveLength(1);
    expect(filterOf(writes[0], 'eq', 'id')).toBe('char-1');
    expect(writes[0].payload).toEqual({
      skills: { proficiencies: ['x'], ability_uses: { [restAbility]: 2 } },
    });
  });

  it('só inimigos: não lê nem altera fichas', async () => {
    state.respond = respond;
    await store().startCombat('session-1', [players[1]]);
    expect(callsOf(state.calls, 'characters')).toEqual([]);
  });

  it('se criar o combate falhar, lança e não insere participantes', async () => {
    state.respond = (call) =>
      call.table === 'combats' ? { error: new Error('falhou') } : undefined;
    await expect(store().startCombat('session-1', players)).rejects.toThrow('falhou');
    expect(callsOf(state.calls, 'combat_participants')).toEqual([]);
  });
});
