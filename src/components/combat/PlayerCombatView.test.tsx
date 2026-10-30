// CARACTERIZAÇÃO: a visão de combate do jogador: o cabeçalho, o turno, o painel de Teste de Morte,
// o ataque e o aviso de quem foi atingido. As Habilidades e os espaços do turno moraram aqui até a
// Onda 6 (ticket 03): hoje vivem na Hotbar (`PlayerHotbar.test.tsx`). Decisões: ROADMAP.md, Onda 4,
// passo 7f. Termos: CONTEXT.md (Fé, Morrendo).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));
vi.mock('./EnemyCombatList', async () => ({
  EnemyCombatList: (await import('@/test/stubs')).makeStub('EnemyCombatList'),
}));
vi.mock('./DeathSavesModal', async () => ({
  DeathSavesModal: (await import('@/test/stubs')).makeStub('DeathSavesModal'),
}));
vi.mock('./AttackPanel', async () => ({
  AttackPanel: (await import('@/test/stubs')).makeStub('AttackPanel'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import { useCombatStore, type CombatParticipant } from '@/store/combatStore';
import type { Character } from '@/features/character-management/types';
import { PlayerCombatView } from './PlayerCombatView';

const sheet = (over: Partial<Character> = {}): Character => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Eliab',
  tribe: 'Judá',
  vocation: 'Guerreiro',
  level: 3,
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  stats: { pv: 12, current_pv: 9, ca: 11, faith: 50, current_faith: 40 },
  skills: { ability_uses: {} },
  ...over,
});

const participant = (over: Partial<CombatParticipant> = {}): CombatParticipant =>
  ({
    id: 'part-1',
    combat_id: 'combat-1',
    entity_id: 'c1',
    entity_type: 'player',
    hp_current: 9,
    initiative: 10,
    is_surprised: false,
    conditions: [],
    created_at: '',
    updated_at: '',
    ...over,
  }) as CombatParticipant;

const startCombat = (parts: CombatParticipant[], turnIndex = 0) =>
  useCombatStore.setState({
    activeCombat: {
      id: 'combat-1',
      session_id: 's',
      round_number: 1,
      current_turn_index: turnIndex,
      status: 'active',
      created_at: '',
      updated_at: '',
    },
    participants: parts,
    currentTurnParticipant: parts[turnIndex],
  });

const view = (character: Character | null = sheet()) =>
  render(<PlayerCombatView character={character} enemies={[]} isLoading={false} />);

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  useCombatStore.setState({
    activeCombat: null,
    participants: [],
    currentTurnParticipant: null,
    hasUsedAction: false,
    hasUsedBonusAction: false,
    hasUsedReaction: false,
  });
});

describe('PlayerCombatView: cabeçalho', () => {
  it('mostra o nome, a tribo e a vocação', () => {
    view();
    expect(screen.getByRole('heading', { name: 'Eliab' })).toBeInTheDocument();
    expect(screen.getByText('Judá')).toBeInTheDocument();
    expect(screen.getByText('• Guerreiro')).toBeInTheDocument();
  });

  it('sem personagem não há cabeçalho', () => {
    view(null);
    expect(screen.queryByRole('heading', { name: 'Eliab' })).toBeNull();
  });
});

// O dano e a cura do Mestre vão para o participante; a ficha só recebe o PV no fim do combate.
// Durante o combate o jogador vê o PV do participante, e não o da ficha (o de antes do combate).
describe('PlayerCombatView: o PV em combate', () => {
  it('mostra o PV do participante sobre o PV máximo da ficha', () => {
    startCombat([participant({ hp_current: 4 })]);
    view();
    expect(screen.getByText('PV em combate')).toBeInTheDocument();
    expect(screen.getByText('4/12')).toBeInTheDocument();
  });

  it('não usa o PV que a ficha ainda guarda de antes do combate', () => {
    startCombat([participant({ hp_current: 4 })]);
    view(sheet({ stats: { pv: 12, current_pv: 12, ca: 11, faith: 50 } }));
    expect(screen.getByText('4/12')).toBeInTheDocument();
    expect(screen.queryByText('12/12')).toBeNull();
  });

  it('acompanha a cura e o dano que chegam pelo tempo real', () => {
    startCombat([participant({ hp_current: 4 })]);
    view();
    act(() => startCombat([participant({ hp_current: 9 })]));
    expect(screen.getByText('9/12')).toBeInTheDocument();
  });

  it('a 0 PV mostra 0/12 junto do Teste de Morte', () => {
    startCombat([participant({ hp_current: 0 })]);
    view();
    expect(screen.getByText('0/12')).toBeInTheDocument();
  });

  it('sem combate, não mostra o PV em combate', () => {
    view();
    expect(screen.queryByText('PV em combate')).toBeNull();
  });

  it('em combate mas fora da lista de participantes, não mostra o PV em combate', () => {
    startCombat([participant({ entity_id: 'outro' })]);
    view();
    expect(screen.queryByText('PV em combate')).toBeNull();
  });
});

describe('PlayerCombatView: o combate', () => {
  it('sem combate, não há lista de inimigos nem turno', () => {
    view();
    expect(document.querySelector('[data-stub="EnemyCombatList"]')).toBeNull();
  });

  it('em combate mostra os inimigos', () => {
    startCombat([participant()]);
    view();
    expect(stubProps('EnemyCombatList')).toMatchObject({ enemies: [], isLoading: false });
  });

  it('no turno do jogador, avisa', () => {
    startCombat([participant()]);
    view();
    expect(screen.getByText('É O SEU TURNO!')).toBeInTheDocument();
  });

  it('a faixa do turno entra só com opacidade e posição, sem escala nem loop', () => {
    startCombat([participant()]);
    view();
    const band = screen.getByTestId('faixa-do-turno');
    expect(band.className).not.toMatch(/zoom|animate-(pulse|bounce|spin|ping)/);
  });

  it('no turno de outro, não avisa', () => {
    startCombat([participant({ id: 'p2', entity_id: 'outro' }), participant()], 0);
    view();
    expect(screen.queryByText('É O SEU TURNO!')).toBeNull();
  });

  it('com PV 0 no combate, mostra o Teste de Morte e esconde o turno', () => {
    startCombat([participant({ hp_current: 0 })]);
    view();
    expect(stubProps('DeathSavesModal')).toMatchObject({
      character: { id: 'c1' },
      participantId: 'part-1',
    });
    expect(screen.queryByText('É O SEU TURNO!')).toBeNull();
  });
});

describe('PlayerCombatView: o ataque', () => {
  const entities = [
    { id: 'c1', name: 'Eliab', totalAc: 14 },
    { id: 'c2', name: 'Rute', totalAc: 12 },
    { id: 'e1', name: 'Filisteu', totalAc: 15 },
  ];
  const parts = [
    participant({ id: 'part-1', entity_id: 'c1', initiative: 20 }),
    participant({ id: 'part-2', entity_id: 'c2', initiative: 15 }),
    participant({ id: 'part-3', entity_id: 'e1', entity_type: 'enemy', initiative: 10 }),
  ];
  const attackView = () =>
    render(
      <PlayerCombatView character={sheet()} enemies={[]} isLoading={false} entities={entities} />,
    );

  it('no turno do jogador mostra o painel de ataque com os alvos (aliado e inimigo, sem ele)', () => {
    startCombat(parts, 0);
    attackView();
    expect(stubProps('AttackPanel')).toMatchObject({
      attackerParticipantId: 'part-1',
      characterId: 'c1',
      attackerConditionIds: [],
      targets: [
        {
          participantId: 'part-2',
          entityId: 'c2',
          entityType: 'player',
          name: 'Rute',
          ac: 12,
          conditionIds: [],
        },
        {
          participantId: 'part-3',
          entityId: 'e1',
          entityType: 'enemy',
          name: 'Filisteu',
          ac: 15,
          conditionIds: [],
        },
      ],
      actionUsed: false,
    });
  });

  it('entrega as Condições do atacante e dos alvos ao painel', () => {
    startCombat(
      [
        participant({
          id: 'part-1',
          entity_id: 'c1',
          initiative: 20,
          conditions: [{ conditionId: 'envenenado', duration: 2 }] as never,
        }),
        participant({
          id: 'part-2',
          entity_id: 'c2',
          initiative: 15,
          conditions: [{ conditionId: 'caido', duration: null }] as never,
        }),
      ],
      0,
    );
    attackView();
    const props = stubProps('AttackPanel')!;
    expect(props.attackerConditionIds).toEqual(['envenenado']);
    expect((props.targets as { conditionIds: string[] }[])[0].conditionIds).toEqual(['caido']);
  });

  it('a Inspiração chega ao painel só para o Inabalável que não a usou hoje', () => {
    startCombat(parts, 0);
    const withInspiration = (char: Character, day = 3) =>
      render(
        <PlayerCombatView
          character={char}
          enemies={[]}
          isLoading={false}
          entities={entities}
          inspirationContext={{ sessionId: 's1', day }}
        />,
      );
    withInspiration(sheet({ stats: { pv: 12, ca: 11, faith: 80, current_faith: 80 } }));
    expect(stubProps('AttackPanel')!.inspiration).toEqual({
      available: true,
      sessionId: 's1',
      day: 3,
    });
    cleanup();
    clearStubs();
    withInspiration(
      sheet({
        stats: { pv: 12, ca: 11, faith: 80, current_faith: 80 },
        inspiration_used_day: 3,
        inspiration_session_id: 's1',
      }),
    );
    expect(stubProps('AttackPanel')!.inspiration).toMatchObject({ available: false });
    cleanup();
    clearStubs();
    withInspiration(sheet());
    expect(stubProps('AttackPanel')!.inspiration).toMatchObject({ available: false });
  });

  it('fora do turno, não há painel de ataque', () => {
    startCombat(parts, 1);
    attackView();
    expect(stubProps('AttackPanel')).toBeUndefined();
  });

  it('sem combate, não há painel de ataque', () => {
    attackView();
    expect(stubProps('AttackPanel')).toBeUndefined();
  });

  it('a 0 PV (Morrendo) não ataca', () => {
    startCombat([{ ...parts[0], hp_current: 0 }, parts[1], parts[2]], 0);
    attackView();
    expect(stubProps('AttackPanel')).toBeUndefined();
  });

  it('registrar o ataque marca a Ação principal como usada, uma vez só', () => {
    startCombat(parts, 0);
    attackView();
    expect(useCombatStore.getState().hasUsedAction).toBe(false);
    act(() => (stubProps('AttackPanel')!.onActionUsed as () => void)());
    expect(useCombatStore.getState().hasUsedAction).toBe(true);
    act(() => (stubProps('AttackPanel')!.onActionUsed as () => void)());
    expect(useCombatStore.getState().hasUsedAction).toBe(true);
    expect(stubProps('AttackPanel')).toMatchObject({ actionUsed: true });
  });
});

describe('PlayerCombatView: o aviso de quem foi atingido', () => {
  const parts = [
    participant({ id: 'part-1', entity_id: 'c1', initiative: 20 }),
    participant({ id: 'part-2', entity_id: 'c2', initiative: 15 }),
  ];
  const hit = (over: Record<string, unknown> = {}) =>
    act(() => {
      window.dispatchEvent(
        new CustomEvent('combat-attack', {
          detail: {
            id: 'a1',
            target_participant_id: 'part-1',
            attacker_name: 'Rute',
            hit: true,
            critical: false,
            damage: 5,
            ...over,
          },
        }),
      );
    });

  beforeEach(() => {
    startCombat(parts, 1);
    view();
  });

  it('avisa quem foi atingido, com o nome do atacante e o dano', () => {
    hit();
    expect(screen.getByText('Você foi atingido por Rute: 5 de dano.')).toBeInTheDocument();
  });

  it('marca o crítico', () => {
    hit({ critical: true, damage: 11 });
    expect(
      screen.getByText('Você foi atingido por Rute (crítico): 11 de dano.'),
    ).toBeInTheDocument();
  });

  it('não avisa quem não foi o alvo, nem erro, nem dano zero', () => {
    hit({ target_participant_id: 'part-2' });
    hit({ hit: false, damage: 0 });
    hit({ damage: 0 });
    expect(screen.queryByText(/Você foi atingido/)).toBeNull();
  });

  it('o aviso some depois de alguns segundos', () => {
    vi.useFakeTimers();
    hit();
    expect(screen.getByText(/Você foi atingido/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.queryByText(/Você foi atingido/)).toBeNull();
    vi.useRealTimers();
  });
});
