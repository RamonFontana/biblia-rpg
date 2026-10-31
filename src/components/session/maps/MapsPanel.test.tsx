import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionMap } from '@/data-access/maps';

const api = vi.hoisted(() => ({
  addSessionMap: vi.fn(),
  updateSessionMap: vi.fn(),
  removeSessionMap: vi.fn(),
  showSessionMap: vi.fn(),
}));
vi.mock('@/data-access/maps', () => api);

import { MapsPanel } from './MapsPanel';

const base: SessionMap = {
  id: 'm1',
  session_id: 's1',
  library_id: 'terreno-areia',
  master_map_id: null,
  name: 'Deserto',
  columns: 20,
  rows: 15,
  grid_visible: true,
  ambient: null,
  position: 0,
  created_at: '2026-11-01T00:00:00Z',
};
const second: SessionMap = { ...base, id: 'm2', name: 'Casa', library_id: 'terreno-piso-de-casa' };

function renderPanel(props: Partial<React.ComponentProps<typeof MapsPanel>> = {}) {
  const onPrepare = vi.fn();
  render(
    <MapsPanel
      sessionId="s1"
      maps={[base, second]}
      shownMapId={null}
      preparedId={null}
      onPrepare={onPrepare}
      {...props}
    />,
  );
  return { onPrepare };
}

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset().mockResolvedValue(undefined));
});

describe('MapsPanel', () => {
  it('lista os mapas com o tamanho em Quadrados', () => {
    renderPanel();
    expect(screen.getByDisplayValue('Deserto')).toBeInTheDocument();
    expect(screen.getAllByText('20×15 Quadrados')).toHaveLength(2);
  });

  it('soma um terreno da Biblioteca com o nome e o tamanho escolhidos', async () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Terreno'), { target: { value: 'terreno-pedra' } });
    fireEvent.change(screen.getByLabelText('Nome do mapa'), { target: { value: 'Muralha' } });
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Somar terreno' }));
    expect(api.addSessionMap).toHaveBeenCalledWith({
      sessionId: 's1',
      libraryId: 'terreno-pedra',
      name: 'Muralha',
      columns: 30,
      rows: 8,
      position: 2,
    });
  });

  it('prende o tamanho do terreno entre 5 e 60 Quadrados por lado', async () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Somar terreno' }));
    expect(api.addSessionMap).toHaveBeenCalledWith(
      expect.objectContaining({ columns: 60, rows: 5 }),
    );
  });

  it('prepara um mapa só para o Mestre, sem mostrá-lo', async () => {
    const { onPrepare } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar Casa' }));
    expect(onPrepare).toHaveBeenCalledWith('m2');
    expect(api.showSessionMap).not.toHaveBeenCalled();
  });

  it('mostra o mapa aos jogadores', async () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar aos jogadores: Deserto' }));
    expect(api.showSessionMap).toHaveBeenCalledWith('s1', 'm1');
  });

  it('marca qual é o Mapa atual e qual está em preparo', () => {
    renderPanel({ shownMapId: 'm1', preparedId: 'm2' });
    const shown = screen.getByLabelText('Nome de Deserto').closest('li')!;
    const prepared = screen.getByLabelText('Nome de Casa').closest('li')!;
    expect(shown).toHaveTextContent('Mapa atual');
    expect(prepared).toHaveTextContent('Em preparo');
  });

  it('volta à cena sem mapa', async () => {
    const { onPrepare } = renderPanel({ shownMapId: 'm1', preparedId: 'm2' });
    fireEvent.click(screen.getByRole('button', { name: 'Voltar à cena' }));
    expect(api.showSessionMap).toHaveBeenCalledWith('s1', null);
    await waitFor(() => expect(onPrepare).toHaveBeenCalledWith(null));
  });

  it('não oferece voltar à cena quando nenhum mapa está à mostra', () => {
    renderPanel();
    expect(screen.queryByRole('button', { name: 'Voltar à cena' })).not.toBeInTheDocument();
  });

  it('liga e desliga as linhas do grid de um mapa', async () => {
    renderPanel();
    fireEvent.click(screen.getByLabelText('Linhas do grid de Deserto'));
    expect(api.updateSessionMap).toHaveBeenCalledWith('m1', { grid_visible: false });
  });

  it('renomeia o mapa ao sair do campo', async () => {
    renderPanel();
    const input = screen.getByLabelText('Nome de Deserto');
    fireEvent.change(input, { target: { value: 'Zim' } });
    fireEvent.blur(input);
    expect(api.updateSessionMap).toHaveBeenCalledWith('m1', { name: 'Zim' });
  });

  it('remove o mapa e desfaz o preparo dele', async () => {
    const { onPrepare } = renderPanel({ preparedId: 'm1' });
    fireEvent.click(screen.getByRole('button', { name: 'Remover Deserto' }));
    expect(api.removeSessionMap).toHaveBeenCalledWith('m1');
    await waitFor(() => expect(onPrepare).toHaveBeenCalledWith(null));
  });

  it('avisa quando uma gravação falha', async () => {
    api.showSessionMap.mockRejectedValue(new Error('falhou'));
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar aos jogadores: Deserto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível');
  });
});
