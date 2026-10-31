// O fundo do mapa enviado: a imagem é lida à parte, por id, e guardada em cache sem expirar.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionMap } from '@/data-access/maps';

const api = vi.hoisted(() => ({ getMasterMapImage: vi.fn() }));
vi.mock('@/data-access/masterMaps', () => api);

import { MapaDoPalco } from './MapaDoPalco';

const map: SessionMap = {
  id: 'sm1',
  session_id: 's1',
  library_id: null,
  master_map_id: 'mm1',
  name: 'Cerco de Jericó',
  columns: 20,
  rows: 15,
  grid_visible: true,
  ambient: null,
  position: 0,
  created_at: '2026-11-01T00:00:00Z',
};

function renderWith(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MapaDoPalco map={map} />
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  api.getMasterMapImage.mockReset();
});
afterEach(cleanup);

describe('MapaDoPalco com a imagem de um mapa do Mestre', () => {
  it('mostra o fundo escuro enquanto a imagem não chega, e depois a imagem', async () => {
    let resolve: (image: string) => void = () => {};
    api.getMasterMapImage.mockReturnValue(new Promise<string>((r) => (resolve = r)));
    renderWith();
    expect(screen.getByTestId('fundo-do-mapa')).toHaveAttribute('data-status', 'loading');
    resolve('data:image/webp;base64,AAAA');
    await waitFor(() =>
      expect(screen.getByTestId('fundo-do-mapa')).toHaveAttribute('data-status', 'ready'),
    );
    expect(screen.getByTestId('fundo-do-mapa').querySelector('image')).toHaveAttribute(
      'href',
      'data:image/webp;base64,AAAA',
    );
  });

  it('lê a imagem pelo id do mapa do Mestre, uma vez só, mesmo ao desenhar de novo', async () => {
    api.getMasterMapImage.mockResolvedValue('data:image/webp;base64,AAAA');
    const { client, rerender } = renderWith();
    await waitFor(() => expect(api.getMasterMapImage).toHaveBeenCalledWith('mm1'));
    rerender(
      <QueryClientProvider client={client}>
        <MapaDoPalco map={{ ...map, name: 'Renomeado' }} />
      </QueryClientProvider>,
    );
    expect(api.getMasterMapImage).toHaveBeenCalledTimes(1);
  });

  it('avisa quando a imagem não carrega, sem derrubar o mapa', async () => {
    api.getMasterMapImage.mockRejectedValue(new Error('falhou'));
    renderWith();
    await waitFor(() =>
      expect(screen.getByTestId('fundo-do-mapa')).toHaveAttribute('data-status', 'error'),
    );
    expect(screen.getByText('Não foi possível carregar a imagem do mapa.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Mapa: Cerco de Jericó' })).toBeInTheDocument();
  });

  it('o grid vai por cima da imagem, e a medida é a mesma do terreno liso', async () => {
    api.getMasterMapImage.mockResolvedValue('data:image/webp;base64,AAAA');
    renderWith();
    const grid = screen.getByTestId('grid-do-mapa');
    expect(grid.getAttribute('data-vertical')).toBe('19');
    expect(grid.getAttribute('data-horizontal')).toBe('14');
  });
});
