// O passo opcional "Mapas" da preparação da sessão: o Mestre escolhe os terrenos que vai usar.
// Termos: CONTEXT.md (Mapa, Biblioteca de mapas).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useSessionDraftStore } from '@/store/createSessionStore';
import { StepMaps } from './StepMaps';

beforeEach(() => {
  useSessionDraftStore.getState().resetStore();
  useSessionDraftStore.getState().setCurrentStep(5);
});
afterEach(cleanup);

const maps = () => useSessionDraftStore.getState().maps;

describe('StepMaps', () => {
  it('diz que o passo é opcional e que dá para somar mapas durante o jogo', () => {
    render(<StepMaps />);
    expect(screen.getByRole('heading', { name: 'Mapas da Sessão' })).toBeInTheDocument();
    expect(screen.getByText(/opcional/i)).toBeInTheDocument();
    expect(screen.getByText('Nenhum mapa escolhido.')).toBeInTheDocument();
  });

  it('soma um terreno da Biblioteca ao rascunho, com nome e tamanho', () => {
    render(<StepMaps />);
    fireEvent.change(screen.getByLabelText('Terreno'), { target: { value: 'terreno-pedra' } });
    fireEvent.change(screen.getByLabelText('Nome do mapa'), { target: { value: 'Muralha' } });
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Somar terreno' }));
    expect(maps()).toEqual([
      expect.objectContaining({
        libraryId: 'terreno-pedra',
        name: 'Muralha',
        columns: 30,
        rows: 8,
      }),
    ]);
    expect(screen.getByText('Muralha')).toBeInTheDocument();
    expect(screen.getByText('30×8 Quadrados')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum mapa escolhido.')).not.toBeInTheDocument();
  });

  it('prende o tamanho entre 5 e 60 Quadrados por lado', () => {
    render(<StepMaps />);
    fireEvent.change(screen.getByLabelText('Colunas'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('Linhas'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Somar terreno' }));
    expect(maps()[0]).toMatchObject({ columns: 60, rows: 5 });
  });

  it('remove um mapa do rascunho', () => {
    render(<StepMaps />);
    fireEvent.click(screen.getByRole('button', { name: 'Somar terreno' }));
    fireEvent.click(screen.getByRole('button', { name: 'Somar terreno' }));
    expect(maps()).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: /^Remover/ })[0]!);
    expect(maps()).toHaveLength(1);
  });

  it('pode seguir ao resumo sem escolher nenhum mapa', () => {
    render(<StepMaps />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo: Resumo' }));
    expect(useSessionDraftStore.getState().currentStep).toBe(6);
    expect(maps()).toEqual([]);
  });

  it('Voltar leva aos jogadores', () => {
    render(<StepMaps />);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(useSessionDraftStore.getState().currentStep).toBe(4);
  });
});
