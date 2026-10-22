// Condições aplicadas por habilidade ou efeito de arma passam pela Resistência a Condição do alvo:
// o nível de cada Condição é o do item equipado que resiste a ELA (tabela do doc + Qualidade - 1).
// Decisões: ROADMAP.md, Onda 3 (passo 6). Termos: CONTEXT.md (Resistência a Condição).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { useCombatStore, type CombatParticipant } from '../store/combatStore';
import { combatEngine } from './combatEngine';
import type { AbilityDefinition } from '@/content/schemas';

const target = (over: Partial<CombatParticipant> = {}): CombatParticipant => ({
  combat_id: 'combat-1',
  conditions: [],
  created_at: '',
  entity_id: 'char-1',
  entity_type: 'player',
  hp_current: 10,
  id: 'part-1',
  initiative: 0,
  is_surprised: false,
  updated_at: '',
  ...over,
});

const ability = (...conditions: Array<[string, number?]>) =>
  ({
    applyConditions: conditions.map(([conditionId, duration]) => ({ conditionId, duration })),
  }) as AbilityDefinition;

/** O alvo tem estes itens no inventário e equipados nos slots indicados. */
const world = (
  items: Array<{ id: string; slug: string; level?: number }>,
  equipment: Record<string, string>,
) => {
  state.respond = (call) =>
    call.table === 'characters'
      ? {
          data: {
            equipment,
            character_items: items.map((i) => ({
              id: i.id,
              level: i.level ?? 1,
              items: { slug: i.slug },
            })),
          },
        }
      : undefined;
};

const written = () =>
  (
    callsOf(state.calls, 'combat_participants', 'update')[0]?.payload as {
      conditions: Array<{ conditionId: string; duration: number | null }>;
    }
  ).conditions;

const toasts: string[] = [];
const onToast = (event: Event) => toasts.push((event as CustomEvent).detail.message);

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  toasts.length = 0;
  window.addEventListener('combat-toast', onToast);
  useCombatStore.setState({ participants: [target()] });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => window.removeEventListener('combat-toast', onToast));

describe('combatEngine.executeAbilityOnTarget: Resistência a Condição', () => {
  it('sem item com resistência aplica as Condições como vieram', async () => {
    world([{ id: 'ci-1', slug: 'couro_cru' }], { body: 'ci-1' });
    await combatEngine.executeAbilityOnTarget(
      ability(['sangrando', 3], ['envenenado', 4]),
      'part-1',
    );
    expect(written()).toEqual([
      { conditionId: 'sangrando', duration: 3 },
      { conditionId: 'envenenado', duration: 4 },
    ]);
    expect(toasts).toEqual([]);
  });

  it('o item é achado pelo slug: a Lorica (Nv4) deixa imune a sangrando', async () => {
    world([{ id: 'ci-1', slug: 'lorica' }], { body: 'ci-1' });
    await combatEngine.executeAbilityOnTarget(ability(['sangrando', 3]), 'part-1');
    expect(written()).toEqual([]);
    expect(toasts).toEqual(['Resistência Nv4: imune a Sangrando']);
  });

  it('o nível de uma Condição não vaza para as outras da mesma habilidade', async () => {
    world([{ id: 'ci-1', slug: 'lorica' }], { body: 'ci-1' });
    await combatEngine.executeAbilityOnTarget(
      ability(['sangrando', 3], ['envenenado', 3]),
      'part-1',
    );
    // sangrando: imune (Nv4); envenenado: a Lorica não resiste, então entra inteiro.
    expect(written()).toEqual([{ conditionId: 'envenenado', duration: 3 }]);
  });

  it('cada Condição recebe o nível do item que resiste a ela', async () => {
    world(
      [
        { id: 'ci-1', slug: 'escudo' }, // Nv2 vs impedido
        { id: 'ci-2', slug: 'chapeu_couro' }, // Nv1 vs cego
      ],
      { offHand: 'ci-1', head: 'ci-2' },
    );
    await combatEngine.executeAbilityOnTarget(ability(['impedido', 4], ['cego', 4]), 'part-1');
    expect(written()).toEqual([
      { conditionId: 'impedido', duration: 2 }, // Nv2: metade da duração
      { conditionId: 'cego', duration: 4 }, // Nv1: só vantagem
    ]);
  });

  it('a Qualidade do item sobe o nível', async () => {
    world([{ id: 'ci-1', slug: 'escudo', level: 3 }], { offHand: 'ci-1' }); // 2 + 2 = Nv4
    await combatEngine.executeAbilityOnTarget(ability(['impedido', 4]), 'part-1');
    expect(written()).toEqual([]);
  });

  it('item no inventário mas não equipado não protege', async () => {
    world([{ id: 'ci-1', slug: 'lorica' }], {});
    await combatEngine.executeAbilityOnTarget(ability(['sangrando', 3]), 'part-1');
    expect(written()).toEqual([{ conditionId: 'sangrando', duration: 3 }]);
  });

  it('pede o slug do item ao banco', async () => {
    world([], {});
    await combatEngine.executeAbilityOnTarget(ability(['sangrando', 3]), 'part-1');
    const lookup = callsOf(state.calls, 'characters', 'select')[0];
    expect(String(lookup.columns)).toContain('items(slug)');
  });

  it('inimigo não tem ficha: aplica sem consultar o banco', async () => {
    useCombatStore.setState({ participants: [target({ entity_type: 'enemy' })] });
    await combatEngine.executeAbilityOnTarget(ability(['sangrando', 3]), 'part-1');
    expect(callsOf(state.calls, 'characters')).toEqual([]);
    expect(written()).toEqual([{ conditionId: 'sangrando', duration: 3 }]);
  });

  it('mantém as Condições que o alvo já tinha', async () => {
    useCombatStore.setState({
      participants: [target({ conditions: [{ conditionId: 'cego', duration: 2 }] as never })],
    });
    world([{ id: 'ci-1', slug: 'lorica' }], { body: 'ci-1' });
    await combatEngine.executeAbilityOnTarget(
      ability(['sangrando', 3], ['envenenado', 3]),
      'part-1',
    );
    expect(written()).toEqual([
      { conditionId: 'cego', duration: 2 },
      { conditionId: 'envenenado', duration: 3 },
    ]);
  });
});

describe('combatEngine.checkWeaponEffects', () => {
  const effects = [{ conditionId: 'sangrando', trigger: 'natural_18_plus' as const }];

  it('com Natural 18 ou mais aplica a Condição da arma por 3 rodadas e avisa', async () => {
    world([], {});
    await combatEngine.checkWeaponEffects(effects, 18, 'part-1');
    expect(written()).toEqual([{ conditionId: 'sangrando', duration: 3 }]);
    expect(toasts).toEqual(['Efeito de Arma Ativado (Nat 18)!']);
  });

  it('o Natural 20 também ativa', async () => {
    world([], {});
    await combatEngine.checkWeaponEffects(effects, 20, 'part-1');
    expect(toasts).toEqual(['Efeito de Arma Ativado (Nat 20)!']);
  });

  it('abaixo de 18 não faz nada', async () => {
    world([], {});
    await combatEngine.checkWeaponEffects(effects, 17, 'part-1');
    expect(callsOf(state.calls, 'combat_participants', 'update')).toEqual([]);
    expect(toasts).toEqual([]);
  });

  it('sem efeitos na arma não faz nada', async () => {
    world([], {});
    await combatEngine.checkWeaponEffects([], 20, 'part-1');
    expect(callsOf(state.calls, 'combat_participants', 'update')).toEqual([]);
    expect(toasts).toEqual([]);
  });

  it('aplica todas as Condições da arma', async () => {
    world([], {});
    await combatEngine.checkWeaponEffects(
      [...effects, { conditionId: 'atordoado', trigger: 'natural_18_plus' }],
      19,
      'part-1',
    );
    expect(written()).toEqual([
      { conditionId: 'sangrando', duration: 3 },
      { conditionId: 'atordoado', duration: 3 },
    ]);
  });
});
