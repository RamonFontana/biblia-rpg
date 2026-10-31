// "Meus mapas": a lista dos mapas do Mestre, o envio (só na web), renomear e apagar. Termos:
// CONTEXT.md (Mapa, Biblioteca de mapas).
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MasterMap } from '@/data-access/masterMaps';

const api = vi.hoisted(() => ({
  listMasterMaps: vi.fn(),
  createMasterMap: vi.fn(),
  renameMasterMap: vi.fn(),
  removeMasterMap: vi.fn(),
}));
vi.mock('@/data-access/masterMaps', () => api);
vi.mock('./MapCropEditor', () => ({
  MapCropEditor: ({
    file,
    onSave,
    onCancel,
  }: {
    file: File;
    onSave: (m: unknown) => void;
    onCancel: () => void;
  }) => (
    <div role="group" aria-label="Editor de recorte">
      <p>{file.name}</p>
      <button
        type="button"
        onClick={() =>
          onSave({ name: 'Cerco', columns: 20, rows: 15, image: 'data:image/webp;base64,XX' })
        }
      >
        Salvar mapa
      </button>
      <button type="button" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  ),
}));

import { MasterMapLibrary } from './MasterMapLibrary';

const map = (id: string, name: string): MasterMap => ({
  id,
  owner_id: 'gm-1',
  name,
  columns: 20,
  rows: 15,
  grid_visible: true,
  created_at: '2026-11-01T00:00:00Z',
});

const wide = (isWide: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isWide && query.includes('min-width'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

function renderLibrary() {
  const onPick = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MasterMapLibrary ownerId="gm-1" onPick={onPick} />
    </QueryClientProvider>,
  );
  return { onPick };
}
const upload = (file: File) =>
  fireEvent.change(screen.getByLabelText('Enviar imagem de mapa'), { target: { files: [file] } });
const png = (size = 1024, type = 'image/png') => {
  const f = new File(['x'], 'jerico.png', { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  api.listMasterMaps.mockResolvedValue([
    map('mm1', 'Cerco de Jericó'),
    map('mm2', 'Casa de Raabe'),
  ]);
  api.createMasterMap.mockResolvedValue(map('mm3', 'Cerco'));
  api.renameMasterMap.mockResolvedValue(undefined);
  api.removeMasterMap.mockResolvedValue(undefined);
  wide(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('MasterMapLibrary: a lista', () => {
  it('lista os mapas do Mestre com o tamanho em Quadrados', async () => {
    renderLibrary();
    expect(await screen.findByDisplayValue('Cerco de Jericó')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Casa de Raabe')).toBeInTheDocument();
    expect(api.listMasterMaps).toHaveBeenCalledWith('gm-1');
    expect(screen.getAllByText('20×15 Quadrados')).toHaveLength(2);
  });

  it('sem mapas, diz como começar', async () => {
    api.listMasterMaps.mockResolvedValue([]);
    renderLibrary();
    expect(await screen.findByText(/Nenhum mapa seu ainda/)).toBeInTheDocument();
  });

  it('somar à sessão entrega o mapa a quem chamou', async () => {
    const { onPick } = renderLibrary();
    fireEvent.click(await screen.findByRole('button', { name: 'Somar à sessão: Casa de Raabe' }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'mm2' }));
  });

  it('avisa quando a lista não carrega', async () => {
    api.listMasterMaps.mockRejectedValue(new Error('falhou'));
    renderLibrary();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
  });
});

describe('MasterMapLibrary: enviar', () => {
  it('abre o editor com o arquivo, salva o mapa e atualiza a lista', async () => {
    renderLibrary();
    await screen.findByDisplayValue('Cerco de Jericó');
    upload(png());
    expect(screen.getByRole('group', { name: 'Editor de recorte' })).toHaveTextContent(
      'jerico.png',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar mapa' }));
    await waitFor(() =>
      expect(api.createMasterMap).toHaveBeenCalledWith({
        name: 'Cerco',
        columns: 20,
        rows: 15,
        image: 'data:image/webp;base64,XX',
      }),
    );
    await waitFor(() => expect(api.listMasterMaps).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByRole('group', { name: 'Editor de recorte' })).not.toBeInTheDocument(),
    );
  });

  it('cancelar fecha o editor sem gravar nada', async () => {
    renderLibrary();
    await screen.findByDisplayValue('Cerco de Jericó');
    upload(png());
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('group', { name: 'Editor de recorte' })).not.toBeInTheDocument();
    expect(api.createMasterMap).not.toHaveBeenCalled();
  });

  it('recusa arquivo que não é imagem, dizendo o motivo, sem abrir o editor', async () => {
    renderLibrary();
    await screen.findByDisplayValue('Cerco de Jericó');
    upload(png(1024, 'application/pdf'));
    expect(screen.getByRole('alert')).toHaveTextContent('não é uma imagem');
    expect(screen.queryByRole('group', { name: 'Editor de recorte' })).not.toBeInTheDocument();
  });

  it('recusa arquivo acima de 20 MB, dizendo o motivo', async () => {
    renderLibrary();
    await screen.findByDisplayValue('Cerco de Jericó');
    upload(png(20 * 1024 * 1024 + 1));
    expect(screen.getByRole('alert')).toHaveTextContent('20 MB');
    expect(screen.queryByRole('group', { name: 'Editor de recorte' })).not.toBeInTheDocument();
  });

  it('no celular, envio e recorte aparecem como "na web", e a lista continua valendo', async () => {
    wide(false);
    const { onPick } = renderLibrary();
    expect(await screen.findByText(/só na web/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Enviar imagem de mapa')).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Somar à sessão: Cerco de Jericó' }));
    expect(onPick).toHaveBeenCalled();
  });
});

describe('MasterMapLibrary: renomear e apagar', () => {
  it('renomeia ao sair do campo', async () => {
    renderLibrary();
    const input = await screen.findByLabelText('Renomear meu mapa Cerco de Jericó');
    fireEvent.change(input, { target: { value: 'Jericó' } });
    fireEvent.blur(input);
    expect(api.renameMasterMap).toHaveBeenCalledWith('mm1', 'Jericó');
  });

  it('apagar pede confirmação e depois apaga e atualiza a lista', async () => {
    renderLibrary();
    fireEvent.click(await screen.findByRole('button', { name: 'Apagar meu mapa Casa de Raabe' }));
    expect(api.removeMasterMap).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar: apagar Casa de Raabe' }));
    await waitFor(() => expect(api.removeMasterMap).toHaveBeenCalledWith('mm2'));
    await waitFor(() => expect(api.listMasterMaps).toHaveBeenCalledTimes(2));
  });

  it('dá para desistir de apagar', async () => {
    renderLibrary();
    fireEvent.click(await screen.findByRole('button', { name: 'Apagar meu mapa Casa de Raabe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manter Casa de Raabe' }));
    expect(api.removeMasterMap).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Apagar meu mapa Casa de Raabe' }),
    ).toBeInTheDocument();
  });

  it('mapa usado por sessão ativa não se apaga, e o aviso diz por quê', async () => {
    api.removeMasterMap.mockRejectedValue({ code: '23503', message: 'em uso' });
    renderLibrary();
    fireEvent.click(await screen.findByRole('button', { name: 'Apagar meu mapa Casa de Raabe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar: apagar Casa de Raabe' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('em uso por uma sessão ativa');
  });
});
