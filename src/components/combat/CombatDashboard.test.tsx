// CARACTERIZAÇÃO: o painel de combate do Mestre: a ordem e o turno atual, o que cada participante
// mostra e as Condições (ver, adicionar e remover). O seletor, os selos, a janela de PV e os
// controles de morte são stubs; o armazém de combate é o de verdade. Decisões: ROADMAP.md, Onda 4,
// passo 7f. Termos: CONTEXT.md (Combate, Condição).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));
vi.mock('../conditions/ConditionBadge', async () => ({
  ConditionBadge: (await import('@/test/stubs')).makeStub('ConditionBadge', (props) =>
    String(props.conditionId),
  ),
}));
vi.mock('../conditions/ConditionSelector', async () => ({
  ConditionSelector: (await import('@/test/stubs')).makeStub('ConditionSelector'),
}));
vi.mock('./HealthModificationModal', async () => ({
  HealthModificationModal: (await import('@/test/stubs')).makeStub('HealthModificationModal'),
}));
vi.mock('./MasterDeathControls', async () => ({
  MasterDeathControls: (await import('@/test/stubs')).makeStub('MasterDeathControls'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import { useCombatStore, type CombatParticipant } from '@/store/combatStore';
import { CombatDashboard } from './CombatDashboard';

const participant = (id: string, over: Partial<CombatParticipant> = {}): CombatParticipant =>
  ({
    id,
    combat_id: 'combat-1',
    entity_id: `ent-${id}`,
    entity_type: 'player',
    hp_current: 10,
    initiative: 12,
    is_surprised: false,
    conditions: [],
    created_at: '',
    updated_at: '',
    ...over,
  }) as CombatParticipant;

const updateConditions = vi.fn();
const nextTurn = vi.fn();
const endCombat = vi.fn();

const startCombat = (participants: CombatParticipant[], currentIndex = 0) =>
  useCombatStore.setState({
    activeCombat: {
      id: 'combat-1',
      session_id: 's',
      round_number: 3,
      current_turn_index: currentIndex,
      status: 'active',
      created_at: '',
      updated_at: '',
    },
    participants,
    currentTurnParticipant: participants[currentIndex],
    updateConditions,
    nextTurn,
    endCombat,
  });

beforeEach(() => {
  updateConditions.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.clearAllMocks();
  useCombatStore.setState({ activeCombat: null, participants: [], currentTurnParticipant: null });
});

const call = (fn: unknown, ...args: unknown[]) =>
  act(async () => {
    await (fn as (...a: unknown[]) => unknown)(...args);
  });

describe('CombatDashboard: o combate', () => {
  it('sem combate ativo, avisa', () => {
    render(<CombatDashboard />);
    expect(screen.getByText('Nenhum combate ativo nesta sessão.')).toBeInTheDocument();
  });

  it('mostra a rodada e os botões de turno e de fim', async () => {
    startCombat([participant('p1')]);
    render(<CombatDashboard />);
    expect(screen.getByText('Painel de Combate (Rodada 3)')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Próximo Turno' })));
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Finalizar Combate' })),
    );
    expect(nextTurn).toHaveBeenCalledTimes(1);
    expect(endCombat).toHaveBeenCalledTimes(1);
  });

  // O avanço e o fim leem o banco e gravam: um segundo clique antes de terminar partiria do mesmo
  // turno (ou finalizaria duas vezes).
  describe('enquanto grava', () => {
    const pendingCall = () => {
      let finish: () => void = () => {};
      let fail: (reason: unknown) => void = () => {};
      const promise = new Promise<void>((resolve, reject) => {
        finish = resolve;
        fail = reject;
      });
      return { promise, finish, fail };
    };
    const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

    it('Próximo Turno e Finalizar Combate ficam desabilitados até o avanço terminar', async () => {
      const turn = pendingCall();
      nextTurn.mockReturnValue(turn.promise);
      startCombat([participant('p1')]);
      render(<CombatDashboard />);

      await act(async () => fireEvent.click(button('Próximo Turno')));
      expect(button('Próximo Turno').disabled).toBe(true);
      expect(button('Finalizar Combate').disabled).toBe(true);
      await act(async () => fireEvent.click(button('Próximo Turno')));
      expect(nextTurn).toHaveBeenCalledTimes(1);

      await act(async () => turn.finish());
      expect(button('Próximo Turno').disabled).toBe(false);
      expect(button('Finalizar Combate').disabled).toBe(false);
    });

    it('Finalizar Combate trava os dois botões enquanto grava', async () => {
      const ending = pendingCall();
      endCombat.mockReturnValue(ending.promise);
      startCombat([participant('p1')]);
      render(<CombatDashboard />);

      await act(async () => fireEvent.click(button('Finalizar Combate')));
      expect(button('Próximo Turno').disabled).toBe(true);
      await act(async () => fireEvent.click(button('Finalizar Combate')));
      expect(endCombat).toHaveBeenCalledTimes(1);
      await act(async () => ending.finish());
    });

    it('se o avanço falhar, registra o erro e libera os botões', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const turn = pendingCall();
      nextTurn.mockReturnValue(turn.promise);
      startCombat([participant('p1')]);
      render(<CombatDashboard />);

      await act(async () => fireEvent.click(button('Próximo Turno')));
      await act(async () => turn.fail(new Error('sem rede')));

      expect(error).toHaveBeenCalledWith('Erro ao avançar o turno:', expect.any(Error));
      expect(button('Próximo Turno').disabled).toBe(false);
    });

    it('se finalizar falhar, registra o erro e libera os botões', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const ending = pendingCall();
      endCombat.mockReturnValue(ending.promise);
      startCombat([participant('p1')]);
      render(<CombatDashboard />);

      await act(async () => fireEvent.click(button('Finalizar Combate')));
      await act(async () => ending.fail(new Error('sem rede')));

      expect(error).toHaveBeenCalledWith('Erro ao finalizar o combate:', expect.any(Error));
      expect(button('Finalizar Combate').disabled).toBe(false);
    });
  });

  it('marca o participante do turno atual', () => {
    startCombat([participant('p1'), participant('p2')], 1);
    render(<CombatDashboard />);
    expect(screen.getAllByText('Turno Atual')).toHaveLength(1);
  });
});

describe('CombatDashboard: cada participante', () => {
  it('sem dados da entidade, mostra o tipo e a iniciativa', () => {
    startCombat([participant('p1', { entity_type: 'enemy', initiative: 7 })]);
    render(<CombatDashboard />);
    expect(screen.getByText('enemy (Init: 7)')).toBeInTheDocument();
    expect(screen.getByText(/Inimigo • Init: 7/)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText('CA Total:')).toBeNull();
  });

  it('com dados da entidade, mostra o nome, a CA e a arma do inimigo', () => {
    startCombat([participant('p1', { entity_type: 'enemy', entity_id: 'e1' })]);
    render(
      <CombatDashboard
        availableEntities={[
          {
            id: 'e1',
            name: 'Filisteu',
            type: 'enemy',
            hpCurrent: 10,
            totalAc: 14,
            weapon: { name: 'Lança', damageDie: '1d8' },
          },
        ]}
      />,
    );
    expect(screen.getByText('Filisteu')).toBeInTheDocument();
    expect(screen.getByText('CA Total:').nextSibling).toHaveTextContent('14');
    expect(screen.getByText('Lança')).toBeInTheDocument();
    expect(screen.getByText('1d8')).toBeInTheDocument();
  });

  it('a arma só aparece para inimigo', () => {
    startCombat([participant('p1', { entity_id: 'e1' })]);
    render(
      <CombatDashboard
        availableEntities={[
          {
            id: 'e1',
            name: 'Eli',
            type: 'player',
            hpCurrent: 10,
            weapon: { name: 'Lança', damageDie: '1d8' },
          },
        ]}
      />,
    );
    expect(screen.queryByText('Lança')).toBeNull();
  });

  it('Modificar Vida abre a janela do participante', () => {
    startCombat([participant('p1', { entity_id: 'e1' })]);
    render(
      <CombatDashboard
        availableEntities={[{ id: 'e1', name: 'Eli', type: 'player', hpCurrent: 10 }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Modificar Vida' }));
    expect(stubProps('HealthModificationModal')).toMatchObject({
      participantId: 'p1',
      participantName: 'Eli',
      isOpen: true,
    });
    act(() => (stubProps('HealthModificationModal')!.onClose as () => void)());
    expect(document.querySelector('[data-stub="HealthModificationModal"]')).toBeNull();
  });

  // O PV novo chega pelo tempo real. Aplicar outro valor antes disso partiria do PV velho, então o
  // botão do participante espera um instante depois de cada aplicação.
  describe('depois de aplicar dano ou cura', () => {
    const twoParticipants = () => {
      startCombat([
        participant('p1', { entity_id: 'e1' }),
        participant('p2', { entity_id: 'e2', initiative: 5 }),
      ]);
      render(
        <CombatDashboard
          availableEntities={[
            { id: 'e1', name: 'Eli', type: 'player', hpCurrent: 10 },
            { id: 'e2', name: 'Guarda', type: 'enemy', hpCurrent: 10 },
          ]}
        />,
      );
    };
    const healthButton = (index: number) =>
      screen.getAllByRole('button', { name: 'Modificar Vida' })[index] as HTMLButtonElement;
    const applied = () =>
      act(() => (stubProps('HealthModificationModal')!.onApplied as () => void)());

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('o botão do participante fica desabilitado por um instante e depois volta', () => {
      twoParticipants();
      fireEvent.click(healthButton(0));
      applied();

      expect(healthButton(0).disabled).toBe(true);
      act(() => vi.advanceTimersByTime(1000));
      expect(healthButton(0).disabled).toBe(true);
      act(() => vi.advanceTimersByTime(600));
      expect(healthButton(0).disabled).toBe(false);
    });

    it('o botão dos outros participantes continua livre', () => {
      twoParticipants();
      fireEvent.click(healthButton(0));
      applied();

      expect(healthButton(1).disabled).toBe(false);
    });

    it('sem aplicar (só fechar a janela), o botão não espera', () => {
      twoParticipants();
      fireEvent.click(healthButton(0));
      act(() => (stubProps('HealthModificationModal')!.onClose as () => void)());

      expect(healthButton(0).disabled).toBe(false);
    });

    it('sair da tela não deixa o tempo de espera pendurado', () => {
      twoParticipants();
      fireEvent.click(healthButton(0));
      applied();
      cleanup();

      expect(() => act(() => vi.advanceTimersByTime(5000))).not.toThrow();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it('o jogador com PV 0 ganha os controles de morte', () => {
    startCombat([participant('p1', { hp_current: 0 }), participant('p2', { hp_current: 4 })]);
    render(<CombatDashboard />);
    expect(stubProps('MasterDeathControls')).toMatchObject({
      characterId: 'ent-p1',
      participantId: 'p1',
    });
  });

  it('o inimigo com PV 0 não ganha os controles de morte', () => {
    startCombat([participant('p1', { entity_type: 'enemy', hp_current: 0 })]);
    render(<CombatDashboard />);
    expect(document.querySelector('[data-stub="MasterDeathControls"]')).toBeNull();
  });
});

describe('CombatDashboard: Condições', () => {
  const conditions = [
    { conditionId: 'sangrando', duration: 2 },
    { conditionId: 'atordoado', duration: null },
  ];

  it('mostra um selo por Condição, com a duração ou sem ela', () => {
    startCombat([participant('p1', { conditions: conditions as never })]);
    render(<CombatDashboard />);
    expect(stubProps('ConditionBadge', 'sangrando')).toMatchObject({ duration: 2 });
    expect(stubProps('ConditionBadge', 'atordoado')!.duration).toBeUndefined();
  });

  it('Condições que não são uma lista não geram selos', () => {
    startCombat([participant('p1', { conditions: null as never })]);
    render(<CombatDashboard />);
    expect(document.querySelector('[data-stub="ConditionBadge"]')).toBeNull();
    expect(stubProps('ConditionSelector')).toBeDefined();
  });

  it('o seletor recebe a resistência da entidade', () => {
    startCombat([participant('p1', { entity_id: 'e1' })]);
    render(
      <CombatDashboard
        availableEntities={[
          {
            id: 'e1',
            name: 'Eli',
            type: 'player',
            hpCurrent: 10,
            conditionResistanceLevels: { sangrando: 4 },
          },
        ]}
      />,
    );
    expect(stubProps('ConditionSelector')!.resistanceLevels).toEqual({ sangrando: 4 });
  });

  it('remover: grava a lista sem a Condição', async () => {
    startCombat([participant('p1', { conditions: conditions as never })]);
    render(<CombatDashboard />);
    await call(stubProps('ConditionBadge', 'sangrando')!.onRemove, 'sangrando');
    expect(updateConditions).toHaveBeenCalledWith('p1', [
      { conditionId: 'atordoado', duration: null },
    ]);
  });

  it('adicionar: junta a Condição nova às que já existem', async () => {
    startCombat([participant('p1', { conditions: conditions as never })]);
    render(<CombatDashboard />);
    await call(stubProps('ConditionSelector')!.onAddCondition, 'cego', 3);
    expect(updateConditions).toHaveBeenCalledWith('p1', [
      { conditionId: 'sangrando', duration: 2 },
      { conditionId: 'atordoado', duration: null },
      { conditionId: 'cego', duration: 3 },
    ]);
  });

  it('adicionar com duração 0 vale sem duração, e uma Condição igual é trocada', async () => {
    startCombat([participant('p1', { conditions: conditions as never })]);
    render(<CombatDashboard />);
    await call(stubProps('ConditionSelector')!.onAddCondition, 'sangrando', 0);
    const [, saved] = updateConditions.mock.calls[0];
    expect(saved.filter((c: { conditionId: string }) => c.conditionId === 'sangrando')).toEqual([
      { conditionId: 'sangrando', duration: null },
    ]);
  });

  it('adicionar a quem não tem Condições começa uma lista', async () => {
    startCombat([participant('p1', { conditions: null as never })]);
    render(<CombatDashboard />);
    await call(stubProps('ConditionSelector')!.onAddCondition, 'cego', 2);
    expect(updateConditions).toHaveBeenCalledWith('p1', [{ conditionId: 'cego', duration: 2 }]);
  });
});

describe('CombatDashboard: ataques', () => {
  it('lista os últimos ataques do combate', () => {
    startCombat([participant('p1')]);
    useCombatStore.setState({
      attacks: [
        {
          id: 'a1',
          combat_id: 'combat-1',
          attacker_participant_id: 'p1',
          target_participant_id: 'p1',
          attacker_name: 'Eliabe',
          target_name: 'Filisteu',
          natural_roll: 14,
          total: 19,
          target_ac: 15,
          hit: true,
          critical: false,
          fumble: false,
          damage: 7,
          target_hp_before: 12,
          target_hp_after: 5,
          applied_mode: 'normal',
          rolls: null,
          inspiration_used: false,
          created_at: '',
        },
      ],
    });
    render(<CombatDashboard />);
    expect(screen.getByText('Últimos ataques')).toBeInTheDocument();
    expect(screen.getByText(/Eliabe → Filisteu/)).toBeInTheDocument();
  });

  it('sem ataques, a lista não aparece', () => {
    startCombat([participant('p1')]);
    useCombatStore.setState({ attacks: [] });
    render(<CombatDashboard />);
    expect(screen.queryByText('Últimos ataques')).toBeNull();
  });
});
