// A recarga das Habilidades do Descanso Curto: uma vez por descanso, por ficha (ADR 0006).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const data = vi.hoisted(() => ({ markShortRestRecharge: vi.fn() }));
vi.mock('@/data-access/characters', () => data);

import { ABILITIES } from '@/content/abilities';
import { useShortRestRecharge } from './useShortRestRecharge';

const shortAbility = ABILITIES.find((a) => a.usageType === 'short_rest')!.id;
const longAbility = ABILITIES.find((a) => a.usageType === 'long_rest')!.id;

const hero = (over: Record<string, unknown> = {}) => ({
  id: 'hero',
  skills: { ability_uses: { [shortAbility]: 1, [longAbility]: 1 } },
  last_short_rest_recharge: null,
  ...over,
});

beforeEach(() => {
  data.markShortRestRecharge.mockReset().mockResolvedValue(undefined);
});

describe('useShortRestRecharge', () => {
  it('com um descanso aberto, recarrega as Habilidades do Descanso Curto e grava a identidade', async () => {
    const onRecharged = vi.fn();
    renderHook(() => useShortRestRecharge('r1', [hero()], onRecharged));
    await waitFor(() => expect(data.markShortRestRecharge).toHaveBeenCalledTimes(1));
    expect(data.markShortRestRecharge).toHaveBeenCalledWith(
      'hero',
      { ability_uses: { [longAbility]: 1 } },
      'r1',
    );
    await waitFor(() =>
      expect(onRecharged).toHaveBeenCalledWith('hero', {
        skills: { ability_uses: { [longAbility]: 1 } },
        last_short_rest_recharge: 'r1',
      }),
    );
  });

  it('não recarrega duas vezes o mesmo descanso', async () => {
    const { rerender } = renderHook(({ list }) => useShortRestRecharge('r1', list, vi.fn()), {
      initialProps: { list: [hero()] },
    });
    await waitFor(() => expect(data.markShortRestRecharge).toHaveBeenCalledTimes(1));
    rerender({ list: [hero()] });
    rerender({ list: [hero()] });
    expect(data.markShortRestRecharge).toHaveBeenCalledTimes(1);
  });

  it('não recarrega a ficha que já recarregou neste descanso', () => {
    renderHook(() =>
      useShortRestRecharge('r1', [hero({ last_short_rest_recharge: 'r1' })], vi.fn()),
    );
    expect(data.markShortRestRecharge).not.toHaveBeenCalled();
  });

  it('um descanso novo recarrega de novo', async () => {
    const { rerender } = renderHook(
      ({ id }) => useShortRestRecharge(id, [hero({ last_short_rest_recharge: 'r1' })], vi.fn()),
      { initialProps: { id: 'r1' as string | null } },
    );
    expect(data.markShortRestRecharge).not.toHaveBeenCalled();
    rerender({ id: 'r2' });
    await waitFor(() => expect(data.markShortRestRecharge).toHaveBeenCalledTimes(1));
  });

  it('sem descanso aberto não recarrega nada', () => {
    renderHook(() => useShortRestRecharge(null, [hero()], vi.fn()));
    expect(data.markShortRestRecharge).not.toHaveBeenCalled();
  });

  it('recarrega cada ficha da lista (o Mestre pelos NPCs jogáveis)', async () => {
    renderHook(() =>
      useShortRestRecharge('r1', [hero({ id: 'npc-1' }), hero({ id: 'npc-2' })], vi.fn()),
    );
    await waitFor(() => expect(data.markShortRestRecharge).toHaveBeenCalledTimes(2));
  });

  it('uma ficha sem Habilidades usadas também registra o descanso', async () => {
    renderHook(() => useShortRestRecharge('r1', [hero({ skills: null })], vi.fn()));
    await waitFor(() =>
      expect(data.markShortRestRecharge).toHaveBeenCalledWith('hero', { ability_uses: {} }, 'r1'),
    );
  });

  it('se gravar falhar, tenta de novo na próxima leitura', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    data.markShortRestRecharge.mockRejectedValueOnce(new Error('falhou'));
    const { rerender } = renderHook(() => useShortRestRecharge('r1', [hero()], vi.fn()));
    await waitFor(() => expect(data.markShortRestRecharge).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    rerender();
    await waitFor(() => expect(data.markShortRestRecharge).toHaveBeenCalledTimes(2));
  });
});
