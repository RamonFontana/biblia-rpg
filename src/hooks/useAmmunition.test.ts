// Fixa a ligação do hook de munição: usa as operações do inventário e o sorteio do app.
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const inventory = vi.hoisted(() => ({
  consumeAmmo: vi.fn(),
  recoverAmmo: vi.fn(),
  addAmmoCharges: vi.fn(),
}));

vi.mock('@/data-access/inventory', () => inventory);

import { systemRng } from '@/lib/systemRng';
import { useAmmunition } from './useAmmunition';

describe('useAmmunition', () => {
  it('consume e addCharges repassam direto para o inventário', () => {
    const { result } = renderHook(() => useAmmunition());
    expect(result.current.consume).toBe(inventory.consumeAmmo);
    expect(result.current.addCharges).toBe(inventory.addAmmoCharges);
  });

  it('recover passa o sorteio do app ao inventário', async () => {
    inventory.recoverAmmo.mockResolvedValue(2);
    const { result } = renderHook(() => useAmmunition());
    await expect(result.current.recover('ci1', 4, 20)).resolves.toBe(2);
    expect(inventory.recoverAmmo).toHaveBeenCalledWith('ci1', 4, 20, systemRng);
  });
});
