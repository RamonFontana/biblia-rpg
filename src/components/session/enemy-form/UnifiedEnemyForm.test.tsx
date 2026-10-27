import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { findEnemyAbility } from '@/content/enemyAbilities';
import { MOCK_BESTIARY } from './bestiaryPresets';
import { UnifiedEnemyForm } from './UnifiedEnemyForm';

afterEach(cleanup);

const setup = (initialValues?: Parameters<typeof UnifiedEnemyForm>[0]['initialValues']) => {
  const onSubmit = vi.fn();
  render(<UnifiedEnemyForm onSubmit={onSubmit} initialValues={initialValues} />);
  fireEvent.change(screen.getByPlaceholderText('Ex: Lobo Selvagem'), {
    target: { value: 'Anakim' },
  });
  return onSubmit;
};
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar Inimigo' }));
const submitted = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls[0][0];

describe('UnifiedEnemyForm: Habilidades com efeito', () => {
  it('a biblioteca do bestiário adiciona a Habilidade com a referência e mostra o efeito', async () => {
    const onSubmit = setup();
    fireEvent.change(screen.getByLabelText('Adicionar da biblioteca'), {
      target: { value: 'enemy-presenca-aterradora' },
    });
    expect(screen.getByDisplayValue('Presença Aterradora')).toBeInTheDocument();
    expect(
      screen.getByText(/TR de Sabedoria CD 13 · Amedrontado \(10 rodadas\)/),
    ).toBeInTheDocument();
    save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).skills).toEqual([
      expect.objectContaining({
        name: 'Presença Aterradora',
        libraryId: 'enemy-presenca-aterradora',
      }),
    ]);
  });

  it('uma Habilidade personalizada leva o efeito montado no editor', async () => {
    const onSubmit = setup();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar$/ }));
    fireEvent.change(screen.getByPlaceholderText('Nome da habilidade'), {
      target: { value: 'Laço' },
    });
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    fireEvent.change(screen.getByLabelText('Condição aplicada'), {
      target: { value: 'agarrado' },
    });
    save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).skills).toEqual([
      expect.objectContaining({
        name: 'Laço',
        effect: { apply: [{ conditionId: 'agarrado' }], usage: 'unlimited' },
      }),
    ]);
  });

  it('uma Habilidade só com texto continua sem efeito', async () => {
    const onSubmit = setup();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar$/ }));
    fireEvent.change(screen.getByPlaceholderText('Nome da habilidade'), {
      target: { value: 'Comando' },
    });
    save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [skill] = submitted(onSubmit).skills;
    expect(skill.libraryId).toBeUndefined();
    expect(skill.effect).toBeUndefined();
  });

  it('o preset do Leão da Judeia traz o Salto e Bote da biblioteca', () => {
    const lion = MOCK_BESTIARY.find((b) => b.id === 'leao-judeia');
    expect(lion?.skills.map((skill) => skill.libraryId)).toEqual(['enemy-salto-e-bote']);
    expect(findEnemyAbility('enemy-salto-e-bote')).toBeDefined();
  });
});
