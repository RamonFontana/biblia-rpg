// Os três lugares onde o Mestre aplica uma Condição à mão (painel de combate, cartão do jogador e
// lista de NPCs) passam ao seletor a Resistência a Condição do alvo, pelos itens equipados dele.
// Decisões: ROADMAP.md, Onda 3 (passo 6). Termos: CONTEXT.md (Resistência a Condição).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

// O armazém de autenticação assina o Supabase ao ser importado.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));

import { useCombatStore, type CombatParticipant } from '@/store/combatStore';
import { CombatDashboard } from '../combat/CombatDashboard';
import { PlayerCard } from '../session/PlayerCard';
import { SessionParticipantList } from '../session/SessionParticipantList';
import type { Character } from '@/features/character-management/types';

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

/** Personagem com a Lorica (Nv4 vs sangrando e atordoado) equipada no corpo. */
const withLorica = (over: Record<string, unknown> = {}) =>
  ({
    id: 'char-1',
    name: 'Eli',
    tribe: 'Judá',
    vocation: 'Guerreiro',
    level: 1,
    attributes: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
    stats: { pv: 10, current_pv: 10, current_faith: 50 },
    conditions: [],
    equipment: { body: 'ci-1' },
    character_items: [{ id: 'ci-1', level: 1, items: { slug: 'lorica' } }],
    ...over,
  }) as unknown as Character;

function openAndPick(conditionName: string) {
  fireEvent.click(screen.getByRole('button', { name: /Adicionar Efeito/ }));
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
  fireEvent.click(within(screen.getByRole('listbox')).getByText(conditionName));
}

describe('CombatDashboard', () => {
  beforeEach(() => {
    const participant = {
      id: 'part-1',
      combat_id: 'combat-1',
      entity_id: 'char-1',
      entity_type: 'player',
      hp_current: 10,
      initiative: 5,
      is_surprised: false,
      conditions: [],
      created_at: '',
      updated_at: '',
    } as CombatParticipant;
    useCombatStore.setState({
      activeCombat: {
        id: 'combat-1',
        session_id: 's',
        round_number: 1,
        current_turn_index: 0,
        status: 'active',
        created_at: '',
        updated_at: '',
      },
      participants: [participant],
      currentTurnParticipant: participant,
    });
  });

  it('o alvo com resistência aparece na janela de aplicar Condição', () => {
    render(
      <CombatDashboard
        availableEntities={[
          {
            id: 'char-1',
            name: 'Eli',
            type: 'player',
            hpCurrent: 10,
            conditionResistanceLevels: { sangrando: 4 },
          },
        ]}
      />,
    );
    openAndPick('Sangrando');
    expect(screen.getByText('Resistência Nv4: imune a Sangrando')).toBeTruthy();
  });
});

describe('PlayerCard', () => {
  it('o Mestre vê a resistência dos itens equipados do jogador', () => {
    render(
      <PlayerCard
        user={{ user_id: 'u1', online_at: '', username: 'eli' } as never}
        character={withLorica()}
        viewerIsGM
      />,
    );
    openAndPick('Atordoado');
    expect(screen.getByText('Resistência Nv4: imune a Atordoado')).toBeTruthy();
  });
});

describe('SessionParticipantList', () => {
  it('o Mestre vê a resistência dos itens equipados do NPC jogável', () => {
    render(
      <SessionParticipantList
        onlineUsers={[]}
        isGM
        npcs={[withLorica({ is_playable: true })]}
        activeTests={[]}
        testResults={{}}
      />,
    );
    openAndPick('Sangrando');
    expect(screen.getByText('Resistência Nv4: imune a Sangrando')).toBeTruthy();
  });
});
