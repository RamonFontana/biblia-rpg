// O serviço de uso de Habilidade: monta a chamada da função do banco a partir do efeito, depois da
// proteção de cada alvo, e só então gasta o uso e a Fé. Com o Supabase falso, que só grava as
// chamadas. Termos: CONTEXT.md (Habilidade, Resistência a Condição).
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

import { callsOf } from '../test/fakeSupabase';
import { resolveAbilityUseRolls, submitAbilityUse } from './abilityService';
import type { AbilityDefinition } from '@/content/schemas';

const ability: AbilityDefinition = {
  id: 'tribe-levi-16-palavra-de-auto',
  name: 'Palavra de Autoridade',
  sourceType: 'tribe',
  sourceId: 'levi',
  minLevel: 16,
  path: 'A',
  actionType: 'action',
  usageType: 'combat',
  maxUses: 1,
  effect: 'Paralisa inimigo por 1 turno.',
  combatEffect: { targets: 'enemy', apply: [{ conditionId: 'paralisado', rounds: 1 }] },
};
const enemy = {
  participantId: 'p2',
  entityId: 'e1',
  entityType: 'enemy',
  name: 'Filisteu',
  ac: 14,
  conditionIds: [],
};
const base = {
  ability,
  userParticipantId: 'p1',
  targets: [enemy],
  character: { id: 'char-1', skills: {}, stats: { current_faith: 40 } },
};
const sent = () => callsOf(state.calls, 'record_ability_use', 'rpc')[0].payload;
const charUpdates = () => callsOf(state.calls, 'characters', 'update');

beforeEach(() => {
  state.calls.length = 0;
  state.respond = () => ({ data: 'use-1' });
});

describe('submitAbilityUse', () => {
  it('manda à função do banco as Condições que chegam a cada alvo', async () => {
    await expect(submitAbilityUse(base)).resolves.toMatchObject({ id: 'use-1' });
    expect(sent()).toEqual({
      p_user_participant_id: 'p1',
      p_ability_id: 'tribe-levi-16-palavra-de-auto',
      p_ability_name: 'Palavra de Autoridade',
      p_action_type: 'action',
      p_targets: [
        { participantId: 'p2', conditions: [{ conditionId: 'paralisado', duration: 1 }] },
      ],
    });
  });

  it('devolve o resultado por alvo', async () => {
    const outcome = await submitAbilityUse(base);
    expect(outcome.results).toEqual([
      {
        participantId: 'p2',
        name: 'Filisteu',
        conditions: [{ conditionId: 'paralisado', duration: 1 }],
        messages: [],
      },
    ]);
  });

  it('gasta o uso da Habilidade na ficha depois de registrar', async () => {
    await submitAbilityUse(base);
    expect(charUpdates()[0].payload).toEqual({ skills: { ability_uses: { [ability.id]: 1 } } });
  });

  it('gasta também a Fé, quando a Habilidade custa', async () => {
    await submitAbilityUse({
      ...base,
      ability: { ...ability, faithCost: 8 },
    });
    expect(charUpdates()[0].payload).toEqual({
      skills: { ability_uses: { [ability.id]: 1 } },
      stats: { current_faith: 32 },
    });
  });

  it('sem Fé para o custo, nada é registrado nem gasto', async () => {
    await expect(
      submitAbilityUse({
        ...base,
        ability: { ...ability, faithCost: 50 },
      }),
    ).rejects.toThrow('Fé Insuficiente');
    expect(callsOf(state.calls, 'record_ability_use', 'rpc')).toEqual([]);
    expect(charUpdates()).toEqual([]);
  });

  it('se o banco recusa o uso, o uso e a Fé não são gastos', async () => {
    state.respond = () => ({ error: new Error('Não é o turno de quem usa a Habilidade') });
    await expect(submitAbilityUse(base)).rejects.toThrow('Não é o turno');
    expect(charUpdates()).toEqual([]);
  });

  it('se gravar o gasto na ficha falha, o uso registrado fica e não lança', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    state.respond = (call) =>
      call.table === 'characters' ? { error: new Error('falhou') } : { data: 'use-1' };
    await expect(submitAbilityUse(base)).resolves.toMatchObject({ id: 'use-1' });
    expect(console.error).toHaveBeenCalled();
  });

  it('uma Habilidade sem efeito de combate não vai ao banco', async () => {
    const plain = { ...ability, combatEffect: undefined };
    await expect(submitAbilityUse({ ...base, ability: plain })).rejects.toThrow(
      'não tem efeito de combate',
    );
  });
});

describe('submitAbilityUse: proteção do alvo', () => {
  const ally = { ...enemy, participantId: 'p3', entityId: 'c9', entityType: 'player' };
  const protectionRow = (over: Record<string, unknown> = {}) => ({
    equipment: {},
    tribe: 'Judá',
    vocation: 'Guerreiro',
    level: 1,
    skills: {},
    character_items: [],
    ...over,
  });
  const withTarget = { ...base, targets: [ally] };

  it('o inimigo não tem ficha nem proteção: não lê nada', async () => {
    await submitAbilityUse(base);
    expect(callsOf(state.calls, 'characters', 'select')).toEqual([]);
  });

  it('a imunidade de Habilidade passiva do alvo anula a Condição e avisa', async () => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'select'
        ? {
            data: protectionRow({
              tribe: 'Naftali',
              vocation: 'Guerreiro',
              level: 20,
              skills: { path_choices: { tribe: 'A' } },
            }),
          }
        : { data: 'use-1' };
    const outcome = await submitAbilityUse(withTarget);
    expect(sent()).toMatchObject({ p_targets: [{ participantId: 'p3', conditions: [] }] });
    expect(outcome.results[0].messages).toEqual(['Imunidade: imune a Paralisado']);
  });

  it('falhar ao ler a proteção não impede o uso: o alvo fica sem proteção', async () => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'select'
        ? { error: new Error('sem ficha') }
        : { data: 'use-1' };
    await submitAbilityUse(withTarget);
    expect(sent()).toMatchObject({
      p_targets: [
        { participantId: 'p3', conditions: [{ conditionId: 'paralisado', duration: 1 }] },
      ],
    });
  });
});

describe('submitAbilityUse: Habilidade com TR', () => {
  const tactic: AbilityDefinition = {
    id: 'vocation-guerreiro-18-grito-de-guerra',
    name: 'Grito de Guerra',
    sourceType: 'vocation',
    sourceId: 'guerreiro',
    minLevel: 18,
    actionType: 'action',
    usageType: 'long_rest',
    maxUses: 1,
    effect: 'Inimigos TR SAB.',
    combatEffect: {
      targets: 'enemies',
      save: { attribute: 'sab' },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
    },
  };
  const saveBase = {
    ...base,
    ability: tactic,
    character: {
      id: 'char-1',
      skills: {},
      stats: { current_faith: 40 },
      vocation: 'Guerreiro',
      level: 18,
      attributes: { for: 16 },
    },
  };

  it('manda o atributo do TR e a CD da Habilidade, sem Condições', async () => {
    await submitAbilityUse(saveBase);
    expect(sent()).toEqual({
      p_user_participant_id: 'p1',
      p_ability_id: 'vocation-guerreiro-18-grito-de-guerra',
      p_ability_name: 'Grito de Guerra',
      p_action_type: 'action',
      p_targets: [{ participantId: 'p2', conditions: [] }],
      p_save: { attribute: 'sab', cd: 17 },
    });
  });

  it('devolve o uso como pendente, com a CD e o atributo, e nenhuma Condição', async () => {
    const outcome = await submitAbilityUse(saveBase);
    expect(outcome.pending).toEqual({ cd: 17, attribute: 'sab' });
    expect(outcome.results[0].conditions).toEqual([]);
  });

  it('gasta o uso e a Fé como numa Habilidade sem TR', async () => {
    await submitAbilityUse({ ...saveBase, ability: { ...tactic, faithCost: 8 } });
    expect(charUpdates()[0].payload).toEqual({
      skills: { ability_uses: { [tactic.id]: 1 } },
      stats: { current_faith: 32 },
    });
  });

  it('sem Vocação a CD usa o atributo de SAB e a ficha sem atributos vale 0', async () => {
    const outcome = await submitAbilityUse({
      ...saveBase,
      character: { id: 'char-1', skills: {}, stats: { current_faith: 40 } },
    });
    expect(outcome.pending).toEqual({ cd: 10, attribute: 'sab' });
  });

  it('o uso sem TR não é pendente', async () => {
    const outcome = await submitAbilityUse(base);
    expect(outcome.pending).toBeUndefined();
  });
});

describe('resolveAbilityUseRolls', () => {
  const pendingUse = {
    id: 'use-9',
    ability_id: 'vocation-guerreiro-18-grito-de-guerra',
    cd: 13,
    targets: [
      { participantId: 'p2', name: 'Filisteu', conditions: [] },
      { participantId: 'p3', name: 'Bandido', conditions: [] },
    ],
  };
  const participants = [
    { id: 'p2', entity_id: 'e1', entity_type: 'enemy' as const },
    { id: 'p3', entity_id: 'e2', entity_type: 'enemy' as const },
  ];
  const resolved = () =>
    callsOf(state.calls, 'resolve_ability_use', 'rpc')[0].payload as {
      p_use_id: string;
      p_results: Record<string, unknown>[];
    };
  const attributesRows = [
    { id: 'e1', attributes: { sab: 10 } },
    { id: 'e2', attributes: { sab: 14 } },
  ];

  beforeEach(() => {
    state.respond = (call) =>
      call.table === 'characters' ? { data: attributesRows } : { data: 'resolved' };
  });

  it('quem não alcança a CD falha e recebe a Condição; quem alcança passa', async () => {
    const outcome = await resolveAbilityUseRolls({
      use: pendingUse,
      participants,
      rolls: [
        { participantId: 'p2', natural: 12, mark: null },
        { participantId: 'p3', natural: 12, mark: null },
      ],
    });
    expect(outcome.status).toBe('resolved');
    expect(resolved().p_use_id).toBe('use-9');
    expect(resolved().p_results).toEqual([
      {
        participantId: 'p2',
        natural: 12,
        total: 12,
        failed: true,
        mode: 'normal',
        conditions: [{ conditionId: 'amedrontado', duration: 10 }],
      },
      {
        participantId: 'p3',
        natural: 12,
        total: 14,
        failed: false,
        mode: 'normal',
        conditions: [],
      },
    ]);
  });

  it('soma o modificador do atributo do TR de cada alvo', async () => {
    await resolveAbilityUseRolls({
      use: pendingUse,
      participants,
      rolls: [
        { participantId: 'p2', natural: 13, mark: null },
        { participantId: 'p3', natural: 11, mark: null },
      ],
    });
    // e2 tem SAB 14 (+2): 11 + 2 = 13, alcança a CD 13.
    expect(resolved().p_results.map((r) => r.failed)).toEqual([false, false]);
  });

  it('a marca do Mestre fica gravada como a modalidade do alvo', async () => {
    await resolveAbilityUseRolls({
      use: pendingUse,
      participants,
      rolls: [
        { participantId: 'p2', natural: 5, mark: 'desvantagem' },
        { participantId: 'p3', natural: 18, mark: 'vantagem' },
      ],
    });
    expect(resolved().p_results.map((r) => r.mode)).toEqual(['desvantagem', 'vantagem']);
  });

  it('a ficha sem atributo ou fora do banco vale modificador 0', async () => {
    state.respond = (call) => (call.table === 'characters' ? { data: [] } : { data: 'resolved' });
    await resolveAbilityUseRolls({
      use: pendingUse,
      participants,
      rolls: [
        { participantId: 'p2', natural: 13, mark: null },
        { participantId: 'p3', natural: 12, mark: null },
      ],
    });
    expect(resolved().p_results.map((r) => [r.total, r.failed])).toEqual([
      [13, false],
      [12, true],
    ]);
  });

  it('devolve expired quando o combate acabou', async () => {
    state.respond = (call) =>
      call.table === 'characters' ? { data: attributesRows } : { data: 'expired' };
    const outcome = await resolveAbilityUseRolls({
      use: pendingUse,
      participants,
      rolls: [
        { participantId: 'p2', natural: 12, mark: null },
        { participantId: 'p3', natural: 12, mark: null },
      ],
    });
    expect(outcome.status).toBe('expired');
  });

  it('falta o dado de um alvo: não chama o banco', async () => {
    await expect(
      resolveAbilityUseRolls({
        use: pendingUse,
        participants,
        rolls: [{ participantId: 'p2', natural: 12, mark: null }],
      }),
    ).rejects.toThrow('Falta o dado');
    expect(callsOf(state.calls, 'resolve_ability_use', 'rpc')).toEqual([]);
  });

  it.each([[21], [0], [-1], [12.5]])('o d20 %s fora de 1 a 20 é recusado', async (natural) => {
    await expect(
      resolveAbilityUseRolls({
        use: pendingUse,
        participants,
        rolls: [
          { participantId: 'p2', natural, mark: null },
          { participantId: 'p3', natural: 12, mark: null },
        ],
      }),
    ).rejects.toThrow('entre 1 e 20');
  });

  it.each([[1], [20]])('o d20 %s, nos extremos, vale', async (natural) => {
    await expect(
      resolveAbilityUseRolls({
        use: pendingUse,
        participants,
        rolls: [
          { participantId: 'p2', natural, mark: null },
          { participantId: 'p3', natural: 12, mark: null },
        ],
      }),
    ).resolves.toMatchObject({ status: 'resolved' });
  });

  it('uma Habilidade sem TR não tem o que resolver', async () => {
    await expect(
      resolveAbilityUseRolls({
        use: { ...pendingUse, ability_id: 'tribe-levi-16-palavra-de-auto' },
        participants,
        rolls: [],
      }),
    ).rejects.toThrow('não tem TR');
  });
});
