// CARACTERIZAÇÃO: fixa o que o último passo da criação grava. Criar manda o rascunho inteiro; editar
// manda tudo menos o equipamento e as moedas (a loja não é regravada na edição).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  saveCharacter: vi.fn(),
  updateCharacter: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/data-access/characters', () => ({
  saveCharacter: mocks.saveCharacter,
  updateCharacter: mocks.updateCharacter,
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));

import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import type { DraftCharacter } from '../../types';
import { Summary } from './Summary';

const draft: DraftCharacter = {
  name: 'Calebe',
  tribe: 'Judá',
  vocation: 'Guerreiro',
  fortress: 'Coragem',
  temptation: 'Ira',
  coins: 5,
  equipment: [{ id: 'espada', name: 'Espada', type: 'Arma' }],
  stats: { pv: 12, ca: 12, faith: 50 },
  attributes: { for: 15, des: 14, con: 13, int: 12, sab: 10, car: 8 },
};

const start = (editingId?: string) => {
  useCharacterCreationStore.setState({ draft, editingId, currentStep: 9 });
  return render(<Summary />);
};
const confirm = () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar e Salvar' }));

beforeEach(() => {
  mocks.saveCharacter.mockReset().mockResolvedValue(undefined);
  mocks.updateCharacter.mockReset().mockResolvedValue(undefined);
  mocks.navigate.mockReset();
  useCharacterCreationStore.getState().reset();
});
afterEach(cleanup);

describe('Summary', () => {
  it('mostra o resumo do rascunho', () => {
    start();
    expect(screen.getByText('Calebe')).toBeInTheDocument();
    expect(screen.getByText(/Judá/)).toBeInTheDocument();
    expect(screen.getByText('FOR: 15')).toBeInTheDocument();
    expect(screen.getByText('CAR: 8')).toBeInTheDocument();
  });

  it('personagem novo: grava o rascunho inteiro e vai para a lista', async () => {
    start();
    confirm();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/characters'));
    expect(mocks.saveCharacter).toHaveBeenCalledWith(draft);
    expect(mocks.updateCharacter).not.toHaveBeenCalled();
  });

  it('edição: atualiza sem o equipamento e sem as moedas', async () => {
    start('c1');
    confirm();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/characters'));
    const [id, payload] = mocks.updateCharacter.mock.calls[0];
    expect(id).toBe('c1');
    expect(payload).toStrictEqual({
      name: 'Calebe',
      tribe: 'Judá',
      vocation: 'Guerreiro',
      fortress: 'Coragem',
      temptation: 'Ira',
      stats: draft.stats,
      attributes: draft.attributes,
    });
    expect(mocks.saveCharacter).not.toHaveBeenCalled();
  });

  it('erro ao salvar mostra a mensagem do erro e não navega', async () => {
    mocks.saveCharacter.mockRejectedValue(new Error('RLS negou'));
    start();
    confirm();
    expect(await screen.findByText('RLS negou')).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirmar e Salvar' })).toBeEnabled();
  });

  it('erro sem texto mostra a mensagem padrão', async () => {
    mocks.saveCharacter.mockRejectedValue({});
    start();
    confirm();
    expect(await screen.findByText('Erro ao salvar personagem.')).toBeInTheDocument();
  });

  it('enquanto salva, os dois botões ficam desligados', async () => {
    let finish: () => void = () => {};
    mocks.saveCharacter.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    start();
    confirm();
    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Voltar e Editar' })).toBeDisabled();
    finish();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
  });
});
