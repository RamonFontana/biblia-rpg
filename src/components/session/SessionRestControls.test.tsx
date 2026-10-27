// CARACTERIZAÇÃO: fixa o comportamento dos botões de Descanso Curto e Longo do Mestre, com um
// Supabase falso que só grava as chamadas.
// Decisões: ROADMAP.md, Onda 2 (bloco B): o Descanso Curto recarrega habilidades mesmo sem cura;
// Longo 1 por dia; o 1d4 de Fé do Longo é digitado pelo Mestre ou vem da Rolagem Virtual (ADR 0001).
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

vi.mock('@/lib/systemRng', () => ({ systemRng: () => 0.99 }));

import { callsOf, filterOf } from '../../test/fakeSupabase';
import { ABILITIES } from '@/content/abilities';
import type { SessionNpc } from '@/data-access/sessions';
import type { Character } from '@/features/character-management/types';
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
  } as unknown as Character, // ficha parcial: só os campos que os botões leem
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

  it('um jogador sem personagem é ignorado e os outros descansam', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '3'),
    );
    render(
      <SessionRestControls
        sessionId="s1"
        sessionData={session()}
        playerCharacters={[{ character: null }, hero]}
      />,
    );
    clickShortRest();
    await waitFor(() => expect(heroWrites()).toHaveLength(1));
    expect(callsOf(state.calls, 'characters', 'update')).toHaveLength(1);
  });

  it('os NPCs com ficha descansam, mas um inimigo na lista de NPCs não', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '3'),
    );
    const npc = { ...hero.character, id: 'npc-1' } as SessionNpc;
    const foe = { ...hero.character, id: 'foe-1', is_enemy: true } as SessionNpc;
    render(
      <SessionRestControls
        sessionId="s1"
        sessionData={session()}
        playerCharacters={[]}
        npcs={[npc, foe]}
      />,
    );
    clickShortRest();
    await waitFor(() =>
      expect(
        callsOf(state.calls, 'characters', 'update').map((c) => filterOf(c, 'eq', 'id')),
      ).toEqual(['npc-1']),
    );
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
        playerCharacters={[
          hero,
          { character: { ...hero.character, id: 'orc', is_enemy: true } as Character },
        ]}
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

describe('Descanso Longo: o 1d4 de Fé', () => {
  const openLongRest = () =>
    fireEvent.click(screen.getByRole('button', { name: /Descanso Longo/ }));
  const typeDie = (value: string) =>
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value } });
  const confirm = () => fireEvent.click(screen.getByRole('button', { name: /Confirmar/ }));

  it('o botão abre o diálogo e não grava nada antes de confirmar', () => {
    renderControls();
    openLongRest();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(state.calls).toEqual([]);
  });

  it('usa o d4 digitado pelo Mestre: PV cheios e a Fé recuperada pelo grupo', async () => {
    renderControls();
    openLongRest();
    typeDie('3');
    confirm();
    await waitFor(() => expect(heroWrites()).toHaveLength(1));
    expect(heroWrites()[0].payload).toMatchObject({
      stats: { pv: 10, current_pv: 10, current_faith: 43 },
      skills: { ability_uses: {} },
    });
    expect(callsOf(state.calls, 'game_sessions', 'update')[0].payload).toMatchObject({
      last_long_rest_day: 2,
    });
  });

  it('com Sacerdote no grupo, soma 2 ao d4', async () => {
    const priest = {
      character: { ...hero.character, id: 'priest', vocation: 'Sacerdote' } as Character,
    };
    render(
      <SessionRestControls
        sessionId="s1"
        sessionData={session()}
        playerCharacters={[hero, priest]}
      />,
    );
    openLongRest();
    typeDie('3');
    confirm();
    await waitFor(() => expect(heroWrites()).toHaveLength(1));
    expect(heroWrites()[0].payload).toMatchObject({ stats: { current_faith: 45 } });
  });

  it('a Rolagem Virtual preenche o d4 sem confirmar sozinha', () => {
    renderControls();
    openLongRest();
    fireEvent.click(screen.getByRole('button', { name: /Rolar 1d4/ }));
    expect(screen.getByRole('spinbutton')).toHaveValue(4);
    expect(state.calls).toEqual([]);
  });

  it('d4 vazio ou fora de 1 a 4 é recusado e nada é gravado', () => {
    renderControls();
    openLongRest();
    confirm();
    expect(screen.getByText(/Insira o resultado do d4/)).toBeInTheDocument();
    typeDie('5');
    confirm();
    expect(screen.getByText(/entre 1 e 4/)).toBeInTheDocument();
    expect(state.calls).toEqual([]);
  });

  it('cancelar fecha o diálogo sem gravar', () => {
    renderControls();
    openLongRest();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(state.calls).toEqual([]);
  });
});
