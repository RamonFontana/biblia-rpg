// O lembrete do Ataque Furtivo no cartão do inimigo (CONTEXT.md: Ataque Furtivo).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/data-access/combat', () => ({
  setEnemyFurtivoUsed: vi.fn().mockResolvedValue(undefined),
}));

import { setEnemyFurtivoUsed } from '@/data-access/combat';
import { FurtivoReminder } from './FurtivoReminder';

const props = {
  participantId: 'p1',
  skills: [{ name: 'Ataque Furtivo', description: 'x' }],
  hp: 9,
  isCurrentTurn: true,
  round: 2,
  abilityState: null as unknown,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('FurtivoReminder', () => {
  it('mostra o lembrete no turno do inimigo e grava a rodada no "usei"', async () => {
    render(<FurtivoReminder {...props} />);
    expect(screen.getByText(/\+1d6 disponível/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'usei' }));
    await waitFor(() => expect(setEnemyFurtivoUsed).toHaveBeenCalledWith('p1', 2));
  });

  it('trava o botão depois do uso e libera na rodada seguinte', () => {
    const used = { furtivo: { usedRound: 2 } };
    const { rerender } = render(<FurtivoReminder {...props} abilityState={used} />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    rerender(<FurtivoReminder {...props} abilityState={used} round={3} />);
    expect((screen.getByRole('button', { name: 'usei' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('não aparece fora do turno nem sem a passiva', () => {
    const { rerender } = render(<FurtivoReminder {...props} isCurrentTurn={false} />);
    expect(screen.queryByTestId('furtivo-reminder')).toBeNull();
    rerender(<FurtivoReminder {...props} skills={[]} />);
    expect(screen.queryByTestId('furtivo-reminder')).toBeNull();
  });
});
