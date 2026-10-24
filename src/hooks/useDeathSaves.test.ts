// Fixa o que cada ação de morte grava na ficha: contadores, estável e morto, via data-access.
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = vi.hoisted(() => ({
  updateCharacterDeathState: vi.fn(),
  reviveWithHp: vi.fn(),
  markDead: vi.fn(),
}));

vi.mock('@/data-access/characters', () => ({
  updateCharacterDeathState: data.updateCharacterDeathState,
}));
vi.mock('@/data-access/vitals', () => ({
  characterVitalsService: { reviveWithHp: data.reviveWithHp, markDead: data.markDead },
}));

import { useDeathSaves } from './useDeathSaves';

const hook = () => renderHook(() => useDeathSaves()).result.current;

beforeEach(() => {
  data.updateCharacterDeathState.mockReset().mockResolvedValue(undefined);
  data.reviveWithHp.mockReset().mockResolvedValue({});
  data.markDead.mockReset().mockResolvedValue({});
});

describe('useDeathSaves', () => {
  it('addSuccess soma um sucesso e fica estável no terceiro', async () => {
    await expect(hook().addSuccess('c1', 1)).resolves.toEqual({
      newSuccesses: 2,
      isStable: false,
    });
    expect(data.updateCharacterDeathState).toHaveBeenLastCalledWith('c1', {
      death_saves_successes: 2,
      is_stable: false,
    });

    await expect(hook().addSuccess('c1', 2)).resolves.toEqual({ newSuccesses: 3, isStable: true });
    expect(data.updateCharacterDeathState).toHaveBeenLastCalledWith('c1', {
      death_saves_successes: 3,
      is_stable: true,
    });
  });

  it('addFailure soma falhas (uma por padrão)', async () => {
    await expect(hook().addFailure('c1', 0)).resolves.toEqual({ newFailures: 1, isDead: false });
    expect(data.updateCharacterDeathState).toHaveBeenLastCalledWith('c1', {
      death_saves_failures: 1,
      is_dead: false,
    });
    expect(data.markDead).not.toHaveBeenCalled();
  });

  it('addFailure morre no terceiro: grava is_dead e o rótulo Morto juntos', async () => {
    await expect(hook().addFailure('c1', 1, 2)).resolves.toEqual({ newFailures: 3, isDead: true });
    expect(data.markDead).toHaveBeenCalledWith('c1', { death_saves_failures: 3 });
    expect(data.updateCharacterDeathState).not.toHaveBeenCalled();
  });

  it('stabilize deixa estável com três sucessos', async () => {
    await hook().stabilize('c1');
    expect(data.updateCharacterDeathState).toHaveBeenCalledWith('c1', {
      is_stable: true,
      death_saves_successes: 3,
    });
  });

  it('killInstant mata com três falhas e o rótulo Morto', async () => {
    await hook().killInstant('c1');
    expect(data.markDead).toHaveBeenCalledWith('c1', { death_saves_failures: 3 });
    expect(data.updateCharacterDeathState).not.toHaveBeenCalled();
  });

  it('healAndAwake revive com 1 PV por padrão e zera os testes de morte', async () => {
    await hook().healAndAwake('c1', 'p1');
    expect(data.reviveWithHp).toHaveBeenCalledWith(
      'c1',
      1,
      { death_saves_successes: 0, death_saves_failures: 0, is_stable: false },
      'p1',
    );

    await hook().healAndAwake('c1', undefined, 4);
    expect(data.reviveWithHp).toHaveBeenLastCalledWith('c1', 4, expect.any(Object), undefined);
  });

  it('o erro de gravar chega a quem chamou', async () => {
    data.updateCharacterDeathState.mockRejectedValue({ message: 'falhou' });
    await expect(hook().stabilize('c1')).rejects.toEqual({ message: 'falhou' });
  });
});
