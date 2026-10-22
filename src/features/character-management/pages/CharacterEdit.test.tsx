// CARACTERIZAÇÃO: a edição de uma ficha carrega a ficha no rascunho do assistente de criação (sem a
// lista de compras que não for lista) e mostra o erro de quem não carrega. O assistente é um stub.
// Decisões: ROADMAP.md, Onda 4, passo 7d. Termos: CONTEXT.md (Ficha).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const h = vi.hoisted(() => ({ getCharacterById: vi.fn() }));

vi.mock('@/data-access/characters', () => ({ getCharacterById: h.getCharacterById }));
vi.mock('../../character-creation/components/WizardLayout', async () => ({
  WizardLayout: (await import('@/test/stubs')).makeStub('WizardLayout'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import { useCharacterCreationStore } from '../../character-creation/store/useCharacterCreationStore';
import type { Character } from '../types';
import { CharacterEdit } from './CharacterEdit';

const attributes = { for: 10, des: 12, con: 14, int: 8, sab: 10, car: 9 };
const stats = { pv: 12, current_pv: 12, ca: 11, faith: 50, current_faith: 50 };

const sheet = (over: Partial<Character> = {}): Character => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Eliab',
  tribe: 'Judá',
  vocation: 'Guerreiro',
  attributes,
  stats,
  coins: 15,
  fortress: 'Coragem',
  temptation: 'Ira',
  narrative: { history: 'Pastor' },
  equipment: [],
  has_participated_in_session: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

const renderEdit = () =>
  render(
    <MemoryRouter initialEntries={['/characters/c1/edit']}>
      <Routes>
        <Route path="/characters/:id/edit" element={<CharacterEdit />} />
        <Route path="/characters" element={<p>Lista</p>} />
      </Routes>
    </MemoryRouter>,
  );

const loaded = async () => {
  renderEdit();
  await waitFor(() => expect(stubProps('WizardLayout')).toBeDefined());
  return useCharacterCreationStore.getState();
};

beforeEach(() => {
  useCharacterCreationStore.getState().reset();
  h.getCharacterById.mockResolvedValue(sheet());
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.clearAllMocks();
});

describe('CharacterEdit: carregar a ficha no rascunho', () => {
  it('copia a ficha para o rascunho e abre o assistente no passo 1', async () => {
    const state = await loaded();
    expect(h.getCharacterById).toHaveBeenCalledWith('c1');
    expect(state.editingId).toBe('c1');
    expect(state.currentStep).toBe(1);
    expect(state.draft).toEqual({
      name: 'Eliab',
      tribe: 'Judá',
      vocation: 'Guerreiro',
      coins: 15,
      equipment: [],
      attributes,
      stats,
      fortress: 'Coragem',
      temptation: 'Ira',
      narrative: { history: 'Pastor' },
    });
  });

  it('a ficha que já participou de uma sessão abre travada', async () => {
    h.getCharacterById.mockResolvedValue(sheet({ has_participated_in_session: true }));
    expect((await loaded()).isLocked).toBe(true);
  });

  it('a ficha que nunca participou abre destravada', async () => {
    expect((await loaded()).isLocked).toBe(false);
  });

  it('mantém a lista de compras quando o campo ainda é uma lista', async () => {
    const cart = [{ id: 'adaga', name: 'Adaga', type: 'arma' }];
    h.getCharacterById.mockResolvedValue(sheet({ equipment: cart }));
    expect((await loaded()).draft.equipment).toEqual(cart);
  });

  it('sem equipamento gravado, a lista é vazia', async () => {
    h.getCharacterById.mockResolvedValue(sheet({ equipment: null }));
    expect((await loaded()).draft.equipment).toEqual([]);
  });

  it('moedas, Fortaleza e Tentação ausentes viram 0 e texto vazio', async () => {
    h.getCharacterById.mockResolvedValue(
      sheet({ coins: undefined, fortress: undefined, temptation: undefined }),
    );
    const { draft } = await loaded();
    expect(draft.coins).toBe(0);
    expect(draft.fortress).toBe('');
    expect(draft.temptation).toBe('');
  });

  it('ao sair da tela, o rascunho volta ao início', async () => {
    renderEdit();
    await waitFor(() => expect(useCharacterCreationStore.getState().editingId).toBe('c1'));
    cleanup();
    expect(useCharacterCreationStore.getState().editingId).toBeUndefined();
    expect(useCharacterCreationStore.getState().draft.name).toBe('');
  });
});

describe('CharacterEdit: falhas', () => {
  it('ficha que não existe mostra o aviso e o caminho de volta', async () => {
    h.getCharacterById.mockResolvedValue(null);
    renderEdit();
    expect(await screen.findByText('Personagem não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar para a lista' })).toBeInTheDocument();
    expect(stubProps('WizardLayout')).toBeUndefined();
  });

  it('mostra a mensagem do erro ao carregar', async () => {
    h.getCharacterById.mockRejectedValue(new Error('sem rede'));
    renderEdit();
    expect(await screen.findByText('sem rede')).toBeInTheDocument();
  });

  it('usa a mensagem padrão quando o erro não traz texto', async () => {
    h.getCharacterById.mockRejectedValue({});
    renderEdit();
    expect(await screen.findByText('Erro ao carregar personagem')).toBeInTheDocument();
  });
});
