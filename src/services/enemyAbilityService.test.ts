// O serviço da Habilidade de inimigo: cria o Teste de sessão dos jogadores, grava o uso pela função
// do banco e aplica os resultados. Com o Supabase falso, que só grava as chamadas.
// Termos: CONTEXT.md (Habilidade de inimigo, TR, Resistência a Condição).
import { beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';
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

import { callsOf } from '../test/fakeSupabase';
import { enemyAbilityOf } from '@/domain/enemyAbility';
import { fireEnemyAbility, resolveEnemyAbilityUse } from './enemyAbilityService';

const presenca = enemyAbilityOf({
  name: 'Presença Aterradora',
  libraryId: 'enemy-presenca-aterradora',
})!;

const player = {
  participantId: 'p-eliabe',
  entityId: 'c-eliabe',
  entityType: 'player',
  name: 'Eliabe',
  mark: null,
};
const player2 = {
  participantId: 'p-rute',
  entityId: 'c-rute',
  entityType: 'player',
  name: 'Rute',
  mark: 'desvantagem' as const,
};
const npc = {
  participantId: 'p-npc',
  entityId: 'c-npc',
  entityType: 'npc',
  name: 'Jonas',
  mark: null,
};
const base = { sessionId: 's1', enemyParticipantId: 'p-anakim', ability: presenca };

const owners = [
  { id: 'c-eliabe', user_id: 'u-eliabe' },
  { id: 'c-rute', user_id: 'u-rute' },
];
const sentUse = () =>
  callsOf(state.calls, 'record_enemy_ability_use', 'rpc')[0].payload as Record<string, unknown>;

beforeEach(() => {
  state.calls.length = 0;
  state.respond = (call) => {
    if (call.table === 'session_tests' && call.op === 'select') return { data: [] };
    if (call.table === 'session_tests' && call.op === 'insert') return { data: { id: 'test-1' } };
    if (call.table === 'characters' && call.columns === 'id, user_id') return { data: owners };
    if (call.table === 'record_enemy_ability_use') return { data: 'use-1' };
    return { data: null };
  };
});

describe('fireEnemyAbility: com TR', () => {
  it('cria o Teste de sessão com o TR, a CD e a marca de cada jogador', async () => {
    const firing = await fireEnemyAbility({ ...base, targets: [player, player2] });
    expect(firing).toMatchObject({ id: 'use-1', testId: 'test-1' });
    const [test] = callsOf(state.calls, 'session_tests', 'insert');
    expect(test.payload).toMatchObject({
      session_id: 's1',
      test_type: 'Resistência (Sabedoria)',
      difficulty: 13,
    });
    const [results] = callsOf(state.calls, 'session_test_results', 'insert');
    expect(results.payload).toEqual([
      {
        test_id: 'test-1',
        character_id: 'c-eliabe',
        player_id: 'u-eliabe',
        master_mark: null,
        status: 'pending',
      },
      {
        test_id: 'test-1',
        character_id: 'c-rute',
        player_id: 'u-rute',
        master_mark: 'desvantagem',
        status: 'pending',
      },
    ]);
  });

  it('deixa o uso pendente: manda o TR, o Teste e o efeito, e nenhuma Condição agora', async () => {
    await fireEnemyAbility({ ...base, targets: [player] });
    expect(sentUse()).toEqual({
      p_enemy_participant_id: 'p-anakim',
      p_ability_id: 'enemy-presenca-aterradora',
      p_ability_name: 'Presença Aterradora',
      p_targets: [{ participantId: 'p-eliabe', conditions: [] }],
      p_effect: presenca.effect,
      p_save: { attribute: 'sab', cd: 13 },
      p_test_id: 'test-1',
    });
  });

  it('o NPC jogável não recebe pedido de TR: o Mestre rola por ele', async () => {
    await fireEnemyAbility({ ...base, targets: [player, npc] });
    const [results] = callsOf(state.calls, 'session_test_results', 'insert');
    expect((results.payload as { character_id: string }[]).map((r) => r.character_id)).toEqual([
      'c-eliabe',
    ]);
    expect(sentUse().p_targets).toHaveLength(2);
  });

  it('só NPCs entre os alvos: não cria Teste e o uso fica pendente sem p_test_id', async () => {
    const firing = await fireEnemyAbility({ ...base, targets: [npc] });
    expect(firing.testId).toBeNull();
    expect(callsOf(state.calls, 'session_tests', 'insert')).toHaveLength(0);
    expect(sentUse()).not.toHaveProperty('p_test_id');
    expect(sentUse().p_save).toEqual({ attribute: 'sab', cd: 13 });
  });

  it('com um Teste ativo na sessão, recusa antes de gravar qualquer coisa', async () => {
    state.respond = (call) =>
      call.table === 'session_tests' && call.op === 'select'
        ? { data: [{ id: 'old' }] }
        : { data: null };
    await expect(fireEnemyAbility({ ...base, targets: [player] })).rejects.toThrow(/Teste ativo/);
    expect(callsOf(state.calls, 'record_enemy_ability_use', 'rpc')).toHaveLength(0);
    expect(callsOf(state.calls, 'session_tests', 'insert')).toHaveLength(0);
  });

  it('sem alvos, recusa', async () => {
    await expect(fireEnemyAbility({ ...base, targets: [] })).rejects.toThrow(/ao menos um alvo/);
  });
});

describe('fireEnemyAbility: sem TR', () => {
  const semTr = enemyAbilityOf({
    name: 'Laço',
    effect: { apply: [{ conditionId: 'agarrado', rounds: 3 }], usage: 'unlimited' },
  })!;

  it('a Condição entra na hora, com a duração, e nenhum Teste é criado', async () => {
    const firing = await fireEnemyAbility({ ...base, ability: semTr, targets: [player] });
    expect(sentUse().p_targets).toEqual([
      { participantId: 'p-eliabe', conditions: [{ conditionId: 'agarrado', duration: 3 }] },
    ]);
    expect(sentUse()).not.toHaveProperty('p_save');
    expect(callsOf(state.calls, 'session_tests', 'insert')).toHaveLength(0);
    expect(firing.testId).toBeNull();
  });
});

describe('resolveEnemyAbilityUse', () => {
  const participants = [
    { id: 'p-eliabe', entity_id: 'c-eliabe', entity_type: 'player' as const },
    { id: 'p-rute', entity_id: 'c-rute', entity_type: 'player' as const },
    { id: 'p-npc', entity_id: 'c-npc', entity_type: 'npc' as const },
  ];
  const use = {
    id: 'use-1',
    combat_id: 'cb1',
    ability_id: 'enemy-presenca-aterradora',
    enemy_effect: presenca.effect,
    cd: 13,
    test_id: 'test-1',
    targets: [
      { participantId: 'p-eliabe', name: 'Eliabe', conditions: [] },
      { participantId: 'p-rute', name: 'Rute', conditions: [] },
    ],
  };
  const row = (over: Record<string, unknown>) => ({
    character_id: 'c-eliabe',
    status: 'submitted',
    is_approved: false,
    roll_value: 5,
    result_value: 8,
    applied_mode: 'normal',
    ...over,
  });
  const applied = () =>
    (
      callsOf(state.calls, 'resolve_ability_use', 'rpc')[0].payload as {
        p_results: Record<string, unknown>[];
      }
    ).p_results;

  beforeEach(() => {
    state.respond = (call) => {
      if (call.table === 'session_test_results') {
        return {
          data: [
            row({}),
            row({
              character_id: 'c-rute',
              status: 'pending',
              // Um valor antigo num resultado ainda pendente não conta.
              is_approved: false,
              roll_value: 3,
              result_value: 4,
            }),
          ],
        };
      }
      if (call.table === 'resolve_ability_use') return { data: 'resolved' };
      return { data: null };
    };
  });

  it('quem respondeu e falhou recebe a Condição; quem não respondeu fica sem efeito', async () => {
    const result = await resolveEnemyAbilityUse({ use, participants, npcRolls: [] });
    expect(result.status).toBe('resolved');
    expect(applied()).toEqual([
      {
        participantId: 'p-eliabe',
        natural: 5,
        total: 8,
        failed: true,
        mode: 'normal',
        conditions: [{ conditionId: 'amedrontado', duration: 10 }],
      },
      {
        participantId: 'p-rute',
        natural: null,
        total: null,
        failed: false,
        mode: 'normal',
        conditions: [],
      },
    ]);
  });

  it('quem passou no Teste não recebe nada', async () => {
    state.respond = (call) =>
      call.table === 'session_test_results'
        ? {
            data: [
              row({ is_approved: true, result_value: 15 }),
              row({ character_id: 'c-rute', is_approved: true }),
            ],
          }
        : { data: 'resolved' };
    await resolveEnemyAbilityUse({ use, participants, npcRolls: [] });
    expect(applied().map((r) => r.conditions)).toEqual([[], []]);
  });

  it('fecha o Teste dos celulares depois de aplicar', async () => {
    await resolveEnemyAbilityUse({ use, participants, npcRolls: [] });
    const [done] = callsOf(state.calls, 'session_tests', 'update');
    expect(done.payload).toEqual({ status: 'completed' });
    expect(done.filters).toContainEqual(['eq', 'id', 'test-1']);
  });

  it('o NPC jogável: o d20 do Mestre mais o modificador do atributo contra a CD', async () => {
    const npcUse = {
      ...use,
      test_id: null,
      targets: [{ participantId: 'p-npc', name: 'Jonas', conditions: [] }],
    };
    state.respond = (call) => {
      if (call.table === 'characters' && call.columns === 'id, attributes') {
        return { data: [{ id: 'c-npc', attributes: { sab: 8 } }] };
      }
      return { data: 'resolved' };
    };
    // d20 12 com SAB 8 (-1) = 11, abaixo da CD 13: falha.
    await resolveEnemyAbilityUse({
      use: npcUse,
      participants,
      npcRolls: [{ participantId: 'p-npc', natural: 12, mark: null }],
    });
    expect(applied()[0]).toMatchObject({
      natural: 12,
      total: 11,
      failed: true,
      conditions: [{ conditionId: 'amedrontado', duration: 10 }],
    });
    expect(callsOf(state.calls, 'session_tests', 'update')).toHaveLength(0);
  });

  it('o NPC jogável que passa não recebe a Condição', async () => {
    const npcUse = {
      ...use,
      test_id: null,
      targets: [{ participantId: 'p-npc', name: 'Jonas', conditions: [] }],
    };
    state.respond = (call) =>
      call.table === 'characters' && call.columns === 'id, attributes'
        ? { data: [{ id: 'c-npc', attributes: { sab: 14 } }] }
        : { data: 'resolved' };
    await resolveEnemyAbilityUse({
      use: npcUse,
      participants,
      npcRolls: [{ participantId: 'p-npc', natural: 12, mark: null }],
    });
    expect(applied()[0]).toMatchObject({ total: 14, failed: false, conditions: [] });
  });

  it('sem o d20 do NPC jogável, recusa antes de gravar', async () => {
    const npcUse = {
      ...use,
      test_id: null,
      targets: [{ participantId: 'p-npc', name: 'Jonas', conditions: [] }],
    };
    await expect(
      resolveEnemyAbilityUse({ use: npcUse, participants, npcRolls: [] }),
    ).rejects.toThrow(/Falta o dado de Jonas/);
    expect(callsOf(state.calls, 'resolve_ability_use', 'rpc')).toHaveLength(0);
  });

  it('recusa um d20 fora de 1 a 20', async () => {
    const npcUse = {
      ...use,
      test_id: null,
      targets: [{ participantId: 'p-npc', name: 'Jonas', conditions: [] }],
    };
    await expect(
      resolveEnemyAbilityUse({
        use: npcUse,
        participants,
        npcRolls: [{ participantId: 'p-npc', natural: 21, mark: null }],
      }),
    ).rejects.toThrow(/entre 1 e 20/);
  });

  it('o combate que acabou expira o uso e não mostra mensagens', async () => {
    state.respond = (call) =>
      call.table === 'resolve_ability_use' ? { data: 'expired' } : { data: [row({})] };
    await expect(
      resolveEnemyAbilityUse({ use, participants, npcRolls: [] }),
    ).resolves.toMatchObject({
      status: 'expired',
    });
  });

  it('um alvo que saiu do combate é recusado', async () => {
    await expect(
      resolveEnemyAbilityUse({ use, participants: participants.slice(0, 1), npcRolls: [] }),
    ).rejects.toThrow(/saiu do combate/);
  });

  it('usa o efeito gravado no uso (Habilidade personalizada) e, sem ele, o da biblioteca', async () => {
    const custom = {
      ...use,
      ability_id: 'enemy-custom',
      enemy_effect: {
        save: { attribute: 'des', cd: 11 },
        apply: [{ conditionId: 'agarrado' }],
        usage: 'unlimited',
      },
    };
    await resolveEnemyAbilityUse({ use: custom, participants, npcRolls: [] });
    expect(applied()[0].conditions).toEqual([{ conditionId: 'agarrado', duration: null }]);

    state.calls.length = 0;
    await resolveEnemyAbilityUse({
      use: { ...use, enemy_effect: null },
      participants,
      npcRolls: [],
    });
    expect(applied()[0].conditions).toEqual([{ conditionId: 'amedrontado', duration: 10 }]);
  });

  it('sem efeito gravado nem na biblioteca, recusa', async () => {
    await expect(
      resolveEnemyAbilityUse({
        use: { ...use, ability_id: 'enemy-custom', enemy_effect: null },
        participants,
        npcRolls: [],
      }),
    ).rejects.toThrow(/não tem efeito/);
  });
});
