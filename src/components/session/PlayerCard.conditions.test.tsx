// CARACTERIZAÇÃO: o cartão do jogador na mesa: o nível mostrado e as Condições (ver, adicionar e
// remover, só para o Mestre). Os selos de estado têm o próprio teste (PlayerCard.test.tsx). O seletor
// e os selos de Condição são stubs. Decisões: ROADMAP.md, Onda 4, passo 7e. Termos: CONTEXT.md (Condição).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

const h = vi.hoisted(() => ({
  applyConditionToCharacter: vi.fn(),
  removeConditionFromCharacter: vi.fn(),
}));

vi.mock('@/data-access/conditions', () => ({
  applyConditionToCharacter: h.applyConditionToCharacter,
  removeConditionFromCharacter: h.removeConditionFromCharacter,
}));
vi.mock('../conditions/ConditionBadge', async () => ({
  ConditionBadge: (await import('@/test/stubs')).makeStub('ConditionBadge', (props) =>
    String(props.conditionId),
  ),
}));
vi.mock('../conditions/ConditionSelector', async () => ({
  ConditionSelector: (await import('@/test/stubs')).makeStub('ConditionSelector'),
}));
vi.mock('../combat/MasterDeathControls', async () => ({
  MasterDeathControls: (await import('@/test/stubs')).makeStub('MasterDeathControls'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import type { PresenceState } from '@/data-access/realtime';
import type { Character } from '@/features/character-management/types';
import { PlayerCard } from './PlayerCard';

const user = { user_id: 'u1', online_at: '2026-01-01T10:00:00Z', name: 'Eli' } as PresenceState;

const sheet = (over: Partial<Character> = {}): Character => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Eliab',
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  stats: { pv: 12, current_pv: 9, ca: 11, faith: 50, current_faith: 40 },
  level: 3,
  ...over,
});

const onUpdateConditions = vi.fn();
const call = (fn: unknown, ...args: unknown[]) =>
  act(async () => {
    await (fn as (...a: unknown[]) => unknown)(...args);
  });

beforeEach(() => {
  h.applyConditionToCharacter.mockResolvedValue(undefined);
  h.removeConditionFromCharacter.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.clearAllMocks();
});

describe('PlayerCard: nome e nível', () => {
  it('mostra o nível da coluna level', () => {
    render(<PlayerCard user={user} character={sheet()} />);
    expect(screen.getByText('Eliab (Nível 3)')).toBeInTheDocument();
  });

  it('cai para stats.level e depois para 1', () => {
    const { rerender } = render(
      <PlayerCard
        user={user}
        character={sheet({
          level: undefined,
          stats: { pv: 5, ca: 10, faith: 0, level: 6 } as never,
        })}
      />,
    );
    expect(screen.getByText('Eliab (Nível 6)')).toBeInTheDocument();
    rerender(<PlayerCard user={user} character={sheet({ level: undefined })} />);
    expect(screen.getByText('Eliab (Nível 1)')).toBeInTheDocument();
  });

  it('sem personagem mostra o nome do jogador', () => {
    render(<PlayerCard user={user} />);
    expect(screen.getByText('Eli')).toBeInTheDocument();
  });
});

describe('PlayerCard: Condições', () => {
  const conditions = [{ conditionId: 'sangrando', duration: 2 }];

  it('o jogador vê as Condições, só leitura e sem seletor', () => {
    render(<PlayerCard user={user} character={sheet({ conditions })} />);
    expect(stubProps('ConditionBadge', 'sangrando')).toMatchObject({ duration: 2, readonly: true });
    expect(stubProps('ConditionBadge', 'sangrando')!.onRemove).toBeUndefined();
    expect(document.querySelector('[data-stub="ConditionSelector"]')).toBeNull();
  });

  it('o bloco some sem Condições, a não ser para o Mestre', () => {
    const { rerender } = render(<PlayerCard user={user} character={sheet()} />);
    expect(document.querySelector('[data-stub="ConditionSelector"]')).toBeNull();
    rerender(<PlayerCard user={user} character={sheet()} viewerIsGM />);
    expect(stubProps('ConditionSelector')).toBeDefined();
  });

  it('o bloco não aparece no cartão do Mestre da sessão', () => {
    render(<PlayerCard user={user} character={sheet({ conditions })} viewerIsGM isSessionGM />);
    expect(document.querySelector('[data-stub="ConditionBadge"]')).toBeNull();
  });

  it('a duração nula vira indefinida', () => {
    render(
      <PlayerCard
        user={user}
        character={sheet({ conditions: [{ conditionId: 'sangrando', duration: null }] })}
      />,
    );
    expect(stubProps('ConditionBadge', 'sangrando')!.duration).toBeUndefined();
  });

  it('adicionar: troca a Condição igual, atualiza a tela e grava', async () => {
    render(
      <PlayerCard
        user={user}
        character={sheet({ conditions: [{ conditionId: 'sangrando', duration: 1 }] })}
        viewerIsGM
        onUpdateConditions={onUpdateConditions}
      />,
    );
    await call(stubProps('ConditionSelector')!.onAddCondition, 'sangrando', 3);
    expect(onUpdateConditions).toHaveBeenCalledWith('c1', [
      { conditionId: 'sangrando', duration: 3 },
    ]);
    expect(h.applyConditionToCharacter).toHaveBeenCalledWith(
      'c1',
      [{ conditionId: 'sangrando', duration: 1 }],
      { conditionId: 'sangrando', duration: 3 },
    );
  });

  it('adicionar com duração 0 vale sem duração', async () => {
    render(
      <PlayerCard
        user={user}
        character={sheet()}
        viewerIsGM
        onUpdateConditions={onUpdateConditions}
      />,
    );
    await call(stubProps('ConditionSelector')!.onAddCondition, 'atordoado', 0);
    expect(onUpdateConditions).toHaveBeenCalledWith('c1', [
      { conditionId: 'atordoado', duration: null },
    ]);
  });

  it('remover: tira da tela e grava', async () => {
    const both = [
      { conditionId: 'sangrando', duration: 2 },
      { conditionId: 'atordoado', duration: 1 },
    ];
    render(
      <PlayerCard
        user={user}
        character={sheet({ conditions: both })}
        viewerIsGM
        onUpdateConditions={onUpdateConditions}
      />,
    );
    await call(stubProps('ConditionBadge', 'sangrando')!.onRemove, 'sangrando');
    expect(onUpdateConditions).toHaveBeenCalledWith('c1', [
      { conditionId: 'atordoado', duration: 1 },
    ]);
    expect(h.removeConditionFromCharacter).toHaveBeenCalledWith('c1', both, 'sangrando');
  });

  it('sem onUpdateConditions, ainda grava', async () => {
    render(<PlayerCard user={user} character={sheet()} viewerIsGM />);
    await call(stubProps('ConditionSelector')!.onAddCondition, 'sangrando', 2);
    expect(h.applyConditionToCharacter).toHaveBeenCalledTimes(1);
  });
});
