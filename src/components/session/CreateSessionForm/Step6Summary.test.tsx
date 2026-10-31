// CARACTERIZAÇÃO: o último passo da preparação da sessão: o resumo do rascunho, o envio e o erro.
// Decisões: ROADMAP.md, Onda 4, passo 7e. Termos: CONTEXT.md (Sessão).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const h = vi.hoisted(() => ({ createGameSession: vi.fn() }));

vi.mock('@/services/sessionService', () => ({ createGameSession: h.createGameSession }));

import { useSessionDraftStore } from '@/store/createSessionStore';
import { Step6Summary } from './Step6Summary';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

const renderStep = () =>
  render(
    <MemoryRouter initialEntries={['/sessions/new']}>
      <Where />
      <Routes>
        <Route path="/sessions/new" element={<Step6Summary />} />
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>,
  );

const start = () => fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sessão' }));

beforeEach(() => {
  useSessionDraftStore.getState().resetStore();
  useSessionDraftStore.getState().setPreparation('Noite em Betel', 'Uma emboscada');
  useSessionDraftStore.getState().setParticipantCharacterIds(['c1', 'c2']);
  h.createGameSession.mockResolvedValue('sess-9');
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Step6Summary', () => {
  it('resume o nome, a descrição e o que faltou adicionar', () => {
    renderStep();
    expect(screen.getByText('Noite em Betel')).toBeInTheDocument();
    expect(screen.getByText('Uma emboscada')).toBeInTheDocument();
    expect(screen.getByText('Nenhum inimigo adicionado.')).toBeInTheDocument();
    expect(screen.getByText('Nenhum NPC adicionado.')).toBeInTheDocument();
  });

  it('lista os mapas escolhidos e os envia com o rascunho', async () => {
    useSessionDraftStore
      .getState()
      .addMap({ id: 't1', libraryId: 'terreno-areia', name: 'Deserto', columns: 20, rows: 15 });
    renderStep();
    expect(screen.getByRole('heading', { name: 'Mapas (1)' })).toBeInTheDocument();
    expect(screen.getByText('Deserto (20×15 Quadrados)')).toBeInTheDocument();
    start();
    await waitFor(() => expect(h.createGameSession).toHaveBeenCalled());
    expect(h.createGameSession.mock.calls[0]?.[0].maps).toEqual([
      { id: 't1', libraryId: 'terreno-areia', name: 'Deserto', columns: 20, rows: 15 },
    ]);
  });

  it('sem mapas, o resumo diz que nenhum foi escolhido', () => {
    renderStep();
    expect(screen.getByRole('heading', { name: 'Mapas (0)' })).toBeInTheDocument();
    expect(screen.getByText('Nenhum mapa escolhido.')).toBeInTheDocument();
  });

  it('sem descrição, diz "Sem descrição"', () => {
    useSessionDraftStore.getState().setPreparation('Sem texto', '');
    renderStep();
    expect(screen.getByText('Sem descrição')).toBeInTheDocument();
  });

  it('cria a sessão com o rascunho, limpa o rascunho e abre a mesa', async () => {
    renderStep();
    start();
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/session/sess-9'));
    expect(h.createGameSession).toHaveBeenCalledWith({
      session_name: 'Noite em Betel',
      session_description: 'Uma emboscada',
      enemies: [],
      npcs: [],
      maps: [],
      participant_character_ids: ['c1', 'c2'],
    });
    expect(useSessionDraftStore.getState().name).toBe('');
  });

  it('mostra a mensagem do erro e deixa tentar de novo', async () => {
    h.createGameSession.mockRejectedValueOnce(new Error('sem rede'));
    renderStep();
    start();
    expect(await screen.findByText('sem rede')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/sessions/new');
    expect(useSessionDraftStore.getState().name).toBe('Noite em Betel');
  });

  it('usa a mensagem padrão quando o erro não traz texto', async () => {
    h.createGameSession.mockRejectedValueOnce({});
    renderStep();
    start();
    expect(await screen.findByText('Ocorreu um erro ao criar a sessão.')).toBeInTheDocument();
  });
});
