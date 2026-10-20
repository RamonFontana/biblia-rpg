// CARACTERIZAÇÃO: o passo "Seus Atributos Derivados". A conta está em domain/initialStats; aqui, que
// a tela mostra o resultado, o grava no rascunho e deixa o Levita com o bônus de Fé.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import type { DraftCharacter } from '../../types';
import { InitialStats } from './InitialStats';

const attributes = { for: 10, des: 14, con: 14, int: 10, sab: 10, car: 10 };

const start = (seed: { draft: DraftCharacter }) => {
  useCharacterCreationStore.setState(seed);
  return render(<InitialStats />);
};

beforeEach(() => {
  useCharacterCreationStore.getState().reset();
  useCharacterCreationStore.setState({ currentStep: 5 });
});
afterEach(cleanup);

describe('InitialStats', () => {
  it('mostra PV, CA e Fé e os grava no rascunho', () => {
    start({ draft: { vocation: 'Guerreiro', tribe: 'Judá', attributes } });
    // Guerreiro: 10 + Mod. CON 2; CA 10 + Mod. DES 2; Fé padrão 50.
    expect(screen.getByText('Base 10 + Mod. CON (2)')).toBeInTheDocument();
    expect(screen.getByText('10 + Mod. DES (2)')).toBeInTheDocument();
    expect(screen.getByText('Padrão (50)')).toBeInTheDocument();
    expect(useCharacterCreationStore.getState().draft.stats).toEqual({ pv: 12, ca: 12, faith: 50 });
  });

  it('vocação de dado menor usa base 8', () => {
    start({ draft: { vocation: 'Batedor', tribe: 'Judá', attributes } });
    expect(screen.getByText('Base 8 + Mod. CON (2)')).toBeInTheDocument();
    expect(useCharacterCreationStore.getState().draft.stats?.pv).toBe(10);
  });

  it('a tribo de Levi mostra o bônus de Fé', () => {
    start({ draft: { vocation: 'Sacerdote', tribe: 'Levi', attributes } });
    expect(screen.getByText('Bônus de Levi (+10)')).toBeInTheDocument();
    expect(useCharacterCreationStore.getState().draft.stats?.faith).toBe(60);
  });

  it('Avançar e Voltar andam um passo', () => {
    start({ draft: { vocation: 'Guerreiro', tribe: 'Judá', attributes } });
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    expect(useCharacterCreationStore.getState().currentStep).toBe(6);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(useCharacterCreationStore.getState().currentStep).toBe(5);
  });
});
