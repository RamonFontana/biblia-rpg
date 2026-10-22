// CARACTERIZAÇÃO: o Mestre dá itens do catálogo a um NPC e ajusta a quantidade ou remove o que ele
// tem. Decisões: ROADMAP.md, Onda 4, passo 7d. Termos: CONTEXT.md (Inventário).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  listCatalogItems: vi.fn(),
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  isUpdating: false,
}));

vi.mock('@/data-access/inventory', () => ({ listCatalogItems: h.listCatalogItems }));
vi.mock('@/hooks/useUpdateNPCInventory', () => ({
  useUpdateNPCInventory: () => ({
    addItem: h.addItem,
    updateQuantity: h.updateQuantity,
    removeItem: h.removeItem,
    isUpdating: h.isUpdating,
  }),
}));

import type { InventoryItem } from '@/types/inventory';
import { NPCInventoryManager } from './NPCInventoryManager';

const owned = (id: string, name: string, quantity: number): InventoryItem => ({
  id,
  quantity,
  level: 1,
  items: { name },
});

beforeEach(() => {
  h.isUpdating = false;
  h.listCatalogItems.mockResolvedValue([
    { id: 'i1', name: 'Adaga', category: 'Arma' },
    { id: 'i2', name: 'Corda', category: 'Utilidade' },
  ]);
  h.addItem.mockResolvedValue({ success: true });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const renderManager = (items: InventoryItem[] = []) =>
  render(<NPCInventoryManager characterId="npc-1" items={items} />);

describe('NPCInventoryManager: catálogo', () => {
  it('lista os itens do catálogo com a categoria', async () => {
    renderManager();
    expect(await screen.findByRole('option', { name: 'Adaga (Arma)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Corda (Utilidade)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '-- Selecione um item --' })).toBeInTheDocument();
  });

  it('registra a falha de carregar o catálogo e deixa só a opção vazia', async () => {
    h.listCatalogItems.mockRejectedValue(new Error('sem rede'));
    renderManager();
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching available items:',
        expect.any(Error),
      ),
    );
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('só pode adicionar com um item escolhido', async () => {
    renderManager();
    await screen.findByRole('option', { name: 'Adaga (Arma)' });
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'i2' } });
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeEnabled();
  });

  it('adiciona o item com a quantidade e limpa o formulário', async () => {
    renderManager();
    await screen.findByRole('option', { name: 'Adaga (Arma)' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'i1' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(h.addItem).toHaveBeenCalledWith('npc-1', 'i1', 3));
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue(''));
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });

  it('trava o Adicionar enquanto uma operação roda', async () => {
    h.isUpdating = true;
    renderManager();
    await screen.findByRole('option', { name: 'Adaga (Arma)' });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'i1' } });
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });
});

describe('NPCInventoryManager: itens do NPC', () => {
  const buttonsOf = (name: string) => {
    const row = screen.getByText(name).closest('div.justify-between') as HTMLElement;
    const [minus, plus, remove] = Array.from(row.querySelectorAll('button'));
    return { minus, plus, remove, row };
  };

  it('mostra o nome e a quantidade de cada item', () => {
    renderManager([owned('ci-1', 'Adaga', 2), owned('ci-2', 'Corda', 1)]);
    expect(buttonsOf('Adaga').row).toHaveTextContent('2');
    expect(buttonsOf('Corda').row).toHaveTextContent('1');
  });

  it('+ e − mudam a quantidade em uma unidade', () => {
    renderManager([owned('ci-1', 'Adaga', 2)]);
    const { minus, plus } = buttonsOf('Adaga');
    fireEvent.click(plus);
    expect(h.updateQuantity).toHaveBeenLastCalledWith('ci-1', 3);
    fireEvent.click(minus);
    expect(h.updateQuantity).toHaveBeenLastCalledWith('ci-1', 1);
  });

  it('a lixeira remove o item', () => {
    renderManager([owned('ci-1', 'Adaga', 2)]);
    fireEvent.click(buttonsOf('Adaga').remove);
    expect(h.removeItem).toHaveBeenCalledWith('ci-1');
  });

  it('trava os botões do item enquanto uma operação roda', () => {
    h.isUpdating = true;
    renderManager([owned('ci-1', 'Adaga', 2)]);
    const { minus, plus, remove } = buttonsOf('Adaga');
    expect(minus).toBeDisabled();
    expect(plus).toBeDisabled();
    expect(remove).toBeDisabled();
  });
});
