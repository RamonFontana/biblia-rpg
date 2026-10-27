// O serviço de ataque: monta a chamada da função do banco a partir do resultado do motor. Com o
// Supabase falso, que só grava as chamadas. Termos: CONTEXT.md (Ataque).
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
import { submitAttack } from './attackService';

const result = {
  ability: 'for' as const,
  modifier: 3,
  proficient: true,
  proficiencyBonus: 2,
  total: 19,
  hit: true,
  critical: false,
  fumble: false,
};
const base = {
  attackerParticipantId: 'p1',
  targetParticipantId: 'p2',
  targetAc: 15,
  naturalRoll: 14,
  result,
  damage: 9,
  appliedMode: 'normal' as const,
  rolls: null,
};
const sent = () => callsOf(state.calls, 'apply_attack', 'rpc')[0].payload;

beforeEach(() => {
  state.calls.length = 0;
  state.respond = () => ({ data: 'atk-1' });
});

describe('submitAttack', () => {
  it('manda o resultado do motor à função do banco', async () => {
    await expect(submitAttack(base)).resolves.toMatchObject({ id: 'atk-1' });
    expect(sent()).toEqual({
      p_attacker_participant_id: 'p1',
      p_target_participant_id: 'p2',
      p_natural_roll: 14,
      p_total: 19,
      p_target_ac: 15,
      p_hit: true,
      p_critical: false,
      p_fumble: false,
      p_damage: 9,
      p_applied_mode: 'normal',
      p_rolls: undefined,
      p_inspiration_used: false,
      p_weapon_effect_triggered: false,
      p_conditions: [],
    });
    expect(callsOf(state.calls, 'characters', 'update')).toEqual([]);
  });

  it('um erro de ataque não leva dano', async () => {
    await submitAttack({ ...base, result: { ...result, hit: false }, damage: 9 });
    expect(sent()).toMatchObject({ p_hit: false, p_damage: 0 });
  });

  it('lança o erro do banco', async () => {
    state.respond = () => ({ error: new Error('Não é o turno do atacante') });
    await expect(submitAttack(base)).rejects.toThrow('Não é o turno do atacante');
  });
});

describe('submitAttack: modalidade e Inspiração', () => {
  const withInspiration = {
    ...base,
    appliedMode: 'vantagem' as const,
    rolls: [14, 6],
    inspiration: { characterId: 'char-1', sessionId: 's1', day: 3 },
  };

  it('manda a modalidade e os dois d20', async () => {
    await submitAttack({ ...base, appliedMode: 'desvantagem', rolls: [4, 12] });
    expect(sent()).toMatchObject({ p_applied_mode: 'desvantagem', p_rolls: [4, 12] });
  });

  it('gasta a Inspiração depois do ataque: registra no ataque e marca o dia na ficha', async () => {
    await submitAttack(withInspiration);
    expect(sent()).toMatchObject({ p_inspiration_used: true });
    expect(callsOf(state.calls, 'characters', 'update')[0].payload).toEqual({
      inspiration_used_day: 3,
      inspiration_session_id: 's1',
    });
  });

  it('se o ataque é recusado, a Inspiração não é gasta', async () => {
    state.respond = () => ({ error: new Error('Não é o turno do atacante') });
    await expect(submitAttack(withInspiration)).rejects.toThrow('Não é o turno do atacante');
    expect(callsOf(state.calls, 'characters', 'update')).toEqual([]);
  });

  it('se marcar a ficha falha, o ataque registrado fica e não lança', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    state.respond = (call) =>
      call.table === 'characters' ? { error: new Error('falhou') } : { data: 'atk-1' };
    await expect(submitAttack(withInspiration)).resolves.toMatchObject({ id: 'atk-1' });
    expect(console.error).toHaveBeenCalled();
  });
});

describe('submitAttack: munição', () => {
  const withAmmo = { ...base, ammunition: { characterItemId: 'ci-flechas' } };
  const stock = (quantity: number) => (call: FakeCall) =>
    call.table === 'character_items' && call.op === 'select'
      ? { data: { quantity } }
      : { data: 'atk-1' };
  const ammoWrites = () => callsOf(state.calls, 'character_items', 'update');

  it('gasta 1 munição depois de registrar o ataque', async () => {
    state.respond = stock(5);
    await submitAttack(withAmmo);
    expect(ammoWrites()).toHaveLength(1);
    expect(ammoWrites()[0].payload).toEqual({ quantity: 4 });
  });

  it('gasta a munição também no erro (a flecha foi disparada)', async () => {
    state.respond = stock(5);
    await submitAttack({ ...withAmmo, result: { ...result, hit: false } });
    expect(ammoWrites()[0].payload).toEqual({ quantity: 4 });
  });

  it('se o ataque é recusado, a munição não é gasta', async () => {
    state.respond = (call) =>
      call.table === 'apply_attack'
        ? { error: new Error('Não é o turno do atacante') }
        : stock(5)(call);
    await expect(submitAttack(withAmmo)).rejects.toThrow();
    expect(ammoWrites()).toEqual([]);
  });

  it('arma sem munição não toca no inventário', async () => {
    await submitAttack(base);
    expect(ammoWrites()).toEqual([]);
  });

  it('se gastar a munição falha, o ataque registrado fica e não lança', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    state.respond = stock(0);
    await expect(submitAttack(withAmmo)).resolves.toMatchObject({ id: 'atk-1' });
    expect(ammoWrites()).toEqual([]);
  });
});

describe('submitAttack: efeito de arma', () => {
  const effects = [{ conditionId: 'sangrando', trigger: 'natural_18_plus' as const }];
  const hit = { ...base, naturalRoll: 18, result: { ...result, hit: true } };
  const withEffect = (target: { entityId: string; entityType: string }) => ({
    ...hit,
    weaponEffect: { effects, target },
  });
  const toasts: string[] = [];
  const onToast = (e: Event) => toasts.push((e as CustomEvent).detail.message);

  /** A ficha do alvo com o item de resistência vestido (o escudo dá Nv2 contra Impedido). */
  const target =
    (items: { id: string; slug: string; level?: number }[], equipment = {}) =>
    (call: FakeCall): FakeResult | undefined => {
      if (call.table === 'characters' && call.op === 'select') {
        return {
          data: {
            equipment,
            character_items: items.map((i) => ({
              id: i.id,
              level: i.level ?? 1,
              items: { slug: i.slug },
            })),
          },
        };
      }
      return { data: 'atk-1' };
    };

  beforeEach(() => {
    toasts.length = 0;
    window.addEventListener('combat-toast', onToast);
    return () => window.removeEventListener('combat-toast', onToast);
  });

  it('com 18 natural no acerto, manda as Condições do efeito de arma', async () => {
    state.respond = target([]);
    const outcome = await submitAttack(withEffect({ entityId: 'c9', entityType: 'player' }));
    expect(sent()).toMatchObject({
      p_weapon_effect_triggered: true,
      p_conditions: [{ conditionId: 'sangrando', duration: 3 }],
    });
    expect(outcome).toMatchObject({ weaponEffectTriggered: true });
  });

  it('abaixo de 18, ou no erro, não dispara', async () => {
    state.respond = target([]);
    await submitAttack({
      ...withEffect({ entityId: 'c9', entityType: 'player' }),
      naturalRoll: 17,
    });
    expect(sent()).toMatchObject({ p_weapon_effect_triggered: false, p_conditions: [] });
    state.calls.length = 0;
    await submitAttack({
      ...withEffect({ entityId: 'c9', entityType: 'player' }),
      result: { ...result, hit: false },
    });
    expect(sent()).toMatchObject({ p_weapon_effect_triggered: false, p_conditions: [] });
  });

  it('arma sem efeito configurado não dispara', async () => {
    state.respond = target([]);
    await submitAttack({
      ...hit,
      weaponEffect: { effects: [], target: { entityId: 'c9', entityType: 'player' } },
    });
    expect(sent()).toMatchObject({ p_weapon_effect_triggered: false });
  });

  it('a Resistência a Condição do alvo anula o efeito (Nv4) e avisa', async () => {
    // Escudo de Qualidade 3 dá Nv4 contra Impedido; a arma aqui causa Impedido.
    state.respond = target([{ id: 'ci-1', slug: 'escudo', level: 3 }], { offHand: 'ci-1' });
    const outcome = await submitAttack({
      ...hit,
      weaponEffect: {
        effects: [{ conditionId: 'impedido', trigger: 'natural_18_plus' }],
        target: { entityId: 'c9', entityType: 'player' },
      },
    });
    expect(sent()).toMatchObject({ p_weapon_effect_triggered: true, p_conditions: [] });
    expect(outcome.messages).toEqual(['Resistência Nv4: imune a Impedido']);
    expect(toasts).toEqual(['Resistência Nv4: imune a Impedido']);
  });

  it('o nível reduz a duração', async () => {
    state.respond = target([{ id: 'ci-1', slug: 'escudo' }], { offHand: 'ci-1' }); // Nv2
    await submitAttack({
      ...hit,
      weaponEffect: {
        effects: [{ conditionId: 'impedido', trigger: 'natural_18_plus' }],
        target: { entityId: 'c9', entityType: 'player' },
      },
    });
    expect(sent()).toMatchObject({ p_conditions: [{ conditionId: 'impedido', duration: 2 }] });
  });

  it('inimigo não tem ficha: aplica sem consultar o banco', async () => {
    state.respond = target([]);
    await submitAttack(withEffect({ entityId: 'e1', entityType: 'enemy' }));
    expect(callsOf(state.calls, 'characters')).toEqual([]);
    expect(sent()).toMatchObject({ p_conditions: [{ conditionId: 'sangrando', duration: 3 }] });
  });

  it('se a leitura da ficha do alvo falha, aplica sem resistência', async () => {
    state.respond = (call) =>
      call.table === 'characters' ? { error: new Error('falhou') } : { data: 'atk-1' };
    await submitAttack(withEffect({ entityId: 'c9', entityType: 'player' }));
    expect(sent()).toMatchObject({ p_conditions: [{ conditionId: 'sangrando', duration: 3 }] });
  });
});
