// CARACTERIZAÇÃO: o menu de ações do próprio token: carrega o inventário da ficha do jogador na
// sessão, lista os itens e usa um consumível. Decisões: ROADMAP.md, Onda 4, passo 7e.
// Termos: CONTEXT.md (Inventário).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  findLatestCharacterOfUser: vi.fn(),
  consumeItemViaRpc: vi.fn(),
  getInventoryForMenu: vi.fn(),
  findParticipantCharacterId: vi.fn(),
}));

vi.mock('@/data-access/characters', () => ({
  findLatestCharacterOfUser: h.findLatestCharacterOfUser,
}));
vi.mock('@/data-access/inventory', () => ({
  consumeItemViaRpc: h.consumeItemViaRpc,
  getInventoryForMenu: h.getInventoryForMenu,
}));
vi.mock('@/data-access/sessions', () => ({
  findParticipantCharacterId: h.findParticipantCharacterId,
}));

import { TokenContextMenu } from './TokenContextMenu';

const onClose = vi.fn();
const renderMenu = () =>
  render(<TokenContextMenu userId="u1" sessionId="s1" x={10} y={20} onClose={onClose} />);

const item = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  id,
  quantity: 1,
  items: { id: `i-${id}`, name, is_consumable: true, requires_target: false },
  ...over,
});

beforeEach(() => {
  h.findParticipantCharacterId.mockResolvedValue('c1');
  h.findLatestCharacterOfUser.mockResolvedValue({ id: 'c-latest' });
  h.getInventoryForMenu.mockResolvedValue([]);
  h.consumeItemViaRpc.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('TokenContextMenu: carregar o inventário', () => {
  it('usa o personagem do jogador na sessão', async () => {
    h.getInventoryForMenu.mockResolvedValue([item('a', 'Bálsamo')]);
    renderMenu();
    expect(await screen.findByText('Bálsamo')).toBeInTheDocument();
    expect(h.findParticipantCharacterId).toHaveBeenCalledWith('s1', 'u1');
    expect(h.getInventoryForMenu).toHaveBeenCalledWith('c1');
  });

  it('sem personagem na sessão, cai para a ficha mais recente do usuário', async () => {
    h.findParticipantCharacterId.mockResolvedValue(null);
    renderMenu();
    await waitFor(() => expect(h.getInventoryForMenu).toHaveBeenCalledWith('c-latest'));
  });

  it('com a sessão vazia, vai direto para a ficha mais recente', async () => {
    render(<TokenContextMenu userId="u1" sessionId="" x={10} y={20} onClose={onClose} />);
    await waitFor(() => expect(h.getInventoryForMenu).toHaveBeenCalledWith('c-latest'));
    expect(h.findParticipantCharacterId).not.toHaveBeenCalled();
  });

  it('sem ficha nenhuma, mostra o inventário vazio', async () => {
    h.findParticipantCharacterId.mockResolvedValue(null);
    h.findLatestCharacterOfUser.mockResolvedValue(null);
    renderMenu();
    expect(await screen.findByText('Nenhum item')).toBeInTheDocument();
    expect(h.getInventoryForMenu).not.toHaveBeenCalled();
  });

  it('mostra Carregando até terminar', async () => {
    renderMenu();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Carregando...')).toBeNull());
  });

  it('registra a falha e deixa de carregar', async () => {
    h.getInventoryForMenu.mockRejectedValue(new Error('sem rede'));
    renderMenu();
    await waitFor(() => expect(screen.queryByText('Carregando...')).toBeNull());
    expect(console.error).toHaveBeenCalled();
  });
});

describe('TokenContextMenu: itens', () => {
  it('mostra a quantidade só quando passa de 1', async () => {
    h.getInventoryForMenu.mockResolvedValue([
      item('a', 'Flecha', { quantity: 5 }),
      item('b', 'Bálsamo', { quantity: 1 }),
      item('c', 'Pedra', { quantity: null }),
    ]);
    renderMenu();
    expect(await screen.findByText('x5')).toBeInTheDocument();
    expect(screen.getAllByText(/^x/)).toHaveLength(1);
  });

  it('só o consumível pode ser usado', async () => {
    h.getInventoryForMenu.mockResolvedValue([
      item('a', 'Bálsamo'),
      item('b', 'Corda', { items: { id: 'i-b', name: 'Corda', is_consumable: false } }),
    ]);
    renderMenu();
    await screen.findByText('Bálsamo');
    expect(screen.getByRole('button', { name: /Bálsamo/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Corda/ })).toBeDisabled();
  });

  it('usar o consumível chama o serviço e fecha o menu', async () => {
    h.getInventoryForMenu.mockResolvedValue([item('a', 'Bálsamo')]);
    renderMenu();
    fireEvent.click(await screen.findByRole('button', { name: /Bálsamo/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(h.consumeItemViaRpc).toHaveBeenCalledWith('a');
  });

  it('a falha ao usar é registrada e o menu fecha do mesmo jeito', async () => {
    h.consumeItemViaRpc.mockRejectedValue(new Error('falhou'));
    h.getInventoryForMenu.mockResolvedValue([item('a', 'Bálsamo')]);
    renderMenu();
    fireEvent.click(await screen.findByRole('button', { name: /Bálsamo/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(console.error).toHaveBeenCalledWith('Error using item:', expect.any(Error));
  });
});
