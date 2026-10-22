// CARACTERIZAÇÃO: a lista de personagens do usuário: o carregamento, o erro, a navegação de cada
// ficha (já jogou: abre a ficha; nunca jogou: abre a edição) e o assistente de level-up. Os cartões
// e o assistente são stubs. Decisões: ROADMAP.md, Onda 4, passo 7d. Termos: CONTEXT.md (Ficha).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const h = vi.hoisted(() => ({
  getMyCharacters: vi.fn(),
  getActiveSessionCharacterIds: vi.fn(),
}));

vi.mock('@/data-access/characters', () => ({
  getMyCharacters: h.getMyCharacters,
  getActiveSessionCharacterIds: h.getActiveSessionCharacterIds,
}));
vi.mock('../components/CharacterCard', async () => ({
  CharacterCard: (await import('@/test/stubs')).makeStub('CharacterCard', (props) =>
    String((props.character as { id: string }).id),
  ),
}));
vi.mock('../components/LevelUpWizard', async () => ({
  LevelUpWizard: (await import('@/test/stubs')).makeStub('LevelUpWizard'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import type { Character } from '../types';
import { CharacterList } from './CharacterList';

const sheet = (id: string, over: Partial<Character> = {}): Character => ({
  id,
  user_id: 'u1',
  name: `Ficha ${id}`,
  has_participated_in_session: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const renderList = () =>
  render(
    <MemoryRouter initialEntries={['/characters']}>
      <Where />
      <Routes>
        <Route path="/characters" element={<CharacterList />} />
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  h.getMyCharacters.mockResolvedValue([
    sheet('a'),
    sheet('b', { has_participated_in_session: true }),
  ]);
  h.getActiveSessionCharacterIds.mockResolvedValue(new Set(['b']));
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.clearAllMocks();
});

describe('CharacterList', () => {
  it('lista um cartão por personagem e marca quem está em sessão ativa', async () => {
    renderList();
    await waitFor(() => expect(stubProps('CharacterCard', 'a')).toBeDefined());
    expect(stubProps('CharacterCard', 'a')).toMatchObject({ isInActiveSession: false });
    expect(stubProps('CharacterCard', 'b')).toMatchObject({ isInActiveSession: true });
    expect(screen.getByRole('heading', { name: 'Meus Personagens' })).toBeInTheDocument();
  });

  it('sem personagens, convida a criar o primeiro', async () => {
    h.getMyCharacters.mockResolvedValue([]);
    renderList();
    expect(await screen.findByText('Nenhum personagem')).toBeInTheDocument();
  });

  it('Novo Personagem abre a criação', async () => {
    renderList();
    (await screen.findByRole('button', { name: 'Novo Personagem' })).click();
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/create-character'));
  });

  it('quem nunca participou de uma sessão abre a edição', async () => {
    renderList();
    await waitFor(() => expect(stubProps('CharacterCard', 'a')).toBeDefined());
    act(() => (stubProps('CharacterCard', 'a')!.onClick as (c: Character) => void)(sheet('a')));
    expect(screen.getByTestId('where')).toHaveTextContent('/characters/a/edit');
  });

  it('quem já participou abre a ficha', async () => {
    renderList();
    await waitFor(() => expect(stubProps('CharacterCard', 'b')).toBeDefined());
    act(() =>
      (stubProps('CharacterCard', 'b')!.onClick as (c: Character) => void)(
        sheet('b', { has_participated_in_session: true }),
      ),
    );
    expect(screen.getByTestId('where')).toHaveTextContent('/characters/b');
    expect(screen.getByTestId('where')).not.toHaveTextContent('/edit');
  });

  it('o level-up abre o assistente com a ficha e o cancelamento o fecha', async () => {
    renderList();
    await waitFor(() => expect(stubProps('CharacterCard', 'a')).toBeDefined());
    expect(document.querySelector('[data-stub="LevelUpWizard"]')).toBeNull();

    act(() =>
      (stubProps('CharacterCard', 'a')!.onLevelUpClick as (c: Character) => void)(sheet('a')),
    );
    expect(stubProps('LevelUpWizard')).toMatchObject({ character: { id: 'a' } });

    act(() => (stubProps('LevelUpWizard')!.onCancel as () => void)());
    expect(document.querySelector('[data-stub="LevelUpWizard"]')).toBeNull();
  });

  it('mostra a mensagem do erro', async () => {
    h.getMyCharacters.mockRejectedValue(new Error('sem rede'));
    renderList();
    expect(await screen.findByText('sem rede')).toBeInTheDocument();
  });

  it('usa a mensagem padrão quando o erro não traz texto', async () => {
    h.getActiveSessionCharacterIds.mockRejectedValue({});
    renderList();
    expect(await screen.findByText('Erro ao carregar dados')).toBeInTheDocument();
  });
});
