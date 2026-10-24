// Caracteriza as gravações de vida do serviço: cada operação calcula o valor novo com as regras de
// `domain/vitals` e grava só o que mudou. Usa o Supabase falso, que só registra as chamadas.
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
import { characterVitalsService as vitals } from './vitals';

const failure = { message: 'falhou' };
const stats = { pv: 20, current_pv: 12, faith: 50 };
const lastWrite = (table: string) => callsOf(state.calls, table, 'update').at(-1);

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('adjustCurrentPv', () => {
  it('soma o delta, grava só current_pv e devolve as estatísticas novas', async () => {
    const result = await vitals.adjustCurrentPv('c1', stats, -5);
    expect(result).toEqual({ pv: 20, current_pv: 7, faith: 50 });
    const write = lastWrite('characters');
    expect(write?.payload).toEqual({ stats: { pv: 20, current_pv: 7, faith: 50 } });
    expect(filterOf(write!, 'eq', 'id')).toBe('c1');
  });

  it('não passa do PV máximo nem desce de zero, e não mexe em is_dead nem no status', async () => {
    await expect(vitals.adjustCurrentPv('c1', stats, 100)).resolves.toMatchObject({
      current_pv: 20,
    });
    await expect(vitals.adjustCurrentPv('c1', stats, -100)).resolves.toEqual({
      pv: 20,
      current_pv: 0,
      faith: 50,
    });
    expect(lastWrite('characters')?.payload).not.toHaveProperty('is_dead');
    expect(lastWrite('characters')?.payload).not.toHaveProperty('status');
  });

  it('sem PV atual, parte do máximo; sem nenhum dos dois, assume 10', async () => {
    await expect(vitals.adjustCurrentPv('c1', { pv: 8 }, -3)).resolves.toMatchObject({
      current_pv: 5,
    });
    await expect(vitals.adjustCurrentPv('c1', {}, -3)).resolves.toMatchObject({ current_pv: 7 });
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(vitals.adjustCurrentPv('c1', stats, 1)).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('adjustCurrentPvWithStatus', () => {
  it('grava também o rótulo de status derivado do PV novo', async () => {
    await expect(vitals.adjustCurrentPvWithStatus('c1', stats, -5)).resolves.toEqual({
      pv: 20,
      current_pv: 7,
      faith: 50,
      status: 'Vivo',
    });
    expect(lastWrite('characters')?.payload).toEqual({
      stats: { pv: 20, current_pv: 7, faith: 50, status: 'Vivo' },
    });

    await expect(vitals.adjustCurrentPvWithStatus('c1', stats, -50)).resolves.toMatchObject({
      current_pv: 0,
      status: 'Morto',
    });
  });

  it('não mexe em is_dead', async () => {
    await vitals.adjustCurrentPvWithStatus('c1', stats, -50);
    expect(lastWrite('characters')?.payload).not.toHaveProperty('is_dead');
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(vitals.adjustCurrentPvWithStatus('c1', stats, 1)).rejects.toBe(failure);
  });
});

describe('healCurrentPv', () => {
  it('cura até o máximo na ficha e agrega os campos extras à mesma gravação', async () => {
    const skills = { ability_uses: {} };
    const result = await vitals.healCurrentPv('characters', 'c1', stats, 50, { skills });
    expect(result).toEqual({ pv: 20, current_pv: 20, faith: 50 });
    const write = lastWrite('characters');
    expect(write?.payload).toEqual({ stats: result, skills });
    expect(filterOf(write!, 'eq', 'id')).toBe('c1');
  });

  it('cura zero PV quando o valor é zero (só recarrega os extras)', async () => {
    await expect(vitals.healCurrentPv('characters', 'c1', stats, 0)).resolves.toMatchObject({
      current_pv: 12,
    });
  });

  it('grava em session_npcs quando o alvo é um NPC simples', async () => {
    await vitals.healCurrentPv('session_npcs', 'n1', stats, 3);
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(0);
    const write = lastWrite('session_npcs');
    expect(write?.payload).toEqual({ stats: { pv: 20, current_pv: 15, faith: 50 } });
    expect(filterOf(write!, 'eq', 'id')).toBe('n1');
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(vitals.healCurrentPv('characters', 'c1', stats, 1)).rejects.toBe(failure);
    await expect(vitals.healCurrentPv('session_npcs', 'n1', stats, 1)).rejects.toBe(failure);
  });
});

describe('increaseMaxPv', () => {
  it('aumenta o PV máximo e o atual, agregando os campos extras', async () => {
    const result = await vitals.increaseMaxPv('c1', stats, 4, { level: 3 });
    expect(result).toEqual({ pv: 24, current_pv: 16, faith: 50 });
    expect(lastWrite('characters')?.payload).toEqual({ stats: result, level: 3 });
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(vitals.increaseMaxPv('c1', stats, 1)).rejects.toBe(failure);
  });
});

describe('syncFromCombatEnd', () => {
  const permanent = [{ id: 'maldicao', duration: null }] as never;

  it('grava o PV final, o status e as condições permanentes numa só gravação', async () => {
    const result = await vitals.syncFromCombatEnd('c1', stats, 9, false, false, permanent);
    expect(result).toEqual({ isDead: false });
    const write = lastWrite('characters');
    expect(write?.payload).toEqual({
      stats: { pv: 20, current_pv: 9, faith: 50, status: 'Vivo' },
      conditions: permanent,
      is_dead: false,
    });
    expect(filterOf(write!, 'eq', 'id')).toBe('c1');
  });

  it('jogador a zero PV fica Morrendo e não morre', async () => {
    await expect(vitals.syncFromCombatEnd('c1', stats, 0, false, false, [])).resolves.toEqual({
      isDead: false,
    });
    expect(lastWrite('characters')?.payload).toMatchObject({
      stats: { current_pv: 0, status: 'Morrendo' },
      is_dead: false,
    });
  });

  it('inimigo a zero PV morre, e quem já estava morto continua morto', async () => {
    await expect(vitals.syncFromCombatEnd('e1', stats, 0, false, true, [])).resolves.toEqual({
      isDead: true,
    });
    expect(lastWrite('characters')?.payload).toMatchObject({
      stats: { status: 'Morto' },
      is_dead: true,
    });

    await expect(vitals.syncFromCombatEnd('c1', stats, 15, true, false, [])).resolves.toEqual({
      isDead: true,
    });
  });

  it('registra e lança o erro do Supabase', async () => {
    state.respond = () => ({ error: failure });
    await expect(vitals.syncFromCombatEnd('c1', stats, 5, false, false, [])).rejects.toBe(failure);
  });
});

describe('applyDamageOrHealing', () => {
  const participant = {
    id: 'p1',
    entity_id: 'c1',
    entity_type: 'player' as const,
    hp_current: 10,
  };

  it('lê o PV máximo da ficha, aplica o dano e grava o PV do participante', async () => {
    state.respond = (call) =>
      call.table === 'characters' ? { data: { stats: { pv: 30 } } } : undefined;
    await expect(vitals.applyDamageOrHealing(participant, 4, 'damage')).resolves.toBe(6);

    const [lookup] = callsOf(state.calls, 'characters', 'select');
    expect(filterOf(lookup, 'eq', 'id')).toBe('c1');
    const write = lastWrite('combat_participants');
    expect(write?.payload).toEqual({ hp_current: 6 });
    expect(filterOf(write!, 'eq', 'id')).toBe('p1');
  });

  it('a cura respeita o PV máximo e o dano não passa de zero', async () => {
    state.respond = (call) =>
      call.table === 'characters' ? { data: { stats: { pv: 12 } } } : undefined;
    await expect(vitals.applyDamageOrHealing(participant, 50, 'healing')).resolves.toBe(12);
    await expect(vitals.applyDamageOrHealing(participant, 50, 'damage')).resolves.toBe(0);
  });

  it('sem ficha legível, assume 10 de PV máximo', async () => {
    await expect(vitals.applyDamageOrHealing(participant, 50, 'healing')).resolves.toBe(10);
  });

  it('NPC: procura na ficha e, se não houver, no NPC simples da sessão', async () => {
    state.respond = (call) => {
      if (call.table === 'characters') return { data: null };
      if (call.table === 'session_npcs') return { data: { stats: { pv: 40 } } };
      return undefined;
    };
    const npc = { ...participant, entity_id: 'n1', entity_type: 'npc' as const };
    await expect(vitals.applyDamageOrHealing(npc, 50, 'healing')).resolves.toBe(40);
    expect(filterOf(callsOf(state.calls, 'session_npcs', 'select')[0], 'eq', 'id')).toBe('n1');
  });

  it('NPC com ficha não consulta o NPC simples', async () => {
    state.respond = (call) =>
      call.table === 'characters' ? { data: { stats: { pv: 25 } } } : undefined;
    const npc = { ...participant, entity_type: 'npc' as const };
    await expect(vitals.applyDamageOrHealing(npc, 50, 'healing')).resolves.toBe(25);
    expect(callsOf(state.calls, 'session_npcs')).toHaveLength(0);
  });

  it('registra e lança o erro de gravar', async () => {
    state.respond = (call) => (call.op === 'update' ? { error: failure } : undefined);
    await expect(vitals.applyDamageOrHealing(participant, 1, 'damage')).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('reviveWithHp', () => {
  const world = (data: unknown = { stats: { pv: 20, current_pv: 0, status: 'Morto' } }) => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'select' ? { data } : undefined;
  };

  it('lê as estatísticas na hora, limita o PV ao máximo e força vivo', async () => {
    world();
    const result = await vitals.reviveWithHp('c1', 50, { death_saves_failures: 0 });
    expect(result).toEqual({ pv: 20, current_pv: 20, status: 'Vivo' });
    const write = lastWrite('characters');
    expect(write?.payload).toEqual({
      stats: result,
      is_dead: false,
      death_saves_failures: 0,
    });
    expect(filterOf(write!, 'eq', 'id')).toBe('c1');
  });

  it('sincroniza o PV do participante do combate quando ele é informado', async () => {
    world();
    await vitals.reviveWithHp('c1', 1, undefined, 'p1');
    const write = lastWrite('combat_participants');
    expect(write?.payload).toEqual({ hp_current: 1 });
    expect(filterOf(write!, 'eq', 'id')).toBe('p1');
  });

  // Em combate o PV vive no participante (o dano do Mestre também só o altera) e a ficha o recebe
  // no fim do combate. Levantar grava na ficha na hora o estado de vida, mas não o PV.
  it('em combate, a ficha recebe o estado de vida mas não o PV: ele chega no fim do combate', async () => {
    world({ stats: { pv: 20, current_pv: 12, status: 'Morrendo' } });
    const result = await vitals.reviveWithHp('c1', 1, { death_saves_failures: 0 }, 'p1');
    expect(result).toEqual({ pv: 20, current_pv: 12, status: 'Vivo' });
    expect(lastWrite('characters')?.payload).toEqual({
      stats: { pv: 20, current_pv: 12, status: 'Vivo' },
      is_dead: false,
      death_saves_failures: 0,
    });
    expect(lastWrite('combat_participants')?.payload).toEqual({ hp_current: 1 });
  });

  it('sem participante, não mexe no combate', async () => {
    world();
    await vitals.reviveWithHp('c1', 1);
    expect(callsOf(state.calls, 'combat_participants')).toHaveLength(0);
  });

  it('sem estatísticas legíveis, parte de um máximo de 10', async () => {
    world({ stats: null });
    await expect(vitals.reviveWithHp('c1', 99)).resolves.toMatchObject({ current_pv: 10 });
  });

  it('registra e lança o erro de ler, de gravar a ficha e de gravar o participante', async () => {
    vi.mocked(console.error).mockClear();
    state.respond = (call) => (call.op === 'select' ? { error: failure } : undefined);
    await expect(vitals.reviveWithHp('c1', 5)).rejects.toBe(failure);
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(0);

    state.respond = (call) =>
      call.op === 'select'
        ? { data: { stats: { pv: 20 } } }
        : call.table === 'characters'
          ? { error: failure }
          : undefined;
    await expect(vitals.reviveWithHp('c1', 5, undefined, 'p1')).rejects.toBe(failure);
    expect(callsOf(state.calls, 'combat_participants')).toHaveLength(0);

    state.respond = (call) =>
      call.op === 'select'
        ? { data: { stats: { pv: 20 } } }
        : call.table === 'combat_participants'
          ? { error: failure }
          : undefined;
    await expect(vitals.reviveWithHp('c1', 5, undefined, 'p1')).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledTimes(3);
  });
});

// A morte (3 Testes de Morte falhos ou a Morte Instantânea do Mestre) grava `is_dead` e o rótulo
// "Morto" juntos. Antes só `is_dead` mudava e o rótulo ficava "Vivo" até o fim do combate.
describe('markDead', () => {
  const world = (
    data: unknown = { stats: { pv: 20, current_pv: 0, faith: 50, status: 'Morrendo' } },
  ) => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'select' ? { data } : undefined;
  };

  it('lê as estatísticas na hora e grava is_dead com o rótulo Morto, sem perder o resto', async () => {
    world();
    const result = await vitals.markDead('c1', { death_saves_failures: 3 });
    expect(result).toEqual({ pv: 20, current_pv: 0, faith: 50, status: 'Morto' });
    const write = lastWrite('characters');
    expect(write?.payload).toEqual({
      stats: result,
      is_dead: true,
      death_saves_failures: 3,
    });
    expect(filterOf(write!, 'eq', 'id')).toBe('c1');
  });

  it('não mexe no PV nem no combate', async () => {
    world();
    await vitals.markDead('c1');
    expect(callsOf(state.calls, 'combat_participants')).toHaveLength(0);
    expect(lastWrite('characters')?.payload).toMatchObject({ stats: { current_pv: 0 } });
  });

  it('sem estatísticas legíveis, grava só o rótulo', async () => {
    world({ stats: null });
    await expect(vitals.markDead('c1')).resolves.toEqual({ status: 'Morto' });
  });

  it('registra e lança o erro de ler e o de gravar', async () => {
    vi.mocked(console.error).mockClear();
    state.respond = (call) => (call.op === 'select' ? { error: failure } : undefined);
    await expect(vitals.markDead('c1')).rejects.toBe(failure);
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(0);

    state.respond = (call) =>
      call.op === 'select' ? { data: { stats: { pv: 20 } } } : { error: failure };
    await expect(vitals.markDead('c1')).rejects.toBe(failure);
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});
