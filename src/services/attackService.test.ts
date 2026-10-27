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
    await expect(submitAttack(base)).resolves.toBe('atk-1');
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
    await expect(submitAttack(withInspiration)).resolves.toBe('atk-1');
    expect(console.error).toHaveBeenCalled();
  });
});
