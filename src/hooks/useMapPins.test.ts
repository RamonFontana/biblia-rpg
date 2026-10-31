import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PinRow } from '@/lib/mapScene';

const api = vi.hoisted(() => ({
  listMapPins: vi.fn(),
  placePin: vi.fn(),
  removePin: vi.fn(),
  setPinLight: vi.fn(),
  subscribeToMapPins: vi.fn(),
}));
vi.mock('@/data-access/mapPins', () => api);

import { useMapPins } from './useMapPins';

const pin = (over: Partial<PinRow>): PinRow => ({
  id: 'p1',
  map_id: 'm1',
  character_id: 'c1',
  npc_id: null,
  col: 1,
  row: 1,
  ...over,
});

let emit: (payload: unknown) => void;

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.listMapPins.mockResolvedValue([pin({})]);
  api.placePin.mockResolvedValue(undefined);
  api.removePin.mockResolvedValue(undefined);
  api.setPinLight.mockResolvedValue(undefined);
  api.subscribeToMapPins.mockImplementation((_id, onChange) => {
    emit = onChange;
    return () => {};
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useMapPins', () => {
  it('lê os pins do mapa', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toEqual([pin({})]));
  });

  it('sem mapa não há pins e nada é lido', () => {
    const { result } = renderHook(() => useMapPins(undefined));
    expect(result.current.pins).toEqual([]);
    expect(api.listMapPins).not.toHaveBeenCalled();
  });

  it('segue a mudança em tempo real: novo, movido e removido', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    act(() => emit({ eventType: 'INSERT', new: pin({ id: 'p2', character_id: 'c2', col: 5 }) }));
    expect(result.current.pins.map((p) => p.id)).toEqual(['p1', 'p2']);
    act(() => emit({ eventType: 'UPDATE', new: pin({ id: 'p1', col: 9 }) }));
    expect(result.current.pins.find((p) => p.id === 'p1')?.col).toBe(9);
    act(() => emit({ eventType: 'DELETE', old: { id: 'p2' } }));
    expect(result.current.pins.map((p) => p.id)).toEqual(['p1']);
  });

  it('mover mostra o pin no novo Quadrado na hora e grava', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    await act(async () => {
      await result.current.move({ kind: 'character', id: 'c1' }, { col: 4, row: 6 });
    });
    expect(result.current.pins[0]).toMatchObject({ col: 4, row: 6 });
    expect(api.placePin).toHaveBeenCalledWith({
      mapId: 'm1',
      target: { kind: 'character', id: 'c1' },
      col: 4,
      row: 6,
    });
  });

  it('um Retrato sem pin ganha um ao ser movido, sem duplicar quando o eco chega', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    await act(async () => {
      await result.current.move({ kind: 'npc', id: 'n1' }, { col: 2, row: 2 });
    });
    expect(result.current.pins).toHaveLength(2);
    act(() =>
      emit({
        eventType: 'INSERT',
        new: pin({ id: 'real', character_id: null, npc_id: 'n1', col: 2, row: 2 }),
      }),
    );
    expect(result.current.pins.filter((p) => p.npc_id === 'n1')).toHaveLength(1);
  });

  it('mover para fora do mapa (nulo) devolve o Retrato à Bandeja', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    await act(async () => {
      await result.current.move({ kind: 'character', id: 'c1' }, null);
    });
    expect(result.current.pins).toEqual([]);
    expect(api.removePin).toHaveBeenCalledWith('m1', { kind: 'character', id: 'c1' });
  });

  it('se a gravação falha, relê o mapa e volta ao que o banco tem', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    api.placePin.mockRejectedValue(new Error('falhou'));
    await act(async () => {
      await result.current.move({ kind: 'character', id: 'c1' }, { col: 8, row: 8 });
    });
    await waitFor(() => expect(result.current.pins[0]).toMatchObject({ col: 1, row: 1 }));
  });

  it('acender a luz do pin muda a tela na hora e grava; nulo apaga', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    await act(async () => {
      await result.current.setLight({ kind: 'character', id: 'c1' }, { brightM: 6, dimM: 6 });
    });
    expect(result.current.pins[0]).toMatchObject({ light_bright_m: 6, light_dim_m: 6 });
    expect(api.setPinLight).toHaveBeenCalledWith(
      'm1',
      { kind: 'character', id: 'c1' },
      { brightM: 6, dimM: 6 },
    );
    await act(async () => {
      await result.current.setLight({ kind: 'character', id: 'c1' }, null);
    });
    expect(result.current.pins[0]).toMatchObject({ light_bright_m: null, light_dim_m: null });
  });

  it('se a luz do pin não grava, relê o que o banco tem', async () => {
    const { result } = renderHook(() => useMapPins('m1'));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    api.setPinLight.mockRejectedValue(new Error('falhou'));
    await act(async () => {
      await result.current.setLight({ kind: 'character', id: 'c1' }, { brightM: 6, dimM: 6 });
    });
    await waitFor(() => expect(result.current.pins[0]?.light_bright_m).toBeUndefined());
  });
});
