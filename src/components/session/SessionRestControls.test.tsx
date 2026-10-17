// CARACTERIZAÇÃO: fixa o comportamento dos botões de Descanso Curto e Longo do Mestre, com um
// Supabase falso que só grava as chamadas.
// Decisões: ROADMAP.md, Onda 2 (bloco B): o Descanso Curto recarrega habilidades mesmo sem cura;
// Longo 1 por dia; o 1d4 de Fé do Longo é digitado pelo Mestre (ADR 0001, ainda não implementado).
// Termos: CONTEXT.md (Descanso Curto, Descanso Longo).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FakeCall, FakeResult } from '../../test/fakeSupabase';

const state = vi.hoisted(() => ({
  calls: [] as FakeCall[],
  respond: undefined as ((call: FakeCall) => FakeResult | undefined) | undefined,
}));

vi.mock('../../lib/supabase', async () => {
  const { createFakeSupabase } = await import('../../test/fakeSupabase');
  return {
    supabase: createFakeSupabase({
      calls: state.calls,
      respond: (call) => state.respond?.(call),
    }),
  };
});

import { callsOf, filterOf } from '../../test/fakeSupabase';
import { ABILITIES } from '@/content/abilities';
import { SessionRestControls } from './SessionRestControls';

const shortRestAbility = ABILITIES.find((a) => a.usageType === 'short_rest')!.id;
const longRestAbility = ABILITIES.find((a) => a.usageType === 'long_rest')!.id;

const session = (over: Record<string, unknown> = {}) => ({
  current_day: 2,
  last_long_rest_day: 1,
  short_rests_today: 0,
  ...over,
});

const hero = {
  character: {
    id: 'hero',
    vocation: 'Guerreiro',
    is_enemy: false,
    stats: { pv: 10, current_pv: 4, current_faith: 40 },
    skills: { ability_uses: { [shortRestAbility]: 1, [longRestAbility]: 1 } },
  },
};

const renderControls = (sessionData = session()) =>
  render(
    <SessionRestControls sessionId="s1" sessionData={sessionData} playerCharacters={[hero]} />,
  );
const clickShortRest = () =>
  fireEvent.click(screen.getByRole('button', { name: /Descanso Curto/ }));
const heroWrites = () =>
  callsOf(state.calls, 'characters', 'update').filter((c) => filterOf(c, 'eq', 'id') === 'hero');

beforeEach(() => {
  state.calls.length = 0;
  state.respond = undefined;
  vi.stubGlobal('alert', vi.fn());
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Descanso Curto', () => {
  it('cura o valor digitado pelo Mestre e recarrega as habilidades de Descanso Curto', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '3'),
    );
    renderControls();
    clickShortRest();
    await waitFor(() => expect(heroWrites()).toHaveLength(1));
    expect(heroWrites()[0].payload).toEqual({
      stats: { pv: 10, current_pv: 7, current_faith: 40 },
      skills: { ability_uses: { [longRestAbility]: 1 } },
    });
  });

  it('a cura não passa dos PV máximos', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '50'),
    );
    renderControls();
    clickShortRest();
    await waitFor(() => expect(heroWrites()).toHaveLength(1));
    expect(heroWrites()[0].payload).toMatchObject({ stats: { current_pv: 10 } });
  });

  it('mesmo sem PV recuperados (em branco ou 0), as habilidades de Descanso Curto recarregam', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => ''),
    );
    renderControls();
    clickShortRest();
    await waitFor(() => expect(heroWrites()).toHaveLength(1));
    expect(heroWrites()[0].payload).toEqual({
      stats: { pv: 10, current_pv: 4, current_faith: 40 },
      skills: { ability_uses: { [longRestAbility]: 1 } },
    });
  });

  it('conta o descanso na sessão', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '1'),
    );
    renderControls(session({ short_rests_today: 1 }));
    clickShortRest();
    await waitFor(() => expect(callsOf(state.calls, 'game_sessions', 'update')).toHaveLength(1));
    expect(callsOf(state.calls, 'game_sessions', 'update')[0].payload).toEqual({
      short_rests_today: 2,
    });
  });

  it('não grava nada se o Mestre cancelar ou digitar um valor inválido', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => null),
    );
    renderControls();
    clickShortRest();
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '-2'),
    );
    clickShortRest();
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'abc'),
    );
    clickShortRest();
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(2));
    expect(state.calls).toEqual([]);
  });

  it('com 2 descansos já feitos no dia, o botão fica desabilitado', () => {
    renderControls(session({ short_rests_today: 2 }));
    expect(screen.getByRole('button', { name: /Descanso Curto/ })).toBeDisabled();
  });

  it('inimigos não descansam', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '3'),
    );
    render(
      <SessionRestControls
        sessionId="s1"
        sessionData={session()}
        playerCharacters={[hero, { character: { ...hero.character, id: 'orc', is_enemy: true } }]}
      />,
    );
    clickShortRest();
    await waitFor(() => expect(heroWrites()).toHaveLength(1));
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(1);
  });
});

describe('Descanso Longo: disponibilidade', () => {
  const longButton = () => screen.getByRole('button', { name: /Descanso Longo/ });

  it('um dia depois do último Descanso Longo já está disponível', () => {
    renderControls(session({ current_day: 2, last_long_rest_day: 1 }));
    expect(longButton()).toBeEnabled();
  });

  it('no mesmo dia do último Descanso Longo não está disponível', () => {
    renderControls(session({ current_day: 3, last_long_rest_day: 3 }));
    expect(longButton()).toBeDisabled();
    expect(screen.getByText(/a partir do dia 4/)).toBeInTheDocument();
  });
});
