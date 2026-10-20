// CARACTERIZAÇÃO: o "Salvar" rápido dos passos da edição. Só grava com um personagem em edição, nunca
// manda equipamento nem moedas e junta o rascunho com o que o passo acabou de mudar.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ updateCharacter: vi.fn() }));
vi.mock('@/data-access/characters', () => ({ updateCharacter: mocks.updateCharacter }));

import { useCharacterCreationStore } from '../store/useCharacterCreationStore';
import { useQuickSave } from './useQuickSave';

const seed = (editingId?: string) =>
  useCharacterCreationStore.setState({
    editingId,
    draft: {
      name: 'Calebe',
      vocation: 'Guerreiro',
      coins: 5,
      equipment: [{ id: 'espada', name: 'Espada', type: 'Arma' }],
      attributes: { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 },
    },
  });

beforeEach(() => {
  vi.useFakeTimers();
  mocks.updateCharacter.mockReset().mockResolvedValue(undefined);
  useCharacterCreationStore.getState().reset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useQuickSave', () => {
  it('sem personagem em edição, não grava nada', async () => {
    seed(undefined);
    const { result } = renderHook(() => useQuickSave());
    expect(result.current.isEditing).toBe(false);
    await act(() => result.current.quickSave());
    expect(mocks.updateCharacter).not.toHaveBeenCalled();
    expect(result.current.message).toBeNull();
  });

  it('grava o rascunho sem equipamento nem moedas, com o que o passo mudou por cima', async () => {
    seed('c1');
    const { result } = renderHook(() => useQuickSave());
    expect(result.current.isEditing).toBe(true);
    const attributes = { for: 15, des: 14, con: 13, int: 12, sab: 10, car: 8 };
    await act(() => result.current.quickSave({ attributes }));
    expect(mocks.updateCharacter).toHaveBeenCalledWith('c1', {
      name: 'Calebe',
      vocation: 'Guerreiro',
      attributes,
    });
    expect(result.current.message).toBe('Salvo!');
  });

  it('o equipamento e as moedas que o passo manda também ficam de fora', async () => {
    seed('c1');
    const { result } = renderHook(() => useQuickSave());
    await act(() => result.current.quickSave({ coins: 1, equipment: [] }));
    const [, payload] = mocks.updateCharacter.mock.calls[0];
    expect(payload).not.toHaveProperty('coins');
    expect(payload).not.toHaveProperty('equipment');
  });

  it('a mensagem some depois de 3 segundos', async () => {
    seed('c1');
    const { result } = renderHook(() => useQuickSave());
    await act(() => result.current.quickSave());
    expect(result.current.message).toBe('Salvo!');
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.message).toBeNull();
  });

  it('erro ao gravar mostra "Erro ao salvar" e libera o botão', async () => {
    mocks.updateCharacter.mockRejectedValue(new Error('falhou'));
    seed('c1');
    const { result } = renderHook(() => useQuickSave());
    await act(() => result.current.quickSave());
    expect(result.current.message).toBe('Erro ao salvar');
    expect(result.current.saving).toBe(false);
  });
});
