// Fixa como o serviço grava o resultado de um Teste e a perda de Fé, com um Supabase falso que só
// grava as chamadas. O Teste de Fé usa a mesma regra da tela do jogador (Fé Efetiva com Item
// Profano). Decisões: ROADMAP.md, Onda 3 (passo 3). Termos: CONTEXT.md (Teste de Fé, Fé Efetiva).
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
import { submitTestResult } from './sessionTestService';

// Como em produção: a linha do amuleto tem `effects` vazio; a penalidade vem do conteúdo (slug).
const amulet = { items: { slug: 'simbolo_proibido', effects: {} } };

const world = (options: { faith?: number; items?: unknown[] } = {}) => {
  state.respond = (call) => {
    if (call.table === 'characters' && call.op === 'select') {
      return { data: { stats: { current_faith: options.faith ?? 50, pv: 10 } } };
    }
    if (call.table === 'character_items') return { data: options.items ?? [] };
    return undefined;
  };
};
const resultWrite = () => callsOf(state.calls, 'session_test_results', 'update')[0].payload;
const faithWrite = () =>
  callsOf(state.calls, 'characters', 'update').find((c) => filterOf(c, 'eq', 'id') === 'char-1');

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('submitTestResult: Teste de Fé', () => {
  it('sem Item Profano, passa quando o dado é menor ou igual à Fé', async () => {
    world({ faith: 50 });
    await submitTestResult('r1', 45, 0, 'char-1', 'Fé', undefined, 45);
    expect(resultWrite()).toMatchObject({ result_value: 45, roll_value: 45, is_approved: true });
    expect(faithWrite()).toBeUndefined();
  });

  it('com Item Profano, a Fé Efetiva menor reprova (a mesma conta da tela do jogador)', async () => {
    // Fé 50, Amuleto Proibido (-10): Fé Efetiva 40. O jogador rolou 45.
    world({ faith: 50, items: [amulet] });
    await submitTestResult('r1', 45, 0, 'char-1', 'Fé', 3, 45);
    expect(resultWrite()).toMatchObject({ is_approved: false });
    // A perda de Fé digitada (3) sai da Fé Atual (50), não da Efetiva.
    expect(faithWrite()!.payload).toStrictEqual({ stats: { current_faith: 47, pv: 10 } });
  });

  it('com Item Profano, um dado dentro da Fé Efetiva ainda passa', async () => {
    world({ faith: 50, items: [amulet] });
    await submitTestResult('r1', 40, 0, 'char-1', 'Fé');
    expect(resultWrite()).toMatchObject({ is_approved: true });
  });

  it('o Modificador de Fé do Mestre soma à Fé Efetiva (Misericórdia) ou subtrai (Punição)', async () => {
    world({ faith: 50, items: [amulet] });
    await submitTestResult('r1', 55, 15, 'char-1', 'Fé');
    expect(resultWrite()).toMatchObject({ is_approved: true }); // 40 + 15 = 55
    state.calls.length = 0;
    await submitTestResult('r1', 26, -15, 'char-1', 'Fé');
    expect(resultWrite()).toMatchObject({ is_approved: false }); // 40 - 15 = 25
  });

  it('só os itens do personagem do teste entram na conta', async () => {
    world({ faith: 50, items: [amulet] });
    await submitTestResult('r1', 45, 0, 'char-1', 'Fé');
    const read = callsOf(state.calls, 'character_items', 'select')[0];
    expect(filterOf(read, 'eq', 'character_id')).toBe('char-1');
  });

  it('a perda de Fé nunca deixa a Fé abaixo de 0', async () => {
    world({ faith: 4 });
    await submitTestResult('r1', 90, 0, 'char-1', 'Fé', 6);
    expect(faithWrite()!.payload).toMatchObject({ stats: { current_faith: 0 } });
  });

  // Decisão do autor (ROADMAP, passo 9c, Q11): sem ler a ficha não há como julgar o Teste de Fé.
  // Antes o serviço caía na regra do Teste comum (resultado >= CD) e não aplicava a perda de Fé.
  it('se a leitura da ficha falha, lança e não grava o resultado nem a perda de Fé', async () => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'select'
        ? { error: new Error('leitura falhou') }
        : undefined;
    await expect(submitTestResult('r1', 90, 0, 'char-1', 'Fé', 6)).rejects.toThrow(
      'leitura falhou',
    );
    expect(callsOf(state.calls, 'session_test_results', 'update')).toEqual([]);
    expect(faithWrite()).toBeUndefined();
  });

  it('o Teste comum não lê a ficha, então uma leitura que falha não o atrapalha', async () => {
    state.respond = (call) =>
      call.table === 'characters' && call.op === 'select'
        ? { error: new Error('leitura falhou') }
        : undefined;
    await submitTestResult('r1', 15, 10, 'char-1', 'Destreza');
    expect(resultWrite()).toMatchObject({ is_approved: true });
  });
});

describe('submitTestResult: o uso do Teste de Fé decide se a falha custa Fé', () => {
  const fail = (use: 'clamor' | 'tentacao' | 'testemunho', selfishRequest: boolean) =>
    submitTestResult('r1', 90, 0, 'char-1', 'Fé', 4, 90, { use, selfishRequest });

  it('o Clamor que falha sem Pedido Egoísta é silêncio divino: reprova e não custa Fé', async () => {
    world({ faith: 50 });
    await fail('clamor', false);
    expect(resultWrite()).toMatchObject({ is_approved: false });
    expect(faithWrite()).toBeUndefined();
  });

  it('o Clamor que falha com Pedido Egoísta custa a perda de Fé', async () => {
    world({ faith: 50 });
    await fail('clamor', true);
    expect(faithWrite()!.payload).toMatchObject({ stats: { current_faith: 46 } });
  });

  it('a Tentação e o Testemunho que falham custam Fé', async () => {
    world({ faith: 50 });
    await fail('tentacao', false);
    expect(faithWrite()!.payload).toMatchObject({ stats: { current_faith: 46 } });
    state.calls.length = 0;
    await fail('testemunho', false);
    expect(faithWrite()!.payload).toMatchObject({ stats: { current_faith: 46 } });
  });

  it('o Clamor que passa não custa Fé, com ou sem Pedido Egoísta', async () => {
    world({ faith: 50 });
    await submitTestResult('r1', 10, 0, 'char-1', 'Fé', undefined, 10, {
      use: 'clamor',
      selfishRequest: true,
    });
    expect(resultWrite()).toMatchObject({ is_approved: true });
    expect(faithWrite()).toBeUndefined();
  });
});

describe('submitTestResult: Teste comum', () => {
  it('passa quando o resultado alcança a CD, sem olhar Fé nem itens', async () => {
    world({ items: [amulet] });
    await submitTestResult('r1', 12, 12, 'char-1', 'Destreza');
    expect(resultWrite()).toMatchObject({ is_approved: true, status: 'submitted' });
    expect(callsOf(state.calls, 'character_items')).toEqual([]);
    state.calls.length = 0;
    await submitTestResult('r1', 11, 12, 'char-1', 'Destreza');
    expect(resultWrite()).toMatchObject({ is_approved: false });
  });

  it('o dado rolado é gravado ao lado do total; sem ele, fica nulo', async () => {
    world();
    await submitTestResult('r1', 15, 10, 'char-1', 'Destreza', undefined, 13);
    expect(resultWrite()).toMatchObject({ result_value: 15, roll_value: 13 });
    state.calls.length = 0;
    await submitTestResult('r1', 15, 10, 'char-1', 'Destreza');
    expect(resultWrite()).toMatchObject({ roll_value: null });
  });

  it('erro ao gravar o resultado é lançado', async () => {
    state.respond = (call) =>
      call.table === 'session_test_results' ? { error: new Error('falhou') } : undefined;
    await expect(submitTestResult('r1', 15, 10)).rejects.toThrow('falhou');
  });
});
