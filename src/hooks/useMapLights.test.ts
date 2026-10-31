import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LightRow } from '@/lib/mapScene';

const api = vi.hoisted(() => ({
  listMapLights: vi.fn(),
  addMapLight: vi.fn(),
  updateMapLight: vi.fn(),
  removeMapLight: vi.fn(),
  subscribeToMapLights: vi.fn(),
}));
vi.mock('@/data-access/mapLights', () => api);

import { useMapLights } from './useMapLights';

const light = (over: Partial<LightRow> = {}): LightRow => ({
  id: 'l1',
  map_id: 'm1',
  col: 2,
  row: 3,
  bright_m: 6,
  dim_m: 6,
  label: 'Fogueira',
  ...over,
});

let emit: (payload: unknown) => void;

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.listMapLights.mockResolvedValue([light()]);
  api.addMapLight.mockResolvedValue(undefined);
  api.updateMapLight.mockResolvedValue(undefined);
  api.removeMapLight.mockResolvedValue(undefined);
  api.subscribeToMapLights.mockImplementation((_id, onChange) => {
    emit = onChange;
    return () => {};
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useMapLights', () => {
  it('lê as luzes do mapa', async () => {
    const { result } = renderHook(() => useMapLights('m1'));
    await waitFor(() => expect(result.current.lights).toEqual([light()]));
  });

  it('sem mapa não há luzes e nada é lido', () => {
    const { result } = renderHook(() => useMapLights(undefined));
    expect(result.current.lights).toEqual([]);
    expect(api.listMapLights).not.toHaveBeenCalled();
  });

  it('segue o tempo real: nova, mudada e removida', async () => {
    const { result } = renderHook(() => useMapLights('m1'));
    await waitFor(() => expect(result.current.lights).toHaveLength(1));
    act(() => emit({ eventType: 'INSERT', new: light({ id: 'l2', col: 9 }) }));
    expect(result.current.lights.map((l) => l.id).sort()).toEqual(['l1', 'l2']);
    act(() => emit({ eventType: 'UPDATE', new: light({ id: 'l1', col: 7 }) }));
    expect(result.current.lights.find((l) => l.id === 'l1')?.col).toBe(7);
    act(() => emit({ eventType: 'DELETE', old: { id: 'l2' } }));
    expect(result.current.lights.map((l) => l.id)).toEqual(['l1']);
  });

  it('somar uma luz grava no mapa', async () => {
    const { result } = renderHook(() => useMapLights('m1'));
    await waitFor(() => expect(result.current.lights).toHaveLength(1));
    await act(async () => {
      await result.current.add({ col: 4, row: 4, brightM: 3, dimM: 3, label: 'Braseiro' });
    });
    expect(api.addMapLight).toHaveBeenCalledWith({
      mapId: 'm1',
      col: 4,
      row: 4,
      brightM: 3,
      dimM: 3,
      label: 'Braseiro',
    });
  });

  it('mudar mostra o resultado na hora e grava', async () => {
    const { result } = renderHook(() => useMapLights('m1'));
    await waitFor(() => expect(result.current.lights).toHaveLength(1));
    await act(async () => {
      await result.current.change('l1', { col: 8, row: 1, brightM: 1.5 });
    });
    expect(result.current.lights[0]).toMatchObject({ col: 8, row: 1, bright_m: 1.5, dim_m: 6 });
    expect(api.updateMapLight).toHaveBeenCalledWith('l1', { col: 8, row: 1, brightM: 1.5 });
  });

  it('tirar a luz some da tela na hora e apaga', async () => {
    const { result } = renderHook(() => useMapLights('m1'));
    await waitFor(() => expect(result.current.lights).toHaveLength(1));
    await act(async () => {
      await result.current.remove('l1');
    });
    expect(result.current.lights).toEqual([]);
    expect(api.removeMapLight).toHaveBeenCalledWith('l1');
  });

  it('se a gravação falha, relê o que o banco tem', async () => {
    const { result } = renderHook(() => useMapLights('m1'));
    await waitFor(() => expect(result.current.lights).toHaveLength(1));
    api.updateMapLight.mockRejectedValue(new Error('falhou'));
    await act(async () => {
      await result.current.change('l1', { col: 8 });
    });
    await waitFor(() => expect(result.current.lights[0]?.col).toBe(2));
  });
});
