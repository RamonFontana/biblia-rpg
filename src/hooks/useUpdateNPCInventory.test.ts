// Fixa o hook do inventário do Mestre: liga `isUpdating` durante a operação, devolve
// `{ success, error }` em vez de lançar e remove o item quando a quantidade chega a zero.
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const inventory = vi.hoisted(() => ({
  addInventoryItem: vi.fn(),
  consumeInventoryItem: vi.fn(),
  removeInventoryItem: vi.fn(),
  setInventoryQuantity: vi.fn(),
}));

vi.mock('@/data-access/inventory', () => inventory);

import { useUpdateNPCInventory } from './useUpdateNPCInventory';

beforeEach(() => {
  Object.values(inventory).forEach((fn) => fn.mockReset().mockResolvedValue(undefined));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useUpdateNPCInventory', () => {
  it('addItem soma o item ao personagem (uma unidade por padrão)', async () => {
    const { result } = renderHook(() => useUpdateNPCInventory());
    let outcome;
    await act(async () => {
      outcome = await result.current.addItem('c1', 'i1');
    });
    expect(outcome).toEqual({ success: true });
    expect(inventory.addInventoryItem).toHaveBeenCalledWith('c1', 'i1', 1);

    await act(async () => {
      await result.current.addItem('c1', 'i1', 4);
    });
    expect(inventory.addInventoryItem).toHaveBeenLastCalledWith('c1', 'i1', 4);
  });

  it('removeItem apaga a linha do inventário', async () => {
    const { result } = renderHook(() => useUpdateNPCInventory());
    await act(async () => {
      await result.current.removeItem('ci1');
    });
    expect(inventory.removeInventoryItem).toHaveBeenCalledWith('ci1');
  });

  it('updateQuantity grava a quantidade e remove o item quando ela chega a zero ou menos', async () => {
    const { result } = renderHook(() => useUpdateNPCInventory());
    await act(async () => {
      await result.current.updateQuantity('ci1', 3);
    });
    expect(inventory.setInventoryQuantity).toHaveBeenCalledWith('ci1', 3);
    expect(inventory.removeInventoryItem).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.updateQuantity('ci1', 0);
      await result.current.updateQuantity('ci2', -1);
    });
    expect(inventory.removeInventoryItem).toHaveBeenCalledWith('ci1');
    expect(inventory.removeInventoryItem).toHaveBeenCalledWith('ci2');
    expect(inventory.setInventoryQuantity).toHaveBeenCalledTimes(1);
  });

  it('consumeItem repassa os dados do consumo', async () => {
    const { result } = renderHook(() => useUpdateNPCInventory());
    const stats = { pv: 10, current_pv: 5 };
    await act(async () => {
      await result.current.consumeItem('c1', 'ci1', 2, { heal: 4 }, stats, true);
    });
    expect(inventory.consumeInventoryItem).toHaveBeenCalledWith({
      characterId: 'c1',
      characterItemId: 'ci1',
      currentQuantity: 2,
      itemEffects: { heal: 4 },
      currentStats: stats,
      isPlayable: true,
    });
  });

  it('devolve o erro em vez de lançar e registra', async () => {
    inventory.removeInventoryItem.mockRejectedValue({ message: 'sem permissão' });
    const { result } = renderHook(() => useUpdateNPCInventory());
    let outcome;
    await act(async () => {
      outcome = await result.current.removeItem('ci1');
    });
    expect(outcome).toEqual({ success: false, error: 'sem permissão' });
    expect(console.error).toHaveBeenCalledWith('Error removing item:', {
      message: 'sem permissão',
    });
  });

  it('isUpdating fica ligado só durante a operação', async () => {
    let finish: () => void = () => {};
    inventory.addInventoryItem.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useUpdateNPCInventory());
    expect(result.current.isUpdating).toBe(false);

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.addItem('c1', 'i1');
    });
    expect(result.current.isUpdating).toBe(true);

    await act(async () => {
      finish();
      await pending;
    });
    expect(result.current.isUpdating).toBe(false);
  });

  it('isUpdating também desliga quando a operação falha', async () => {
    inventory.addInventoryItem.mockRejectedValue(new Error('rede'));
    const { result } = renderHook(() => useUpdateNPCInventory());
    await act(async () => {
      await result.current.addItem('c1', 'i1');
    });
    expect(result.current.isUpdating).toBe(false);
  });
});
